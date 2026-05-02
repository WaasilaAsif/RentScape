/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { Card } from "@/components/ui/Card"
import { Topbar } from "@/components/dashboard/Topbar"
import { MonthlyRevenueChart, PropertyTypesChart } from "@/components/charts/Charts"
import { RatingCard } from "@/components/dashboard/RatingCard"
//import {} from 
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

// type RatableItem = {
//   lease_id: string
//   target_id: string
//   target_name: string
//   target_type: 'tenant'
//   property_title: string
//   unit_number: string
//   end_date: string
// }

type TenantRatingItem = {
  lease_id: string
  target_id: string
  target_name: string
  target_type: 'tenant'
  property_title: string
  unit_number: string
  end_date: string
}

export default function LandlordDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [ratableLeases, setRatableLeases] = useState<TenantRatingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadAnalytics() {
    try {
      const response = await fetch('/api/dashboard/landlord', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load analytics')
      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    }
  }

  async function loadRatableLeases() {
    try {
      const response = await fetch('/api/leases?status=expired,terminated', { cache: 'no-store' })
      if (!response.ok) return
      
      const data = await response.json()
      
      // Get already rated lease IDs
      const ratingsResponse = await fetch('/api/ratings', { cache: 'no-store' })
      const ratingsData = ratingsResponse.ok ? await ratingsResponse.json() : { ratings: [] }
      const ratedLeaseIds = new Set(
        ratingsData.ratings
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((r: any) => r.target_type === 'tenant')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((r: any) => r.lease_id)
      )
      
      // Transform to ratable format, filter out already rated
      const ratable = data.leases
        .filter((lease: any) => !ratedLeaseIds.has(lease.id))
        .map((lease: any) => ({
          lease_id: lease.id,
          target_id: lease.tenant_id,
          target_name: lease.tenant_name,
          target_type: 'tenant' as const,
          property_title: lease.property_title,
          unit_number: lease.unit_number,
          end_date: lease.end_date,
        }))
      
      setRatableLeases(ratable)
    } catch (err) {
      console.error('Failed to load ratable leases:', err)
    }
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      await Promise.all([loadAnalytics(), loadRatableLeases()])
      setLoading(false)
    }
    loadData()
  }, [])

  async function handleRate(item: TenantRatingItem, score: number, comment: string) {
    const response = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lease_id: item.lease_id,
        target_id: item.target_id,
        target_type: item.target_type,
        score,
        comment: comment || undefined,
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to submit rating')
    }

    // Reload to remove rated item
    await loadRatableLeases()
  }

  const formatRs = (amount: number) =>
    new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0
    }).format(amount)

  if (loading) {
    return (
      <DashboardShell role="landlord">
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
          <div className="mx-auto max-w-7xl px-4">
            <p className="text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  if (error || !analytics) {
    return (
      <DashboardShell role="landlord">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
          <div className="mx-auto max-w-7xl px-4">
            <p className="text-red-600">{error || 'Failed to load dashboard'}</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="landlord">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar title="Landlord Overview" subtitle="Portfolio status and payments at a glance" />

          {/* Stats Cards */}
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

          {/* Revenue & Property Types */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Revenue Overview">
              <div className="space-y-6">
                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
                  <p className="text-sm font-medium text-blue-100">Total Revenue</p>
                  <p className="mt-2 text-3xl font-bold">{formatRs(analytics.totalRevenue)}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 border border-amber-200/50">
                  <p className="text-sm font-medium text-amber-900">Pending Payments</p>
                  <p className="mt-2 text-3xl font-bold text-amber-600">{formatRs(analytics.pendingPayments)}</p>
                </div>
              </div>
            </Card>
            <Card title="Property Types Distribution">
              <PropertyTypesChart data={analytics.propertyTypes} />
            </Card>
          </div>

          {/* Monthly Revenue Chart */}
          <Card title="Monthly Revenue Trend">
            <MonthlyRevenueChart data={analytics.monthlyRevenue} />
          </Card>

          {/* Rating Card */}
          {ratableLeases.length > 0 && (
            // <RatingCard
            //   items={ratableLeases}
            //   onRate={handleRate}
            //   title="Rate Your Past Tenants"
            //   description="Share feedback on completed leases"
            // />
<RatingCard
  items={ratableLeases.filter(item => item.target_type === 'tenant') as any}
  onRate={handleRate as any}
  title="Rate Your Past Tenants"
  description="Share feedback on completed leases"
/>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}