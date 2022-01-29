use std::collections::BTreeSet;

use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use ulid::Ulid;

#[derive(Debug, Clone, PartialEq, PartialOrd, Eq, Ord, Serialize, Deserialize, Hash)]
pub struct Habit {
    pub id: Ulid,
    pub name: String,
    pub description: String,
    pub dates: BTreeSet<NaiveDate>,
    pub goal: String
}

#[derive(Debug, Clone, PartialEq, PartialOrd, Eq, Ord, Serialize, Deserialize, Hash)]
pub struct HabitOptional {
    pub name: Option<String>,
    pub description: Option<String>,
    pub goal: Option<String>
}

#[derive(Serialize, Deserialize)]
pub struct Name {
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub struct Id {
    pub id: Ulid,
}
