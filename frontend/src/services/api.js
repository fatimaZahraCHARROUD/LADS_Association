const API_BASE = "http://localhost:3000";

function authHeader() {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth ? authHeader() : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message =
      (Array.isArray(err.message) ? err.message.join(", ") : err.message) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  get:    (p)    => request(p),
  post:   (p, b) => request(p, { method: "POST",   body: b }),
  patch:  (p, b) => request(p, { method: "PATCH",  body: b }),
  delete: (p)    => request(p, { method: "DELETE" }),
};

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
