const COLUMNS = [
  { key: "jobNumber", label: "Job ID", width: 10 },
  { key: "jobbableEntity", label: "Jobbable Entity", width: 30 },
  { key: "scheduledAtDisplay", label: "Scheduled Date Time", width: 22 },
  { key: "jobTypeName", label: "Job Type", width: 30 },
  { key: "assignedTechs", label: "Assigned Users", width: 32 }
];

export function formatJobsTable(jobs) {
  if (!jobs.length) {
    return "No overdue incomplete jobs found.";
  }

  const header = COLUMNS.map((column) => padCell(column.label, column.width)).join(" | ");
  const separator = COLUMNS.map((column) => "-".repeat(column.width)).join("-+-");
  const rows = jobs.map((job) => {
    return COLUMNS.map((column) => padCell(job[column.key], column.width)).join(" | ");
  });

  return [header, separator, ...rows].join("\n");
}

function padCell(value, width) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  const clipped = normalized.length > width
    ? `${normalized.slice(0, Math.max(0, width - 3))}...`
    : normalized;

  return clipped.padEnd(width, " ");
}
