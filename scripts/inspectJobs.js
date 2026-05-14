#!/usr/bin/env node

import { loadConfig } from "../src/config.js";
import { requestSonarGraphql } from "../src/sonar/client.js";

const ids = process.argv.slice(2).map((id) => Number.parseInt(id, 10)).filter(Boolean);

if (!ids.length) {
  console.error("Usage: npm run inspect-jobs -- <job-id> [job-id...]");
  process.exitCode = 1;
} else {
  const config = loadConfig();
  const query = `#graphql
  query SampleJobs($id: Int64Bit!) {
    jobs(id: $id) {
      entities {
        id
        complete
        scheduled_datetime
        job_type {
          name
        }
        jobbable {
          __typename
          ... on Account {
            name
          }
          ... on NetworkSite {
            name
          }
        }
        users {
          entities {
            id
            name
          }
        }
      }
    }
  }
  `;

  for (const id of ids) {
    const data = await requestSonarGraphql({
      url: config.sonarGraphqlUrl,
      token: config.sonarApiToken,
      query,
      variables: { id }
    });

    console.log(JSON.stringify(data.jobs.entities[0] ?? { id, missing: true }, null, 2));
  }
}
