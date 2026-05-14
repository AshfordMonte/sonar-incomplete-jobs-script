const DEFAULT_TITLE = "Incomplete Jobs";

export function formatJobsForSlack(jobs, { titleSuffix = "" } = {}) {
  const title = formatTitle(titleSuffix);

  if (!jobs.length) {
    return {
      text: `${title}\nNo overdue incomplete Sonar jobs found.`,
      blocks: [
        sectionBlock(`*${title}*`),
        sectionBlock("No overdue incomplete Sonar jobs found.")
      ]
    };
  }

  const visibleJobs = jobs.slice(0, 99);

  // Incoming webhooks render Slack's native table block cleanly here.
  const blocks = [
    sectionBlock(`*${title}*`),
    tableBlock(visibleJobs)
  ];

  if (jobs.length > visibleJobs.length) {
    blocks.push(sectionBlock(`Showing the first ${visibleJobs.length} jobs. Run the CLI for the full list.`));
  }

  return {
    text: `${title}\n${formatPlainTextRows(visibleJobs)}`,
    blocks
  };
}

export async function postToSlack({ webhookUrl, payload }) {
  if (!webhookUrl) {
    throw new Error("SLACK_WEBHOOK_URL is required when using --post-slack.");
  }

  const response = await sendSlackPayload(webhookUrl, payload);

  if (response.ok) {
    return;
  }

  const responseText = await response.text();
  throw new Error(`Slack webhook failed with ${response.status}: ${responseText}`);
}

async function sendSlackPayload(webhookUrl, payload) {
  return fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

function sectionBlock(text) {
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text
    }
  };
}

function tableBlock(jobs) {
  return {
    type: "table",
    column_settings: [
      { align: "left" },
      { align: "left", is_wrapped: true },
      { align: "left" },
      { align: "left", is_wrapped: true },
      { align: "left", is_wrapped: true }
    ],
    rows: [
      tableRow([
        "Job | ID",
        "Job | Jobbable Entity",
        "Job | Scheduled Date time",
        "Job Type | Name",
        "Assigned Users"
      ]),
      ...jobs.map((job) => tableRow([
        job.jobNumber || job.id || "",
        job.jobbableEntity || "",
        job.scheduledAtDisplay || job.scheduledAt || "",
        job.jobTypeName || "",
        job.assignedTechs || ""
      ]))
    ]
  };
}

// Slack table cells must be plain text or rich text objects.
function tableRow(values) {
  return values.map((value) => ({
    type: "raw_text",
    text: String(value ?? "")
  }));
}

function formatPlainTextRows(jobs) {
  const headers = [
    "Job | ID",
    "Job | Jobbable Entity",
    "Job | Scheduled Date time",
    "Job Type | Name",
    "Assigned Users"
  ];
  const rows = [
    `| ${headers.map(escapeMarkdownTableCell).join(" | ")} |`,
    "| --- | --- | --- | --- | --- |"
  ];

  for (const job of jobs) {
    rows.push(`| ${[
      job.jobNumber || job.id || "",
      job.jobbableEntity || "",
      job.scheduledAtDisplay || job.scheduledAt || "",
      job.jobTypeName || "",
      job.assignedTechs || ""
    ].map(escapeMarkdownTableCell).join(" | ")} |`);
  }

  return rows.join("\n");
}

function escapeMarkdownTableCell(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

function formatTitle(titleSuffix) {
  const suffix = String(titleSuffix ?? "").trim();

  return suffix ? `${DEFAULT_TITLE} ${suffix}` : DEFAULT_TITLE;
}
