'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Topbar } from '@/components/dashboard/Topbar'
import { Card } from '@/components/ui/Card'

type Lease = {
  id: string
  monthly_rent: string
  start_date: string
  end_date: string
  status: 'pending' | 'active' | 'expired' | 'terminated'
  property_title: string
  property_city?: string | null
  property_area?: string | null
  unit_number: string
}

export default function TenantLeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([])
  const [loading, setLoading] = useState(true)
  const [submittingLeaseId, setSubmittingLeaseId] = useState<string | null>(null)

  const loadLeases = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/leases', { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'Failed to load leases')
      setLeases(Array.isArray(payload?.leases) ? payload.leases : [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load leases')
      setLeases([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLeases()
  }, [loadLeases])

  async function acceptLease(leaseId: string) {
    setSubmittingLeaseId(leaseId)
    try {
      const response = await fetch(`/api/leases/${leaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || 'Failed to accept lease')
      toast.success('Lease accepted successfully')
      await loadLeases()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept lease')
    } finally {
      setSubmittingLeaseId(null)
    }
  }

  return (
    <DashboardShell role="tenant">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar title="Lease Offers & Agreements" subtitle="Review pending offers and active leases" />

          <Card title="My Leases" description="Pending offers require your action before they become active">
            {loading ? (
              <p className="text-slate-600">Loading leases...</p>
            ) : leases.length === 0 ? (
              <p className="text-slate-600">No leases found yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {leases.map((lease) => (
                  <div key={lease.id} className="rounded-2xl border border-blue-200/50 bg-white p-4 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">{lease.property_title}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Unit #{lease.unit_number}
                      {lease.property_city ? ` • ${lease.property_city}` : ''}
                      {lease.property_area ? `, ${lease.property_area}` : ''}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      Rent: <span className="font-semibold">PKR {Number(lease.monthly_rent).toLocaleString()}</span>
                    </p>
                    <p className="text-sm text-slate-600">
                      {new Date(lease.start_date).toLocaleDateString()} - {new Date(lease.end_date).toLocaleDateString()}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          lease.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : lease.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {lease.status}
                      </span>
                      {lease.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => acceptLease(lease.id)}
                          disabled={submittingLeaseId === lease.id}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                        >
                          {submittingLeaseId === lease.id ? 'Accepting...' : 'Accept Lease'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}

