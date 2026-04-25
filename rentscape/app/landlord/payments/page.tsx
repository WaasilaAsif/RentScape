'use client'

import { useEffect, useState } from 'react'
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { Card } from "@/components/ui/Card"
import { Topbar } from "@/components/dashboard/Topbar"

type Payment = {
  id: string
  lease_id: string
  amount: number
  due_date: string
  paid_date: string | null
  status: 'pending' | 'paid' | 'overdue' | 'waived'
  tenant_name: string
  property_title: string
  unit_number: string
  notes?: string | null
}

type Lease = {
  id: string
  tenant_name: string
  property_title: string
  unit_number: string
  status: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [leases, setLeases] = useState<Lease[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [addForm, setAddForm] = useState({
    lease_id: '',
    amount: '',
    due_date: '',
    notes: ''
  })

  async function loadPayments() {
    setLoading(true)
    try {
      const response = await fetch('/api/payments', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to fetch payments')
      const data = await response.json()
      setPayments(Array.isArray(data.payments) ? data.payments : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  async function loadLeases() {
    try {
      const response = await fetch('/api/leases', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to fetch leases')
      const data = await response.json()
      setLeases(Array.isArray(data.leases) ? data.leases : [])
    } catch (err) {
      console.error('Failed to load leases:', err)
    }
  }

  useEffect(() => {
    loadPayments()
    loadLeases()
  }, [])

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lease_id: addForm.lease_id,
          amount: Number(addForm.amount),
          due_date: addForm.due_date,
          notes: addForm.notes || undefined,
          status: 'pending'
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add payment')
      }

      setAddForm({ lease_id: '', amount: '', due_date: '', notes: '' })
      setShowAddForm(false)
      await loadPayments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add payment')
    } finally {
      setSubmitting(false)
    }
  }

  async function updatePaymentStatus(paymentId: string, status: 'paid' | 'waived') {
    setUpdating(paymentId)
    setError(null)
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          ...(status === 'paid' && { paid_date: new Date().toISOString().split('T')[0] })
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update payment')
      }

      await loadPayments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payment')
    } finally {
      setUpdating(null)
    }
  }

  const stats = {
    collected: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    overdue: payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0),
    waived: payments.filter(p => p.status === 'waived').reduce((sum, p) => sum + p.amount, 0),
  }

  const pendingPayments = payments.filter(p => p.status === 'pending')
  const overduePayments = payments.filter(p => p.status === 'overdue')
  const paidPayments = payments.filter(p => p.status === 'paid')
  const waivedPayments = payments.filter(p => p.status === 'waived')

  return (
    <DashboardShell role="landlord">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar title="Payment Management" subtitle="Monitor rent collection and payments" />

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              {showAddForm ? 'Cancel' : '+ Add Payment'}
            </button>
          </div>

          {showAddForm && (
            <Card title="Add Payment" description="Create an additional charge or custom payment">
              <form onSubmit={handleAddPayment} className="grid gap-4 md:grid-cols-2">
                <select
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  value={addForm.lease_id}
                  onChange={e => setAddForm({ ...addForm, lease_id: e.target.value })}
                  required
                >
                  <option value="">Select Lease</option>
                  {leases.filter(l => l.status === 'active').map(lease => (
                    <option key={lease.id} value={lease.id}>
                      {lease.tenant_name} - {lease.property_title} Unit {lease.unit_number}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  placeholder="Amount (PKR)"
                  value={addForm.amount}
                  onChange={e => setAddForm({ ...addForm, amount: e.target.value })}
                  required
                />
                <input
                  type="date"
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  value={addForm.due_date}
                  onChange={e => setAddForm({ ...addForm, due_date: e.target.value })}
                  required
                />
                <input
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  placeholder="Notes (e.g., Water bill, Repair charge)"
                  value={addForm.notes}
                  onChange={e => setAddForm({ ...addForm, notes: e.target.value })}
                />
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {submitting ? 'Adding...' : 'Add Payment'}
                  </button>
                </div>
              </form>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-4">
            <Card title="Collected">
              <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
                <p className="text-sm font-medium text-green-100">Total Collected</p>
                <p className="mt-2 text-3xl font-bold">PKR {stats.collected.toLocaleString()}</p>
              </div>
            </Card>
            <Card title="Pending">
              <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 border border-amber-200/50">
                <p className="text-sm font-medium text-amber-900">Awaiting Payment</p>
                <p className="mt-2 text-3xl font-bold text-amber-600">PKR {stats.pending.toLocaleString()}</p>
              </div>
            </Card>
            <Card title="Overdue">
              <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100 p-6 border border-red-200/50">
                <p className="text-sm font-medium text-red-900">Overdue</p>
                <p className="mt-2 text-3xl font-bold text-red-600">PKR {stats.overdue.toLocaleString()}</p>
              </div>
            </Card>
            <Card title="Waived">
              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-6 border border-slate-200/50">
                <p className="text-sm font-medium text-slate-700">Forgiven</p>
                <p className="mt-2 text-3xl font-bold text-slate-600">PKR {stats.waived.toLocaleString()}</p>
              </div>
            </Card>
          </div>

          {loading ? (
            <Card title="Payments">
              <p className="text-slate-600">Loading payments...</p>
            </Card>
          ) : (
            <>
              {overduePayments.length > 0 && (
                <Card title="⚠️ Overdue Payments" description={`${overduePayments.length} payments overdue`}>
                  <div className="space-y-3">
                    {overduePayments.map(payment => (
                      <div key={payment.id} className="rounded-xl border border-red-200 bg-red-50 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{payment.tenant_name}</p>
                            <p className="text-sm text-slate-600">
                              {payment.property_title} • Unit {payment.unit_number}
                            </p>
                            <p className="text-sm text-red-600 mt-1">
                              Due: {new Date(payment.due_date).toLocaleDateString()}
                            </p>
                            {payment.notes && (
                              <p className="text-xs text-slate-500 mt-1 italic">{payment.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-red-600">
                              PKR {payment.amount.toLocaleString()}
                            </p>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => updatePaymentStatus(payment.id, 'paid')}
                                disabled={updating === payment.id}
                                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                {updating === payment.id ? '...' : 'Mark Paid'}
                              </button>
                              <button
                                onClick={() => updatePaymentStatus(payment.id, 'waived')}
                                disabled={updating === payment.id}
                                className="rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                              >
                                Waive
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {pendingPayments.length > 0 && (
                <Card title="Pending Payments" description={`${pendingPayments.length} payments due soon`}>
                  <div className="space-y-3">
                    {pendingPayments.map(payment => (
                      <div key={payment.id} className="rounded-xl border border-blue-200 bg-white p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{payment.tenant_name}</p>
                            <p className="text-sm text-slate-600">
                              {payment.property_title} • Unit {payment.unit_number}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                              Due: {new Date(payment.due_date).toLocaleDateString()}
                            </p>
                            {payment.notes && (
                              <p className="text-xs text-slate-500 mt-1 italic">{payment.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-blue-600">
                              PKR {payment.amount.toLocaleString()}
                            </p>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => updatePaymentStatus(payment.id, 'paid')}
                                disabled={updating === payment.id}
                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                {updating === payment.id ? '...' : 'Mark Paid'}
                              </button>
                              <button
                                onClick={() => updatePaymentStatus(payment.id, 'waived')}
                                disabled={updating === payment.id}
                                className="rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                              >
                                Waive
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card title="Payment History" description="Recently paid or waived">
                {paidPayments.length === 0 && waivedPayments.length === 0 ? (
                  <p className="text-slate-600 py-8 text-center">No payment history yet.</p>
                ) : (
                  <div className="space-y-3">
                    {[...paidPayments, ...waivedPayments].slice(0, 10).map(payment => (
                      <div key={payment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-75">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{payment.tenant_name}</p>
                            <p className="text-sm text-slate-600">
                              {payment.property_title} • Unit {payment.unit_number}
                            </p>
                            <p className={`text-sm mt-1 ${payment.status === 'paid' ? 'text-green-600' : 'text-slate-600'}`}>
                              {payment.status === 'paid' 
                                ? `Paid: ${payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : 'N/A'}`
                                : 'Waived by landlord'
                              }
                            </p>
                            {payment.notes && (
                              <p className="text-xs text-slate-500 mt-1 italic">{payment.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-slate-700">
                              PKR {payment.amount.toLocaleString()}
                            </p>
                            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                              payment.status === 'paid' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {payment.status === 'paid' ? 'Paid' : 'Waived'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}