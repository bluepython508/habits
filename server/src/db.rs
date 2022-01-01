use std::collections::{BTreeMap, BTreeSet};

use crate::{
    common::{Habit, HabitOptional},
    user::User,
};
use anyhow::{Context, Result};
use argon2::{password_hash::PasswordHashString, PasswordHash};
use chrono::NaiveDate;
use rocket::{
    fairing::{AdHoc, Fairing},
    http::Status,
    request::{FromRequest, Outcome},
    Request,
};
use serde::Deserialize;
use sql::{CondExpr, Ordering, Pool, Table};
use ulid::Ulid;

#[cfg(debug_assertions)]
type DatabaseT = sql::Sqlite;
#[cfg(not(debug_assertions))]
type DatabaseT = sql::Postgres;

pub struct Db<'a>(&'a sql::Pool<DatabaseT>);
struct DbState(sql::Pool<DatabaseT>);

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
    #[cfg(debug_assertions)]
    async fn from_url(url: &str) -> Result<Self> {
        Ok(Self(Pool::open(url)?))
    }
    #[cfg(not(debug_assertions))]
    async fn from_url(url: &str) -> Result<Self> {
        Ok(Self(Pool::connect(url).await?))
    }
}

#[derive(Table)]
#[sql(name = "users")]
struct DbUser {
    #[sql(unique, as_str)]
    id: Ulid,
    #[sql(unique)]
    username: String,
    #[sql(as_str)]
    password_hash: PasswordHashString,
}

#[derive(Table)]
#[sql(name = "habits")]
#[allow(dead_code)]
struct DbHabit {
    #[sql(unique, as_str)]
    id: Ulid,
    #[sql(as_str, references(DbUser::id, on_delete = "cascade"))]
    owner: Ulid,
    name: String,
}

#[derive(Table)]
#[sql(name = "habits_dates")]
#[allow(dead_code)]
struct DbHabitDate {
    #[sql(as_str, references(DbHabit::id, on_delete = "cascade"))]
    habit_id: Ulid,
    #[sql(as_str)]
    date: NaiveDate,
}

impl Db<'_> {
    pub fn fairing() -> impl Fairing {
        macro_rules! fairing_try {
            ($e:expr => $r:expr) => {
                match $e {
                    Ok(x) => x,
                    Err(e) => {
                        eprintln!("{}", e);
                        return Err($r);
                    }
                }
            }
        }
        AdHoc::try_on_ignite("Db", |r| async move {
            let DbConfig { db_url } = fairing_try!(r.figment().extract() => r);
            let db_state = fairing_try!(DbState::from_url(&db_url).await => r);
            fairing_try!(db_state.0.create::<DbUser>().if_not_exists().execute().await => r);
            fairing_try!(db_state.0.create::<DbHabit>().if_not_exists().execute().await => r);
            fairing_try!(db_state.0.create::<DbHabitDate>().if_not_exists().execute().await => r);
            Ok(r.manage(db_state))
        })
    }

    async fn check_habit_owned_by(&self, habit: Ulid, user: User) -> Result<()> {
        if self
            .0
            .select(DbHabit::COLUMNS)
            .r#where(
                DbHabit::id
                    .equals(habit)
                    .and(DbHabit::owner.equals(user.id)),
            )
            .limit(1)
            .fetch_all::<DbHabit>()
            .await?
            .is_empty()
        {
            return Err(anyhow::anyhow!("Habit not found")).context(Status::NotFound);
        }
        Ok(())
    }

    pub async fn habits(&self, user: User) -> Result<BTreeMap<Ulid, Habit>> {
        let mut habits = self
            .0
            .select(DbHabit::COLUMNS)
            .r#where(DbHabit::owner.equals(user.id))
            .fetch_all::<DbHabit>()
            .await?
            .into_iter()
            .map(|x| {
                (
                    x.id,
                    Habit {
                        id: x.id,
                        name: x.name,
                        dates: Default::default(),
                    },
                )
            })
            .collect::<BTreeMap<_, _>>();
        for (id, habit) in habits.iter_mut() {
            habit.dates = self
                .0
                .select((DbHabitDate::date,))
                .r#where(DbHabitDate::habit_id.equals(*id))
                .limit(64)
                .fetch_all::<(NaiveDate,)>()
                .await?
                .into_iter()
                .map(|x| x.0)
                .collect()
        }
        Ok(habits)
    }

    pub async fn get_habit(&self, user: User, id: Ulid) -> Result<Habit> {
        self.check_habit_owned_by(id, user).await?;

        let Some((name, )) = self
            .0
            .select((DbHabit::name,))
            .r#where(DbHabit::id.equals(id))
            .limit(1)
            .fetch_all::<(String,)>()
            .await?
            .pop() else { return Err(anyhow::anyhow!("Habit not found")).context(Status::NotFound) };
        let dates: BTreeSet<chrono::NaiveDate> = self
            .0
            .select((DbHabitDate::date,))
            .r#where(DbHabitDate::habit_id.equals(id))
            .order_by(DbHabitDate::date, Ordering::Descending)
            .fetch_all::<(NaiveDate,)>()
            .await?
            .into_iter()
            .map(|x| x.0)
            .collect();

        Ok(Habit { id, name, dates })
    }

    pub async fn complete_habit(&self, user: User, habit: Ulid, date: NaiveDate) -> Result<()> {
        self.check_habit_owned_by(habit, user).await?;
        self.0
            .insert_into(DbHabitDate::COLUMNS)
            .values((habit, date))
            .execute()
            .await?;
        Ok(())
    }

    pub async fn uncomplete_habit(&self, user: User, habit: Ulid, date: NaiveDate) -> Result<()> {
        self.check_habit_owned_by(habit, user).await?;
        self.0
            .delete_where(
                DbHabitDate::habit_id
                    .equals(habit)
                    .and(DbHabitDate::date.equals(date)),
            )
            .execute()
            .await?;
        Ok(())
    }

    pub async fn new_habit(&self, user: User, name: String) -> Result<Ulid> {
        let id = Ulid::new();
        self.0
            .insert_into(DbHabit::COLUMNS)
            .values((id, user.id, name))
            .execute()
            .await?;
        Ok(id)
    }

    pub async fn delete_habit(&self, user: User, id: Ulid) -> Result<()> {
        self.check_habit_owned_by(id, user).await?;
        self.0
            .delete_where(DbHabit::id.equals(id))
            .execute()
            .await?;
        Ok(())
    }

    pub async fn add_user(
        &self,
        id: Ulid,
        username: &str,
        hashed_pass: PasswordHash<'_>,
    ) -> Result<()> {
        self.0
            .insert_into(DbUser::COLUMNS)
            .values((id, username.to_owned(), hashed_pass.serialize()))
            .execute()
            .await?;
        Ok(())
    }

    pub async fn get_user(&self, id_or_name: &str) -> Result<User> {
        let id_cond = if let Ok(id) = id_or_name.parse::<Ulid>() {
            DbUser::id.equals(id)
        } else {
            CondExpr::TRUE
        };
        let DbUser {
            id,
            username,
            password_hash,
        } = self
            .0
            .select(DbUser::COLUMNS)
            .r#where(id_cond.or(DbUser::username.equals(id_or_name.to_owned())))
            .limit(1)
            .fetch_all::<DbUser>()
            .await?
            .pop()
            .ok_or_else(|| anyhow::anyhow!("User {} not found", id_or_name))
            .context(Status::NotFound)?;
        Ok(User {
            id,
            username,
            hashed_password: password_hash,
        })
    }

    pub async fn update_habit(&self, user: User, id: Ulid, update: &HabitOptional) -> Result<()> {
        self.check_habit_owned_by(id, user).await?;
        if let Some(name) = &update.name {
            self.0
                .update()
                .r#where(DbHabit::id.equals(id))
                .set(DbHabit::name, name.to_owned())
                .execute()
                .await?
        }
        Ok(())
    }
}
