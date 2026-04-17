import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Topbar } from "@/components/dashboard/Topbar";

export default function LandlordDashboardPage() {
  return (
    <DashboardShell role="landlord">
      <Topbar title="Landlord overview" subtitle="Portfolio status and payments at a glance" />

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card
          title="Portfolio health"
          description="Your active properties and occupancy metrics will appear here."
          footer={<p className="text-sm text-slate-500">No properties created yet. The listing page is ready.</p>}
        />
        <Card
          title="Payments summary"
          description="Track rent collection and overdue accounts from one place."
          footer={<p className="text-sm text-slate-500">No payment records yet. This will fill in as leases populate.</p>}
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
