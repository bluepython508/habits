import { useCallback, useEffect, useState } from "react";
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
    <div className="modal is-active">
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

const Habits = () => {
  const api = useApi();
  useEffect(() => {
    api.habits();
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

  return (
    <div className={addModalVisible ? "is-clipped" : ""}>
      {addModalVisible && <AddHabitModal hide={hideAddModal} />}
      {Object.values(habits).map((habit) => (
        <HabitShort key={habit.id} habit={habit} />
      ))}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
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
