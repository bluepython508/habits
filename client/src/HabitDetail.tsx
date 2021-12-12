import { DateTime } from "luxon";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApi } from "./api";
import { calendarMonth } from "./date";
import { error } from "./Error";
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

const HabitDetail = () => {
  const { id } = useParams();
  const api = useApi();
  const navigate = useNavigate();
  useEffect(() => {
    api.getHabit(id!).catch(e => {
      if (error(e).type === 'notfound') {
        navigate("/")
      }
    });
  }, [id, api, navigate]);
  const habit = useSelector((state) => state.habits[id!]);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const showDeleteModal = useCallback(
    () => setDeleteModalVisible(true),
    [setDeleteModalVisible]
  );
  const hideDeleteModal = useCallback(
    () => setDeleteModalVisible(false),
    [setDeleteModalVisible]
  );
  const [month, setMonth] = useState(DateTime.now());
  const nextMonth = useCallback(
    () => setMonth((month) => month.plus({ months: 1 })),
    [setMonth]
  );
  const lastMonth = useCallback(
    () => setMonth((month) => month.minus({ months: 1 })),
    [setMonth]
  );
  const dates = calendarMonth(month);
  if (habit === undefined) {
    return <></>;
  }
  return (
    <div>
      {isDeleteModalVisible && (
        <DeleteModal habit={habit} hide={hideDeleteModal} />
      )}
      <div className="has-text-centered is-clearfix mt-3 mr-3">
        <Link
          className="button is-link is-light m-4"
          to="/"
          style={{
            position: "fixed",
            left: 0,
            bottom: 0,
          }}
        >
          Back
        </Link>
        <h1 className="title">{habit.name}</h1>
        <button
          className="button is-danger m-4"
          onClick={showDeleteModal}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
          }}
        >
          Delete
        </button>
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
      <table className="table container has-text-centered">
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
              {row.map(({ date, type }) => (
                <td
                  key={date.toISODate()}
                  className={`${
                    habit.dates.includes(date.toISODate())
                      ? "has-background-success"
                      : ""
                  } ${type === "current" ? "" : "has-text-grey"}`}
                >
                  {date.day}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default HabitDetail;
