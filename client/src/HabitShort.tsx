import { useApi } from "./api";
import { Habit } from "./types";
import { Link } from "react-router-dom";
import { useCallback } from "react";

const HabitShort = ({ habit, asDay }: { habit: Habit, asDay: string }) => {
  const doneToday = habit.dates.includes(asDay);
  const api = useApi();
  const setDone = useCallback(() => {
    api.setDone(habit.id, asDay);
  }, [api, habit.id, asDay]);
  const setUndone = useCallback(() => {
    api.setUndone(habit.id, asDay);
  }, [api, habit.id, asDay]);
  const toggle = useCallback(
    () => (doneToday ? setUndone() : setDone()),
    [doneToday, setUndone, setDone]
  );

  return (
    <div
      className={`box has-text-centered container mb-3 p-2 ${
        doneToday ? "has-background-success has-text-light" : ""
      }`}
      onClick={toggle}
    >
      <div className="level is-mobile" style={{
        position: "relative"
      }}>
        <h2 className="level-item subtitle is-4" style={{
          position: "absolute",
          margin: "auto",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        }}>{habit.name}</h2>
        <div
          className="level-right has-text-centered"
          onClick={(e) => e.stopPropagation()}
        >
          <Link className="button is-primary is-small" to={`/${habit.id}`}>
            Details
          </Link>
        </div>
      </div>
    </div>
  );
};
export default HabitShort;
