export interface Habit {
  id: string;
  name: string;
  description: string;
  dates: { [date: string]: number | undefined };
  goal: string;
  daily: number;
}

export type Habits = {
  [id: string]: Habit;
};
