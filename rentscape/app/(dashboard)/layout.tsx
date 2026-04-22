import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "RentScape Dashboard",
  description: "Tenant and landlord dashboards",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .bg-anim {
          background: linear-gradient(-45deg, #071928, #0474C4, #06457F, #2C444C, #050f1a);
          background-size: 400% 400%;
          animation: gradient-shift 14s ease infinite;
        }
      `}</style>
      <div className="bg-anim min-h-screen text-white">{children}</div>
    </>
  );
}

