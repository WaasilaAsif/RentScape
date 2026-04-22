import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card } from "@/components/ui/Card";

export default function TenantMaintenancePage() {
  return (
    <DashboardShell role="tenant">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar title="Maintenance" subtitle="Track and submit maintenance requests" />
          <Card
            title="Maintenance Requests"
            description="This section is now connected. You can add request list/form logic next."
            footer={<p className="text-sm text-slate-600">No maintenance requests yet.</p>}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
