import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card } from "@/components/ui/Card";

export default function TenantSearchPage() {
  return (
    <DashboardShell role="tenant">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar title="Search rentals" subtitle="Browse listings by location and type" />
          <Card
            title="Rental Search"
            description="Use the full search experience from the dashboard listings view."
            footer={
              <Link
                href="/tenant/dashboard"
                className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Open Listings Dashboard
              </Link>
            }
          />
        </div>
      </div>
    </DashboardShell>
  );
}
