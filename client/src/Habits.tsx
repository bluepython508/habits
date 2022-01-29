import { DateTime } from "luxon";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { useApi } from "./api";
import HabitShort from "./HabitShort";
import { useSelector } from "./store";
import { useNavigate, useParams } from "react-router-dom";
import classNames from "classnames";
import animationStyles from "./HabitsAnimation.module.css";

const AddHabitModal = ({ hide }: { hide: () => void }) => {
  const [name, setName] = useState("");
  const onChange = useCallback((e) => setName(e.target.value), [setName]);
  const api = useApi();
  const submit = useCallback(() => {
    api.newHabit(name);
    hide();
  }, [api, name, hide]);

  return (
    <div className="modal is-active container is-fluid">
      <div className="modal-background" onClick={hide} />
      <div className="modal-content">
        <div className="card container has-text-centered block p-3">
          <h2 className="title block">Add Habit</h2>
          <hr className="block" />
          <form onSubmit={submit}>
            <div className="field block">
              <div className="control block">
                <input
                  className="input"
                  type="text"
                  value={name}
                  onChange={onChange}
                  placeholder="Name"
                  autoFocus
                />
              </div>
            </div>
            <input
              className="is-hidden"
              type="submit"
              disabled={name.length === 0}
            />
            <div className="buttons is-right">
              <button className="button is-danger" onClick={hide}>
                Cancel
              </button>
              <button
                type="submit"
                className="button is-primary"
                disabled={name.length === 0}
              >
                Add
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

function compareOn<T, U>(keyFn: (t: T) => U): (a: T, b: T) => number {
  return (a, b) => {
    const keyA = keyFn(a);
    const keyB = keyFn(b);
    if (keyA > keyB) {
      return 1;
    } else if (keyA < keyB) {
      return -1;
    } else {
      return 0;
    }
  };
}

const Habits = () => {
  const params = useParams();
  const week = DateTime.fromISO(
    params.week ?? DateTime.now().startOf("week").toISODate()
  );
  const oldWeek = usePrevious(week);

  const api = useApi();
  useEffect(() => {
    api.habits().then((habits) => {
      Promise.all(Object.keys(habits).map(api.getHabit));
    });
  }, [api]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const showAddModal = useCallback(
    () => setAddModalVisible(true),
    [setAddModalVisible]
  );
  const hideAddModal = useCallback(
    () => setAddModalVisible(false),
    [setAddModalVisible]
  );

  const navigate = useNavigate();
  const nextWeek = useCallback(() => {
    navigate(
      `/week/${week
        .plus({ weeks: week.endOf("week") > DateTime.now() ? 0 : 1 })
        .toISODate()}`
    );
  }, [navigate, week]);
  const prevWeek = useCallback(() => {
    navigate(`/week/${week.minus({ weeks: 1 }).toISODate()}`);
  }, [navigate, week]);

  const swipingHandlers = useSwipeable({
    onSwipedRight: prevWeek,
    onSwipedLeft: nextWeek,
    preventDefaultTouchmoveEvent: true,
  });

  return (
    <div
      className={addModalVisible ? "is-clipped" : ""}
      {...swipingHandlers}
      style={{
        height: "100vh",
      }}
    >
      {addModalVisible && <AddHabitModal hide={hideAddModal} />}
      <div
        className="has-background-white"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div className="level is-mobile container">
          <div className="level-left">
            <button onClick={prevWeek} className="ml-2 mt-2 button">
              {"<"}
            </button>
          </div>
          <h2 className="level-item title is-4 has-text-centered">
            Week of {week.toISODate()}
          </h2>
          <div className="level-right">
            <button
              onClick={nextWeek}
              className="button mr-2 mt-2"
              disabled={week.endOf("week") > DateTime.now()}
            >
              {">"}
            </button>
          </div>
        </div>
        <hr />
      </div>
      <HabitsList week={week} prevWeek={oldWeek} key={week.toISODate()} />
      <div
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        <button className="button is-primary m-4" onClick={showAddModal}>
          Add
        </button>
      </div>
    </div>
  );
};

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>();
  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

const HabitsList = ({
  week,
  prevWeek,
}: {
  week: DateTime;
  prevWeek?: DateTime;
}) => {
  const [appearing, setAppearing] = useState(true);
  useEffect(() => {
    setTimeout(() => setAppearing(false), 10);
  }, []);
  const habits = useSelector((state) => state.habits);
  return (
    <div
      className={classNames(
        appearing && animationStyles.appearing,
        animationStyles.animated,
        (prevWeek ?? week) > week && animationStyles.fromLeft,
        (prevWeek ?? week) < week && animationStyles.fromRight
      )}
    >
      {Object.values(habits)
        .sort(compareOn((h) => h.id))
        .map((habit) => (
          <HabitShort
            key={week.toISODate() + habit.id}
            habit={habit}
            week={week}
          />
        ))}
    </div>
  );
};

export default Habits;
