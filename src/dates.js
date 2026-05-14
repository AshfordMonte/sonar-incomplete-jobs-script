export function getDefaultCutoffDate() {
  const now = new Date();
  return formatLocalDate(now);
}

export function localDateToCutoffDatetime(dateValue) {
  const [year, month, day] = dateValue.split("-").map((part) => Number.parseInt(part, 10));
  const localStartOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);

  if (Number.isNaN(localStartOfDay.getTime())) {
    throw new Error(`Invalid cutoff date: ${dateValue}`);
  }

  return localStartOfDay.toISOString();
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
