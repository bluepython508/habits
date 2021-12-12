use std::collections::BTreeSet;

use serde::{Serialize, Deserialize};
use chrono::NaiveDate;
use ulid::Ulid;

#[derive(Debug, Clone, PartialEq, PartialOrd, Eq, Ord, Serialize, Deserialize, Hash)]
pub struct Habit {
    pub id: Ulid,
    pub name: String,
    pub dates: BTreeSet<NaiveDate>,
}

#[derive(Serialize, Deserialize)]
pub struct Name {
    pub name: String
}

#[derive(Serialize, Deserialize)]
pub struct Id {
    pub id: Ulid
}
