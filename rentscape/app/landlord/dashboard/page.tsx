import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { Card } from "@/components/ui/Card"
import { Topbar } from "@/components/dashboard/Topbar"
import { MonthlyRevenueChart, PropertyTypesChart } from "@/components/charts/Charts"
import { headers } from 'next/headers'
interface Analytics {
  totalProperties: number
  activeLeases: number
  totalTenants: number
  averageRating: number
  totalRevenue: number
  pendingPayments: number
  monthlyRevenue: Array<{ month: string; revenue: number }>
  propertyTypes: Array<{ type: string; count: number }>
}

export default async function LandlordDashboard() {
  // Fetch from API route
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'

  const cookieHeader = headersList.get('cookie') || ''

  const response = await fetch(`${protocol}://${host}/api/dashboard/landlord`, {
    cache: 'no-store',
    headers: {
      cookie: cookieHeader
    }
  })

  if (!response.ok) {
    return <div className="p-8">Failed to load dashboard</div>
  }

  const analytics: Analytics = await response.json()

  return (
    <DashboardShell role="landlord">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar title="Landlord overview" subtitle="Portfolio status and payments at a glance" />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card title="Total Properties" description={`${analytics.totalProperties}`}>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-bold text-blue-600">{analytics.totalProperties}</p>
                <p className="text-sm text-blue-500">properties</p>
              </div>
            </Card>
            <Card title="Active Leases" description={`${analytics.activeLeases} leases`}>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-bold text-indigo-600">{analytics.activeLeases}</p>
                <p className="text-sm text-indigo-500">active</p>
              </div>
            </Card>
            <Card title="Total Tenants" description={`${analytics.totalTenants} tenants`}>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-bold text-cyan-600">{analytics.totalTenants}</p>
                <p className="text-sm text-cyan-500">tenants</p>
              </div>
            </Card>
            <Card title="Average Rating" description={`${analytics.averageRating.toFixed(1)} / 5`}>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-bold text-blue-600">{analytics.averageRating.toFixed(1)}</p>
                <div className="flex gap-0.5 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>{i < Math.round(analytics.averageRating) ? '★' : '☆'}</span>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Revenue Overview">
              <div className="space-y-6">
                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
                  <p className="text-sm font-medium text-blue-100">Total Revenue</p>
                  <p className="mt-2 text-3xl font-bold">${analytics.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 border border-amber-200/50">
                  <p className="text-sm font-medium text-amber-900">Pending Payments</p>
                  <p className="mt-2 text-3xl font-bold text-amber-600">${analytics.pendingPayments.toFixed(2)}</p>
                </div>
              </div>
            </Card>
            <Card title="Property Types Distribution">
              <PropertyTypesChart data={analytics.propertyTypes} />
            </Card>
          </div>

          <Card title="Monthly Revenue Trend">
            <MonthlyRevenueChart data={analytics.monthlyRevenue} />
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}