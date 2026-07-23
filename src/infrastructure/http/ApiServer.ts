import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ApiSuccess, ApiError } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3020/api/v1";

export class ServerApiError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const jar = await cookies();
  const token = jar.get("sk_access")?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * The API now re-checks account status (suspended/etc.) on every authenticated
 * request, not just at login (cf. HANDOFF_INFRA.md, v1.0.10) — a 401 can
 * arrive on any call, mid-session, for a token that hasn't actually expired.
 * `redirect()` throws a special Next.js signal that must reach the render/
 * action pipeline uncaught — callers that wrap these functions in try/catch
 * must rethrow it first via `unstable_rethrow` (see call sites).
 */
async function handleUnauthorized(): Promise<never> {
  try {
    const jar = await cookies();
    jar.delete("sk_access");
    jar.delete("sk_refresh");
  } catch {
    // cookies() is read-only during a plain Server Component render (as
    // opposed to a Server Action/Route Handler) — the redirect below still
    // ends the session visually; the API will keep rejecting the stale cookie.
  }
  redirect("/login?reason=session_expired");
}

export async function serverGet<T>(path: string, revalidate = 30): Promise<T> {
  const auth = await getAuthHeader();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...auth },
    next: { revalidate },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) await handleUnauthorized();
    const err = body as ApiError;
    throw new ServerApiError(res.status, err.message ?? "Erreur serveur");
  }
  return ((body as ApiSuccess<T>).data ?? body) as T;
}

export async function serverPost<T>(path: string, data?: unknown): Promise<T> {
  const auth = await getAuthHeader();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: data !== undefined ? JSON.stringify(data) : undefined,
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) await handleUnauthorized();
    const err = body as ApiError;
    throw new ServerApiError(res.status, err.message ?? "Erreur serveur");
  }
  return ((body as ApiSuccess<T>).data ?? body) as T;
}

export async function serverUpload<T>(path: string, formData: FormData): Promise<T> {
  const auth = await getAuthHeader();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { ...auth }, // no Content-Type — browser sets multipart boundary
    body: formData,
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) await handleUnauthorized();
    const err = body as ApiError;
    throw new ServerApiError(res.status, err.message ?? "Erreur serveur");
  }
  return ((body as ApiSuccess<T>).data ?? body) as T;
}

export async function serverDelete<T>(path: string): Promise<T> {
  const auth = await getAuthHeader();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...auth },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) await handleUnauthorized();
    const err = body as ApiError;
    throw new ServerApiError(res.status, err.message ?? "Erreur serveur");
  }
  return ((body as ApiSuccess<T>).data ?? body) as T;
}

export async function serverPatch<T>(path: string, data: unknown): Promise<T> {
  const auth = await getAuthHeader();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify(data),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) await handleUnauthorized();
    const err = body as ApiError;
    throw new ServerApiError(res.status, err.message ?? "Erreur serveur");
  }
  return ((body as ApiSuccess<T>).data ?? body) as T;
}
