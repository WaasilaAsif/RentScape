'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import PropertyCard from '@/components/property-card'
import type { MapMarker } from '@/components/map'

const PropertyMap = dynamic(() => import('@/components/map'), { ssr: false })

type Property = {
  id: string
  title: string
  city: string
  area: string | null
  property_type: string
  lat: number | null
  lng: number | null
  min_rent?: number | null
  max_rent?: number | null
}

export default function BrowsePage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const params = new URLSearchParams({ limit: '80' })
      if (query.trim()) params.set('q', query.trim())
      const response = await fetch(`/api/properties?${params.toString()}`, { cache: 'no-store' })
      const data = await response.json()
      if (!cancelled) {
        setProperties(Array.isArray(data.properties) ? data.properties : [])
        setLoading(false)
      }
    }
    load().catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [query])

  const markers = useMemo<MapMarker[]>(
    () =>
      properties
        .filter(p => typeof p.lat === 'number' && typeof p.lng === 'number')
        .map(p => ({ id: p.id, title: p.title, lat: p.lat as number, lng: p.lng as number })),
    [properties]
  )

  const center = useMemo<[number, number]>(() => {
    if (markers.length > 0) return [markers[0].lat, markers[0].lng]
    return [33.6844, 73.0479]
  }, [markers])

  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Browse Properties</h1>
          <Link href="/login" className="text-sm font-medium text-blue-700 hover:text-blue-900">
            Sign in
          </Link>
        </div>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by city or area"
          className="w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm text-slate-700"
        />
        <PropertyMap center={center} markers={markers} zoom={12} heightClassName="h-[360px]" />
        {loading ? (
          <p className="text-slate-600">Loading listings...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {properties.map(property => (
              <PropertyCard key={property.id} property={property} href={`/properties/${property.id}`} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}