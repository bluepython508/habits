import classNames from "classnames";
import { DateTime } from "luxon";
import { Habit } from "./types";

type Goal = {
  perWeek: number;
};

export const parseGoal = (goal: string): Goal | undefined => {
  if (goal === "") {
    return;
  }
  const json = JSON.parse(goal);
  if (json.perWeek !== undefined) {
    return {
      perWeek: json.perWeek,
    };
  }
};

export const Goal = ({ habit, date }: { habit: Habit; date: DateTime }) => {
  const goal = parseGoal(habit.goal);
  if (goal === undefined) {
    return <></>;
  }
  const week = [0, 1, 2, 3, 4, 5, 6].map((day) =>
    date.startOf("week").plus({ days: day })
  );
  const daysMet = week.filter((day) =>
    habit.dates.includes(day.toISODate())
  ).length;
  const met = daysMet >= goal.perWeek;
  return (
    <p className={classNames(met && "has-text-success", "pr-3", "pt-1")}>
      {daysMet} / {goal.perWeek}
    </p>
  );
};
