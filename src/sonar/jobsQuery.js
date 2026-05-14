export const INCOMPLETE_JOBS_QUERY = `#graphql
query IncompleteJobs($cutoffDatetime: Datetime!, $page: Int!, $recordsPerPage: Int!) {
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
      sonar_unique_id
      complete
      completed_successfully
      completion_datetime
      completion_notes
      scheduled_datetime
      updated_at
      jobbable {
        __typename
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
      address_on_completion
      serviceable_address_account_assignment_future {
        address {
          line1
          line2
          city
          subdivision
          zip
        }
      }
      completed_by_user {
        id
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
}
`;

// Keep GraphQL variables in one place so the query stays easy to compare
// against Sonar's schema when fields or filters change.
export function buildIncompleteJobsVariables({ cutoffDatetime, page, recordsPerPage }) {
  return {
    cutoffDatetime,
    page,
    recordsPerPage
  };
}
