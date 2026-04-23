'use client';

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface TopbarProps {
  title: string;
  subtitle: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();
  const [loggingOut, setLoggingOut] = useState(false);

  const initials = useMemo(() => {
    const rawName = user?.full_name || user?.email || "G";
    const clean = rawName.includes("@") ? rawName.split("@")[0] : rawName;
    return clean.slice(0, 1).toUpperCase();
  }, [user]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 shadow-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-blue-100">Dashboard</p>
          <h1 className="mt-2 text-4xl font-bold text-white">{title}</h1>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="rounded-xl border border-white/20 bg-white/15 px-6 py-3 text-sm font-medium text-blue-50 backdrop-blur-sm">
            {subtitle}
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="grid h-9 w-9 place-items-center rounded-full border border-white/40 bg-white/20 text-sm font-semibold text-white">
              {isLoading ? "..." : initials}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg border border-white/40 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25 disabled:opacity-60"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
