'use client';

import { useMemo } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface TopbarProps {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function Topbar({ title, subtitle, actionLabel, onAction }: TopbarProps) {
  const { user, isLoading } = useCurrentUser();

  const initials = useMemo(() => {
    const rawName = user?.full_name || user?.email || "G";
    const clean = rawName.includes("@") ? rawName.split("@")[0] : rawName;
    return clean.slice(0, 1).toUpperCase();
  }, [user]);

  return (
    <header className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 shadow-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-blue-100">Dashboard</p>
          <h1 className="mt-2 text-4xl font-bold text-white">{title}</h1>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <p className="text-sm font-medium text-blue-50/95">
            {subtitle}
          </p>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="grid h-9 w-9 place-items-center rounded-full border border-white/40 bg-white/20 text-sm font-semibold text-white">
              {isLoading ? "..." : initials}
            </div>
            {actionLabel && onAction ? (
              <button
                type="button"
                onClick={onAction}
                className="rounded-lg border border-white/40 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25"
              >
                {actionLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
