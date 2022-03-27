
use std::collections::BTreeMap;

use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use ulid::Ulid;

#[derive(Debug, Clone, PartialEq, PartialOrd, Eq, Ord, Serialize, Deserialize, Hash)]
pub struct Habit {
    pub id: Ulid,
    pub name: String,
    pub description: String,
    pub dates: BTreeMap<NaiveDate, u8>,
    pub goal: String,
    pub daily: u8
}

#[derive(Debug, Clone, PartialEq, PartialOrd, Eq, Ord, Serialize, Deserialize, Hash)]
pub struct HabitOptional {
    pub name: Option<String>,
    pub description: Option<String>,
    pub goal: Option<String>,
    pub daily: Option<u8>
}

#[derive(Serialize, Deserialize)]
pub struct Name {
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub struct Id {
    pub id: Ulid,
}

#[derive(Serialize, Deserialize)]
pub struct Amount {
    pub amount: u8
}