import fs from "node:fs";
import path from "node:path";

const DEFAULT_ENV_PATH = ".env";

export function loadConfig({ cwd = process.cwd(), envPath = DEFAULT_ENV_PATH } = {}) {
  loadDotEnv(path.resolve(cwd, envPath));

  return {
    hcTechUserIds: readCsvEnv("HC_TECH_USER_IDS"),
    displayTimeZone: process.env.DISPLAY_TIME_ZONE || "Etc/GMT+6",
    slackTitleSuffix: process.env.SLACK_TITLE_SUFFIX || "",
    sonarGraphqlUrl: readRequiredEnv("SONAR_GRAPHQL_URL"),
    sonarApiToken: readRequiredEnv("SONAR_API_TOKEN"),
    sonarPageSize: readIntegerEnv("SONAR_PAGE_SIZE", 50),
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || ""
  };
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = stripOptionalQuotes(rawValue);

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function stripOptionalQuotes(value) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function readRequiredEnv(key) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function readIntegerEnv(key, fallback) {
  const value = process.env[key];

  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer.`);
  }

  return parsed;
}

function readCsvEnv(key) {
  const value = process.env[key];

  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
