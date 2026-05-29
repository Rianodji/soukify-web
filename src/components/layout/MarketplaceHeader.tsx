import Link from "next/link";
import { cookies } from "next/headers";
import { PlusCircle, Bell, Menu } from "lucide-react";
import { SoukifyLogo } from "@/components/ui/SoukifyLogo";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "@/components/features/search/SearchBar";

async function isAuthenticated() {
  const jar = await cookies();
  return !!jar.get("sk_access");
}

export async function MarketplaceHeader() {
  const authed = await isAuthenticated();

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
                <button
                  type="button"
                  aria-label="Notifications"
                  className="relative w-9 h-9 rounded-full border border-border flex items-center justify-center text-text-secondary hover:text-brand hover:border-brand transition-colors"
                >
                  <Bell className="w-4.5 h-4.5" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error border border-white" />
                </button>
                <Link href="/dashboard">
                  <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:bg-brand-hover transition-colors">
                    M
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
            <button
              type="button"
              aria-label="Menu"
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-border text-text-secondary"
            >
              <Menu className="w-5 h-5" />
            </button>
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
