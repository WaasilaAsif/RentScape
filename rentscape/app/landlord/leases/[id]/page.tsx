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
  tenant_email: string
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

type Payment = {
  id: string
  amount: number
  due_date: string
  paid_date: string | null
  status: 'pending' | 'paid' | 'overdue' | 'waived'
  notes: string | null
}

type FamilyMember = {
  id: string
  full_name: string
  cnic: string | null
  relation: string
}

type MaintenanceRequest = {
  id: string
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
}

export default function LeaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [leaseId, setLeaseId] = useState<string | null>(null)
  const [lease, setLease] = useState<Lease | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  
  const [showEditForm, setShowEditForm] = useState(false)
  const [editForm, setEditForm] = useState({
    end_date: '',
    monthly_rent: '',
    notes: ''
  })

  const [showAddFamilyForm, setShowAddFamilyForm] = useState(false)
  const [familyForm, setFamilyForm] = useState({
    full_name: '',
    cnic: '',
    relation: ''
  })

  useEffect(() => {
    params.then(p => {
      setLeaseId(p.id)
      loadLeaseData(p.id)
    })
  }, [params])

  async function loadLeaseData(id: string) {
    setLoading(true)
    try {
      // Load lease details
      const leaseRes = await fetch(`/api/leases/${id}`, { cache: 'no-store' })
      if (!leaseRes.ok) throw new Error('Failed to fetch lease')
      const leaseData = await leaseRes.json()
      setLease(leaseData.lease)
      
      // Set edit form defaults
      setEditForm({
        end_date: leaseData.lease.end_date,
        monthly_rent: leaseData.lease.monthly_rent.toString(),
        notes: leaseData.lease.notes || ''
      })

      // Load payments
      const paymentsRes = await fetch(`/api/payments?lease_id=${id}`, { cache: 'no-store' })
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json()
        setPayments(paymentsData.payments || [])
      }

      // Load family members if family lease
      if (leaseData.lease.is_family) {
        const familyRes = await fetch(`/api/family-members?lease_id=${id}`, { cache: 'no-store' })
        if (familyRes.ok) {
          const familyData = await familyRes.json()
          setFamilyMembers(familyData.family_members || [])
        }
      }

      // Load maintenance requests for this unit
      const maintenanceRes = await fetch(`/api/maintenance?unit_id=${leaseData.lease.unit_id}`, { cache: 'no-store' })
      if (maintenanceRes.ok) {
        const maintenanceData = await maintenanceRes.json()
        setMaintenanceRequests(maintenanceData.requests || [])
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lease data')
    } finally {
      setLoading(false)
    }
  }

  async function handleAcceptLease() {
    if (!leaseId) return
    setActionLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/leases/${leaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to accept lease')
      }

      await loadLeaseData(leaseId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept lease')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRejectLease() {
    if (!leaseId || !confirm('Are you sure you want to reject this lease?')) return
    setActionLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/leases/${leaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'terminated' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reject lease')
      }

      router.push('/landlord/leases')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject lease')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleTerminateLease() {
    if (!leaseId || !confirm('Are you sure you want to terminate this lease early?')) return
    setActionLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/leases/${leaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'terminated' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to terminate lease')
      }

      await loadLeaseData(leaseId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to terminate lease')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleUpdateLease(e: React.FormEvent) {
    e.preventDefault()
    if (!leaseId) return
    setActionLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/leases/${leaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          end_date: editForm.end_date,
          monthly_rent: Number(editForm.monthly_rent),
          notes: editForm.notes || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update lease')
      }

      setShowEditForm(false)
      await loadLeaseData(leaseId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lease')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleAddFamilyMember(e: React.FormEvent) {
    e.preventDefault()
    if (!leaseId) return
    setActionLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/family-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lease_id: leaseId,
          full_name: familyForm.full_name,
          cnic: familyForm.cnic || undefined,
          relation: familyForm.relation,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add family member')
      }

      setFamilyForm({ full_name: '', cnic: '', relation: '' })
      setShowAddFamilyForm(false)
      await loadLeaseData(leaseId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add family member')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardShell role="landlord">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
          <div className="mx-auto max-w-7xl px-4">
            <p className="text-slate-600">Loading lease details...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  if (!lease) {
    return (
      <DashboardShell role="landlord">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
          <div className="mx-auto max-w-7xl px-4">
            <p className="text-red-600">Lease not found</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    expired: 'bg-slate-100 text-slate-700',
    terminated: 'bg-red-100 text-red-700',
  }

  return (
    <DashboardShell role="landlord">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar 
            title={`Lease: ${lease.tenant_name}`} 
            subtitle={`${lease.property_title} • Unit ${lease.unit_number}`}
            backButton
            backHref="/landlord/leases"
          />

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            {lease.status === 'pending' && (
              <>
                <button
                  onClick={handleAcceptLease}
                  disabled={actionLoading}
                  className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                >
                  Accept Lease
                </button>
                <button
                  onClick={handleRejectLease}
                  disabled={actionLoading}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Reject Lease
                </button>
              </>
            )}
            
            {lease.status === 'active' && (
              <>
                <button
                  onClick={() => setShowEditForm(!showEditForm)}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {showEditForm ? 'Cancel Edit' : 'Edit Lease'}
                </button>
                <button
                  onClick={handleTerminateLease}
                  disabled={actionLoading}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Terminate Lease
                </button>
              </>
            )}
          </div>

          {/* Edit Form */}
          {showEditForm && lease.status === 'active' && (
            <Card title="Edit Lease" description="Update lease terms">
              <form onSubmit={handleUpdateLease} className="grid gap-4 md:grid-cols-2">
                <input
                  type="date"
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  value={editForm.end_date}
                  onChange={e => setEditForm({ ...editForm, end_date: e.target.value })}
                  required
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  placeholder="Monthly Rent (PKR)"
                  value={editForm.monthly_rent}
                  onChange={e => setEditForm({ ...editForm, monthly_rent: e.target.value })}
                  required
                />
                <textarea
                  className="md:col-span-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  placeholder="Notes"
                  rows={3}
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                />
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {actionLoading ? 'Updating...' : 'Update Lease'}
                  </button>
                </div>
              </form>
            </Card>
          )}

          {/* Lease Details */}
          <Card title="Lease Details">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Tenant</p>
                <p className="font-semibold text-slate-900">{lease.tenant_name}</p>
                <p className="text-sm text-slate-600">{lease.tenant_email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <span className={`inline-block mt-1 rounded-full px-3 py-1 text-xs font-medium ${statusColors[lease.status]}`}>
                  {lease.status.charAt(0).toUpperCase() + lease.status.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-500">Monthly Rent</p>
                <p className="text-2xl font-bold text-blue-600">PKR {lease.monthly_rent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Advance Amount</p>
                <p className="text-lg font-semibold text-slate-900">PKR {lease.advance_amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Start Date</p>
                <p className="font-semibold text-slate-900">{new Date(lease.start_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">End Date</p>
                <p className="font-semibold text-slate-900">{new Date(lease.end_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Lease Type</p>
                <p className="font-semibold text-slate-900">
                  {lease.is_family ? `Family (${lease.occupant_count} occupants)` : 'Individual'}
                </p>
              </div>
              {lease.notes && (
                <div className="md:col-span-2">
                  <p className="text-sm text-slate-500">Notes</p>
                  <p className="text-slate-700">{lease.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Family Members */}
          {lease.is_family && (
            <Card 
              title="Family Members" 
              description={`${familyMembers.length} registered members`}
            >
              <div className="space-y-3">
                {familyMembers.map(member => (
                  <div key={member.id} className="rounded-xl border border-blue-200 bg-white p-4">
                    <p className="font-semibold text-slate-900">{member.full_name}</p>
                    <p className="text-sm text-slate-600">Relation: {member.relation}</p>
                    {member.cnic && <p className="text-sm text-slate-500">CNIC: {member.cnic}</p>}
                  </div>
                ))}
                
                {!showAddFamilyForm && lease.status === 'active' && (
                  <button
                    onClick={() => setShowAddFamilyForm(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Family Member
                  </button>
                )}

                {showAddFamilyForm && (
                  <form onSubmit={handleAddFamilyMember} className="grid gap-3 border-t border-slate-200 pt-4">
                    <input
                      className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                      placeholder="Full Name"
                      value={familyForm.full_name}
                      onChange={e => setFamilyForm({ ...familyForm, full_name: e.target.value })}
                      required
                    />
                    <input
                      className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                      placeholder="CNIC (optional)"
                      value={familyForm.cnic}
                      onChange={e => setFamilyForm({ ...familyForm, cnic: e.target.value })}
                    />
                    <input
                      className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                      placeholder="Relation (e.g., Spouse, Child)"
                      value={familyForm.relation}
                      onChange={e => setFamilyForm({ ...familyForm, relation: e.target.value })}
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        Add Member
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddFamilyForm(false)}
                        className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </Card>
          )}

          {/* Payment History */}
          <Card title="Payment History" description={`${payments.length} payments`}>
            {payments.length === 0 ? (
              <p className="text-slate-600 py-8 text-center">No payments yet</p>
            ) : (
              <div className="space-y-3">
                {payments.map(payment => (
                  <div key={payment.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-slate-900">PKR {payment.amount.toLocaleString()}</p>
                        <p className="text-sm text-slate-600">Due: {new Date(payment.due_date).toLocaleDateString()}</p>
                        {payment.notes && <p className="text-xs text-slate-500 italic mt-1">{payment.notes}</p>}
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                        payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                        payment.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        payment.status === 'waived' ? 'bg-slate-100 text-slate-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Maintenance Requests */}
          <Card title="Maintenance Requests" description={`${maintenanceRequests.length} requests for this unit`}>
            {maintenanceRequests.length === 0 ? (
              <p className="text-slate-600 py-8 text-center">No maintenance requests</p>
            ) : (
              <div className="space-y-3">
                {maintenanceRequests.slice(0, 5).map(request => (
                  <div key={request.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-slate-900">{request.title}</p>
                        {request.description && <p className="text-sm text-slate-600 mt-1">{request.description}</p>}
                        <p className="text-xs text-slate-500 mt-2">{new Date(request.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          request.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          request.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          request.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {request.priority}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          request.status === 'resolved' || request.status === 'closed' ? 'bg-green-100 text-green-700' :
                          request.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {request.status}
                        </span>
                      </div>
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