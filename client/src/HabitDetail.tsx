import { DateTime } from "luxon";
import { useCallback, useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApi } from "./api";
import { calendarMonth } from "./date";
import { error } from "./Error";
import { Goal, parseGoal } from "./goal";
import { useSelector } from "./store";
import { Habit } from "./types";

const DeleteModal = ({ habit, hide }: { habit: Habit; hide: () => void }) => {
  const api = useApi();
  const navigate = useNavigate();
  const doDelete = useCallback(() => {
    api.deleteHabit(habit.id);
    navigate("/");
  }, [habit, navigate, api]);
  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={hide} />
      <div className="modal-content">
        <div className="card container has-text-centered p-3 block">
          <h2 className="title block">Confirm Delete</h2>
          <hr />
          <p className="content">
            Are you sure you want to delete "{habit.name}"?
          </p>
          <div className="buttons is-right">
            <button className="button" onClick={hide}>
              Cancel
            </button>
            <button className="button is-danger" onClick={doDelete}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Header = ({ habit, edit }: { habit: Habit; edit: () => void }) => {
  return (
    <div>
      <h1 className="title">{habit.name}</h1>
      {habit.description && (
        <pre className="container box content is-family-primary">
          {habit.description}
        </pre>
      )}
      <Goal habit={habit} date={DateTime.now().startOf("week")} />
      <button
        className="button is-warning m-4"
        style={{
          position: "absolute",
          right: 0,
          top: 0,
        }}
        onClick={edit}
      >
        Edit
      </button>
    </div>
  );
};

const EditHeader = ({
  habit,
  stopEdit,
}: {
  habit: Habit;
  stopEdit: () => void;
}) => {
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const showDeleteModal = useCallback(
    () => setDeleteModalVisible(true),
    [setDeleteModalVisible]
  );
  const hideDeleteModal = useCallback(
    () => setDeleteModalVisible(false),
    [setDeleteModalVisible]
  );
  const [habitName, setName] = useState(habit.name);
  const [habitDesc, setDesc] = useState(habit.description);
  const [habitGoal, setGoal] = useState(habit.goal);
  const [habitDaily, setDaily] = useState(habit.daily);
  const onChangeName = useCallback((e) => setName(e.target.value), [setName]);
  const onChangeDesc = useCallback((e) => setDesc(e.target.value), [setDesc]);
  const onChangeGoal = useCallback(
    (e) => {
      if (e.target.value !== 0) {
        setGoal(JSON.stringify({ perWeek: e.target.value }));
      } else {
        setGoal("");
      }
    },
    [setGoal]
  );
  const onChangeDaily = useCallback(
    (e) => setDaily(Number(e.target.value)),
    [setDaily]
  );
  const api = useApi();
  const save = useCallback(() => {
    api.updateHabit({
      id: habit.id,
      name: habitName === habit.name ? undefined : habitName,
      description: habitDesc === habit.description ? undefined : habitDesc,
      goal: habitGoal === habit.goal ? undefined : habitGoal,
      daily: habitDaily === habit.daily ? undefined : habitDaily,
    });
    stopEdit();
  }, [api, habitName, stopEdit, habit, habitDesc, habitGoal, habitDaily]);
  const isMobile = useMediaQuery({ query: `(max-width: 768px)` });
  return (
    <div>
      {isDeleteModalVisible && (
        <DeleteModal habit={habit} hide={hideDeleteModal} />
      )}
      <div className={`buttons is-centered ${isMobile ? "pl-6 ml-3" : ""}`}>
        <button className="button is-danger" onClick={showDeleteModal}>
          Delete
        </button>
        <button className="button is-warning" onClick={stopEdit}>
          Cancel
        </button>
        <button className="button is-success" onClick={save}>
          Save
        </button>
      </div>
      <div className="container is-fluid">
        <input
          className="container input title is-medium control"
          type="text"
          value={habitName}
          onChange={onChangeName}
          placeholder="Name"
        />
        <input
          className="container input control"
          type="number"
          value={parseGoal(habitGoal)?.perWeek ?? 0}
          onChange={onChangeGoal}
          placeholder="Goal"
          min="0"
          max="7"
        />
        <input
          className="container input control"
          type="number"
          value={habitDaily}
          onChange={onChangeDaily}
          placeholder="Daily"
          min="0"
        />
        <textarea
          className="textarea control has-text-left"
          value={habitDesc}
          onChange={onChangeDesc}
          placeholder="Description"
        />
      </div>
    </div>
  );
};

const HabitDetail = () => {
  const { id } = useParams();
  const api = useApi();
  const navigate = useNavigate();
  useEffect(() => {
    api.getHabit(id!).catch((e) => {
      if (error(e).type === "notfound") {
        navigate("/");
      }
    });
  }, [id, api, navigate]);
  const habit = useSelector((state) => state.habits[id!]);
  const [month, setMonth] = useState(DateTime.now());
  const nextMonth = useCallback(
    () => setMonth((month) => month.plus({ months: 1 })),
    [setMonth]
  );
  const lastMonth = useCallback(
    () => setMonth((month) => month.minus({ months: 1 })),
    [setMonth]
  );

  const [isEdit, setEdit] = useState(false);
  const startEdit = useCallback(() => setEdit(true), [setEdit]);
  const endEdit = useCallback(() => setEdit(false), [setEdit]);

  const dates = calendarMonth(month);
  if (habit === undefined) {
    return <></>;
  }
  return (
    <div>
      <Link
        className="button is-link is-light m-4"
        to="/"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 100,
        }}
      >
        Back
      </Link>
      <div className="has-text-centered is-clearfix mt-4">
        {isEdit ? (
          <EditHeader habit={habit} stopEdit={endEdit} />
        ) : (
          <Header habit={habit} edit={startEdit} />
        )}
      </div>
      <hr />
      <div
        className="level container is-mobile"
        style={{
          maxWidth: "fit-content",
        }}
      >
        <div className="level-left">
          <button
            className="button level-item"
            onClick={lastMonth}
            children={["<"]}
          />
        </div>
        <div
          className="level-item"
          style={{
            width: "12rem",
          }}
        >
          {month.monthLong} {month.year}
        </div>
        <div className="level-right">
          <button
            className="button level-item"
            onClick={nextMonth}
            children={[">"]}
          />
        </div>
      </div>
      <table className="table container has-text-centered mb-4">
        <thead>
          <tr>
            <th>M</th>
            <th>T</th>
            <th>W</th>
            <th>T</th>
            <th>F</th>
            <th>S</th>
            <th>S</th>
          </tr>
        </thead>
        <tbody>
          {dates.map((row) => (
            <tr key={row[0].date.weekNumber} className="tbody">
              {row.map(({ date, type }) => {
                const ratio =
                  (habit.dates[date.toISODate()] ?? 0) / habit.daily;
                return (
                  <td
                    key={date.toISODate()}
                    className={`${
                      type === "current" ? "" : "has-text-grey-light"
                    } ${
                      (habit.dates[date.toISODate()] ?? 0) > 0 &&
                      "has-background-success"
                    }${type === "current" ? '' : '-light'}`} // TODO: Colors
                    style={{
                      filter: `brightness(${1.25 - ratio / 2})`,
                    }}
                    onClick={() => {
                      if (date < DateTime.now().endOf("day")) {
                        api.setDone(
                          habit.id,
                          date.toISODate(),
                          (habit.dates[date.toISODate()] ?? 0) >= habit.daily
                            ? 0
                            : (habit.dates[date.toISODate()] ?? 0) + 1
                        );
                      }
                    }}
                  >
                    {date.day}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default HabitDetail;
