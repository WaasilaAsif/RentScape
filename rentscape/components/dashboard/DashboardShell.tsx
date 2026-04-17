import type { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";

interface DashboardShellProps {
  role: "tenant" | "landlord";
  children: ReactNode;
}

export function DashboardShell({ role, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-400">
        <Sidebar role={role} />
        <main className="flex-1 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
