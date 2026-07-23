import Link from "next/link";
import { cookies } from "next/headers";
import { PlusCircle } from "lucide-react";
import { SoukifyLogo } from "@/components/ui/SoukifyLogo";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "@/components/features/search/SearchBar";
import { NotificationsButton } from "@/components/layout/NotificationsButton";
import { MarketplaceMobileMenu } from "@/components/layout/MarketplaceMobileMenu";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3020/api/v1";

async function getAuthToken() {
  const jar = await cookies();
  return jar.get("sk_access")?.value;
}

/**
 * Decorative fetch only (avatar initial) — never redirects on failure like
 * `serverGet` would. A public marketplace page must stay browsable even with
 * an expired/invalid token; only real authenticated actions should bounce to
 * /login (cf. `handleUnauthorized` in ApiServer.ts).
 */
async function getUserInitial(token: string): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 30 },
    });
    if (!res.ok) return "?";
    const body = await res.json();
    const name: string | undefined = body?.data?.name ?? body?.name;
    return name?.[0]?.toUpperCase() ?? "?";
  } catch {
    return "?";
  }
}

export async function MarketplaceHeader() {
  const token = await getAuthToken();
  const authed = !!token;
  const initial = authed ? await getUserInitial(token!) : "?";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top bar */}
        <div className="flex items-center gap-3 h-16">
          {/* Logo */}
          <Link href="/" className="shrink-0 mr-2">
            <SoukifyLogo size="sm" />
          </Link>

          {/* Search — hidden on mobile, shown on md+ */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <SearchBar size="md" />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">
            <Link href="/dashboard/annonces/new">
              <Button size="sm" variant="gold" className="hidden sm:flex">
                <PlusCircle className="w-4 h-4" />
                Publier
              </Button>
            </Link>

            {authed ? (
              <>
                <NotificationsButton />
                <Link href="/dashboard">
                  <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:bg-brand-hover transition-colors">
                    {initial}
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button size="sm" variant="ghost" className="hidden sm:flex">
                    Connexion
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" variant="secondary">
                    <span className="hidden sm:inline">Créer un compte</span>
                    <span className="sm:hidden">Compte</span>
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile menu trigger */}
            <MarketplaceMobileMenu authed={authed} />
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="md:hidden pb-3">
          <SearchBar size="md" />
        </div>
      </div>
    </header>
  );
}
