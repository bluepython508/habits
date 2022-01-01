use argon2::{
    password_hash::{PasswordHashString, SaltString},
    Argon2, PasswordHash,
};
use rand::thread_rng;
use rocket::{
    http::Status,
    request::{FromRequest, Outcome},
    Request,
};
use rocket_basicauth::BasicAuth;
use ulid::Ulid;
use anyhow::Result;

use crate::db::Db;

pub struct User {
    pub id: Ulid,
    pub username: String,
    pub hashed_password: PasswordHashString,
}

impl User {
    pub async fn signup(db: Db<'_>, name: String, password: String) -> Result<Self> {
        let user = User {
            id: Ulid::new(),
            username: name,
            hashed_password: PasswordHash::generate(
                Argon2::default(),
                password,
                SaltString::generate(thread_rng()).as_ref(),
            )?
            .serialize(),
        };
        db.add_user(
            user.id,
            &user.username,
            user.hashed_password.password_hash(),
        )
        .await?;
        
        Ok(user)
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for User {
    type Error = ();

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let Outcome::Success(db) = request.guard::<Db<'_>>().await else { return Outcome::Failure((Status::InternalServerError, ())) };
        let Outcome::Success(basic_auth) = request.guard::<BasicAuth>().await else { return Outcome::Failure((Status::Unauthorized, ())) };
        let Ok(user) = db.get_user(&basic_auth.username).await else { return Outcome::Failure((Status::Unauthorized, ())) };
        if user.hashed_password.password_hash().verify_password(&[&Argon2::default()], basic_auth.password).is_err() {
            return Outcome::Failure((Status::Unauthorized, ()))
        }
        return Outcome::Success(user)
    }
}
