"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Package, Store, Ticket,
  Flag, DollarSign, Settings2, LogOut, X, ChevronRight, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SoukifyLogo } from "@/components/ui/SoukifyLogo";
import type { UserRole } from "@/types/api";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin",           label: "Vue d'ensemble",  icon: LayoutDashboard },
  { href: "/admin/users",     label: "Utilisateurs",    icon: Users,
    roles: ["ADMIN", "SUPER_ADMIN", "ACCOUNT_MANAGER"] },
  { href: "/admin/annonces",  label: "Annonces",        icon: Package,
    roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/shops",     label: "Boutiques",       icon: Store,
    roles: ["ADMIN", "SUPER_ADMIN", "ACCOUNT_MANAGER"] },
  { href: "/admin/tickets",   label: "Tickets",         icon: Ticket,
    roles: ["SUPPORT", "ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/reports",   label: "Signalements",    icon: Flag,
    roles: ["ADMIN", "SUPER_ADMIN", "SUPPORT"] },
  { href: "/admin/finance",   label: "Finance",         icon: DollarSign,
    roles: ["FINANCE", "SUPER_ADMIN"] },
  { href: "/admin/config",    label: "Configuration",   icon: Settings2,
    roles: ["SUPER_ADMIN"] },
];

interface SidebarProps {
  userRoles: UserRole[];
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

function NavLink({ item, roles, onClick }: { item: NavItem; roles: UserRole[]; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = item.href === "/admin"
    ? pathname === "/admin"
    : pathname.startsWith(item.href);

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
      {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
    </Link>
  );
}

export function AdminSidebar({ userRoles, userName, isOpen, onClose }: SidebarProps) {
  const router = useRouter();

  const roleLabel = (() => {
    if (userRoles.includes("SUPER_ADMIN")) return "Super Admin";
    if (userRoles.includes("ADMIN")) return "Administrateur";
    if (userRoles.includes("FINANCE")) return "Finance";
    if (userRoles.includes("SUPPORT")) return "Support";
    if (userRoles.includes("ACCOUNT_MANAGER")) return "Account Manager";
    return "Admin";
  })();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

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

      {/* Admin badge */}
      <div className="mb-5 px-1">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gold-light border border-accent-200">
          <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-white shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary truncate">{userName}</p>
            <span className="text-xs text-gold font-medium">{roleLabel}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        <p className="text-xs font-semibold text-text-disabled uppercase tracking-wider px-3 mb-2">
          Backoffice
        </p>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} roles={userRoles} onClick={onClose} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="mt-4 pt-4 border-t border-border space-y-1">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-primary-50 hover:text-brand transition-colors"
        >
          <LayoutDashboard className="w-5 h-5 text-text-disabled" />
          Mon dashboard
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
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-border h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </aside>
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
