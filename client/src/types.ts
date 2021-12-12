export interface Habit {
  id: string;
  name: string;
  dates: string[];
}

export type Habits = {
  [id: string]: Habit;
};
