const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://unspoken-backend-nqvl.onrender.com";

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("unspoken-session-token");
}

function authHeaders() {
  const token = getToken();

  // The Render backend expects a raw JWT in the lowercase `authorization`
  // header. It does NOT accept a "Bearer " prefix.
  return token ? { authorization: token } : {};
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "GET",
    headers: {
      ...authHeaders(),
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(await readApiError(res));
  }

  return res.json() as Promise<T>;
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(await readApiError(res));
  }

  return res.json() as Promise<T>;
}

export async function apiPostForm<T>(
  path: string,
  form: FormData,
): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: {
      ...authHeaders(),
      Accept: "application/json",
      // Do NOT set Content-Type — the browser sets the multipart boundary.
    },
    body: form,
  });

  if (!res.ok) {
    throw new Error(await readApiError(res));
  }

  return res.json() as Promise<T>;
}

async function readApiError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as {
      detail?: string | Array<{ loc?: unknown[]; msg?: string; type?: string }>;
      message?: string;
    };

    if (typeof data.detail === "string") return data.detail;

    if (Array.isArray(data.detail) && data.detail.length > 0) {
      return data.detail
        .map((d) => {
          const where = Array.isArray(d.loc) ? d.loc.join(".") : "";
          return where
            ? `${where}: ${d.msg ?? d.type ?? "invalid"}`
            : d.msg ?? "invalid";
        })
        .join("; ");
    }

    if (data.message) return data.message;
    return `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}
