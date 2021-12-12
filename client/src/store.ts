import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  useDispatch as useDispatchBase,
  useSelector as useSelectorBase,
  useStore as useStoreBase,
  TypedUseSelectorHook,
} from "react-redux";
import { today } from "./date";
import { Habit, Habits } from "./types";

const initialHabitsState: Habits = {};
const habits = createSlice({
  name: "habits",
  initialState: initialHabitsState,
  reducers: {
    loadHabits: (state: Habits, habits: PayloadAction<Habits>) =>
      habits.payload,
    setHabit: (state: Habits, { payload }: PayloadAction<Habit>) => ({
      ...state,
      [payload.id]: payload,
    }),
    deleteHabit: (state: Habits, { payload }: PayloadAction<string>) => {
      const { [payload]: _, ...rest } = state;
      return rest;
    },
    markHabitDone: (state: Habits, { payload }: PayloadAction<string>) => {
      state[payload].dates.push(today());
    },
    markHabitUndone: (state: Habits, { payload }: PayloadAction<string>) => {
      const now = today();
      state[payload].dates = state[payload].dates.filter(
        (date) => date !== now
      );
    },
  },
});

type LoginState = { username: string; password: string } | null;
const loginState: LoginState = null;
const login = createSlice({
  name: "login",
  initialState: loginState as LoginState,
  reducers: {
    login: (
      state: LoginState,
      { payload }: PayloadAction<{ username: string; password: string }>
    ) => payload,
    logout: (state: LoginState) => null,
  },
});

export const actions = { ...habits.actions, ...login.actions };

const store = configureStore({
  reducer: {
    habits: habits.reducer,
    login: login.reducer,
  },
});

export default store;

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export const useDispatch: () => AppDispatch = () => useDispatchBase();
export const useSelector: TypedUseSelectorHook<RootState> = useSelectorBase;
export const useStore: () => typeof store = useStoreBase;
