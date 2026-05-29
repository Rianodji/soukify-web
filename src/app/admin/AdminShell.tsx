"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import type { UserRole } from "@/types/api";

interface AdminShellProps {
  children: React.ReactNode;
  userRoles: UserRole[];
  userName: string;
}

export function AdminShell({ children, userRoles, userName }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar
        userRoles={userRoles}
        userName={userName}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardHeader
          title="Administration"
          onMenuToggle={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
