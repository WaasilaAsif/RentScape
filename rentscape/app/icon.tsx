import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0474c4 0%, #4f46e5 100%)',
          color: '#ffffff',
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '-0.04em',
        }}
      >
        RS
      </div>
    ),
    size
  )
}
