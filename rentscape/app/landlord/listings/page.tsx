'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Card } from '@/components/ui/Card'
import { Topbar } from '@/components/dashboard/Topbar'
import PropertyCard from '@/components/property-card'
import { toast } from 'sonner'

const PropertyMap = dynamic(() => import('@/components/map'), { ssr: false })

type Property = {
  id: string
  title: string
  city: string
  area: string | null
  property_type: string
  min_rent?: number | null
  max_rent?: number | null
}

type PropertyForm = {
  title: string
  city: string
  area: string
  property_type: 'apartment' | 'house' | 'room' | 'commercial' | 'other'
  monthly_rent: string
  lat: string
  lng: string
}

const initialForm: PropertyForm = {
  title: '',
  city: '',
  area: '',
  property_type: 'apartment',
  monthly_rent: '',
  lat: '33.6844',
  lng: '73.0479',
}

export default function ListingsPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<PropertyForm>(initialForm)
  const selectedLat = Number(form.lat)
  const selectedLng = Number(form.lng)
  const hasValidCoordinates = Number.isFinite(selectedLat) && Number.isFinite(selectedLng)

  async function loadMyProperties() {
    setLoading(true)
    const response = await fetch('/api/properties?mine=true&limit=100', { cache: 'no-store' })
    const data = await response.json()
    setProperties(Array.isArray(data.properties) ? data.properties : [])
    setLoading(false)
  }

  useEffect(() => {
    loadMyProperties().catch(() => {
      setError('Failed to load properties.')
      setLoading(false)
    })
  }, [])

  async function handleCreateProperty(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          city: form.city,
          area: form.area || undefined,
          property_type: form.property_type,
          total_units: 1,
          max_occupants_per_unit: 1,
          monthly_rent: Number(form.monthly_rent),
          lat: Number(form.lat),
          lng: Number(form.lng),
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to create property')
      }

      setForm(initialForm)
      await loadMyProperties()
      toast.success('Property listed successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardShell role="landlord">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar title="Properties Listings" subtitle="Manage your properties and create new listings" />

          <Card title="Create Property" description="Add a listing with location and starting rent">
            <form onSubmit={handleCreateProperty} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                placeholder="Title"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
              <input
                className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                placeholder="City"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                required
              />
              <input
                className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                placeholder="Area"
                value={form.area}
                onChange={e => setForm({ ...form, area: e.target.value })}
              />
              <select
                className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                value={form.property_type}
                onChange={e => setForm({ ...form, property_type: e.target.value as PropertyForm['property_type'] })}
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="room">Room</option>
                <option value="commercial">Commercial</option>
                <option value="other">Other</option>
              </select>
              <input
                type="number"
                min="0"
                className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                placeholder="Monthly rent (PKR)"
                value={form.monthly_rent}
                onChange={e => setForm({ ...form, monthly_rent: e.target.value })}
                required
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="number"
                  step="any"
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  placeholder="Latitude"
                  value={form.lat}
                  onChange={e => setForm({ ...form, lat: e.target.value })}
                  required
                />
                <input
                  type="number"
                  step="any"
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  placeholder="Longitude"
                  value={form.lng}
                  onChange={e => setForm({ ...form, lng: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <p className="text-sm text-slate-600">Click on the map to set latitude and longitude.</p>
                <PropertyMap
                  center={hasValidCoordinates ? [selectedLat, selectedLng] : [33.6844, 73.0479]}
                  markers={
                    hasValidCoordinates
                      ? [{ id: 'selected-form-location', title: 'Selected location', lat: selectedLat, lng: selectedLng }]
                      : []
                  }
                  zoom={13}
                  heightClassName="h-[280px]"
                  onMapClick={(lat, lng) =>
                    setForm(prev => ({
                      ...prev,
                      lat: lat.toFixed(6),
                      lng: lng.toFixed(6),
                    }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : 'Create Property'}
                </button>
              </div>
            </form>
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          </Card>

          <Card title="Your Properties" description="Only your own listings">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-blue-200/40 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-4 h-32 w-full animate-pulse rounded-xl bg-slate-200/70" />
                    <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200/70" />
                    <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-200/70" />
                    <div className="mt-4 flex items-center justify-between">
                      <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200/70" />
                      <div className="h-5 w-24 animate-pulse rounded bg-slate-200/70" />
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <p className="text-slate-600">No properties listed yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {properties.map(property => (
                  <PropertyCard key={property.id} property={property} href={`/properties/${property.id}`} />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
