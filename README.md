# Sonar Incomplete Jobs CLI

Daily CLI report for overdue incomplete Sonar jobs assigned to HC Wireless technicians.

The normal daily workflow is:

```powershell
npm run slack
```

That command pulls overdue incomplete jobs from Sonar, formats them as a Slack table, and posts the report to the configured Slack webhook.

## What It Reports

By default, a job is included when:

- Sonar says `complete` is `false`
- `scheduled_datetime` is before today, which means yesterday and older
- at least one assigned Sonar user matches `HC_TECH_USER_IDS`

The current HC Wireless tech IDs are:

```env
HC_TECH_USER_IDS=344,341,340
```

The Slack/table output uses these columns:

- `Job | ID`
- `Job | Jobbable Entity`
- `Job | Scheduled Date time`
- `Job Type | Name`
- `Assigned Users`

## Setup

1. Install Node.js 18 or newer.
2. Fill in `.env`.
3. Run a local report before posting to Slack.

Required `.env` values:

```env
SONAR_GRAPHQL_URL=https://your-sonar-host.example.com/graphql
SONAR_API_TOKEN=replace_me
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/replace/me
HC_TECH_USER_IDS=344,341,340
DISPLAY_TIME_ZONE=Etc/GMT+6
```

Optional values:

```env
SONAR_PAGE_SIZE=50
SLACK_TITLE_SUFFIX=- <@USERID1> <@USERID2> <@USERID3>
```

`SLACK_TITLE_SUFFIX` is useful if you want the title to look like:

```text
Incomplete Jobs - @Nathan Butterworth @Leo Castillo @Chris Rush
```

## Commands

Post the daily Slack report:

```powershell
npm run slack
```

Print the same report in the terminal:

```powershell
npm run jobs
```

Preview the Slack payload without posting:

```powershell
npm run jobs -- --limit 4 --slack-preview
```

Limit returned jobs:

```powershell
npm run jobs -- --limit 25
```

Use a custom cutoff date. This includes jobs scheduled before the date, so `2026-05-14` means May 13 and older:

```powershell
npm run jobs -- --cutoff-date 2026-05-14
```

Temporarily override the HC Wireless tech IDs:

```powershell
npm run jobs -- --tech-user-ids 123,456,789
```

Inspect overdue incomplete jobs for all assigned techs:

```powershell
npm run jobs -- --all-techs --limit 10
```

Print raw normalized JSON:

```powershell
npm run jobs -- --output json
```

Inspect specific Sonar jobs:

```powershell
npm run inspect-jobs -- 59855 59853 59874 57193
```

Inspect available Sonar GraphQL fields:

```powershell
npm run introspect
```

## Slack Output

Slack output uses a native Slack table block. The script sends one title section and one table block. Slack allows up to 100 rows in a table block, so the message includes the header row plus the first 99 jobs.

The fallback `text` field is included for Slack notifications and accessibility. The visible channel message should render from the `blocks` array.

## Sonar Query

The main query lives in `src/sonar/jobsQuery.js`. Sonar handles the broad filter:

```graphql
jobs(
  complete: false
  paginator: { page: $page, records_per_page: $recordsPerPage }
  search: [{
    datetime_fields: [{
      attribute: "scheduled_datetime"
      operator: LT
      search_value: $cutoffDatetime
    }]
  }]
  sorter: [{ attribute: "scheduled_datetime", direction: DESC }]
) {
  entities {
    id
    complete
    scheduled_datetime
    jobbable {
      ... on Account {
        name
      }
      ... on NetworkSite {
        name
      }
    }
    job_type {
      name
    }
    users {
      entities {
        id
        name
      }
    }
  }
  page_info {
    page
    records_per_page
    total_count
    total_pages
  }
}
```

The HC Wireless technician filter runs locally against `jobs.entities.users.entities.id`. The CLI scans additional Sonar pages until it fills the requested `--limit` or runs out of results.
