import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Topbar } from "@/components/dashboard/Topbar";

export default function ListingsPage() {
  return (
    <DashboardShell role="landlord">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar title="Properties Listings" subtitle="Manage your property listings and units" />

          <div className="grid gap-6">
            <Card title="Your Properties">
              <div className="space-y-4 py-8 text-center">
                <p className="text-slate-600">No properties listed yet.</p>
                <button className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2 text-sm font-medium text-white transition hover:shadow-lg">
                  Create Property
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
