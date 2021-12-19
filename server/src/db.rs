use std::{
    collections::{BTreeMap, BTreeSet},
    str::FromStr,
};

use crate::{common::{Habit, HabitOptional}, user::User};
use argon2::{password_hash::PasswordHashString, PasswordHash};
use chrono::NaiveDate;
use rocket::{
    fairing::{AdHoc, Fairing},
    http::Status,
    request::{FromRequest, Outcome},
    Request,
};
use serde::Deserialize;
use sqlx::query;
use ulid::Ulid;

pub struct Db<'a>(&'a sqlx::SqlitePool);
struct DbState(sqlx::SqlitePool);

#[derive(Deserialize)]
struct DbConfig {
    db_url: String,
}

#[rocket::async_trait]
impl<'a> FromRequest<'a> for Db<'a> {
    type Error = ();

    async fn from_request(request: &'a Request<'_>) -> Outcome<Self, Self::Error> {
        if let Some(DbState(pool)) = request.rocket().state::<DbState>() {
            Outcome::Success(Db(pool))
        } else {
            Outcome::Failure((Status::InternalServerError, ()))
        }
    }
}

impl DbState {
    async fn from_url(url: &str) -> Result<Self, sqlx::Error> {
        Ok(Self(sqlx::SqlitePool::connect(url).await?))
    }
}

impl Db<'_> {
    pub fn fairing() -> impl Fairing {
        AdHoc::try_on_ignite("Db", |r| async move {
            let Ok(DbConfig { db_url }) = r.figment().extract() else { return Err(r) };
            let Ok(db_state) = DbState::from_url(&db_url).await else { return Err(r) };
            Ok(r.manage(db_state))
        })
    }

    async fn check_habit_owned_by(&self, habit: Ulid, user: User) -> bool {
        let id = habit.to_string();
        let user = user.id.to_string();
        query!(
            "SELECT id FROM habits WHERE habits.id = ? AND habits.owner = ?",
            id,
            user
        )
        .fetch_one(self.0)
        .await
        .is_ok()
    }

    pub async fn habits(&self, user: User) -> Result<BTreeMap<Ulid, Habit>, Status> {
        let user = user.id.to_string();
        let mut habits = query!(
            "SELECT
                    habits.id as id, 
                    habits.name as name
                FROM habits
                WHERE owner = ?;",
            user
        )
        .map(|r| {
            let id: Ulid = r.id.parse().map_err(|_| Status::InternalServerError)?;
            Ok((
                id,
                Habit {
                    id,
                    name: r.name,
                    dates: Default::default(),
                },
            ))
        })
        .fetch_all(self.0)
        .await
        .unwrap()
        .into_iter()
        .collect::<Result<BTreeMap<_, _>, _>>()?;
        for (id, habit) in habits.iter_mut() {
            let id = id.to_string();
            habit.dates = query!(
                "SELECT date FROM habits_dates WHERE habit_id = ? ORDER BY date DESC LIMIT 256",
                id
            )
            .map(|date| {
                Some(date.date)
                    .as_ref()
                    .and_then(|e| NaiveDate::from_str(e).ok())
                    .ok_or(Status::InternalServerError)
            })
            .fetch_all(self.0)
            .await
            .map_err(|_| Status::InternalServerError)?
            .into_iter()
            .collect::<Result<BTreeSet<_>, _>>()?
        }
        Ok(habits)
    }

    pub async fn get_habit(&self, user: User, id: Ulid) -> Option<Habit> {
        if !self.check_habit_owned_by(id, user).await {
            return None;
        }
        let id_str = id.to_string();
        let name = query!("SELECT habits.name FROM habits WHERE habits.id = ?", id_str)
            .fetch_optional(self.0)
            .await
            .unwrap()?
            .name;
        let dates: BTreeSet<chrono::NaiveDate> = query!(
            "SELECT habits_dates.date FROM habits_dates WHERE habit_id = ? ORDER BY date DESC",
            id_str
        )
        .map(|r| r.date.parse().unwrap())
        .fetch_all(self.0)
        .await
        .unwrap()
        .into_iter()
        .collect();
        Some(Habit { id, name, dates })
    }

    pub async fn complete_habit(
        &self,
        user: User,
        habit: Ulid,
        date: NaiveDate,
    ) -> Result<(), Status> {
        if !self.check_habit_owned_by(habit, user).await {
            return Err(Status::NotFound);
        }
        let id = habit.to_string();
        let date = date.to_string();
        query!(
            "INSERT INTO habits_dates(habit_id, date) VALUES (?, ?);",
            id,
            date
        )
        .execute(self.0)
        .await
        .map_err(|_| Status::InternalServerError)?;
        Ok(())
    }

    pub async fn uncomplete_habit(
        &self,
        user: User,
        habit: Ulid,
        date: NaiveDate,
    ) -> Result<(), Status> {
        if !self.check_habit_owned_by(habit, user).await {
            return Err(Status::NotFound);
        }
        let id = habit.to_string();
        query!(
            "DELETE FROM habits_dates WHERE habit_id=? AND date=?",
            id,
            date
        )
        .execute(self.0)
        .await
        .map_err(|_| Status::InternalServerError)
        .map(|_| ())
    }

    pub async fn new_habit(&self, user: User, name: impl AsRef<str>) -> Result<Ulid, Status> {
        let id = Ulid::new();
        let id_str = id.to_string();
        let owner = user.id.to_string();
        let name = name.as_ref();
        query!(
            "INSERT INTO habits(id, name, owner) VALUES (?, ?, ?)",
            id_str,
            name,
            owner
        )
        .execute(self.0)
        .await
        .map_err(|_| Status::InternalServerError)?;
        Ok(id)
    }

    pub async fn delete_habit(&self, user: User, id: Ulid) -> Status {
        if !self.check_habit_owned_by(id, user).await {
            return Status::NotFound;
        }
        let id = id.to_string();
        #[allow(clippy::question_mark)] // Can't be rewritten with ? as Status is not Try
        if query!(
            "DELETE FROM habits_dates WHERE habit_id=?; DELETE FROM habits WHERE id=?;",
            id,
            id
        )
        .execute(self.0)
        .await
        .is_err()
        {
            return Status::InternalServerError;
        };
        Status::Accepted
    }

    pub async fn add_user(
        &self,
        id: Ulid,
        username: &str,
        hashed_pass: PasswordHash<'_>,
    ) -> Result<(), ()> {
        let id = id.to_string();
        let password_hash = hashed_pass.to_string();
        query!(
            "INSERT INTO users(id, username, password_hash) VALUES (?, ?, ?)",
            id,
            username,
            password_hash
        )
        .execute(self.0)
        .await
        .map_err(|_| ())?;
        Ok(())
    }

    pub async fn get_user(&self, id_or_name: &str) -> Result<User, ()> {
        let user = query!(
            "SELECT id, username, password_hash FROM users WHERE id = ? OR username = ?",
            id_or_name,
            id_or_name
        )
        .map(|r| User {
            id: r.id.parse().unwrap(),
            username: r.username,
            hashed_password: PasswordHashString::new(&r.password_hash).unwrap(),
        })
        .fetch_one(self.0)
        .await
        .map_err(|_| ())?;
        Ok(user)
    }

    pub async fn update_habit(&self, user: User, id: Ulid, update: &HabitOptional) -> Status {
        if !self.check_habit_owned_by(id, user).await {
            return Status::NotFound;
        }
        let id = id.to_string();
        if let Some(name) = &update.name {
            #[allow(clippy::question_mark)]
            if query!("UPDATE habits SET name = ? WHERE id = ?", name, id)
                .execute(self.0).await.is_err() {
                    return Status::InternalServerError;
                }
        }

        Status::Accepted
    }
}
