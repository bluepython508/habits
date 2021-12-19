#![feature(let_else, result_into_ok_or_err)]
use std::{collections::BTreeMap, str::FromStr};

use chrono::NaiveDate;
mod common;
use common::{Habit, Id, Name, HabitOptional};
use rocket::{
    build, catch, catchers, delete,
    fs::{FileServer, NamedFile},
    get,
    http::Status,
    launch, post,
    request::FromParam,
    routes,
    serde::json::Json,
    Request, put,
};
use rocket_basicauth::BasicAuth;
use ulid::Ulid;

use db::Db;

use crate::user::User;

mod db;
mod user;

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
async fn habits(db: Db<'_>, user: User) -> Result<Json<BTreeMap<Ulid, Habit>>, Status> {
    db.habits(user).await.map(Json)
}

#[post("/habits", data = "<name>")]
async fn new_habit(db: Db<'_>, user: User, name: Json<Name>) -> Result<Json<Id>, Status> {
    db.new_habit(user, &name.name)
        .await
        .map(|id| Json(Id { id }))
}

#[get("/habits/<id>")]
async fn get_habit(db: Db<'_>, user: User, id: ParamFromStr<Ulid>) -> Option<Json<Habit>> {
    db.get_habit(user, id.0).await.map(Json)
}

#[put("/habits/<id>", data = "<update>")]
async fn update_habit(db: Db<'_>, user: User, id: ParamFromStr<Ulid>, update: Json<HabitOptional>) -> Status {
    db.update_habit(user, id.0, &*update).await
}

#[delete("/habits/<id>")]
async fn delete_habit(db: Db<'_>, user: User, id: ParamFromStr<Ulid>) -> Status {
    db.delete_habit(user, id.0).await
}

#[post("/habits/<id>/<date>")]
async fn complete_habit(db: Db<'_>, user: User, id: ParamFromStr<Ulid>, date: ParamFromStr<NaiveDate>) -> Status {
    db.complete_habit(user, id.0, date.0)
        .await
        .map(|_| Status::Accepted)
        .into_ok_or_err()
}

#[delete("/habits/<id>/<date>")]
async fn uncomplete_habit(db: Db<'_>, user: User, id: ParamFromStr<Ulid>, date: ParamFromStr<NaiveDate>) -> Status {
    db.uncomplete_habit(user, id.0, date.0)
        .await
        .map(|_| Status::Accepted)
        .into_ok_or_err()
}

#[post("/signup")]
async fn signup(db: Db<'_>, basic_auth: BasicAuth) -> Status {
    #[allow(clippy::question_mark)] // Clippy lint is wrong, status can't be ?'d
    if User::signup(db, basic_auth.username, basic_auth.password)
        .await
        .is_err()
    {
        return Status::InternalServerError;
    }
    Status::Accepted
}

#[get("/check_user")]
async fn check_user(_user: User) -> Status {
    Status::Ok
}

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
