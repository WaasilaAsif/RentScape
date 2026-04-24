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
  status: 'pending' | 'paid' | 'overdue'
  tenant_name: string
  property_title: string
  unit_number: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

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

  useEffect(() => {
    loadPayments()
  }, [])

  async function markAsPaid(paymentId: string) {
    setUpdating(paymentId)
    setError(null)
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0]
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
    collected: payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0),
    pending: payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0),
    overdue: payments
      .filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + p.amount, 0),
  }

  const pendingPayments = payments.filter(p => p.status === 'pending')
  const overduePayments = payments.filter(p => p.status === 'overdue')
  const paidPayments = payments.filter(p => p.status === 'paid')

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

          <div className="grid gap-6 lg:grid-cols-3">
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
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-red-600">
                              PKR {payment.amount.toLocaleString()}
                            </p>
                            <button
                              onClick={() => markAsPaid(payment.id)}
                              disabled={updating === payment.id}
                              className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {updating === payment.id ? 'Updating...' : 'Mark Paid'}
                            </button>
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
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-blue-600">
                              PKR {payment.amount.toLocaleString()}
                            </p>
                            <button
                              onClick={() => markAsPaid(payment.id)}
                              disabled={updating === payment.id}
                              className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {updating === payment.id ? 'Updating...' : 'Mark Paid'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card title="Payment History" description="Recently paid">
                {paidPayments.length === 0 ? (
                  <p className="text-slate-600 py-8 text-center">No payment history yet.</p>
                ) : (
                  <div className="space-y-3">
                    {paidPayments.slice(0, 10).map(payment => (
                      <div key={payment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-75">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{payment.tenant_name}</p>
                            <p className="text-sm text-slate-600">
                              {payment.property_title} • Unit {payment.unit_number}
                            </p>
                            <p className="text-sm text-green-600 mt-1">
                              Paid: {payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-slate-700">
                              PKR {payment.amount.toLocaleString()}
                            </p>
                            <span className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                              Paid
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