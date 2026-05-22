// src/config/api.js
const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

export const API_BASE =
  // allow override via env if you ever need it
  (process.env.REACT_APP_API_BASE || "").trim() ||
  (isLocal ? "http://localhost:5000" : "https://admin.dozemate.com");

// Join base + path safely
export const apiUrl = (path) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const base = (API_BASE || "").replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
};

// Optional: lightweight fetch wrapper
export async function apiFetch(path, options = {}) {
  const res = await fetch(apiUrl(path), options);
  return { ok: res.ok, status: res.status, json: await res.json().catch(() => null) };
}
