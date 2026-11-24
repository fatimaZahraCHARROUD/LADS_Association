const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000")
  .replace(/\/+$/, "");

function authHeader() {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function request(path, { method = "GET", body, auth = true, signal } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth ? authHeader() : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (res.status === 204) return null;

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  // Unified response shape: { success, content, error }
  if (json && typeof json === "object" && "success" in json) {
    if (json.success === false) {
      throw new Error(json.error || `Request failed (${res.status})`);
    }
    return json.content;
  }

  // Fallback for non-unified responses
  if (!res.ok) {
    const message =
      (json && (Array.isArray(json.message) ? json.message.join(", ") : json.message)) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return json;
}

export { API_BASE };

export function getCurrentUserId() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId || payload.sub || null;
  } catch {
    return null;
  }
}

export function getCurrentUserRole() {
  const token = localStorage.getItem("token");
  if (!token) return [];
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Array.isArray(payload.role) ? payload.role : [];
  } catch {
    return [];
  }
}

export const api = {
  get:    (p, options) => request(p, options),
  post:   (p, b)       => request(p, { method: "POST",   body: b }),
  patch:  (p, b)       => request(p, { method: "PATCH",  body: b }),
  delete: (p)          => request(p, { method: "DELETE" }),
  getExecDashboard: (options) =>
    request("/statistics/executive-dashboard", options),
  getTeamDashboard: (options) =>
    request("/statistics/team-dashboard", options),
  switchRole: (membershipId) =>
    request("/auth/switch-role", { method: "POST", body: { membershipId } }),
};
