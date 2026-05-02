'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { Card } from "@/components/ui/Card"
import { Topbar } from "@/components/dashboard/Topbar"

type Lease = {
  id: string
  unit_id: string
  tenant_id: string
  tenant_name: string
  property_id: string
  property_title: string
  unit_number: string
  monthly_rent: number
  advance_amount: number
  start_date: string
  end_date: string
  is_family: boolean
  occupant_count: number
  status: 'pending' | 'active' | 'expired' | 'terminated'
  notes: string | null
  created_at: string
}

type Unit = {
  id: string
  unit_number: string
  property_id: string
  property_title: string
  monthly_rent: number
  advance_required: boolean
  advance_months: number | null
  is_available: boolean
}

type Tenant = {
  id: string
  full_name: string
  email: string
}

export default function LeasesPage() {
  const router = useRouter()
  const [leases, setLeases] = useState<Lease[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [createForm, setCreateForm] = useState({
    unit_id: '',
    tenant_id: '',
    start_date: '',
    end_date: '',
    is_family: false,
    occupant_count: 1,
    notes: ''
  })

  async function loadLeases() {
    setLoading(true)
    try {
      const response = await fetch('/api/leases', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to fetch leases')
      const data = await response.json()
      setLeases(Array.isArray(data.leases) ? data.leases : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leases')
    } finally {
      setLoading(false)
    }
  }

  async function loadAvailableUnits() {
    try {
      const response = await fetch('/api/units?mine=true', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to fetch units')
      const data = await response.json()
      const availableUnits = (Array.isArray(data.units) ? data.units : []).filter(
        (u: Unit) => u.is_available
      )
      setUnits(availableUnits)
    } catch (err) {
      console.error('Failed to load units:', err)
    }
  }

  async function loadTenants() {
    try {
      // You'll need to create this endpoint or use search
      const response = await fetch('/api/profiles?role=tenant', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to fetch tenants')
      const data = await response.json()
      setTenants(Array.isArray(data.profiles) ? data.profiles : [])
    } catch (err) {
      console.error('Failed to load tenants:', err)
      // Fallback: empty list, landlord can type tenant email
    }
  }

  useEffect(() => {
    loadLeases()
    loadAvailableUnits()
    loadTenants()
  }, [])

  async function handleCreateLease(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const selectedUnit = units.find(u => u.id === createForm.unit_id)
      if (!selectedUnit) throw new Error('Unit not found')

      const response = await fetch('/api/leases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: createForm.unit_id,
          tenant_id: createForm.tenant_id,
          monthly_rent: selectedUnit.monthly_rent,
          advance_amount: selectedUnit.advance_required
            ? selectedUnit.monthly_rent * (selectedUnit.advance_months || 1)
            : 0,
          start_date: createForm.start_date,
          end_date: createForm.end_date,
          is_family: createForm.is_family,
          occupant_count: createForm.occupant_count,
          notes: createForm.notes || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create lease')
      }

      const { lease } = await response.json()
      
      setCreateForm({
        unit_id: '',
        tenant_id: '',
        start_date: '',
        end_date: '',
        is_family: false,
        occupant_count: 1,
        notes: ''
      })
      setShowCreateForm(false)
      await loadLeases()
      await loadAvailableUnits()
      
      // Redirect to lease detail to add family members if needed
      router.push(`/landlord/leases/${lease.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lease')
    } finally {
      setSubmitting(false)
    }
  }

  const activeLeases = leases.filter(l => l.status === 'active')
  const pendingLeases = leases.filter(l => l.status === 'pending')
  const expiredLeases = leases.filter(l => l.status === 'expired')

  return (
    <DashboardShell role="landlord">
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar title="Lease Management" subtitle="Track and manage all tenant leases" />

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              {showCreateForm ? 'Cancel' : '+ Create Lease'}
            </button>
          </div>

          {showCreateForm && (
            <Card title="Create Lease" description="Assign a tenant to an available unit">
              <form onSubmit={handleCreateLease} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-blue-900">Unit</label>
                  <select
                    className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                    value={createForm.unit_id}
                    onChange={e => setCreateForm({ ...createForm, unit_id: e.target.value })}
                    required
                  >
                    <option value="">Select Available Unit</option>
                    {units.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.property_title} - Unit {unit.unit_number} (PKR {unit.monthly_rent.toLocaleString()}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-blue-900">Tenant</label>
                  <select
                    className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                    value={createForm.tenant_id}
                    onChange={e => setCreateForm({ ...createForm, tenant_id: e.target.value })}
                    required
                  >
                    <option value="">Select Tenant</option>
                    {tenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.full_name} ({tenant.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-blue-900">Start Date</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                    value={createForm.start_date}
                    onChange={e => setCreateForm({ ...createForm, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-blue-900">End Date</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                    value={createForm.end_date}
                    onChange={e => setCreateForm({ ...createForm, end_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-blue-900">Occupant Count</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                    value={createForm.occupant_count}
                    onChange={e => setCreateForm({ ...createForm, occupant_count: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_family"
                    checked={createForm.is_family}
                    onChange={e => setCreateForm({ ...createForm, is_family: e.target.checked })}
                    className="h-4 w-4 rounded border-blue-300"
                  />
                  <label htmlFor="is_family" className="text-sm font-medium text-blue-900">
                    Family Lease
                  </label>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-blue-900">Notes</label>
                  <textarea
                    className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                    placeholder="Optional"
                    rows={3}
                    value={createForm.notes}
                    onChange={e => setCreateForm({ ...createForm, notes: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {submitting ? 'Creating...' : 'Create Lease'}
                  </button>
                </div>

              </form>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Active">
              <div className="rounded-xl bg-linear-to-br from-green-500 to-green-600 p-6 text-white">
                <p className="text-sm font-medium text-green-100">Active Leases</p>
                <p className="mt-2 text-3xl font-bold">{activeLeases.length}</p>
              </div>
            </Card>
            <Card title="Pending">
              <div className="rounded-xl bg-linear-to-br from-yellow-500 to-yellow-600 p-6 text-white">
                <p className="text-sm font-medium text-yellow-100">Pending Approval</p>
                <p className="mt-2 text-3xl font-bold">{pendingLeases.length}</p>
              </div>
            </Card>
            <Card title="Expired">
              <div className="rounded-xl bg-linear-to-br from-slate-500 to-slate-600 p-6 text-white">
                <p className="text-sm font-medium text-slate-100">Expired</p>
                <p className="mt-2 text-3xl font-bold">{expiredLeases.length}</p>
              </div>
            </Card>
          </div>

          {loading ? (
            <Card title="Leases">
              <p className="text-slate-600">Loading leases...</p>
            </Card>
          ) : (
            <>
              {activeLeases.length > 0 && (
                <Card title="Active Leases" description={`${activeLeases.length} ongoing leases`}>
                  <div className="space-y-4">
                    {activeLeases.map(lease => (
                      <div
                        key={lease.id}
                        onClick={() => router.push(`/landlord/leases/${lease.id}`)}
                        className="cursor-pointer rounded-xl border border-blue-200 bg-white p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-slate-900">{lease.tenant_name}</h3>
                            <p className="text-sm text-slate-600 mt-1">
                              {lease.property_title} • Unit {lease.unit_number}
                            </p>
                            <p className="text-sm text-slate-500 mt-2">
                              {new Date(lease.start_date).toLocaleDateString()} - {new Date(lease.end_date).toLocaleDateString()}
                            </p>
                            {lease.is_family && (
                              <span className="mt-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                                Family ({lease.occupant_count} occupants)
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">
                              PKR {lease.monthly_rent.toLocaleString()}/mo
                            </p>
                            {lease.advance_amount > 0 && (
                              <p className="text-sm text-slate-500 mt-1">
                                Advance: PKR {lease.advance_amount.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {pendingLeases.length > 0 && (
                <Card title="Pending Leases" description="Awaiting activation">
                  <div className="space-y-3">
                    {pendingLeases.map(lease => (
                      <div
                        key={lease.id}
                        onClick={() => router.push(`/landlord/leases/${lease.id}`)}
                        className="cursor-pointer rounded-xl border border-yellow-200 bg-yellow-50 p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{lease.tenant_name}</p>
                            <p className="text-sm text-slate-600">
                              {lease.property_title} • Unit {lease.unit_number}
                            </p>
                          </div>
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                            Pending
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {expiredLeases.length > 0 && (
                <Card title="Expired Leases" description="Past leases">
                  <div className="space-y-3">
                    {expiredLeases.slice(0, 5).map(lease => (
                      <div
                        key={lease.id}
                        onClick={() => router.push(`/landlord/leases/${lease.id}`)}
                        className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-75 hover:opacity-100 transition-opacity"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{lease.tenant_name}</p>
                            <p className="text-sm text-slate-600">
                              {lease.property_title} • Unit {lease.unit_number}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                              Ended: {new Date(lease.end_date).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            Expired
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {leases.length === 0 && !loading && (
                <Card title="No Leases Yet">
                  <div className="py-8 text-center text-slate-600">
                    <p>No leases created yet. Click &quot;Create Lease&quot; to get started.</p>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}