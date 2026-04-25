'use client'

import { useEffect, useState } from 'react'
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { Card } from "@/components/ui/Card"
import { Topbar } from "@/components/dashboard/Topbar"

type MaintenanceRequest = {
  id: string
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  tenant_name: string
  property_title: string
  unit_number: string
  created_at: string
  resolved_at: string | null
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

const statusColors = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-700',
}

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  async function loadRequests() {
    setLoading(true)
    try {
      const response = await fetch('/api/maintenance', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to fetch maintenance requests')
      const data = await response.json()
      setRequests(Array.isArray(data.requests) ? data.requests : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  async function updateStatus(requestId: string, newStatus: MaintenanceRequest['status']) {
    setUpdating(requestId)
    setError(null)
    try {
      const response = await fetch(`/api/maintenance/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          ...(newStatus === 'resolved' && { resolved_at: new Date().toISOString() })
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update request')
      }

      await loadRequests()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update request')
    } finally {
      setUpdating(null)
    }
  }

  const openRequests = requests.filter(r => r.status === 'open')
  const inProgressRequests = requests.filter(r => r.status === 'in_progress')
  const resolvedRequests = requests.filter(r => r.status === 'resolved' || r.status === 'closed')

  return (
    <DashboardShell role="landlord">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar title="Maintenance Requests" subtitle="Manage property maintenance and repairs" />

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Open Requests">
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
                <p className="text-sm font-medium text-blue-100">New Requests</p>
                <p className="mt-2 text-3xl font-bold">{openRequests.length}</p>
              </div>
            </Card>
            <Card title="In Progress">
              <div className="rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 text-white">
                <p className="text-sm font-medium text-yellow-100">Active Work</p>
                <p className="mt-2 text-3xl font-bold">{inProgressRequests.length}</p>
              </div>
            </Card>
            <Card title="Resolved">
              <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
                <p className="text-sm font-medium text-green-100">Completed</p>
                <p className="mt-2 text-3xl font-bold">{resolvedRequests.length}</p>
              </div>
            </Card>
          </div>

          {loading ? (
            <Card title="Requests">
              <p className="text-slate-600">Loading maintenance requests...</p>
            </Card>
          ) : (
            <>
              {openRequests.length > 0 && (
                <Card title="🔴 Open Requests" description={`${openRequests.length} requests need attention`}>
                  <div className="space-y-4">
                    {openRequests.map(request => (
                      <div key={request.id} className="rounded-xl border border-blue-200 bg-white p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-slate-900">{request.title}</h3>
                            <p className="text-sm text-slate-600 mt-1">
                              {request.property_title} • Unit {request.unit_number}
                            </p>
                            <p className="text-sm text-slate-500">Reported by {request.tenant_name}</p>
                          </div>
                          <div className="flex gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${priorityColors[request.priority]}`}>
                              {request.priority}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[request.status]}`}>
                              {request.status}
                            </span>
                          </div>
                        </div>
                        {request.description && (
                          <p className="text-sm text-slate-700 mb-4 p-3 bg-slate-50 rounded-lg">
                            {request.description}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mb-4">
                          Created: {new Date(request.created_at).toLocaleString()}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(request.id, 'in_progress')}
                            disabled={updating === request.id}
                            className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700 disabled:opacity-50"
                          >
                            {updating === request.id ? 'Updating...' : 'Start Work'}
                          </button>
                          <button
                            onClick={() => updateStatus(request.id, 'resolved')}
                            disabled={updating === request.id}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            Mark Resolved
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {inProgressRequests.length > 0 && (
                <Card title="🔧 In Progress" description={`${inProgressRequests.length} requests being worked on`}>
                  <div className="space-y-4">
                    {inProgressRequests.map(request => (
                      <div key={request.id} className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-slate-900">{request.title}</h3>
                            <p className="text-sm text-slate-600 mt-1">
                              {request.property_title} • Unit {request.unit_number}
                            </p>
                            <p className="text-sm text-slate-500">Reported by {request.tenant_name}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${priorityColors[request.priority]}`}>
                            {request.priority}
                          </span>
                        </div>
                        {request.description && (
                          <p className="text-sm text-slate-700 mb-4 p-3 bg-white rounded-lg">
                            {request.description}
                          </p>
                        )}
                        <button
                          onClick={() => updateStatus(request.id, 'resolved')}
                          disabled={updating === request.id}
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {updating === request.id ? 'Updating...' : 'Mark Resolved'}
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card title="Resolved Requests" description="Recently completed">
                {resolvedRequests.length === 0 ? (
                  <p className="text-slate-600 py-8 text-center">No resolved requests yet.</p>
                ) : (
                  <div className="space-y-3">
                    {resolvedRequests.slice(0, 10).map(request => (
                      <div key={request.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-75">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{request.title}</h3>
                            <p className="text-sm text-slate-600 mt-1">
                              {request.property_title} • Unit {request.unit_number}
                            </p>
                            <p className="text-sm text-green-600 mt-1">
                              Resolved: {request.resolved_at ? new Date(request.resolved_at).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                            {request.status}
                          </span>
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