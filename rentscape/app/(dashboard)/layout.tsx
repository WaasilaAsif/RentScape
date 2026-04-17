import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "RentScape Dashboard",
  description: "Tenant and landlord dashboards",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-slate-100">{children}</div>;
}
