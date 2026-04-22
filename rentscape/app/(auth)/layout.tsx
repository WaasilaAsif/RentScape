import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "RentScape — Auth",
  description: "Login and signup for RentScape",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-transparent text-slate-900">
      <div className="flex min-h-screen w-full min-w-0 items-stretch justify-center p-0">
        {children}
      </div>
    </div>
  );
}
