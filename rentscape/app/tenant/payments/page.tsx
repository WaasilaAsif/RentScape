'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Topbar } from '@/components/dashboard/Topbar'
import { Card } from '@/components/ui/Card'

type Payment = {
  id: string
  amount: string
  due_date: string
  paid_date: string | null
  status: 'pending' | 'paid' | 'overdue' | 'waived'
  tenant_confirmed?: boolean
  property_title: string
  property_city: string
}

export default function TenantPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState<string | null>(null)

  const loadPayments = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/payments', { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'Failed to load payments')
      setPayments(Array.isArray(payload?.payments) ? payload.payments : [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load payments')
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  async function confirmPayment(paymentId: string) {
    setPayingId(paymentId)
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'tenant_confirmed' }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || payload?.message || 'Failed to confirm payment')
      toast.success('Payment confirmation sent to landlord')
      await loadPayments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to confirm payment')
    } finally {
      setPayingId(null)
    }
  }

  const totals = useMemo(() => {
    const due = payments
      .filter((p) => p.status === 'pending' || p.status === 'overdue')
      .reduce((sum, p) => sum + Number(p.amount), 0)
    const overdue = payments
      .filter((p) => p.status === 'overdue')
      .reduce((sum, p) => sum + Number(p.amount), 0)
    return { due, overdue }
  }, [payments])

  return (
    <DashboardShell role="tenant">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar title="My Payments" subtitle="Track your upcoming and completed rent invoices" />

          <div className="grid gap-6 md:grid-cols-2">
            <Card title="Amount Due">
              <p className="text-3xl font-bold text-blue-700">PKR {totals.due.toLocaleString()}</p>
            </Card>
            <Card title="Overdue">
              <p className="text-3xl font-bold text-rose-600">PKR {totals.overdue.toLocaleString()}</p>
            </Card>
          </div>

          <Card title="Invoices" description="Pending invoices should be paid before due date">
            {loading ? (
              <p className="text-slate-600">Loading payments...</p>
            ) : payments.length === 0 ? (
              <div className="rounded-xl border border-blue-200/60 bg-blue-50 px-4 py-6 text-center text-sm text-blue-800">
                No payments found. Once a lease is active, your invoices will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="rounded-xl border border-blue-200/50 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{payment.property_title}</p>
                        <p className="text-sm text-slate-600">{payment.property_city}</p>
                        <p className="mt-2 text-sm text-slate-700">
                          Due: {new Date(payment.due_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-semibold text-blue-700">
                          PKR {Number(payment.amount).toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-2 text-right">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                            payment.status === 'overdue'
                              ? 'bg-rose-100 text-rose-700'
                              : payment.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {payment.status}
                        </span>
                        {(payment.status === 'pending' || payment.status === 'overdue') && !payment.tenant_confirmed ? (
                          <button
                            type="button"
                            onClick={() => confirmPayment(payment.id)}
                            disabled={payingId === payment.id}
                            className="block rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                          >
                            {payingId === payment.id ? 'Sending...' : 'Confirm Payment'}
                          </button>
                        ) : null}
                        {(payment.status === 'pending' || payment.status === 'overdue') && payment.tenant_confirmed ? (
                          <span className="inline-block rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                            Awaiting landlord approval
                          </span>
                        ) : null}
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

