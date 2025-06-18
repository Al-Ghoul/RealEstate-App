import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import calendar from "dayjs/plugin/calendar";
import "dayjs/locale/ar";

dayjs.extend(relativeTime);
dayjs.extend(calendar);

export function formatChatTimestamp(dateStr: string): string {
  const date = dayjs(dateStr);
  const now = dayjs();

  if (now.diff(date, "minute") < 1) return "Just now";

  const diffDays = now.diff(date, "day");

  if (diffDays <= 7) {
    return date.fromNow();
  } else {
    return date.calendar(null, {
      sameDay: "[Today]",
      nextDay: "[Tomorrow]",
      nextWeek: "MMM D",
      lastDay: "[Yesterday]",
      lastWeek: "MMM D",
      sameElse: "MMM D, YYYY",
    });
  }
}
