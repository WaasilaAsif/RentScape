'use client'

import { useEffect, useState } from 'react'
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { Card } from "@/components/ui/Card"
import { Topbar } from "@/components/dashboard/Topbar"

type Profile = {
  id: string
  full_name: string
  email: string
  phone: string | null
  cnic: string | null
  address: string | null
  role: string
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  police_verification_url: string | null
  police_verified: boolean
  created_at: string
}

type Rating = {
  id: string
  reviewer_name: string
  property_title: string | null
  unit_number: string | null
  score: number
  comment: string | null
  created_at: string
}

type RatableItem = {
  lease_id: string
  landlord_id: string
  landlord_name: string
  property_id: string
  property_title: string
  unit_number: string
  end_date: string
  status: string
}

export default function TenantProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [ratings, setRatings] = useState<Rating[]>([])
  const [ratableItems, setRatableItems] = useState<RatableItem[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [givenRatings, setGivenRatings] = useState<any[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalRatings, setTotalRatings] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showRateModal, setShowRateModal] = useState(false)
  const [ratingItem, setRatingItem] = useState<RatableItem | null>(null)
  const [ratingType, setRatingType] = useState<'landlord' | 'property'>('landlord')
  const [ratingForm, setRatingForm] = useState({ score: 5, comment: '' })
  const [submittingRating, setSubmittingRating] = useState(false)

  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    police_verification_url: '',
  })

  async function loadProfile() {
    setLoading(true)
    try {
      const response = await fetch('/api/profile', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to fetch profile')
      const data = await response.json()
      
      setProfile(data.profile)
      setRatings(data.ratings || [])
      setAverageRating(data.average_rating || 0)
      setTotalRatings(data.total_ratings || 0)
      
      setEditForm({
        full_name: data.profile.full_name || '',
        phone: data.profile.phone || '',
        address: data.profile.address || '',
        emergency_contact_name: data.profile.emergency_contact_name || '',
        emergency_contact_phone: data.profile.emergency_contact_phone || '',
        police_verification_url: data.profile.police_verification_url || '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  async function loadRatableLeases() {
    try {
      // Get completed/expired leases for this tenant
      const response = await fetch('/api/leases', { cache: 'no-store' })
      if (!response.ok) return
      
      const data = await response.json()
      const completedLeases = (data.leases || []).filter(
        (l: { status?: string }) => l.status === 'expired' || l.status === 'terminated'
      )
      
      setRatableItems(completedLeases)
    } catch (err) {
      console.error('Failed to load ratable leases:', err)
    }
  }

  async function loadGivenRatings() {
    try {
      const response = await fetch('/api/ratings', { cache: 'no-store' })
      if (!response.ok) return
      
      const data = await response.json()
      setGivenRatings(data.ratings || [])
    } catch (err) {
      console.error('Failed to load given ratings:', err)
    }
  }

  useEffect(() => {
    loadProfile()
    loadRatableLeases()
    loadGivenRatings()
  }, [])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      await loadProfile()
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmitRating() {
    if (!ratingItem) return
    
    setSubmittingRating(true)
    setError(null)
    
    try {
      const targetId = ratingType === 'landlord' ? ratingItem.landlord_id : ratingItem.property_id
      
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lease_id: ratingItem.lease_id,
          target_id: targetId,
          target_type: ratingType,
          score: ratingForm.score,
          comment: ratingForm.comment || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit rating')
      }

      setRatingForm({ score: 5, comment: '' })
      setShowRateModal(false)
      setRatingItem(null)
      await loadGivenRatings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating')
    } finally {
      setSubmittingRating(false)
    }
  }

  function hasRated(leaseId: string, type: 'landlord' | 'property', targetId: string): boolean {
    return givenRatings.some(
      r => r.lease_id === leaseId && r.target_type === type && r.target_id === targetId
    )
  }

  if (loading) {
    return (
      <DashboardShell role="tenant">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
          <div className="mx-auto max-w-7xl px-4">
            <p className="text-slate-600">Loading profile...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  if (!profile) {
    return (
      <DashboardShell role="tenant">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
          <div className="mx-auto max-w-7xl px-4">
            <p className="text-red-600">Profile not found</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="tenant">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar title="My Profile" subtitle="View and manage your account information" />

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-xl bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <Card title="Profile Information">
            {editing ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
                    value={editForm.full_name}
                    onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                  <textarea
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
                    rows={3}
                    value={editForm.address}
                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Emergency Contact Name</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
                    value={editForm.emergency_contact_name}
                    onChange={e => setEditForm({ ...editForm, emergency_contact_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Emergency Contact Phone</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
                    value={editForm.emergency_contact_phone}
                    onChange={e => setEditForm({ ...editForm, emergency_contact_phone: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Police Verification URL</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
                    value={editForm.police_verification_url}
                    onChange={e => setEditForm({ ...editForm, police_verification_url: e.target.value })}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-slate-500 mt-1">Upload your police verification certificate to increase credibility</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Full Name</p>
                  <p className="font-semibold text-slate-900">{profile.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-semibold text-slate-900">{profile.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-semibold text-slate-900">{profile.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">CNIC</p>
                  <p className="font-semibold text-slate-900">{profile.cnic || 'Not provided'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-slate-500">Address</p>
                  <p className="font-semibold text-slate-900">{profile.address || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Emergency Contact</p>
                  <p className="font-semibold text-slate-900">
                    {profile.emergency_contact_name || 'Not provided'}
                    {profile.emergency_contact_phone && ` (${profile.emergency_contact_phone})`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Police Verification</p>
                  {profile.police_verified ? (
                    <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      ✓ Verified
                    </span>
                  ) : profile.police_verification_url ? (
                    <span className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                      Pending Review
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      Not Uploaded
                    </span>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Ratings Received */}
          <Card title="My Ratings" description={`${totalRatings} total reviews • ${averageRating.toFixed(1)} ⭐ average`}>
            {ratings.length === 0 ? (
              <p className="text-slate-600 py-8 text-center">No ratings received yet</p>
            ) : (
              <div className="space-y-4">
                {ratings.map(rating => (
                  <div key={rating.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-slate-900">{rating.reviewer_name}</p>
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
                        <p className="text-2xl font-bold text-yellow-600">
                          {'⭐'.repeat(rating.score)}
                        </p>
                        <p className="text-sm text-slate-500">{rating.score}/5</p>
                      </div>
                    </div>
                    {rating.comment && (
                      <p className="mt-3 text-slate-700 italic">&quot;{rating.comment}&quot;</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Rate Past Leases */}
          {ratableItems.length > 0 && (
            <Card title="Rate Your Past Stays" description="Share your experience with landlords and properties">
              <div className="space-y-3">
                {ratableItems.map(item => (
                  <div key={item.lease_id} className="rounded-xl border border-blue-200 bg-white p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-slate-900">{item.property_title}</p>
                        <p className="text-sm text-slate-600">Unit {item.unit_number}</p>
                        <p className="text-sm text-slate-500">
                          Ended: {new Date(item.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!hasRated(item.lease_id, 'landlord', item.landlord_id) && (
                          <button
                            onClick={() => {
                              setRatingItem(item)
                              setRatingType('landlord')
                              setShowRateModal(true)
                            }}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            Rate Landlord
                          </button>
                        )}
                        {!hasRated(item.lease_id, 'property', item.property_id) && (
                          <button
                            onClick={() => {
                              setRatingItem(item)
                              setRatingType('property')
                              setShowRateModal(true)
                            }}
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                          >
                            Rate Property
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Ratings I Gave */}
          {givenRatings.length > 0 && (
            <Card title="Ratings I've Given" description={`${givenRatings.length} reviews`}>
              <div className="space-y-3">
                {givenRatings.map(rating => (
                  <div key={rating.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {rating.target_name} ({rating.target_type})
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

      {/* Rating Modal */}
      {showRateModal && ratingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Rate {ratingType === 'landlord' ? ratingItem.landlord_name : ratingItem.property_title}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRatingForm({ ...ratingForm, score: star })}
                      className={`text-3xl ${star <= ratingForm.score ? 'text-yellow-500' : 'text-slate-300'}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Comment (optional)</label>
                <textarea
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
                  rows={4}
                  value={ratingForm.comment}
                  onChange={e => setRatingForm({ ...ratingForm, comment: e.target.value })}
                  placeholder="Share your experience..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRateModal(false)
                    setRatingItem(null)
                    setRatingForm({ score: 5, comment: '' })
                  }}
                  className="flex-1 rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRating}
                  disabled={submittingRating}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submittingRating ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}