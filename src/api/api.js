const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const {
    method = "GET",
    body,
    headers = {},
    params
  } = options;

  let url = `${API_BASE_URL}${endpoint}`;

  if (params && typeof params === "object") {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value);
      }
    });

    const queryString = searchParams.toString();

    if (queryString) {
      url += `${url.includes("?") ? "&" : "?"}${queryString}`;
    }
  }

  const config = {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    }
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);

  let data = null;

  try {
    if (response.status !== 204) {
      data = await response.json();
    }
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent("unauthorized", { detail: 401 }));
    }

    let message = "Error en la petición al servidor";

    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      message = data.detail.map((item) => item.msg).join(" | ");
    } else if (typeof data?.message === "string") {
      message = data.message;
    }

    throw new Error(message);
  }

  return data;
}