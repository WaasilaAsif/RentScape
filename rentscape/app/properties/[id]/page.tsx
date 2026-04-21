'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { MapMarker } from '@/components/map'

const PropertyMap = dynamic(() => import('@/components/map'), { ssr: false })

type PropertyDetails = {
  id: string
  title: string
  city: string
  area: string | null
  property_type: string
  status: string
  landlord_name?: string
  lat: number
  lng: number
}

type Unit = {
  id: string
  unit_number: string
  monthly_rent: number
  bedrooms: number
}

export default function PropertyDetailsPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [property, setProperty] = useState<PropertyDetails | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [amenities, setAmenities] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      const response = await fetch(`/api/properties/${id}`, { cache: 'no-store' })
      const data = await response.json()
      if (!cancelled) {
        setProperty(data.property ?? null)
        setUnits(Array.isArray(data.units) ? data.units : [])
        setAmenities(Array.isArray(data.amenities) ? data.amenities : [])
        setLoading(false)
      }
    }
    load().catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <main className="min-h-screen p-8">Loading property details...</main>
  if (!property) return <main className="min-h-screen p-8">Property not found.</main>

  const marker: MapMarker = {
    id: property.id,
    title: property.title,
    lat: property.lat,
    lng: property.lng,
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">{property.title}</h1>
          <p className="mt-2 text-slate-600">
            {property.city}
            {property.area ? `, ${property.area}` : ''} • {property.property_type}
          </p>
          <p className="mt-2 text-sm text-slate-500">Listed by {property.landlord_name ?? 'Landlord'}</p>
        </section>

        <section className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
          <PropertyMap center={[property.lat, property.lng]} markers={[marker]} zoom={14} heightClassName="h-[440px]" />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Amenities</h2>
            {amenities.length === 0 ? (
              <p className="mt-3 text-slate-600">No amenities listed.</p>
            ) : (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-700">
                {amenities.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Available Units</h2>
            {units.length === 0 ? (
              <p className="mt-3 text-slate-600">No available units right now.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {units.map(unit => (
                  <li key={unit.id} className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                    Unit {unit.unit_number} • {unit.bedrooms} bed • PKR {Number(unit.monthly_rent).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
