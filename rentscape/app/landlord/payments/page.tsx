'use client'

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Topbar } from "@/components/dashboard/Topbar";

type Payment = {
  id: string
  amount: string
  due_date: string
  paid_date: string | null
  status: 'pending' | 'paid' | 'overdue' | 'waived'
  property_title: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [markingPaymentId, setMarkingPaymentId] = useState<string | null>(null)

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

  const stats = useMemo(() => {
    const collected = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0)
    const pending = payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0)
    const overdue = payments.filter((p) => p.status === 'overdue').reduce((sum, p) => sum + Number(p.amount), 0)
    return { collected, pending, overdue }
  }, [payments])

  async function markAsPaid(paymentId: string) {
    setMarkingPaymentId(paymentId)
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          paid_date: new Date().toISOString().slice(0, 10),
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || payload?.message || 'Failed to mark paid')
      toast.success('Payment marked as paid')
      await loadPayments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark payment')
    } finally {
      setMarkingPaymentId(null)
    }
  }

  return (
    <DashboardShell role="landlord">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar title="Payment Management" subtitle="Monitor rent collection and payments" />

          <div className="grid gap-6 md:grid-cols-3">
            <Card title="Collected">
              <p className="text-3xl font-bold text-emerald-700">PKR {stats.collected.toLocaleString()}</p>
            </Card>
            <Card title="Pending">
              <p className="text-3xl font-bold text-amber-700">PKR {stats.pending.toLocaleString()}</p>
            </Card>
            <Card title="Overdue">
              <p className="text-3xl font-bold text-rose-700">PKR {stats.overdue.toLocaleString()}</p>
            </Card>
          </div>

          <Card title="Payment History">
            {loading ? (
              <p className="text-slate-600">Loading payment records...</p>
            ) : payments.length === 0 ? (
              <div className="rounded-xl border border-blue-200/60 bg-blue-50 px-4 py-6 text-center text-sm text-blue-800">
                No payments found. Once a lease is active, your invoices will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="rounded-xl border border-blue-200/40 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{payment.property_title}</p>
                        <p className="text-sm text-slate-600">
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
                        {(payment.status === 'pending' || payment.status === 'overdue') ? (
                          <button
                            type="button"
                            onClick={() => markAsPaid(payment.id)}
                            disabled={markingPaymentId === payment.id}
                            className="block rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                          >
                            {markingPaymentId === payment.id ? 'Saving...' : 'Mark Paid'}
                          </button>
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
  );
}
