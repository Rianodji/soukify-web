"use client";

import { Menu, Search } from "lucide-react";
import Link from "next/link";
import { NotificationsButton } from "./NotificationsButton";

interface DashboardHeaderProps {
  title: string;
  onMenuToggle: () => void;
}

export function DashboardHeader({ title, onMenuToggle }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-border px-4 sm:px-6 h-16 flex items-center gap-4">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMenuToggle}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:bg-border transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <h1 className="font-semibold text-text-primary text-lg flex-1">{title}</h1>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="hidden sm:flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand transition-colors px-3 py-1.5 rounded-lg hover:bg-primary-50"
        >
          <Search className="w-3.5 h-3.5" />
          Voir les annonces
        </Link>

        <NotificationsButton size="w-9 h-9" />
      </div>
    </header>
  );
}
