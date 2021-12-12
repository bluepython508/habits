import axios from "axios";
import { useMemo } from "react";
import { actions, useSelector, useDispatch } from "./store";

export interface Client {
  newHabit(name: string): Promise<void>;
  deleteHabit(id: string): Promise<void>;
  getHabit(id: string): Promise<void>;
  habits(): Promise<void>;
  setDone(habit: string): Promise<void>;
  setUndone(habit: string): Promise<void>;
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
          await client.delete(`habits/${habit}`);
          dispatch(actions.deleteHabit(habit));
      },
      habits: async () => {
          const response = await client.get("habits");
          dispatch(actions.loadHabits(response.data));
      },
      setDone: async (habit) => {
          await client.post(`habits/${habit}/done`);
          dispatch(actions.markHabitDone(habit));
      },
      setUndone: async (habit) => {
          await client.delete(`habits/${habit}/done`);
          dispatch(actions.markHabitUndone(habit));
      },
      login: async (username, password) => {
          await client.get('/check_user', { auth: { username, password } });
          dispatch(actions.login({ username, password }));
      },
      signup: async (username: string, password: string) => {
          await client.post('/signup', {}, { auth: { username, password } });
          dispatch(actions.login({ username, password }));
      }
    }),
    [client, dispatch]
  );
  return api;
};
