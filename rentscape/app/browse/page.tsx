'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

const PropertyMap = dynamic(() => import('@/components/map'), { ssr: false })

type Unit = {
  id: string
  unit_number: string
  bedrooms: number
  bathrooms: number
  monthly_rent: number
  property_id: string
  property_title: string
  city: string
  area: string | null
  property_type: string
  lat: number | null
  lng: number | null
}

export default function BrowsePage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      // Fetch available units, not properties
      const response = await fetch('/api/units?available=true', { cache: 'no-store' })
      const data = await response.json()
      if (!cancelled) {
        setUnits(Array.isArray(data.units) ? data.units : [])
        setLoading(false)
      }
    }
    load().catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const filteredUnits = useMemo(() => {
    if (!query.trim()) return units
    const q = query.toLowerCase()
    return units.filter(
      u =>
        u.city.toLowerCase().includes(q) ||
        u.area?.toLowerCase().includes(q) ||
        u.property_title.toLowerCase().includes(q)
    )
  }, [units, query])

  const markers = useMemo(
    () =>
      filteredUnits
        .filter(u => typeof u.lat === 'number' && typeof u.lng === 'number')
        .map(u => ({
          id: u.id,
          title: `${u.property_title} - Unit ${u.unit_number}`,
          lat: u.lat as number,
          lng: u.lng as number,
        })),
    [filteredUnits]
  )

  const center = useMemo<[number, number]>(() => {
    if (markers.length > 0) return [markers[0].lat, markers[0].lng]
    return [33.6844, 73.0479]
  }, [markers])

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Browse Available Units</h1>
          <Link href="/login" className="text-sm font-medium text-blue-700 hover:text-blue-900">
            Sign in
          </Link>
        </div>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by city, area, or property name"
          className="w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm text-slate-700"
        />
        <PropertyMap center={center} markers={markers} zoom={12} heightClassName="h-[360px]" />
        {loading ? (
          <p className="text-slate-600">Loading units...</p>
        ) : (
          <>
            <p className="text-sm text-slate-600">{filteredUnits.length} units available</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredUnits.map(unit => (
                <Link
                  key={unit.id}
                  href={`/properties/${unit.property_id}`}
                  className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-lg text-slate-900">
                    {unit.property_title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Unit {unit.unit_number} • {unit.area ? `${unit.area}, ` : ''}{unit.city}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    {unit.bedrooms} bed • {unit.bathrooms} bath • {unit.property_type}
                  </p>
                  <p className="text-2xl font-bold text-blue-600 mt-3">
                    PKR {unit.monthly_rent.toLocaleString()}/mo
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}