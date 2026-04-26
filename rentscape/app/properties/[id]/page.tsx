'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { MapMarker } from '@/components/map'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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

type PropertyImage = {
  id: string
  image_url: string
  is_primary: boolean
}

export default function PropertyDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id
  const [property, setProperty] = useState<PropertyDetails | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [amenities, setAmenities] = useState<string[]>([])
  const [images, setImages] = useState<PropertyImage[]>([])
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      const [propRes, imgRes] = await Promise.all([
        fetch(`/api/properties/${id}`, { cache: 'no-store' }),
        fetch(`/api/properties/${id}/images`, { cache: 'no-store' }),
      ])
      const propData = await propRes.json()
      const imgData = await imgRes.json()
      if (!cancelled) {
        setProperty(propData.property ?? null)
        setUnits(Array.isArray(propData.units) ? propData.units : [])
        setAmenities(Array.isArray(propData.amenities) ? propData.amenities : [])
        const imgs: PropertyImage[] = Array.isArray(imgData.images) ? imgData.images : []
        setImages(imgs)
        // Start on the primary image
        const primaryIdx = imgs.findIndex(img => img.is_primary)
        setActiveIndex(primaryIdx >= 0 ? primaryIdx : 0)
        setLoading(false)
      }
    }
    load().catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
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
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
        >
          ← Back
        </button>

        <section className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">{property.title}</h1>
          <p className="mt-2 text-slate-600">
            {property.city}
            {property.area ? `, ${property.area}` : ''} • {property.property_type}
          </p>
          <p className="mt-2 text-sm text-slate-500">Listed by {property.landlord_name ?? 'Landlord'}</p>
        </section>

        {/* Photo Gallery */}
        {images.length > 0 && (
          <section className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm space-y-3">
            {/* Main image */}
            <div
              className="relative w-full overflow-hidden rounded-xl bg-slate-100 cursor-zoom-in"
              style={{ height: '400px' }}
              onClick={() => setLightbox(images[activeIndex].image_url)}
            >
              <Image
                src={images[activeIndex].image_url}
                alt={`${property.title} photo ${activeIndex + 1}`}
                fill
                className="object-cover transition-opacity duration-300"
                sizes="(max-width: 768px) 100vw, 900px"
                priority
              />
              {images[activeIndex].is_primary && (
                <span className="absolute top-3 left-3 rounded-full bg-yellow-400 px-2.5 py-1 text-xs font-semibold text-yellow-900 shadow">
                  ★ Cover Photo
                </span>
              )}
              <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white">
                {activeIndex + 1} / {images.length}
              </span>
              {/* Prev / Next arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={e => { e.stopPropagation(); setActiveIndex(i => (i - 1 + images.length) % images.length) }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white transition"
                  >
                    <svg className="h-4 w-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setActiveIndex(i => (i + 1) % images.length) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white transition"
                  >
                    <svg className="h-4 w-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveIndex(idx)}
                    className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      idx === activeIndex ? 'border-blue-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-90'
                    }`}
                  >
                    <Image
                      src={img.image_url}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

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

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-h-[90vh] max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <Image
              src={lightbox}
              alt="Property photo"
              width={1200}
              height={800}
              className="rounded-2xl object-contain max-h-[85vh] w-full"
            />
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 rounded-full bg-white p-1.5 text-slate-700 shadow-lg hover:bg-slate-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </main>
  )
}