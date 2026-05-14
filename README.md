# Sonar Incomplete Jobs CLI

CLI framework for pulling overdue incomplete Sonar jobs for HC Wireless technicians, formatting them as a list/table, and eventually posting the output to Slack.

## Setup

1. Install Node.js 18 or newer.
2. Fill in `.env` with your Sonar GraphQL endpoint, API token, and HC Wireless technician user IDs.
3. Run:

```powershell
npm run jobs -- --help
```

## Commands

Print incomplete jobs as a console table:

```powershell
npm run jobs
```

By default, this returns jobs where:

- `complete` is `false`
- `scheduled_datetime` is before today, which means yesterday and older
- at least one assigned Sonar user matches `HC_TECH_USER_IDS`, if that env value is set

For HC Wireless, use:

```env
HC_TECH_USER_IDS=344,341,340
DISPLAY_TIME_ZONE=Etc/GMT+6
```

Limit returned jobs. The CLI may scan additional Sonar pages to fill this count after the HC technician filter is applied:

```powershell
npm run jobs -- --limit 25
```

Request a specific Sonar page:

```powershell
npm run jobs -- --page 2 --limit 25
```

Use a custom cutoff date. This includes jobs scheduled before the date, so `2026-05-14` means May 13 and older:

```powershell
npm run jobs -- --cutoff-date 2026-05-14
```

Override HC Wireless technician user IDs:

```powershell
npm run jobs -- --tech-user-ids 123,456,789
```

Inspect overdue incomplete jobs for all assigned techs:

```powershell
npm run jobs -- --all-techs --limit 10 --output json
```

Print raw normalized JSON:

```powershell
npm run jobs -- --output json
```

Inspect the available Sonar GraphQL fields:

```powershell
npm run introspect
```

Post to Slack once `SLACK_WEBHOOK_URL` is set:

```powershell
npm run jobs -- --post-slack
```

Optionally add a suffix after the Slack title, for user mentions or a team note:

```env
SLACK_TITLE_SUFFIX=- <@USERID1> <@USERID2> <@USERID3>
```

Preview the Slack webhook payload without posting:

```powershell
npm run jobs -- --limit 4 --slack-preview
```

Slack output uses a Slack table block with these columns:

- `Job ID`
- `Job | Jobbable Entity`
- `Scheduled`
- `Job Type`
- `Assigned Users`

Slack posts the first 99 jobs plus the header row in the table block. Run the CLI locally for the full list if the report is longer.

## GraphQL Query

The current query in `src/sonar/jobsQuery.js` uses the confirmed Sonar shape:

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
    serviceable_address_account_assignment_future {
      address {
        line1
        line2
        city
        subdivision
        zip
      }
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

The HC Wireless technician filter currently runs locally against `jobs.entities.users.entities.id`. If `HC_TECH_USER_IDS` is empty, the CLI includes all overdue incomplete jobs.

The CLI expects normalized jobs with these display fields:

- `id`
- `jobNumber`
- `complete`
- `status`
- `customerName`
- `address`
- `assignedTechs`
- `assignedTechUserIds`
- `scheduledAt`
- `scheduledAtDisplay`
- `jobbableEntity`
- `jobTypeName`
- `completedAt`
- `notes`
