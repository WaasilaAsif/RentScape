import Link from 'next/link'
import Image from 'next/image'

type PropertyCardData = {
  id: string
  title: string
  city: string
  area: string | null
  property_type: string
  min_rent?: number | null
  max_rent?: number | null
}

type PropertyCardProps = {
  property: PropertyCardData
  onClick?: () => void
  href?: string
  coverImage?: string
}

function formatRentRange(min?: number | null, max?: number | null) {
  if (typeof min !== 'number' && typeof max !== 'number') return 'Price on Request'
  if (typeof min === 'number' && typeof max === 'number') {
    return `PKR ${min.toLocaleString()} - ${max.toLocaleString()}`
  }
  const value = (min ?? max ?? 0).toLocaleString()
  return `PKR ${value}`
}

export default function PropertyCard({ property, onClick, href, coverImage }: PropertyCardProps) {
  const card = (
    <article
      onClick={onClick}
      className="cursor-pointer rounded-2xl border border-blue-200/70 bg-white shadow-sm transition hover:border-blue-300 hover:shadow-md overflow-hidden"
    >
      {/* Cover image */}
      <div className="relative h-40 w-full bg-slate-100">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={property.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-center text-xs uppercase tracking-widest text-slate-400 border-b border-slate-200">
            No Photos Yet
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-slate-900">{property.title}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {property.city}
          {property.area ? `, ${property.area}` : ''}
        </p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
            {property.property_type}
          </span>
          <span className="font-semibold text-cyan-700">
            {formatRentRange(property.min_rent, property.max_rent)}
          </span>
        </div>
      </div>
    </article>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    )
  }

  return card
}