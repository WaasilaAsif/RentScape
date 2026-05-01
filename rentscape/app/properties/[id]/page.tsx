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
  landlord_phone?: string
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

type Review = {
  id: string
  reviewer_name: string
  score: number        // 1–5
  comment: string | null
  created_at: string
}

type RatingsData = {
  average_rating: number
  total_reviews: number
  reviews: Review[]
}

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <svg
          key={star}
          className={`${sizeClass} ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-slate-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
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

export default function PropertyDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id
  const [property, setProperty] = useState<PropertyDetails | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [amenities, setAmenities] = useState<string[]>([])
  const [images, setImages] = useState<PropertyImage[]>([])
  const [ratings, setRatings] = useState<RatingsData | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      const [propRes, imgRes, ratingsRes] = await Promise.all([
        fetch(`/api/properties/${id}`, { cache: 'no-store' }),
        fetch(`/api/properties/${id}/images`, { cache: 'no-store' }),
        fetch(`/api/properties/${id}/ratings`, { cache: 'no-store' }),
      ])
      const propData = await propRes.json()
      const imgData = await imgRes.json()
      const ratingsData = await ratingsRes.json()
      if (!cancelled) {
        setProperty(propData.property ?? null)
        setUnits(Array.isArray(propData.units) ? propData.units : [])
        setAmenities(Array.isArray(propData.amenities) ? propData.amenities : [])
        const imgs: PropertyImage[] = Array.isArray(imgData.images) ? imgData.images : []
        setImages(imgs)
        const primaryIdx = imgs.findIndex(img => img.is_primary)
        setActiveIndex(primaryIdx >= 0 ? primaryIdx : 0)
        setRatings(ratingsData ?? null)
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

  // Count per star for breakdown bars
  const starCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: ratings?.reviews.filter(r => Math.round(r.score) === star).length ?? 0,
  }))

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
          {/* Inline rating badge under the subtitle */}
          {ratings && ratings.total_reviews > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <StarRating rating={ratings.average_rating} size="sm" />
              <span className="text-sm font-medium text-slate-700">{ratings.average_rating.toFixed(1)}</span>
              <span className="text-sm text-slate-400">({ratings.total_reviews} review{ratings.total_reviews !== 1 ? 's' : ''})</span>
            </div>
          )}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <svg className="h-5 w-5 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
            </svg>
            <p className="text-sm text-slate-600">
              Interested in renting? Contact <span className="font-medium text-slate-800">{property.landlord_name ?? 'the landlord'}</span> on{' '}
              <a href={`tel:${property.landlord_phone}`} className="font-semibold text-blue-700 hover:underline">
                {property.landlord_phone ?? 'number not available'}
              </a>
            </p>
          </div>
        </section>

        {/* Photo Gallery */}
        {images.length > 0 && (
          <section className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm space-y-3">
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

        {/* Ratings & Reviews */}
        <section className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm space-y-6">
          <h2 className="text-xl font-semibold text-slate-900">Ratings & Reviews</h2>

          {!ratings || ratings.total_reviews === 0 ? (
            <p className="text-slate-500">No reviews yet for this property.</p>
          ) : (
            <>
              {/* Summary row */}
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                {/* Big average score */}
                <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 px-8 py-6 text-center shrink-0">
                  <span className="text-5xl font-bold text-slate-900">{ratings.average_rating.toFixed(1)}</span>
                  <StarRating rating={ratings.average_rating} size="lg" />
                  <span className="mt-1 text-sm text-slate-500">{ratings.total_reviews} review{ratings.total_reviews !== 1 ? 's' : ''}</span>
                </div>

                {/* Breakdown bars */}
                <div className="flex-1 space-y-2 py-2">
                  {starCounts.map(({ star, count }) => (
                    <RatingBar key={star} label={String(star)} count={count} total={ratings.total_reviews} />
                  ))}
                </div>
              </div>

              {/* Individual reviews */}
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
            </>
          )}
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