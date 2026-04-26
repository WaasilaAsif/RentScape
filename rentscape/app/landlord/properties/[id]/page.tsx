'use client'

import { useEffect, useState, use } from 'react'
import dynamic from 'next/dynamic'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Card } from '@/components/ui/Card'
import { Topbar } from '@/components/dashboard/Topbar'
import { PropertyImageGallery } from '@/components/property/PropertyImageGallery'

const PropertyMap = dynamic(() => import('@/components/map'), { ssr: false })

type Property = {
  id: string
  title: string
  city: string
  area: string | null
  property_type: string
  total_units: number
  lat: number
  lng: number
  status: string
}

type Unit = {
  id: string
  unit_number: string
  floor: number | null
  bedrooms: number
  bathrooms: number
  monthly_rent: number
  is_available: boolean
  advance_required: boolean
  advance_months: number | null
  max_occupants: number
  description: string | null
}

type UnitForm = {
  unit_number: string
  floor: string
  bedrooms: number
  bathrooms: number
  monthly_rent: string
  advance_required: boolean
  advance_months: string
  max_occupants: number
  description: string
}

const initialUnitForm: UnitForm = {
  unit_number: '',
  floor: '1',
  bedrooms: 1,
  bathrooms: 1,
  monthly_rent: '',
  advance_required: false,
  advance_months: '',
  max_occupants: 2,
  description: '',
}

const ALL_AMENITIES = [
  'WiFi', 'Parking', 'Generator', 'Water Supply', 'Security Guard',
  'CCTV', 'Elevator', 'Gas', 'Air Conditioning', 'Laundry',
  'Rooftop Access', 'Gym', 'Swimming Pool', 'Prayer Area', 'Storage Room'
]

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [property, setProperty] = useState<Property | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<UnitForm>(initialUnitForm)

  const [linkedAmenities, setLinkedAmenities] = useState<string[]>([])
  const [showAmenityPicker, setShowAmenityPicker] = useState(false)
  const [amenityInput, setAmenityInput] = useState('')
  const [amenitySubmitting, setAmenitySubmitting] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const propResponse = await fetch(`/api/properties/${id}`, { cache: 'no-store' })
      const propData = await propResponse.json()
      setProperty(propData.property)
      setLinkedAmenities(Array.isArray(propData.amenities) ? propData.amenities : [])

      const unitsResponse = await fetch(`/api/units?property_id=${id}`, { cache: 'no-store' })
      const unitsData = await unitsResponse.json()
      setUnits(Array.isArray(unitsData.units) ? unitsData.units : [])
    } catch (err) {
      setError('Failed to load property data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  async function handleCreateUnit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: id,
          unit_number: form.unit_number,
          floor: Number(form.floor),
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          monthly_rent: Number(form.monthly_rent),
          is_available: true,
          advance_required: form.advance_required,
          advance_months: form.advance_required ? Number(form.advance_months) : undefined,
          max_occupants: form.max_occupants,
          description: form.description || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to create unit')
      }

      setForm(initialUnitForm)
      setShowForm(false)
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddAmenity(amenity: string) {
    if (linkedAmenities.includes(amenity)) return
    setAmenitySubmitting(true)
    try {
      setLinkedAmenities(prev => [...prev, amenity])
    } finally {
      setAmenitySubmitting(false)
    }
  }

  async function handleRemoveAmenity(amenity: string) {
    try {
      setLinkedAmenities(prev => prev.filter(a => a !== amenity))
    } catch (err) {
      console.error('Failed to remove amenity', err)
    }
  }

  async function handleAddCustomAmenity(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = amenityInput.trim()
    if (!trimmed) return
    await handleAddAmenity(trimmed)
    setAmenityInput('')
  }

  const filteredAmenities = ALL_AMENITIES.filter(a => !linkedAmenities.includes(a))

  if (loading) {
    return (
      <DashboardShell role="landlord">
        <div className="p-8">Loading property...</div>
      </DashboardShell>
    )
  }

  if (!property) {
    return (
      <DashboardShell role="landlord">
        <div className="p-8">Property not found</div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="landlord">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar
            title={property.title}
            subtitle={`${property.area ? property.area + ', ' : ''}${property.city} • ${property.property_type}`}
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Property Info" className="lg:col-span-1">
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-slate-600">Total Units</dt>
                  <dd className="text-slate-900">{property.total_units}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-600">Units Added</dt>
                  <dd className="text-slate-900">{units.length}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-600">Available Units</dt>
                  <dd className="text-slate-900">{units.filter(u => u.is_available).length}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-600">Status</dt>
                  <dd className="capitalize text-slate-900">{property.status}</dd>
                </div>
              </dl>
            </Card>

            <div className="lg:col-span-2">
              <PropertyMap
                center={[property.lat, property.lng]}
                markers={[{ id: property.id, title: property.title, lat: property.lat, lng: property.lng }]}
                zoom={15}
                heightClassName="h-[300px]"
              />
            </div>
          </div>

          {/* ── Photos ── */}
          <Card title="Photos" description="Upload photos to showcase this property">
            <PropertyImageGallery propertyId={id} />
          </Card>

          <div className="flex justify-end">
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              {showForm ? 'Cancel' : '+ Add Unit'}
            </button>
          </div>

          {showForm && (
            <Card title="Add Unit" description={`Add a rentable unit to ${property.title}`}>
              <form onSubmit={handleCreateUnit} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-blue-800">Unit Number</label>
                  <input
                    className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                    placeholder="e.g., 1A, 201"
                    value={form.unit_number}
                    onChange={e => setForm({ ...form, unit_number: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-blue-800">Floor</label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                    value={form.floor}
                    onChange={e => setForm({ ...form, floor: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-blue-800">Bedrooms</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                    value={form.bedrooms}
                    onChange={e => setForm({ ...form, bedrooms: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-blue-800">Bathrooms</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                    value={form.bathrooms}
                    onChange={e => setForm({ ...form, bathrooms: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-blue-800">Monthly Rent (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                    value={form.monthly_rent}
                    onChange={e => setForm({ ...form, monthly_rent: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-blue-800">Max Occupants</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                    value={form.max_occupants}
                    onChange={e => setForm({ ...form, max_occupants: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="advance_required"
                    checked={form.advance_required}
                    onChange={e => setForm({ ...form, advance_required: e.target.checked })}
                    className="h-4 w-4 rounded border-blue-300"
                  />
                  <label htmlFor="advance_required" className="text-sm font-medium text-blue-800">
                    Advance Required
                  </label>
                </div>
                {form.advance_required && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-blue-800">Advance Months</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                      value={form.advance_months}
                      onChange={e => setForm({ ...form, advance_months: e.target.value })}
                      required
                    />
                  </div>
                )}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-medium text-blue-800">Description <span className="text-slate-400">(optional)</span></label>
                  <textarea
                    className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                    rows={3}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {submitting ? 'Adding...' : 'Add Unit'}
                  </button>
                </div>
              </form>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </Card>
          )}

          <Card title="Units" description={`${units.length} of ${property.total_units} units added`}>
            {units.length === 0 ? (
              <p className="text-slate-600">No units added yet. Click &quot;Add Unit&quot; to create the first one.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {units.map(unit => (
                  <div key={unit.id} className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg text-slate-900">Unit {unit.unit_number}</h3>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        unit.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {unit.is_available ? 'Available' : 'Occupied'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">
                      Floor {unit.floor || 'N/A'} • {unit.bedrooms} bed • {unit.bathrooms} bath
                    </p>
                    <p className="text-2xl font-bold text-blue-600 mt-3">
                      PKR {Number(unit.monthly_rent).toLocaleString('en-PK')}/mo
                    </p>
                    {unit.advance_required && (
                      <p className="text-xs text-slate-500 mt-2">
                        Advance: {unit.advance_months} month{unit.advance_months !== 1 ? 's' : ''}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">Max {unit.max_occupants} occupants</p>
                    {unit.description && (
                      <p className="text-sm text-slate-600 mt-3">{unit.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Amenities Section */}
          <Card title="Amenities" description="Manage amenities for this property">
            <div className="space-y-4">
              {linkedAmenities.length === 0 ? (
                <p className="text-slate-500 text-sm">No amenities added yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {linkedAmenities.map(amenity => (
                    <span
                      key={amenity}
                      className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                    >
                      {amenity}
                      <button
                        onClick={() => handleRemoveAmenity(amenity)}
                        className="ml-1 text-blue-400 hover:text-red-500 transition-colors"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowAmenityPicker(!showAmenityPicker)}
                className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
              >
                {showAmenityPicker ? 'Close' : '+ Add Amenity'}
              </button>

              {showAmenityPicker && (
                <div className="rounded-xl border border-blue-200 bg-white p-4 space-y-4">
                  <form onSubmit={handleAddCustomAmenity} className="flex gap-2">
                    <input
                      className="flex-1 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                      placeholder="Type a custom amenity..."
                      value={amenityInput}
                      onChange={e => setAmenityInput(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={amenitySubmitting || !amenityInput.trim()}
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Add
                    </button>
                  </form>

                  {filteredAmenities.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-blue-800 mb-2">Quick add:</p>
                      <div className="flex flex-wrap gap-2">
                        {filteredAmenities.map(amenity => (
                          <button
                            key={amenity}
                            onClick={() => handleAddAmenity(amenity)}
                            disabled={amenitySubmitting}
                            className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
                          >
                            + {amenity}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}