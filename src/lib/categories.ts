import type { Category } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3020/api/v1";

/** Server-side fetch of `GET /categories` — public, rarely changes, cached 1h. */
export async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const body = await res.json() as { data: Category[] };
    return body.data ?? [];
  } catch {
    return [];
  }
}
