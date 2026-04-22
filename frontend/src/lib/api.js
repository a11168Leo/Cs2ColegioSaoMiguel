const jsonHeaders = {
  "Content-Type": "application/json",
};

async function request(path, { baseUrl, token, method = "GET", body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...jsonHeaders,
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let detail = "Unexpected API error.";

    try {
      const payload = await response.json();
      detail = payload.detail || JSON.stringify(payload);
    } catch {
      detail = response.statusText || detail;
    }

    throw new Error(detail);
  }

  return response.json();
}

export function getDashboard({ baseUrl, token }) {
  return request("/api/dashboard", { baseUrl, token });
}

export function createMatch({ baseUrl, token, payload }) {
  return request("/api/matches", {
    baseUrl,
    token,
    method: "POST",
    body: payload,
  });
}

export function executeMatchAction({ baseUrl, token, matchId, action, payload }) {
  const endpoint =
    action === "command"
      ? `/api/matches/${matchId}/command`
      : `/api/matches/${matchId}/${action}`;

  return request(endpoint, {
    baseUrl,
    token,
    method: "POST",
    body: payload,
  });
}
