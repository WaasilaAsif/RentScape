'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState } from 'react'
import PropertyCard from '@/components/property-card'
import type { MapMarker } from '@/components/map'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Topbar } from '@/components/dashboard/Topbar'
import { Card } from '@/components/ui/Card'

const PropertyMap = dynamic(() => import('@/components/map'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full animate-pulse rounded-2xl border border-white/15 bg-slate-900/40" />
  ),
})

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

export default function TenantDashboard() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [cityFilter, setCityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const loadProperties = useCallback(async () => {
    setLoading(true)
    setApiError(null)
    try {
      const response = await fetch('/api/properties?limit=50', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Properties API failed to initialize.')
      }
      setProperties(Array.isArray(data.properties) ? data.properties : [])
    } catch (error) {
      setProperties([])
      setApiError(error instanceof Error ? error.message : 'Properties API failed to initialize.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProperties()
  }, [loadProperties])

  const cities = useMemo(() => {
    return [...new Set(properties.map(property => property.city).filter(Boolean))].sort()
  }, [properties])

  const propertyTypes = useMemo(() => {
    return [...new Set(properties.map(property => property.property_type).filter(Boolean))].sort()
  }, [properties])

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      const matchesCity = cityFilter === 'all' || property.city === cityFilter
      const matchesType = typeFilter === 'all' || property.property_type === typeFilter
      return matchesCity && matchesType
    })
  }, [properties, cityFilter, typeFilter])

  const markers = useMemo<MapMarker[]>(
    () =>
      filteredProperties
        .filter(
          property =>
            typeof property.lat === 'number' &&
            Number.isFinite(property.lat) &&
            typeof property.lng === 'number' &&
            Number.isFinite(property.lng)
        )
        .map(property => ({
          id: property.id,
          title: property.title,
          lat: property.lat as number,
          lng: property.lng as number,
        })),
    [filteredProperties]
  )

  const mapCenter = useMemo<[number, number]>(() => {
    if (markers.length > 0) return [markers[0].lat, markers[0].lng]
    return [33.6844, 73.0479]
  }, [markers])

  return (
    <DashboardShell role="tenant">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar title="Tenant overview" subtitle="Discover rentals by area and property type" />
          {apiError && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <span>{apiError}</span>
              <button
                type="button"
                onClick={loadProperties}
                className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Retry
              </button>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-3">
            <Card title="Available Listings" description="Currently active properties">
              <p className="text-4xl font-bold text-blue-600">{properties.length}</p>
            </Card>
            <Card title="Shown on Map" description="Listings after filters">
              <p className="text-4xl font-bold text-indigo-600">{filteredProperties.length}</p>
            </Card>
            <Card title="Map Markers" description="Listings with valid coordinates">
              <p className="text-4xl font-bold text-cyan-600">{markers.length}</p>
            </Card>
          </div>

          <Card title="Filters" description="Refine by city and property type">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-medium text-blue-800">City</span>
                <select
                  value={cityFilter}
                  onChange={e => setCityFilter(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                >
                  <option value="all">All cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-blue-800">Property type</span>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                >
                  <option value="all">All types</option>
                  {propertyTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Card>

          <Card title="Map View" description="Explore nearby options at a glance">
            <PropertyMap
              center={mapCenter}
              markers={markers}
              zoom={12}
              onMarkerClick={marker => setSelectedPropertyId(marker.id)}
            />
          </Card>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-800">Listings</h2>
            {loading ? (
              <p className="text-slate-500">Loading properties...</p>
            ) : filteredProperties.length === 0 ? (
              <p className="text-slate-500">No listings found yet. Add properties or adjust filters.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredProperties.map(property => (
                  <div
                    key={property.id}
                    className={selectedPropertyId === property.id ? 'ring-2 ring-cyan-300/70 rounded-2xl' : ''}
                  >
                    <PropertyCard
                      property={property}
                      href={`/properties/${property.id}`}
                      onClick={() => setSelectedPropertyId(property.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  )
}
