import Link from 'next/link'

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
}

function formatRentRange(min?: number | null, max?: number | null) {
  if (typeof min !== 'number' && typeof max !== 'number') return 'Price on Request'
  if (typeof min === 'number' && typeof max === 'number') {
    return `PKR ${min.toLocaleString()} - ${max.toLocaleString()}`
  }
  const value = (min ?? max ?? 0).toLocaleString()
  return `PKR ${value}`
}

export default function PropertyCard({ property, onClick, href }: PropertyCardProps) {
  const card = (
    <article
      onClick={onClick}
      className="cursor-pointer rounded-2xl border border-blue-200/70 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
    >
      <div className="mb-4 grid h-32 w-full place-items-center rounded-xl border border-slate-200 bg-slate-100 text-center text-xs uppercase tracking-widest text-slate-500">
        Image Placeholder
      </div>
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
