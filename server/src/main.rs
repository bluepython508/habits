#![feature(let_else, result_into_ok_or_err)]
use std::{collections::BTreeMap, str::FromStr};

use chrono::NaiveDate;
mod common;
use common::{Habit, HabitOptional, Id, Name};
use rocket::{
    build, catch, catchers, delete,
    fs::{FileServer, NamedFile},
    get,
    http::Status,
    launch, post, put,
    request::FromParam,
    response::Responder,
    routes,
    serde::json::Json,
    Request,
};
use rocket_basicauth::BasicAuth;
use ulid::Ulid;

use db::Db;

use crate::user::User;

mod db;
mod user;

#[derive(Debug)]
struct Error(anyhow::Error);
type Result<T, E = Error> = std::result::Result<T, E>;

impl From<anyhow::Error> for Error {
    fn from(e: anyhow::Error) -> Self {
        Self(e)
    }
}

impl<'r, 'o> Responder<'r, 'o> for Error
where
    'o: 'r,
{
    fn respond_to(self, request: &'r Request<'_>) -> rocket::response::Result<'o> {
        eprintln!("{:?}", &self);
        self.0
            .downcast::<Status>()
            .unwrap_or(Status::InternalServerError)
            .respond_to(request)
    }
}

struct ParamFromStr<T>(pub T);
impl<'a, T> FromParam<'a> for ParamFromStr<T>
where
    T: FromStr,
    T::Err: std::fmt::Debug,
{
    type Error = T::Err;

    fn from_param(param: &'a str) -> Result<Self, Self::Error> {
        Ok(Self(param.parse()?))
    }
}

#[get("/habits")]
async fn habits(db: Db<'_>, user: User) -> Result<Json<BTreeMap<Ulid, Habit>>> {
    Ok(Json(db.habits(user).await?))
}

#[post("/habits", data = "<name>")]
async fn new_habit(db: Db<'_>, user: User, name: Json<Name>) -> Result<Json<Id>> {
    Ok(Json(Id {
        id: db.new_habit(user, name.name.clone()).await?,
    }))
}

#[get("/habits/<id>")]
async fn get_habit(db: Db<'_>, user: User, id: ParamFromStr<Ulid>) -> Result<Json<Habit>> {
    Ok(Json(db.get_habit(user, id.0).await?))
}

#[put("/habits/<id>", data = "<update>")]
async fn update_habit(
    db: Db<'_>,
    user: User,
    id: ParamFromStr<Ulid>,
    update: Json<HabitOptional>,
) -> Result<()> {
    db.update_habit(user, id.0, &*update).await?;
    Ok(())
}

#[delete("/habits/<id>")]
async fn delete_habit(db: Db<'_>, user: User, id: ParamFromStr<Ulid>) -> Result<()> {
    db.delete_habit(user, id.0).await?;
    Ok(())
}

#[post("/habits/<id>/<date>")]
async fn complete_habit(
    db: Db<'_>,
    user: User,
    id: ParamFromStr<Ulid>,
    date: ParamFromStr<NaiveDate>,
) -> Result<()> {
    db.complete_habit(user, id.0, date.0).await?;
    Ok(())
}

#[delete("/habits/<id>/<date>")]
async fn uncomplete_habit(
    db: Db<'_>,
    user: User,
    id: ParamFromStr<Ulid>,
    date: ParamFromStr<NaiveDate>,
) -> Result<()> {
    db.uncomplete_habit(user, id.0, date.0).await?;
    Ok(())
}

#[post("/signup")]
async fn signup(db: Db<'_>, basic_auth: BasicAuth) -> Result<()> {
    User::signup(db, basic_auth.username, basic_auth.password).await?;
    Ok(())
}

#[get("/check_user")]
fn check_user(_user: User) {}

#[catch(404)]
fn api_notfound(_: &Request) {}

#[catch(404)]
async fn notfound(_: &Request<'_>) -> NamedFile {
    NamedFile::open("./build/index.html").await.unwrap()
}

#[launch]
fn launch() -> _ {
    build()
        .attach(Db::fairing())
        .mount(
            "/api",
            routes![
                habits,
                new_habit,
                get_habit,
                delete_habit,
                complete_habit,
                uncomplete_habit,
                update_habit,
                signup,
                check_user
            ],
        )
        .mount("/", FileServer::from("./build/"))
        .register("/", catchers![notfound])
        .register("/api", catchers![api_notfound])
}
