"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser, resetCurrentUser } from "@/hooks/useCurrentUser";
import { usePathname } from "next/navigation";

type DashboardRole = "tenant" | "landlord";

const navItems: Record<DashboardRole, Array<{ label: string; href: string; exact?: boolean }>> = {
  tenant: [
    { label: "Dashboard", href: "/tenant/dashboard", exact: true },
    { label: "Leases", href: "/tenant/leases" },
    { label: "Payments", href: "/tenant/payments" },
    { label: "Maintenance", href: "/tenant/maintenance" },
    { label: "Search", href: "/tenant/search" },
    { label: "Profile", href: "/tenant/profile" },
    { label: "Ratings", href: "/tenant/ratings" },
  ],
  landlord: [
    { label: "Dashboard", href: "/landlord", exact: true },
    { label: "Listings", href: "/landlord/listings" },
    { label: "Leases", href: "/landlord/leases" },
    { label: "Maintenance", href: "/landlord/maintenance" },
    { label: "Payments", href: "/landlord/payments" },
    { label: "Profile", href: "/landlord/profile" },
  ],
}

interface Property {
  id: string;
  title: string;
  city: string;
  status: string;
}

interface SidebarProps {
  role: DashboardRole;
}

const MIN_WIDTH = 60;
const MAX_WIDTH = 360;
const DEFAULT_WIDTH = 288; // w-72

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const { user, isLoading: userLoading } = useCurrentUser();
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isCollapsed = width < 120;
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  const userName = useMemo(() => {
    const rawName = user?.full_name || user?.email || "Guest";
    return rawName.includes("@") ? rawName.split("@")[0] : rawName;
  }, [user]);

  useEffect(() => {
    if (role === "landlord") {
      fetch("/api/properties?mine=true")
        .then((res) => res.json())
        .then((data) => setProperties(data.properties || []))
        .catch((err) => console.error("Failed to fetch properties", err));
    }
  }, [role]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setWidth(newWidth);
    };
    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      // Snap to collapsed or open
      setWidth(prev => prev < 120 ? MIN_WIDTH : DEFAULT_WIDTH);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed.");
      resetCurrentUser();
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <aside
      style={{ width }}
      className="sidebar-scroll sticky top-0 hidden h-screen shrink-0 flex-col gap-8 overflow-y-auto border-r border-blue-200/30 bg-gradient-to-b from-blue-50 to-indigo-50 px-3 py-8 lg:flex transition-none relative"
    >
      {/* Content — hide when collapsed */}
      {!isCollapsed && (
        <>
          <div className="space-y-2 px-3">
            <p className="text-sm uppercase tracking-widest text-blue-600 font-semibold">RentScape</p>
            <h2 className="text-2xl font-bold text-blue-900">
              {role === "tenant" ? "Tenant Hub" : "Landlord Hub"}
            </h2>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {navItems[role].map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-blue-800 hover:bg-blue-100/60 hover:text-blue-900'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200/50 p-4 text-sm text-blue-900 mx-3">
            <p className="font-semibold mb-1">
              Welcome,{" "}
              {userLoading ? (
                <span className="inline-block h-4 w-20 animate-pulse rounded bg-blue-200/60 align-middle" />
              ) : userName}!
            </p>
            <p className="text-blue-700/80">
              {role === "tenant"
                ? "Check your upcoming stays and active rental agreements."
                : "Your portfolio overview and active rentals appear here."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mx-3 w-auto rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-900 transition hover:bg-blue-100/70 disabled:opacity-60"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </>
      )}

      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-300/50 transition-colors"
      />
    </aside>
  );
}