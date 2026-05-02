"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";

const Sidebar = dynamic(() => import("@/components/dashboard/Sidebar").then(mod => ({ default: mod.Sidebar })), {
  ssr: false,
  loading: () => (
    <aside className="hidden w-72 shrink-0 flex-col gap-8 overflow-y-auto sidebar-scroll border-r border-blue-200/30 bg-gradient-to-b from-blue-50 to-indigo-50 px-6 py-8 lg:flex">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-blue-600">RentScape</p>
        <h2 className="text-2xl font-bold text-blue-900">Loading...</h2>
      </div>
    </aside>
  )
});

interface DashboardShellProps {
  role: "tenant" | "landlord";
  children: ReactNode;
}

export function DashboardShell({ role, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen text-slate-900">
      <div className="flex min-h-screen w-full">
        <Sidebar role={role} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
