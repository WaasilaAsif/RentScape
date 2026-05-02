'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'

type RatableItem = {
  lease_id: string
  target_id: string
  target_name: string
  target_type: 'landlord' | 'property' | 'tenant'
  property_title?: string
  unit_number?: string
  end_date: string
}

type Props = {
  items: RatableItem[]
  onRate: (item: RatableItem, score: number, comment: string) => Promise<void>
  title: string
  description: string
}

export function RatingCard({ items, onRate, title, description }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [currentItem, setCurrentItem] = useState<RatableItem | null>(null)
  const [score, setScore] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [hoverScore, setHoverScore] = useState(0)

  async function handleSubmit() {
    if (!currentItem) return
    
    setSubmitting(true)
    try {
      await onRate(currentItem, score, comment)
      setShowModal(false)
      setCurrentItem(null)
      setScore(5)
      setComment('')
    } catch (err) {
      console.error('Failed to submit rating:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return null
  }

  return (
    <>
      <Card title={title} description={description}>
        <div className="space-y-3">
          {items.map(item => (
            <div key={`${item.lease_id}-${item.target_id}`} className="rounded-xl border border-blue-200 bg-white p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-slate-900">{item.target_name}</p>
                  {item.property_title && (
                    <p className="text-sm text-slate-600">
                      {item.property_title} • Unit {item.unit_number}
                    </p>
                  )}
                  <p className="text-sm text-slate-500">
                    Ended: {new Date(item.end_date).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCurrentItem(item)
                    setShowModal(true)
                  }}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Rate {item.target_type === 'landlord' ? 'Landlord' : item.target_type === 'property' ? 'Property' : 'Tenant'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal */}
      {showModal && currentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Rate {currentItem.target_name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
                <div className="flex gap-2" onMouseLeave={() => setHoverScore(0)}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setScore(star)}
                      onMouseEnter={() => setHoverScore(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-8 h-8"
                        fill={star <= (hoverScore || score) ? '#eab308' : 'none'}
                        stroke={star <= (hoverScore || score) ? '#eab308' : '#cbd5e1'}
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 0-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Comment (optional)</label>
                <textarea
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
                  rows={4}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Share your experience..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setCurrentItem(null)
                    setScore(5)
                    setComment('')
                  }}
                  className="flex-1 rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}