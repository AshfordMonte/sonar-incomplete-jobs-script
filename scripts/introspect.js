#!/usr/bin/env node

import { loadConfig } from "../src/config.js";
import { requestSonarGraphql } from "../src/sonar/client.js";

const INTROSPECTION_QUERY = `#graphql
query InspectJobsSchema {
  jobType: __type(name: "Job") {
    fields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
  }
  jobTypeType: __type(name: "JobType") {
    fields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
  }
  jobbableInterface: __type(name: "JobbableInterface") {
    fields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
    possibleTypes {
      name
    }
  }
  accountType: __type(name: "Account") {
    fields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
  }
  userType: __type(name: "User") {
    fields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
  }
  futureAssignmentType: __type(name: "ServiceableAddressAccountAssignmentFuture") {
    fields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
  }
  addressType: __type(name: "Address") {
    fields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
  }
  subdivisionType: __type(name: "Subdivision") {
    fields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
  }
  jobConnection: __type(name: "JobConnection") {
    fields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
  }
  paginatorType: __type(name: "Paginator") {
    inputFields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
  }
  searchType: __type(name: "Search") {
    inputFields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
  }
  sorterType: __type(name: "Sorter") {
    inputFields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
  }
  sortDirectionType: __type(name: "SortDirection") {
    enumValues {
      name
    }
  }
  rangeOperatorType: __type(name: "RangeOperator") {
    enumValues {
      name
    }
  }
  searchStringFieldType: __type(name: "SearchStringField") {
    inputFields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
  }
  searchDatetimeFieldType: __type(name: "SearchDatetimeField") {
    inputFields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
  }
  pageInfoType: __type(name: "PageInfo") {
    fields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
  }
  queryType: __schema {
    queryType {
      fields {
        name
        args {
          name
          type {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
      }
    }
  }
}
`;

const config = loadConfig();
const data = await requestSonarGraphql({
  url: config.sonarGraphqlUrl,
  token: config.sonarApiToken,
  query: INTROSPECTION_QUERY,
  variables: {}
});

const jobsField = data.queryType.queryType.fields.find((field) => field.name === "jobs");

console.log(JSON.stringify({
  jobsArgs: jobsField?.args ?? [],
  jobConnectionFields: listFields(data.jobConnection?.fields),
  jobFields: listFields(data.jobType?.fields),
  jobTypeFields: listFields(data.jobTypeType?.fields),
  jobbableFields: listFields(data.jobbableInterface?.fields),
  jobbablePossibleTypes: (data.jobbableInterface?.possibleTypes ?? []).map((type) => type.name).sort(),
  accountFields: listFields(data.accountType?.fields),
  pageInfoFields: listFields(data.pageInfoType?.fields),
  paginatorFields: listFields(data.paginatorType?.inputFields),
  searchFields: listFields(data.searchType?.inputFields),
  sorterFields: listFields(data.sorterType?.inputFields),
  rangeOperators: listEnumValues(data.rangeOperatorType?.enumValues),
  sortDirections: listEnumValues(data.sortDirectionType?.enumValues),
  addressFields: listFields(data.addressType?.fields),
  futureAssignmentFields: listFields(data.futureAssignmentType?.fields),
  subdivisionFields: listFields(data.subdivisionType?.fields),
  searchDatetimeFieldFields: listFields(data.searchDatetimeFieldType?.inputFields),
  searchStringFieldFields: listFields(data.searchStringFieldType?.inputFields),
  userFields: listFields(data.userType?.fields)
}, null, 2));

function listFields(fields = []) {
  return (fields ?? [])
    .map((field) => ({
      name: field.name,
      type: formatType(field.type)
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function formatType(type) {
  if (!type) {
    return "";
  }

  if (type.kind === "NON_NULL") {
    return `${formatType(type.ofType)}!`;
  }

  if (type.kind === "LIST") {
    return `[${formatType(type.ofType)}]`;
  }

  return type.name || type.kind;
}

function listEnumValues(values = []) {
  return values.map((value) => value.name).sort();
}
