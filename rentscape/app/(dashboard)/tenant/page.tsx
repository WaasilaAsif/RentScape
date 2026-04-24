//I think this needs api calls?
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Topbar } from "@/components/dashboard/Topbar";

export default function TenantDashboardPage() {
  return (
    <DashboardShell role="tenant">
      <Topbar title="Tenant overview" subtitle="You are currently viewing your rent dashboard" />

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card
          title="Saved searches"
          description="Your search results will appear here once listings are available."
          footer={<p className="text-sm text-slate-500">No results yet. Start by creating a search filter.</p>}
        />
        <Card
          title="Your active bookings"
          description="Once you book a property, your upcoming stays will show up here."
          footer={<p className="text-sm text-slate-500">No bookings yet — the UI is ready for real lease data.</p>}
        />
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-40 w-full rounded-3xl bg-slate-100 animate-pulse" />
            <div className="mt-4 h-4 w-3/4 rounded-full bg-slate-200 animate-pulse" />
            <div className="mt-3 h-3 w-1/2 rounded-full bg-slate-200 animate-pulse" />
          </div>
        ))}
      </section>
    </DashboardShell>
  );
}
