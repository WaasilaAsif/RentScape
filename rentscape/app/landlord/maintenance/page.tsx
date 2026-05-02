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

type MaintenanceImage = {
  id: string
  request_id: string
  image_url: string
  created_at: string
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

// ── Drawer ────────────────────────────────────────────────────────────────────
function RequestDrawer({
  request,
  onClose,
  onUpdateStatus,
  updating,
}: {
  request: MaintenanceRequest
  onClose: () => void
  onUpdateStatus: (id: string, status: MaintenanceRequest['status']) => void
  updating: string | null
}) {
  const [images, setImages] = useState<MaintenanceImage[]>([])
  const [imagesLoading, setImagesLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    async function fetchImages() {
      try {
        const res = await fetch(`/api/maintenance/images?request_id=${request.id}`, {
          cache: 'no-store',
        })
        if (!res.ok) return
        const data = await res.json()
        setImages(Array.isArray(data.images) ? data.images : [])
      } catch {
        setImages([])
      } finally {
        setImagesLoading(false)
      }
    }
    fetchImages()
  }, [request.id])

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedImage) setSelectedImage(null)
        else onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, selectedImage])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex-1 pr-4">
            <h2 className="text-lg font-bold text-slate-900">{request.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {request.property_title} • Unit {request.unit_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityColors[request.priority]}`}>
              {request.priority} priority
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[request.status]}`}>
              {request.status.replace('_', ' ')}
            </span>
          </div>

          {/* Meta */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Reported by</span>
              <span className="font-medium text-slate-800">{request.tenant_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Submitted</span>
              <span className="font-medium text-slate-800">
                {new Date(request.created_at).toLocaleString()}
              </span>
            </div>
            {request.resolved_at && (
              <div className="flex justify-between">
                <span className="text-slate-500">Resolved</span>
                <span className="font-medium text-green-700">
                  {new Date(request.resolved_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {request.description && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl border border-slate-200 p-4">
                {request.description}
              </p>
            </div>
          )}

          {/* Images */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Photos {!imagesLoading && `(${images.length})`}
            </h3>
            {imagesLoading ? (
              <div className="grid grid-cols-3 gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : images.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No photos attached to this request.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.image_url)}
                    className="group relative h-24 overflow-hidden rounded-lg border border-slate-200 shadow-sm transition hover:shadow-md"
                  >
                    <img
                      src={img.image_url}
                      alt="Maintenance photo"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                      <svg className="h-6 w-6 text-white opacity-0 transition group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer — status actions */}
        {(request.status === 'open' || request.status === 'in_progress') && (
          <div className="border-t border-slate-200 px-6 py-4 flex gap-3">
            {request.status === 'open' && (
              <button
                onClick={() => onUpdateStatus(request.id, 'in_progress')}
                disabled={updating === request.id}
                className="flex-1 rounded-xl bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-yellow-600 disabled:opacity-50"
              >
                {updating === request.id ? 'Updating...' : 'Start Work'}
              </button>
            )}
            <button
              onClick={() => onUpdateStatus(request.id, 'resolved')}
              disabled={updating === request.id}
              className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              {updating === request.id ? 'Updating...' : 'Mark Resolved'}
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full size"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)

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
          ...(newStatus === 'resolved' && { resolved_at: new Date().toISOString() }),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update request')
      }

      await loadRequests()

      // Update selected request in drawer if open
      setSelectedRequest(prev =>
        prev?.id === requestId ? { ...prev, status: newStatus } : prev
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update request')
    } finally {
      setUpdating(null)
    }
  }

  const openRequests = requests.filter(r => r.status === 'open')
  const inProgressRequests = requests.filter(r => r.status === 'in_progress')
  const resolvedRequests = requests.filter(r => r.status === 'resolved' || r.status === 'closed')

  function RequestCard({ request, border }: { request: MaintenanceRequest; border: string }) {
    return (
      <div
        onClick={() => setSelectedRequest(request)}
        className={`cursor-pointer rounded-xl border ${border} bg-white p-6 transition hover:shadow-md`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-slate-900">{request.title}</h3>
            <p className="text-sm text-slate-600 mt-1">
              {request.property_title} • Unit {request.unit_number}
            </p>
            <p className="text-sm text-slate-500">Reported by {request.tenant_name}</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${priorityColors[request.priority]}`}>
              {request.priority}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[request.status]}`}>
              {request.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        {request.description && (
          <p className="text-sm text-slate-700 mb-3 p-3 bg-slate-50 rounded-lg line-clamp-2">
            {request.description}
          </p>
        )}
        <p className="text-xs text-slate-400">
          {new Date(request.created_at).toLocaleString()} • Click to view details
        </p>
      </div>
    )
  }

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
                <Card title="Open Requests" description={`${openRequests.length} requests need attention`}>
                  <div className="space-y-4">
                    {openRequests.map(request => (
                      <RequestCard key={request.id} request={request} border="border-blue-200" />
                    ))}
                  </div>
                </Card>
              )}

              {inProgressRequests.length > 0 && (
                <Card title="In Progress" description={`${inProgressRequests.length} requests being worked on`}>
                  <div className="space-y-4">
                    {inProgressRequests.map(request => (
                      <RequestCard key={request.id} request={request} border="border-yellow-200" />
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
                      <div
                        key={request.id}
                        onClick={() => setSelectedRequest(request)}
                        className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-75 transition hover:opacity-100 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{request.title}</h3>
                            <p className="text-sm text-slate-600 mt-1">
                              {request.property_title} • Unit {request.unit_number}
                            </p>
                            <p className="text-sm text-green-600 mt-1">
                              Resolved: {request.resolved_at
                                ? new Date(request.resolved_at).toLocaleDateString()
                                : 'N/A'}
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

      {/* Drawer */}
      {selectedRequest && (
        <RequestDrawer
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdateStatus={updateStatus}
          updating={updating}
        />
      )}
    </DashboardShell>
  )
}