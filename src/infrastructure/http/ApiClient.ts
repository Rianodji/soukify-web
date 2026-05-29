import { type ApiError } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3020/api/v1";

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class ApiClient {
  private static accessToken: string | null = null;

  static setAccessToken(token: string | null) {
    ApiClient.accessToken = token;
  }

  static async request<T>(
    path: string,
    options: RequestInit = {},
    withAuth = false,
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (withAuth && ApiClient.accessToken) {
      headers["Authorization"] = `Bearer ${ApiClient.accessToken}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = body as ApiError;
      throw new HttpError(res.status, err.message ?? "Une erreur est survenue");
    }

    return (body as { data: T }).data ?? body;
  }

  static get<T>(path: string, withAuth = false) {
    return ApiClient.request<T>(path, { method: "GET" }, withAuth);
  }

  static post<T>(path: string, body: unknown, withAuth = false) {
    return ApiClient.request<T>(path, { method: "POST", body: JSON.stringify(body) }, withAuth);
  }

  static patch<T>(path: string, body: unknown, withAuth = false) {
    return ApiClient.request<T>(path, { method: "PATCH", body: JSON.stringify(body) }, withAuth);
  }

  static delete<T>(path: string, withAuth = false) {
    return ApiClient.request<T>(path, { method: "DELETE" }, withAuth);
  }
}
