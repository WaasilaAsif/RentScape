'use client'

import { useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export type MapMarker = {
  id: string
  title: string
  lat: number
  lng: number
}

type PropertyMapProps = {
  center: [number, number]
  markers: MapMarker[]
  zoom?: number
  onMarkerClick?: (marker: MapMarker) => void
  onMapClick?: (lat: number, lng: number) => void
  heightClassName?: string
}

function MapClickHandler({
  onMapClick,
  onSetTemporaryMarker,
}: {
  onMapClick?: (lat: number, lng: number) => void
  onSetTemporaryMarker: (position: [number, number]) => void
}) {
  useMapEvents({
    click: event => {
      const position: [number, number] = [event.latlng.lat, event.latlng.lng]
      onSetTemporaryMarker(position)
      onMapClick?.(position[0], position[1])
    },
  })

  return null
}

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export default function PropertyMap({
  center,
  markers,
  zoom = 12,
  onMarkerClick,
  onMapClick,
  heightClassName = 'h-[320px]',
}: PropertyMapProps) {
  const [temporaryMarker, setTemporaryMarker] = useState<[number, number] | null>(null)

  const safeCenter = useMemo<[number, number]>(() => {
    if (!Number.isFinite(center[0]) || !Number.isFinite(center[1])) {
      return [33.6844, 73.0479]
    }
    return center
  }, [center])

  return (
    <div className={`${heightClassName} w-full overflow-hidden rounded-2xl border border-white/15`}>
      <MapContainer center={safeCenter} zoom={zoom} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onMapClick ? <MapClickHandler onMapClick={onMapClick} onSetTemporaryMarker={setTemporaryMarker} /> : null}
        {markers.map(marker => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={markerIcon}
            eventHandlers={{
              click: () => onMarkerClick?.(marker),
            }}
          >
            <Popup>{marker.title}</Popup>
          </Marker>
        ))}
        {temporaryMarker ? (
          <Marker position={temporaryMarker} icon={markerIcon}>
            <Popup>Selected location</Popup>
          </Marker>
        ) : null}
      </MapContainer>
    </div>
  )
}
