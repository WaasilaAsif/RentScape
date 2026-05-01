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

type Review = {
  id: string
  reviewer_name: string
  score: number
  comment: string | null
  created_at: string
}

type RatingsData = {
  average_rating: number
  total_reviews: number
  reviews: Review[]
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

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <svg key={star} className={`${sizeClass} ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.05 2.927z" />
        </svg>
      ))}
    </span>
  )
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-6 shrink-0 text-right text-slate-500">{label}</span>
      <svg className="h-3.5 w-3.5 shrink-0 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.05 2.927z" />
      </svg>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-yellow-400 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 shrink-0 text-slate-400">{count}</span>
    </div>
  )
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [property, setProperty] = useState<Property | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<UnitForm>(initialUnitForm)

  const [linkedAmenities, setLinkedAmenities] = useState<{ id: string; name: string }[]>([])
  const [showAmenityPicker, setShowAmenityPicker] = useState(false)
  const [amenityInput, setAmenityInput] = useState('')
  const [amenitySubmitting, setAmenitySubmitting] = useState(false)
  const [ratings, setRatings] = useState<RatingsData | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      const propResponse = await fetch(`/api/properties/${id}`, { cache: 'no-store' })
      const propData = await propResponse.json()
      setProperty(propData.property)
      const amenitiesRes = await fetch(`/api/properties/${id}/amenities`, { cache: 'no-store' })
      const amenitiesData = await amenitiesRes.json()
      setLinkedAmenities(Array.isArray(amenitiesData.amenities) ? amenitiesData.amenities : [])

      const unitsResponse = await fetch(`/api/units?property_id=${id}`, { cache: 'no-store' })
      const unitsData = await unitsResponse.json()
      setUnits(Array.isArray(unitsData.units) ? unitsData.units : [])

      const ratingsRes = await fetch(`/api/properties/${id}/ratings`, { cache: 'no-store' })
      const ratingsData = await ratingsRes.json()
      setRatings(ratingsData ?? null)
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

  async function handleAddAmenity(amenityName: string) {
    
    if (linkedAmenities.some(a => a.name === amenityName)) return
    setAmenitySubmitting(true)
    try {
      // First: get or create the amenity record to get its UUID
      const lookupRes = await fetch('/api/amenities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: amenityName }),
      })
      
      const lookupData = await lookupRes.json()
      console.log('lookupData', lookupData) 
      const amenityId = lookupData.amenity?.id
      console.log('amenityId', amenityId)  

      if (!amenityId) throw new Error('Failed to resolve amenity')

      // Then: link it to the property
      const linkRes = await fetch(`/api/properties/${id}/amenities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amenity_id: amenityId }),
      })

      if (!linkRes.ok) {
        const data = await linkRes.json()
        throw new Error(data.error || 'Failed to add amenity')
      }

      setLinkedAmenities(prev => [...prev, { id: amenityId, name: amenityName }])

    } catch (err) {
      console.error('Failed to add amenity', err)
    } finally {
      setAmenitySubmitting(false)
    }
  }

  async function handleRemoveAmenity(amenityId: string) {
    try {
      const res = await fetch(`/api/properties/${id}/amenities?amenity_id=${amenityId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to remove amenity')
      setLinkedAmenities(prev => prev.filter(a => a.id !== amenityId))
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

  const filteredAmenities = ALL_AMENITIES.filter(a => !linkedAmenities.some(l => l.name === a))

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
                      <span key={amenity.id} className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                        {amenity.name}
                        <button
                          onClick={() => handleRemoveAmenity(amenity.id)}
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
          {/* Ratings & Reviews */}
          <Card title="Ratings & Reviews" description="What tenants say about this property">
            {!ratings || ratings.total_reviews === 0 ? (
              <p className="text-slate-500 text-sm">No reviews yet for this property.</p>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 px-8 py-6 text-center shrink-0">
                    <span className="text-5xl font-bold text-slate-900">{ratings.average_rating.toFixed(1)}</span>
                    <StarRating rating={ratings.average_rating} size="lg" />
                    <span className="mt-1 text-sm text-slate-500">{ratings.total_reviews} review{ratings.total_reviews !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex-1 space-y-2 py-2">
                    {[5, 4, 3, 2, 1].map(star => (
                      <RatingBar
                        key={star}
                        label={String(star)}
                        count={ratings.reviews.filter(r => Math.round(r.score) === star).length}
                        total={ratings.total_reviews}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  {ratings.reviews.map(review => (
                    <div key={review.id} className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-medium text-slate-800">{review.reviewer_name}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(review.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <StarRating rating={review.score} size="sm" />
                      {review.comment && (
                        <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}