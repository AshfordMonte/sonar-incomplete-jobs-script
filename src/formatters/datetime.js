export function formatScheduledDateTime(value, timeZone) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    hour12: false,
    minute: "2-digit",
    month: "numeric",
    timeZone,
    year: "numeric"
  }).formatToParts(date);

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  const hour = String(Number.parseInt(lookup.hour, 10));

  return `${lookup.month}/${lookup.day}/${lookup.year} ${hour}:${lookup.minute}`;
}
