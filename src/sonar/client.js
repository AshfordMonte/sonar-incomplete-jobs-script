export async function requestSonarGraphql({ url, token, query, variables }) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, variables })
  });

  const responseText = await response.text();
  const payload = parseJsonResponse(responseText);

  if (!response.ok) {
    throw new Error(`Sonar API request failed with ${response.status}: ${responseText}`);
  }

  if (payload.errors?.length) {
    const message = payload.errors.map((error) => error.message).join("; ");
    throw new Error(`Sonar GraphQL error: ${message}`);
  }

  return payload.data;
}

function parseJsonResponse(responseText) {
  try {
    return JSON.parse(responseText);
  } catch (error) {
    throw new Error(`Sonar API returned invalid JSON: ${error.message}`);
  }
}
