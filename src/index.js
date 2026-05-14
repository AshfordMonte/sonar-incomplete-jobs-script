#!/usr/bin/env node

import { parseArgs, getHelpText } from "./cli.js";
import { loadConfig } from "./config.js";
import { getDefaultCutoffDate, localDateToCutoffDatetime } from "./dates.js";
import { formatScheduledDateTime } from "./formatters/datetime.js";
import { formatJobsForSlack, postToSlack } from "./formatters/slack.js";
import { formatJobsTable } from "./formatters/table.js";
import { fetchIncompleteJobs } from "./sonar/jobs.js";

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(getHelpText());
    return;
  }

  const config = loadConfig();
  const cutoffDate = options.cutoffDate ?? getDefaultCutoffDate();
  const cutoffDatetime = localDateToCutoffDatetime(cutoffDate);
  const techUserIds = options.allTechs ? [] : options.techUserIds ?? config.hcTechUserIds;
  const result = await fetchIncompleteJobs({
    config,
    cutoffDatetime,
    limit: options.limit,
    page: options.page,
    techUserIds
  });
  result.jobs = result.jobs.map((job) => ({
    ...job,
    scheduledAtDisplay: formatScheduledDateTime(job.scheduledAt, config.displayTimeZone)
  }));

  const slackPayload = formatJobsForSlack(result.jobs, {
    titleSuffix: config.slackTitleSuffix
  });

  if (options.slackPreview) {
    console.log(JSON.stringify(slackPayload, null, 2));
  } else if (options.output === "json") {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatJobsTable(result.jobs));

    if (result.pageInfo && result.pageInfo.page < result.pageInfo.total_pages) {
      console.log(`\nMore jobs are available. Next page: ${result.pageInfo.page + 1} of ${result.pageInfo.total_pages}`);
    }
  }

  if (options.postSlack) {
    await postToSlack({
      webhookUrl: config.slackWebhookUrl,
      payload: slackPayload
    });
    console.log("Posted overdue incomplete jobs to Slack.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
