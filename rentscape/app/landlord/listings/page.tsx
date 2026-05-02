'use client'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Card } from '@/components/ui/Card'
import { Topbar } from '@/components/dashboard/Topbar'
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false })
type Property = {
  id: string
  title: string
  city: string
  area: string | null
  property_type: string
  total_units: number
  status: string
  lat: number
  lng: number
}

type PropertyForm = {
  title: string
  city: string
  area: string
  property_type: 'apartment' | 'house' | 'room' | 'commercial' | 'other'
  total_units: number
  max_occupants_per_unit: number
  lat: string
  lng: string
}

const initialForm: PropertyForm = {
  title: '',
  city: '',
  area: '',
  property_type: 'apartment',
  total_units: 1,
  max_occupants_per_unit: 4,
  lat: '33.6844',
  lng: '73.0479',
}

export default function ListingsPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<PropertyForm>(initialForm)

  async function loadMyProperties() {
    setLoading(true)
    try {
      const response = await fetch('/api/properties?mine=true&limit=100', { cache: 'no-store' })
      const data = await response.json()
      setProperties(Array.isArray(data.properties) ? data.properties : [])
    } catch (err) {
      setError('Failed to load properties.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMyProperties()
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
          total_units: form.total_units,
          max_occupants_per_unit: form.max_occupants_per_unit,
          lat: Number(form.lat),
          lng: Number(form.lng),
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to create property')
      }

      const { property } = await response.json()
      
      setForm(initialForm)
      setShowForm(false)
      await loadMyProperties()
      
      // Redirect to property detail page to add units
     router.push(`/landlord/properties/${property.id}`)  // Add /landlord prefix
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardShell role="landlord">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar 
            title="Property Listings" 
            subtitle="Manage your properties and units" 
          />

          <div className="flex justify-end">
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 transition-colors"
            >
              {showForm ? 'Cancel' : '+ Add Property'}
            </button>
          </div>

          {showForm && (
            <Card title="Create Property" description="Add a new building or complex (you'll add units in the next step)">
            <form onSubmit={handleCreateProperty} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-blue-800">Property Title</label>
                <input
                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  placeholder="e.g., Sunset Apartments"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-blue-800">City</label>
                <input
                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  placeholder="e.g., Islamabad"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-blue-800">Area <span className="text-slate-400">(optional)</span></label>
                <input
                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  placeholder="e.g., F-7"
                  value={form.area}
                  onChange={e => setForm({ ...form, area: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-blue-800">Property Type</label>
                <select
                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  value={form.property_type}
                  onChange={e => setForm({ ...form, property_type: e.target.value as PropertyForm['property_type'] })}
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="room">Room</option>
                  <option value="commercial">Commercial</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-blue-800">Total Units</label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  value={form.total_units}
                  onChange={e => setForm({ ...form, total_units: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-blue-800">Max Occupants Per Unit</label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  value={form.max_occupants_per_unit}
                  onChange={e => setForm({ ...form, max_occupants_per_unit: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-medium text-blue-800">Property Location</label>
                <LocationPicker
                  lat={Number(form.lat)}
                  lng={Number(form.lng)}
                  onChange={(lat, lng) => setForm({ ...form, lat: String(lat), lng: String(lng) })}
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {submitting ? 'Creating...' : 'Create Property & Add Units'}
                </button>
              </div>
            </form>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </Card>
          )}

          <Card title="Your Properties" description="Click on a property to manage its units">
            {loading ? (
              <p className="text-slate-600">Loading properties...</p>
            ) : properties.length === 0 ? (
              <p className="text-slate-600">No properties listed yet. Click &quot;Add Property&quot; to get started.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {properties.map(property => (
                  <div
                    key={property.id}
                    onClick={() => router.push(`/landlord/properties/${property.id}`)}
                    className="cursor-pointer rounded-2xl border border-blue-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-lg text-slate-900">{property.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {property.area ? `${property.area}, ` : ''}{property.city}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="text-slate-500">{property.total_units} units</span>
                      <span className="capitalize text-slate-500">{property.property_type}</span>
                    </div>
                    <div className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      property.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {property.status}
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