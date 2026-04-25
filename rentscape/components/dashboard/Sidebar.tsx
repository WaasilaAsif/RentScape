"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { resetCurrentUser } from "@/hooks/useCurrentUser";

type DashboardRole = "tenant" | "landlord";

const navItems: Record<DashboardRole, Array<{ label: string; href: string; sub?: string }>> = {
  tenant: [
    { label: "Dashboard", href: "/tenant/dashboard" },
    { label: "Leases", href: "/tenant/leases" },
    { label: "Payments", href: "/tenant/payments" },
    { label: "Maintenance", href: "/tenant/maintenance" },
    { label: "Search", href: "/tenant/search" },
    {label: "Profile", href: "/tenant/profile" },
  ],
  landlord: [
  { label: "Dashboard", href: "/landlord" },
  { label: "Listings", href: "/landlord/listings" },
  { label: "Leases", href: "/landlord/leases" },
  { label: "Maintenance", href: "/landlord/maintenance" }, 
  { label: "Payments", href: "/landlord/payments" },
  {label: "Profile", href: "/landlord/profile" },
  ],
};

interface Property {
  id: string;
  title: string;
  city: string;
  status: string;
}

interface SidebarProps {
  role: DashboardRole;
}

export function Sidebar({ role }: SidebarProps) {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const { user, isLoading: userLoading } = useCurrentUser();

  const userName = useMemo(() => {
    const rawName = user?.full_name || user?.email || "Guest";
    return rawName.includes("@") ? rawName.split("@")[0] : rawName;
  }, [user]);

  useEffect(() => {
  console.log("user object:", user);
}, [user]);
  useEffect(() => {
    if (role === "landlord") {
      fetch("/api/properties?mine=true")
        .then((res) => res.json())
        .then((data) => setProperties(data.properties || []))
        .catch((err) => console.error("Failed to fetch properties", err));
    }
  }, [role]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || payload?.message || "Logout failed.");
      }
      resetCurrentUser(); // clears the stale user before redirect
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col gap-8 overflow-y-auto border-r border-blue-200/30 bg-gradient-to-b from-blue-50 to-indigo-50 px-6 py-8 lg:flex">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-blue-600 font-semibold">RentScape</p>
        <h2 className="text-2xl font-bold text-blue-900">
          {role === "tenant" ? "Tenant Hub" : "Landlord Hub"}
        </h2>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems[role].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl px-4 py-2 text-sm font-medium text-blue-800 transition hover:bg-blue-100/60 hover:text-blue-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {role === "landlord" && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-blue-900">Your Properties</h3>
          {properties.length > 0 ? (
            <ul className="space-y-2">
              {properties.map((prop) => (
                <li key={prop.id}>
                  <Link
                    href={`/properties/${prop.id}`}
                    className="block rounded-lg px-3 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-200/50 hover:text-blue-900 truncate"
                  >
                    {prop.title} - {prop.city}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-blue-600">No properties yet.</p>
          )}
        </div>
      )}

      {/* 3. Personalized User Section */}
      <div className="rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200/50 p-4 text-sm text-blue-900">
        <p className="font-semibold mb-1">
          Welcome,{" "}
          {userLoading ? (
            <span className="inline-block h-4 w-20 animate-pulse rounded bg-blue-200/60 align-middle" />
          ) : (
            userName
          )}
          !
        </p>
        {role === "tenant" ? (
          <p className="text-blue-700/80">
            Check your upcoming stays and active rental agreements.
          </p>
        ) : (
          <p className="text-blue-700/80">
            Your portfolio overview and active rentals appear here.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-900 transition hover:bg-blue-100/70 disabled:opacity-60"
      >
        {loggingOut ? "Logging out..." : "Logout"}
      </button>

    </aside>
  );
}