"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import type { UserRole } from "@/types/api";

interface DashboardShellProps {
  children: React.ReactNode;
  userRoles: UserRole[];
  userName: string;
  pageTitle: string;
}

export function DashboardShell({ children, userRoles, userName, pageTitle }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar
        userRoles={userRoles}
        userName={userName}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardHeader
          title={pageTitle}
          onMenuToggle={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
