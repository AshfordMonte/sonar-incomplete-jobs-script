const HELP_TEXT = `Usage: npm run jobs -- [options]

Options:
  --all-techs            Ignore HC_TECH_USER_IDS and include every assigned tech.
  --cutoff-date <date>   Include jobs scheduled before this local date. Defaults to today.
  --limit <number>       Maximum jobs to return. Defaults to SONAR_PAGE_SIZE.
  --page <number>        Sonar result page to request. Defaults to 1.
  --output <table|json>  Output format. Defaults to table.
  --post-slack           Post formatted jobs to SLACK_WEBHOOK_URL.
  --slack-preview        Print the Slack webhook payload JSON without posting it.
  --tech-user-ids <ids>  Comma-separated Sonar user IDs. Overrides HC_TECH_USER_IDS.
  --help                 Show this help text.
`;

export function parseArgs(argv) {
  const options = {
    allTechs: false,
    cutoffDate: null,
    help: false,
    limit: null,
    output: "table",
    page: 1,
    postSlack: false,
    slackPreview: false,
    techUserIds: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--all-techs":
        options.allTechs = true;
        break;
      case "--cutoff-date":
        options.cutoffDate = readDateValue(readValue(argv, index, arg), arg);
        index += 1;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--limit":
        options.limit = readPositiveInteger(readValue(argv, index, arg), arg);
        index += 1;
        break;
      case "--output":
        options.output = readOutput(readValue(argv, index, arg));
        index += 1;
        break;
      case "--page":
        options.page = readPositiveInteger(readValue(argv, index, arg), arg);
        index += 1;
        break;
      case "--post-slack":
        options.postSlack = true;
        break;
      case "--slack-preview":
        options.slackPreview = true;
        break;
      case "--tech-user-ids":
        options.techUserIds = readCsvValue(readValue(argv, index, arg));
        index += 1;
        break;
      default:
        throw new Error(`Unknown option: ${arg}\n\n${HELP_TEXT}`);
    }
  }

  return options;
}

export function getHelpText() {
  return HELP_TEXT;
}

function readValue(argv, index, optionName) {
  const value = argv[index + 1];

  if (!value || value.startsWith("--")) {
    throw new Error(`${optionName} requires a value.`);
  }

  return value;
}

function readPositiveInteger(value, optionName) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`${optionName} must be a positive integer.`);
  }

  return parsed;
}

function readOutput(value) {
  if (!["json", "table"].includes(value)) {
    throw new Error("--output must be either table or json.");
  }

  return value;
}

function readCsvValue(value) {
  const values = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!values.length) {
    throw new Error("--tech-user-ids requires at least one user ID.");
  }

  return values;
}

function readDateValue(value, optionName) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${optionName} must use YYYY-MM-DD format.`);
  }

  return value;
}
