"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Package, ShoppingBag, MessageSquare,
  Wallet, User, Settings, Shield, LogOut, X, ChevronRight,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SoukifyLogo } from "@/components/ui/SoukifyLogo";
import type { UserRole } from "@/types/api";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[];        // if undefined → visible by all
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Vue d'ensemble",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/annonces",
    label: "Mes annonces",
    icon: Package,
    roles: ["SELLER", "PRO_SELLER"],
  },
  {
    href: "/dashboard/boutique",
    label: "Ma boutique",
    icon: Store,
    roles: ["PRO_SELLER"],
  },
  {
    href: "/dashboard/orders",
    label: "Mes commandes",
    icon: ShoppingBag,
  },
  {
    href: "/dashboard/messages",
    label: "Messages",
    icon: MessageSquare,
  },
  {
    href: "/dashboard/wallet",
    label: "Mon portefeuille",
    icon: Wallet,
    roles: ["SELLER", "PRO_SELLER"],
  },
  {
    href: "/dashboard/profile",
    label: "Mon profil",
    icon: User,
  },
];

const ADMIN_ITEMS: NavItem[] = [
  {
    href: "/admin",
    label: "Backoffice Admin",
    icon: Shield,
    roles: ["ADMIN", "ACCOUNT_MANAGER", "SUPPORT", "FINANCE", "SUPER_ADMIN"],
  },
];

interface SidebarProps {
  userRoles: UserRole[];
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

function NavLink({ item, roles, onClick }: { item: NavItem; roles: UserRole[]; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

  if (item.roles && !item.roles.some((r) => roles.includes(r))) return null;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
        isActive
          ? "bg-brand text-white shadow-brand"
          : "text-text-secondary hover:bg-primary-50 hover:text-brand",
      )}
    >
      <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "text-text-disabled group-hover:text-brand")} />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-semibold",
          isActive ? "bg-white/20 text-white" : "bg-error text-white"
        )}>
          {item.badge}
        </span>
      )}
      {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
    </Link>
  );
}

export function DashboardSidebar({ userRoles, userName, isOpen, onClose }: SidebarProps) {
  const router = useRouter();

  const adminRoles = ["ADMIN", "ACCOUNT_MANAGER", "SUPPORT", "FINANCE", "SUPER_ADMIN"] as UserRole[];
  const isAdmin = userRoles.some((r) => adminRoles.includes(r));

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const roleLabel = (() => {
    if (userRoles.includes("SUPER_ADMIN")) return "Super Admin";
    if (userRoles.includes("ADMIN")) return "Administrateur";
    if (userRoles.includes("FINANCE")) return "Finance";
    if (userRoles.includes("SUPPORT")) return "Support";
    if (userRoles.includes("ACCOUNT_MANAGER")) return "Account Manager";
    if (userRoles.includes("PRO_SELLER")) return "Vendeur Pro";
    if (userRoles.includes("SELLER")) return "Vendeur";
    return "Acheteur";
  })();

  const sidebarContent = (
    <div className="flex flex-col h-full py-5 px-3">
      {/* Logo */}
      <div className="flex items-center justify-between px-1 mb-6">
        <SoukifyLogo size="sm" />
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-border transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* User card */}
      <div className="mb-6 px-1">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 border border-primary-100">
          <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold text-sm shrink-0">
            {userName?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary truncate">{userName}</p>
            <span className="text-xs text-brand font-medium">{roleLabel}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} roles={userRoles} onClick={onClose} />
        ))}

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className="my-3 px-3">
              <div className="h-px bg-border" />
              <p className="text-xs font-semibold text-text-disabled uppercase tracking-wider mt-3 mb-1 px-0">
                Administration
              </p>
            </div>
            {ADMIN_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} roles={userRoles} onClick={onClose} />
            ))}
          </>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="mt-4 pt-4 border-t border-border space-y-1">
        <Link
          href="/dashboard/profile"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-primary-50 hover:text-brand transition-colors"
        >
          <Settings className="w-5 h-5 text-text-disabled" />
          Paramètres
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-error-light hover:text-error transition-colors"
        >
          <LogOut className="w-5 h-5 text-text-disabled" />
          Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-border h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-xl transition-transform duration-300 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
