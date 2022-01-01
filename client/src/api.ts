import axios from "axios";
import { useEffect, useMemo } from "react";
import { actions, useSelector, useDispatch } from "./store";
import { Habit, Habits } from "./types";

export interface Client {
  updateHabit(habit: Partial<Omit<Habit, 'dates'>> & { id: string }): Promise<void>;
  newHabit(name: string): Promise<void>;
  deleteHabit(id: string): Promise<void>;
  getHabit(id: string): Promise<void>;
  habits(): Promise<Habits>;
  setDone(habit: string, date: string): Promise<void>;
  setUndone(habit: string, date: string): Promise<void>;
  login(username: string, password: string): Promise<void>;
  signup(username: string, password: string): Promise<void>;
}

export const useApi: () => Client = () => {
  const dispatch = useDispatch();
  const loginState = useSelector((state) => state.login);
  const client = useMemo(
    () =>
      axios.create({
        baseURL: "/api/",
        auth: loginState ?? undefined,
      }),
    [loginState]
  );
  const api: Client = useMemo(
    () => ({
      newHabit: async (name) => {
        const response = await client.post("habits", { name });
        dispatch(
          actions.setHabit({
            id: response.data.id,
            name,
            dates: [],
          })
        );
      },
      getHabit: async (id) => {
        const response = await client.get(`habits/${id}`);
        dispatch(actions.setHabit(response.data));
      },
      deleteHabit: async (habit) => {
        dispatch(actions.deleteHabit(habit));
        await client.delete(`habits/${habit}`);
      },
      habits: async () => {
        const response = await client.get("habits");
        dispatch(actions.loadHabits(response.data));
        return response.data;
      },
      setDone: async (habit, date) => {
        dispatch(actions.markHabitDone({ habit, date }));
        await client.post(`habits/${habit}/${date}`);
      },
      setUndone: async (habit, date) => {
        dispatch(actions.markHabitUndone({ habit, date }));
        await client.delete(`habits/${habit}/${date}`);
      },
      updateHabit: async (habit) => {
        dispatch(actions.updateHabit(habit));
        await client.put(`habits/${habit.id}`, habit);
      },
      login: async (username, password) => {
        await client.get('/check_user', { auth: { username, password } });
        localStorage.setItem("login", JSON.stringify({ username, password }));
        dispatch(actions.login({ username, password }));
      },
      signup: async (username: string, password: string) => {
        await client.post('/signup', {}, { auth: { username, password } });
        localStorage.setItem("login", JSON.stringify({ username, password }));
        dispatch(actions.login({ username, password }));
      }
    }),
    [client, dispatch]
  );

  useEffect(() => {
    if (loginState === null) {
      const storedLogin = localStorage.getItem("login");
      if (storedLogin !== null) {
        const {username, password} = JSON.parse(storedLogin);
        api.login(username, password)
      }
    }
  })

  return api;
};
