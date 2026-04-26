/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { Card } from "@/components/ui/Card"
import { Topbar } from "@/components/dashboard/Topbar"
import { RatingCard } from "@/components/dashboard/RatingCard"

type RatableItem = {
  lease_id: string
  target_id: string
  target_name: string
  target_type: 'landlord' | 'property'| 'tenant'
  property_title?: string
  unit_number?: string
  end_date: string
}

export default function TenantRatingsPage() {
  const [ratableLandlords, setRatableLandlords] = useState<RatableItem[]>([])
  const [ratableProperties, setRatableProperties] = useState<RatableItem[]>([])
  const [givenRatings, setGivenRatings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function loadRatableItems() {
    try {
      const response = await fetch('/api/leases?status=expired,terminated', { cache: 'no-store' })
      if (!response.ok) return
      
      const data = await response.json()
      
      // Get already rated items
      const ratingsResponse = await fetch('/api/ratings', { cache: 'no-store' })
      const ratingsData = ratingsResponse.ok ? await ratingsResponse.json() : { ratings: [] }
      
      const ratedLandlordIds = new Set(
        ratingsData.ratings
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((r: any) => r.target_type === 'landlord')
          .map((r: any) => `${r.lease_id}-${r.target_id}`)
      )
      
      const ratedPropertyIds = new Set(
        ratingsData.ratings
          .filter((r: any) => r.target_type === 'property')
          .map((r: any) => `${r.lease_id}-${r.target_id}`)
      )
      
      // Transform for landlord ratings
      const landlords = data.leases
        .filter((lease: any) => !ratedLandlordIds.has(`${lease.id}-${lease.landlord_id}`))
        .map((lease: any) => ({
          lease_id: lease.id,
          target_id: lease.landlord_id,
          target_name: lease.landlord_name,
          target_type: 'landlord' as const,
          property_title: lease.property_title,
          unit_number: lease.unit_number,
          end_date: lease.end_date,
        }))
      
      // Transform for property ratings
      const properties = data.leases
        .filter((lease: any) => !ratedPropertyIds.has(`${lease.id}-${lease.property_id}`))
        .map((lease: any) => ({
          lease_id: lease.id,
          target_id: lease.property_id,
          target_name: lease.property_title,
          target_type: 'property' as const,
          unit_number: lease.unit_number,
          end_date: lease.end_date,
        }))
      
      setRatableLandlords(landlords)
      setRatableProperties(properties)
      setGivenRatings(ratingsData.ratings || [])
    } catch (err) {
      console.error('Failed to load ratable items:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRatableItems()
  }, [])

  async function handleRate(item: RatableItem, score: number, comment: string) {
    const response = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lease_id: item.lease_id,
        target_id: item.target_id,
        target_type: item.target_type,
        score,
        comment: comment || undefined,
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to submit rating')
    }

    await loadRatableItems()
  }

  if (loading) {
    return (
      <DashboardShell role="tenant">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
          <div className="mx-auto max-w-7xl px-4">
            <p className="text-slate-600">Loading ratings...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="tenant">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar title="Ratings & Reviews" subtitle="Rate your past experiences and view your reviews" />

          {ratableLandlords.length > 0 && (
            <RatingCard
              items={ratableLandlords}
              onRate={handleRate}
              title="Rate Your Landlords"
              description="Share your experience with past landlords"
            />
          )}

          {ratableProperties.length > 0 && (
            <RatingCard
              items={ratableProperties}
              onRate={handleRate}
              title="Rate Properties"
              description="Help others by rating the properties you've lived in"
            />
          )}

          {ratableLandlords.length === 0 && ratableProperties.length === 0 && (
            <Card title="No Pending Ratings">
              <p className="text-slate-600 py-8 text-center">
                You don&apos;t have any completed leases to rate yet. Ratings become available after your lease ends.
              </p>
            </Card>
          )}

          {givenRatings.length > 0 && (
            <Card title="Ratings I've Given" description={`${givenRatings.length} reviews`}>
              <div className="space-y-3">
                {givenRatings.map(rating => (
                  <div key={rating.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {rating.target_name} <span className="text-sm text-slate-500">({rating.target_type})</span>
                        </p>
                        {rating.property_title && (
                          <p className="text-sm text-slate-600">
                            {rating.property_title} • Unit {rating.unit_number}
                          </p>
                        )}
                        <p className="text-sm text-slate-500 mt-1">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-yellow-600">
                          {'⭐'.repeat(rating.score)}
                        </p>
                        <p className="text-xs text-slate-500">{rating.score}/5</p>
                      </div>
                    </div>
                    {rating.comment && (
                      <p className="mt-2 text-sm text-slate-700 italic">&quot;{rating.comment}&quot;</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}