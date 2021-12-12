CREATE TABLE IF NOT EXISTS habits(
    id TEXT PRIMARY KEY NOT NULL,
    owner TEXT REFERENCES users(id) NOT NULL,
    "name" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS habits_dates(
    habit_id TEXT REFERENCES habits(id) NOT NULL,
    "date" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users(
    id TEXT PRIMARY KEY NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);