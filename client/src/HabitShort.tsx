import { useApi } from "./api";
import { Habit } from "./types";
import { Link } from "react-router-dom";
import { useCallback } from "react";
import { DateTime } from "luxon";
import { useMediaQuery } from "react-responsive";

const HabitShort = ({ habit, week }: { habit: Habit; week: DateTime }) => {
  const api = useApi();
  const setDone = useCallback(
    (day: DateTime) => {
      api.setDone(habit.id, day.toISODate());
    },
    [api, habit.id]
  );
  const setUndone = useCallback(
    (day: DateTime) => {
      api.setUndone(habit.id, day.toISODate());
    },
    [api, habit.id]
  );
  const toggle = useCallback(
    (day: DateTime) =>
      habit.dates.includes(day.toISODate()) ? setUndone(day) : setDone(day),
    [setUndone, setDone, habit.dates]
  );

  const day = (day: DateTime) => (
    <span
      className={`column p-2 pt-0 mt-4 mb-2 ${
        habit.dates.includes(day.toISODate())
          ? "has-background-success has-text-light"
          : ""
      }`}
      onClick={() => day.startOf("day") > DateTime.now() || toggle(day)}
    >
      {day.weekdayLong[0]}
    </span>
  );
  const daysOfWeek = [0, 1, 2, 3, 4, 5, 6]
    .map((day) => week.plus({ days: day }))
    .map(day);

  const isMobile = useMediaQuery({ query: `(max-width: 768px)` });

  return (
    <div
      className={`box ${
        isMobile ? "" : "has-text-centered"
      } container mb-3 p-2`}
    >
      <Link to={`/${habit.id}`}>
        <h2 className="subtitle ml-2 is-4">{habit.name}</h2>
      </Link>
      <div className="columns is-mobile is-centered has-text-centered">
        <span className={`column ${!isMobile ? "is-4" : ""}`}></span>
        {daysOfWeek}
        <span className={`column ${!isMobile ? "is-4" : ""}`}></span>
      </div>
    </div>
  );
};

export default HabitShort;
