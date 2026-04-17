import Link from "next/link";

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

interface SidebarProps {
  role: DashboardRole;
}

export function Sidebar({ role }: SidebarProps) {
  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-8 overflow-y-auto border-r border-slate-200 bg-white px-6 py-8 lg:flex">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">RentScape</p>
        <h2 className="text-2xl font-semibold text-slate-900">{role === "tenant" ? "Tenant Hub" : "Landlord Hub"}</h2>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {navItems[role].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-3xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
        {role === "tenant" ? (
          <p>Welcome to your tenant dashboard. Start by checking your upcoming stays.</p>
        ) : (
          <p>Welcome, landlord. Your portfolio overview and active rentals appear here.</p>
        )}
      </div>
    </aside>
  );
}
