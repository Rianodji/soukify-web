"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu, X, Home, Search, PlusCircle, LayoutDashboard,
  Package, ShoppingBag, MessageSquare, LogOut, LogIn, UserPlus,
} from "lucide-react";

export function MarketplaceMobileMenu({ authed }: { authed: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  const linkCls = "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-primary-50 hover:text-brand transition-colors";

  return (
    <>
      <button
        type="button"
        aria-label="Menu"
        onClick={() => setOpen(true)}
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-border text-text-secondary"
      >
        <Menu className="w-5 h-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-xl md:hidden flex flex-col py-5 px-3">
            <div className="flex items-center justify-between px-1 mb-4">
              <p className="font-semibold text-text-primary">Menu</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-border transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              <Link href="/" onClick={() => setOpen(false)} className={linkCls}>
                <Home className="w-5 h-5 text-text-disabled" /> Accueil
              </Link>
              <Link href="/search" onClick={() => setOpen(false)} className={linkCls}>
                <Search className="w-5 h-5 text-text-disabled" /> Rechercher
              </Link>
              <Link href="/dashboard/annonces/new" onClick={() => setOpen(false)} className={linkCls}>
                <PlusCircle className="w-5 h-5 text-text-disabled" /> Publier une annonce
              </Link>

              {authed && (
                <>
                  <div className="my-3 px-3"><div className="h-px bg-border" /></div>
                  <Link href="/dashboard" onClick={() => setOpen(false)} className={linkCls}>
                    <LayoutDashboard className="w-5 h-5 text-text-disabled" /> Tableau de bord
                  </Link>
                  <Link href="/dashboard/annonces" onClick={() => setOpen(false)} className={linkCls}>
                    <Package className="w-5 h-5 text-text-disabled" /> Mes annonces
                  </Link>
                  <Link href="/dashboard/orders" onClick={() => setOpen(false)} className={linkCls}>
                    <ShoppingBag className="w-5 h-5 text-text-disabled" /> Mes commandes
                  </Link>
                  <Link href="/dashboard/messages" onClick={() => setOpen(false)} className={linkCls}>
                    <MessageSquare className="w-5 h-5 text-text-disabled" /> Messages
                  </Link>
                </>
              )}
            </nav>

            <div className="mt-4 pt-4 border-t border-border space-y-1">
              {authed ? (
                <button type="button" onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-error-light hover:text-error transition-colors">
                  <LogOut className="w-5 h-5 text-text-disabled" /> Se déconnecter
                </button>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className={linkCls}>
                    <LogIn className="w-5 h-5 text-text-disabled" /> Connexion
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)} className={linkCls}>
                    <UserPlus className="w-5 h-5 text-text-disabled" /> Créer un compte
                  </Link>
                </>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
