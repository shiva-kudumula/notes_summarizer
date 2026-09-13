export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export async function api(path, options = {}) {
  if (!API_URL) {
    throw new Error("The API URL is not configured. Set VITE_API_URL and redeploy.");
  }
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || (response.status === 429 ? "AI service limit reached. Please try again later." : "Unable to connect to the server."));
    error.status = response.status;
    throw error;
  }
  return data;
}
