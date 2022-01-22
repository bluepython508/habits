import { DateTime } from "luxon";

export type CalendarDay = {
  date: DateTime;
  type: "previous" | "current" | "next";
};
export function calendarMonth(base: DateTime): CalendarDay[][] {
  const firstOfMonth = base.startOf("month");
  const firstShown = firstOfMonth.startOf("week");
  const lastOfMonth = firstOfMonth.endOf("month");
  const lastShown = lastOfMonth.endOf("week");
  let days: CalendarDay[][] = [[]];
  let current = firstShown;
  while (current < lastShown) {
    if (days[days.length - 1].length === 7) {
      days.push([]);
    }
    days[days.length - 1].push({
      date: current,
      type:
        current < firstOfMonth
          ? "previous"
          : current < lastOfMonth
          ? "current"
          : "next",
    });
    current = current.plus({ day: 1 });
  }
  return days;
}
