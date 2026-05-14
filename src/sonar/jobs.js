import { requestSonarGraphql } from "./client.js";
import { buildIncompleteJobsVariables, INCOMPLETE_JOBS_QUERY } from "./jobsQuery.js";

export async function fetchIncompleteJobs({ config, cutoffDatetime, limit, page = 1, techUserIds = [] }) {
  const maxJobs = limit ?? config.sonarPageSize;
  const recordsPerPage = config.sonarPageSize;
  const jobs = [];
  let currentPage = page;
  let pageInfo = null;

  // Sonar filters the broad report server-side. The tech filter is local
  // because these jobs expose assigned users in the returned relation, not as a
  // simple jobs() argument. Scan pages until we have enough matching jobs.
  while (jobs.length < maxJobs) {
    const data = await requestSonarGraphql({
      url: config.sonarGraphqlUrl,
      token: config.sonarApiToken,
      query: INCOMPLETE_JOBS_QUERY,
      variables: buildIncompleteJobsVariables({
        cutoffDatetime,
        page: currentPage,
        recordsPerPage
      })
    });

    const connection = data.jobs;
    const entities = Array.isArray(connection?.entities) ? connection.entities : [];
    pageInfo = connection?.page_info ?? null;

    const matchingJobs = entities
      .map(normalizeJob)
      .filter((job) => needsCompletion(job))
      .filter((job) => matchesTechUserIds(job, techUserIds));

    for (const job of matchingJobs) {
      if (jobs.length >= maxJobs) {
        break;
      }

      jobs.push(job);
    }

    if (jobs.length >= maxJobs || !pageInfo || currentPage >= pageInfo.total_pages) {
      break;
    }

    currentPage += 1;
  }

  return {
    jobs,
    pageInfo,
    scanInfo: {
      recordsPerPage,
      startPage: page,
      endPage: currentPage
    }
  };
}

// Normalize Sonar's snake_case GraphQL response into the shape used by every
// formatter. This keeps Slack/table output independent from the raw API shape.
export function normalizeJob(job) {
  return {
    id: job.id ?? "",
    jobNumber: job.jobNumber ?? job.id ?? "",
    sonarUniqueId: job.sonar_unique_id ?? "",
    assignedTechUserIds: formatAssignedTechUserIds(job.users?.entities),
    complete: job.complete ?? null,
    completedSuccessfully: job.completed_successfully ?? null,
    status: formatCompleteStatus(job.complete),
    customerName: job.customer?.name ?? "",
    jobTypeName: job.job_type?.name ?? "",
    jobbableEntity: formatJobbableEntity(job.jobbable),
    address: firstNonBlank(
      job.address_on_completion,
      formatAddress(job.serviceable_address_account_assignment_future?.address),
      formatAddress(job.serviceLocation)
    ),
    assignedTechs: formatAssignedTechs(job.users?.entities ?? job.assignedTechnicians),
    scheduledAt: job.scheduled_datetime ?? "",
    completedAt: job.completion_datetime ?? job.completedAt ?? "",
    updatedAt: job.updated_at ?? "",
    completedBy: job.completed_by_user?.name ?? "",
    notes: job.completion_notes ?? job.notes ?? ""
  };
}

function formatAddress(location) {
  if (!location) {
    return null;
  }

  return [
    location.addressLine1 ?? location.line1,
    location.line2,
    location.city,
    location.state ?? location.subdivision,
    location.zip
  ].filter(Boolean).join(", ");
}

function formatAssignedTechs(assignedTechnicians) {
  if (!Array.isArray(assignedTechnicians)) {
    return "";
  }

  return assignedTechnicians
    .map((tech) => tech?.name)
    .filter(Boolean)
    .join(" | ");
}

// Prefer Sonar's completion address when present, then fall back to the
// scheduled assignment address.
function firstNonBlank(...values) {
  return values.find((value) => String(value ?? "").trim()) ?? "";
}

function formatCompleteStatus(complete) {
  if (complete === true) {
    return "Complete";
  }

  if (complete === false) {
    return "Incomplete";
  }

  return "";
}

function formatJobbableEntity(jobbable) {
  if (!jobbable) {
    return "";
  }

  return jobbable.name ?? "";
}

function needsCompletion(job) {
  return job.complete === false;
}

function formatAssignedTechUserIds(assignedTechnicians) {
  if (!Array.isArray(assignedTechnicians)) {
    return [];
  }

  return assignedTechnicians
    .map((tech) => tech?.id)
    .filter((id) => id !== undefined && id !== null)
    .map((id) => String(id));
}

function matchesTechUserIds(job, techUserIds) {
  if (!techUserIds.length) {
    return true;
  }

  const allowedIds = new Set(techUserIds.map((id) => String(id)));
  return job.assignedTechUserIds.some((id) => allowedIds.has(id));
}
