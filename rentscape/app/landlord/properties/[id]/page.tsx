'use client'

import { useEffect, useState, use } from 'react'
import dynamic from 'next/dynamic'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Card } from '@/components/ui/Card'
import { Topbar } from '@/components/dashboard/Topbar'

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

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [property, setProperty] = useState<Property | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<UnitForm>(initialUnitForm)

  async function loadData() {
    setLoading(true)
    try {
      // Fetch property details
      const propResponse = await fetch(`/api/properties/${id}`, { cache: 'no-store' })
      const propData = await propResponse.json()
      setProperty(propData.property)

      // Fetch units for this property
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
                <input
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  placeholder="Unit Number (e.g., 1A, 201)"
                  value={form.unit_number}
                  onChange={e => setForm({ ...form, unit_number: e.target.value })}
                  required
                />
                <input
                  type="number"
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  placeholder="Floor"
                  value={form.floor}
                  onChange={e => setForm({ ...form, floor: e.target.value })}
                />
                <input
                  type="number"
                  min="0"
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  placeholder="Bedrooms"
                  value={form.bedrooms}
                  onChange={e => setForm({ ...form, bedrooms: Number(e.target.value) })}
                  required
                />
                <input
                  type="number"
                  min="0"
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  placeholder="Bathrooms"
                  value={form.bathrooms}
                  onChange={e => setForm({ ...form, bathrooms: Number(e.target.value) })}
                  required
                />
                <input
                  type="number"
                  min="0"
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  placeholder="Monthly Rent (PKR)"
                  value={form.monthly_rent}
                  onChange={e => setForm({ ...form, monthly_rent: e.target.value })}
                  required
                />
                <input
                  type="number"
                  min="1"
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  placeholder="Max Occupants"
                  value={form.max_occupants}
                  onChange={e => setForm({ ...form, max_occupants: Number(e.target.value) })}
                  required
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="advance_required"
                    checked={form.advance_required}
                    onChange={e => setForm({ ...form, advance_required: e.target.checked })}
                    className="h-4 w-4 rounded border-blue-300"
                  />
                  <label htmlFor="advance_required" className="text-sm text-slate-700">
                    Advance Required
                  </label>
                </div>
                {form.advance_required && (
                  <input
                    type="number"
                    min="1"
                    max="12"
                    className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                    placeholder="Advance Months"
                    value={form.advance_months}
                    onChange={e => setForm({ ...form, advance_months: e.target.value })}
                    required
                  />
                )}
                <textarea
                  className="md:col-span-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  placeholder="Description (optional)"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
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
                  <div
                    key={unit.id}
                    className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg text-slate-900">Unit {unit.unit_number}</h3>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        unit.is_available 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {unit.is_available ? 'Available' : 'Occupied'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">
                      Floor {unit.floor || 'N/A'} • {unit.bedrooms} bed • {unit.bathrooms} bath
                    </p>
                    <p className="text-2xl font-bold text-blue-600 mt-3">
                      PKR {unit.monthly_rent.toLocaleString()}/mo
                    </p>
                    {unit.advance_required && (
                      <p className="text-xs text-slate-500 mt-2">
                        Advance: {unit.advance_months} month{unit.advance_months !== 1 ? 's' : ''}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      Max {unit.max_occupants} occupants
                    </p>
                    {unit.description && (
                      <p className="text-sm text-slate-600 mt-3">{unit.description}</p>
                    )}
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