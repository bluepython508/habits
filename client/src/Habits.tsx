import { DateTime } from "luxon";
import { useCallback, useEffect, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { useApi } from "./api";
import HabitShort from "./HabitShort";
import { useSelector } from "./store";

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
  const api = useApi();
  useEffect(() => {
    api.habits().then((habits) => {
      Promise.all(Object.keys(habits).map(api.getHabit));
    });
  }, [api]);
  const habits = useSelector((state) => state.habits);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const showAddModal = useCallback(
    () => setAddModalVisible(true),
    [setAddModalVisible]
  );
  const hideAddModal = useCallback(
    () => setAddModalVisible(false),
    [setAddModalVisible]
  );

  const [day, setDay] = useState(DateTime.now())
  const nextDay = useCallback(() => setDay(day => day.plus({ days: day.endOf('day') > DateTime.now() ? 0 : 1 })), [setDay])
  const prevDay = useCallback(() => setDay(day => day.minus({ days: 1 })), [setDay])

  const swipingHandlers = useSwipeable({
    onSwipedRight: prevDay,
    onSwipedLeft: nextDay,
    preventDefaultTouchmoveEvent: true
  })

  return (
    <div className={addModalVisible ? "is-clipped" : ""} {...swipingHandlers}>
      {addModalVisible && <AddHabitModal hide={hideAddModal} />}
      <div className="has-background-white" style={{
        // position: "sticky",
        top: 0
      }}>
        <div className="level is-mobile container">
          <div className="level-left">
            <button onClick={prevDay} className="ml-2 mt-2 button">{'<'}</button>
          </div>
          <h2 className="level-item title has-text-centered">{day.toISODate()}</h2>
          <div className="level-right">
            <button onClick={nextDay} className="button mr-2 mt-2" disabled={day.endOf('day') > DateTime.now()}>{'>'}</button>
          </div>
        </div>
        <hr />
      </div>
      <div {...swipingHandlers}>
      {Object.values(habits)
        .sort(compareOn((h) => h.id))
        .map((habit) => (
          <HabitShort key={habit.id} habit={habit} asDay={day.toISODate()} />
        ))}
      </div>
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

export default Habits;
