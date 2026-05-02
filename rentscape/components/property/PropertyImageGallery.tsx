'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

type PropertyImage = {
  id: string
  property_id: string
  image_url: string
  is_primary: boolean
  created_at: string
}

type Props = {
  propertyId: string
}

export function PropertyImageGallery({ propertyId }: Props) {
  const [images, setImages] = useState<PropertyImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function loadImages() {
    try {
      const res = await fetch(`/api/properties/${propertyId}/images`)
      const data = await res.json()
      setImages(Array.isArray(data.images) ? data.images : [])
    } catch {
      setError('Failed to load images.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadImages()
  }, [propertyId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)

    const isFirstImage = images.length === 0

    try {
      // Upload all selected files sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        // Make first uploaded image primary if no images exist yet
        if (isFirstImage && i === 0) formData.append('is_primary', 'true')

        const res = await fetch(`/api/properties/${propertyId}/images`, {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.error || `Failed to upload ${file.name}`)
        }
      }

      await loadImages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(imageId: string) {
    if (!confirm('Delete this image?')) return
    setError(null)
    try {
      const res = await fetch(`/api/properties/${propertyId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_id: imageId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Delete failed')
      }
      setImages(prev => prev.filter(img => img.id !== imageId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  async function handleSetPrimary(imageId: string) {
    setError(null)
    try {
      const res = await fetch(`/api/properties/${propertyId}/images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_id: imageId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to set primary')
      }
      setImages(prev =>
        prev.map(img => ({ ...img, is_primary: img.id === imageId }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set primary')
    }
  }

  const primaryImage = images.find(img => img.is_primary)
  const otherImages = images.filter(img => !img.is_primary)

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {uploading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload Images
            </>
          )}
        </button>
        <p className="text-xs text-slate-500">JPEG, PNG, WebP or GIF — max 5 MB each</p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading images...</p>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 py-12 text-center">
          <svg className="h-10 w-10 text-blue-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium text-slate-600">No images yet</p>
          <p className="text-xs text-slate-400 mt-1">Upload photos to showcase this property</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Primary image — large */}
          {primaryImage && (
            <div className="group relative overflow-hidden rounded-2xl border border-blue-200 bg-slate-100">
              <div className="relative h-64 sm:h-80 w-full">
                <Image
                  src={primaryImage.image_url}
                  alt="Primary property photo"
                  fill
                  className="object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                  onClick={() => setLightbox(primaryImage.image_url)}
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
              <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-yellow-400 px-2.5 py-1 text-xs font-semibold text-yellow-900 shadow">
                ★ Cover Photo
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDelete(primaryImage.id)}
                  className="rounded-full bg-white/90 p-1.5 text-red-500 shadow hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Other images — grid */}
          {otherImages.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {otherImages.map(img => (
                <div key={img.id} className="group relative overflow-hidden rounded-xl border border-blue-100 bg-slate-100 aspect-square">
                  <Image
                    src={img.image_url}
                    alt="Property photo"
                    fill
                    className="object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                    onClick={() => setLightbox(img.image_url)}
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  {/* Action overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-center pb-2 gap-1.5 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleSetPrimary(img.id)}
                      className="rounded-lg bg-yellow-400 px-2 py-1 text-xs font-semibold text-yellow-900 shadow hover:bg-yellow-300 transition-colors"
                      title="Set as cover"
                    >
                      ★ Cover
                    </button>
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-red-500 shadow hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-400">
            {images.length} photo{images.length !== 1 ? 's' : ''} • Hover over a photo to set it as cover or delete it
          </p>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
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
    </div>
  )
}