import { cookies } from "next/headers";
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

export async function serverGet<T>(path: string, revalidate = 30): Promise<T> {
  const auth = await getAuthHeader();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...auth },
    next: { revalidate },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
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
    const err = body as ApiError;
    throw new ServerApiError(res.status, err.message ?? "Erreur serveur");
  }
  return ((body as ApiSuccess<T>).data ?? body) as T;
}
