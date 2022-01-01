export interface Habit {
  id: string;
  name: string;
  description: string;
  dates: string[];
}

export type Habits = {
  [id: string]: Habit;
};
