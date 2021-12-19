import { useApi } from "./api";
import { today } from "./date";
import { Habit } from "./types";
import { Link } from "react-router-dom";
import { useCallback } from "react";

const HabitShort = ({ habit }: { habit: Habit }) => {
  const doneToday = habit.dates.includes(today());
  const api = useApi();
  const setDone = useCallback(() => {
    api.setDone(habit.id, today());
  }, [api, habit.id]);
  const setUndone = useCallback(() => {
    api.setUndone(habit.id, today());
  }, [api, habit.id]);
  const toggle = useCallback(
    () => (doneToday ? setUndone() : setDone()),
    [doneToday, setUndone, setDone]
  );

  return (
    <div
      className={`box has-text-centered container block ${
        doneToday ? "has-background-success-dark has-text-light" : ""
      }`}
      onClick={toggle}
    >
      <div className="level is-mobile">
        <h2 className="level-item is-size-2">{habit.name}</h2>
        <div
          className="level-right has-text-centered"
          onClick={(e) => e.stopPropagation()}
        >
          <Link className="button is-primary" to={`/${habit.id}`}>
            Details
          </Link>
        </div>
      </div>
    </div>
  );
};
export default HabitShort;
