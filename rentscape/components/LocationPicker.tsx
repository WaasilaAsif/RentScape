'use client'

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { useState } from 'react'
import type { LatLngExpression } from 'leaflet'
import L from 'leaflet'

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})
function ClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

interface LocationPickerProps {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
}

export default function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const [marker, setMarker] = useState<LatLngExpression>([lat, lng])

  function handleSelect(lat: number, lng: number) {
    const pos: LatLngExpression = [lat, lng]
    setMarker(pos)
    onChange(lat, lng)
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-600">Click on the map to set the property location</p>
      <MapContainer
        key="location-picker"
        center={[lat, lng] as LatLngExpression}
        zoom={13}
        style={{ height: '300px', width: '100%', borderRadius: '12px' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler onSelect={handleSelect} />
        <Marker position={marker} />
      </MapContainer>
      <p className="text-xs text-slate-500">
        Selected: {Array.isArray(marker) ? `${(marker as number[])[0].toFixed(5)}, ${(marker as number[])[1].toFixed(5)}` : ''}
      </p>
    </div>
  )
}