import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Topbar } from "@/components/dashboard/Topbar";

export default function PaymentsPage() {
  return (
    <DashboardShell role="landlord">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar title="Payment Management" subtitle="Monitor rent collection and payments" />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Payment Overview">
              <div className="space-y-4">
                <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
                  <p className="text-sm font-medium text-green-100">Collected</p>
                  <p className="mt-2 text-3xl font-bold">$0.00</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-red-50 to-orange-50 p-6 border border-red-200/50">
                  <p className="text-sm font-medium text-red-900">Overdue</p>
                  <p className="mt-2 text-3xl font-bold text-red-600">$0.00</p>
                </div>
              </div>
            </Card>
            <Card title="Payment History">
              <div className="space-y-4 py-8 text-center">
                <p className="text-slate-600">No payment records yet.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
