"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DashboardRole = "tenant" | "landlord";

const navItems: Record<DashboardRole, Array<{ label: string; href: string; sub?: string }>> = {
  tenant: [
    { label: "Dashboard", href: "/tenant" },
    { label: "Maintenance", href: "/tenant/maintenance" },
    { label: "Search", href: "/tenant/search" },
  ],
  landlord: [
    { label: "Dashboard", href: "/landlord" },
    { label: "Listings", href: "/landlord/listings" },
    { label: "Leases", href: "/landlord/leases" },
    { label: "Payments", href: "/landlord/payments" },
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
  const [properties, setProperties] = useState<Property[]>([]);
  const [userName, setUserName] = useState("Guest");

  useEffect(() => {
    if (role === "landlord") {
      fetch("/api/properties?mine=true")
        .then((res) => res.json())
        .then((data) => setProperties(data.properties || []))
        .catch((err) => console.error("Failed to fetch properties", err));
    }
  }, [role]);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        const rawName = payload?.user?.full_name || payload?.user?.email || "Guest";
        const cleanName = rawName.includes("@") ? rawName.split("@")[0] : rawName;
        if (!cancelled) setUserName(cleanName);
      } catch {
        if (!cancelled) setUserName("Guest");
      }
    }

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-8 overflow-y-auto border-r border-blue-200/30 bg-gradient-to-b from-blue-50 to-indigo-50 px-6 py-8 lg:flex">
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
          Welcome, {userName}!
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
    </aside>
  );
}