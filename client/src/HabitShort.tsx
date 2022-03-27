import { useApi } from "./api";
import { Habit } from "./types";
import { Link } from "react-router-dom";
import { useCallback } from "react";
import { DateTime } from "luxon";
import { useMediaQuery } from "react-responsive";
import { Goal } from "./goal";

const HabitShort = ({ habit, week }: { habit: Habit; week: DateTime }) => {
  const api = useApi();
  const setDone = useCallback(
    (day: DateTime, amount: number) => {
      api.setDone(habit.id, day.toISODate(), amount);
    },
    [api, habit.id]
  );
  const mark = useCallback(
    (day: DateTime) => {
      (habit.dates[day.toISODate()] ?? 0) >= habit.daily
        ? setDone(day, 0)
        : setDone(day, (habit.dates[day.toISODate()] ?? 0) + 1);
    },
    [setDone, habit.dates, habit.daily]
  );

  const day = (day: DateTime) => {
    const ratio = (habit.dates[day.toISODate()] ?? 0) / habit.daily;
    return (
      <div
        className={`column p-2 pt-0 mt-4 mb-2 ${
          ratio > 0.5 && "has-text-white"
        }`}
        onClick={() => day.startOf("day") > DateTime.now() || mark(day)}
        key={day.toISODate()}
        style={{
          position: "relative",
          zIndex: 0,
        }}
      >
        <div
          style={{
            filter: `brightness(${1.25 - ratio / 2})`,
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            position: "absolute",
            zIndex: -1,
          }}
          className={
            (habit.dates[day.toISODate()] ?? 0) > 0
              ? "has-background-success"
              : undefined
          }
        />
        <span
          style={{
            position: "relative",
            zIndex: 1,
          }}
        >
          {day.weekdayLong[0]}
        </span>
      </div>
    );
  };
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
      <Link to={`/habit/${habit.id}`}>
        <h2 className="subtitle ml-2 is-4">{habit.name}</h2>
      </Link>
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
        }}
      >
        <Goal habit={habit} date={week} />
        {habit.daily}
      </div>
      <div className="columns is-mobile is-centered has-text-centered">
        <span className={`column ${!isMobile ? "is-4" : ""}`}></span>
        {daysOfWeek}
        <span className={`column ${!isMobile ? "is-4" : ""}`}></span>
      </div>
    </div>
  );
};

export default HabitShort;
