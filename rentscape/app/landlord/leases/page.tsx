import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Topbar } from "@/components/dashboard/Topbar";

export default function LeasesPage() {
  return (
    <DashboardShell role="landlord">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar title="Lease Management" subtitle="Track and manage all tenant leases" />

          <div className="grid gap-6">
            <Card title="Active Leases">
              <div className="space-y-4 py-8 text-center">
                <p className="text-slate-600">No active leases at the moment.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
