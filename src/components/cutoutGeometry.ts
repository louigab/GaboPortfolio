export type CutoutTapePreset =
  | 'top'
  | 'corners'
  | 'left-corners'
  | 'right-corners'
  | 'portrait'
  | 'mixed-top'
  | 'mixed-corners'
  | 'red-corners'
  | 'none'

export interface InspectablePhoto {
  src: string
  title?: string
  caption?: string
  link?: string
  tilt?: number
  variant?: 'default' | 'portrait' | 'shredded'
  tapePosition?: CutoutTapePreset
  badge?: string
  stampRotate?: number
}

// Realistic paper cutout with slightly rough cut sides/top and ragged torn bottom edge
export const REALISTIC_TORN_POLYGONS = [
  '2,3 38,1.5 79,2.5 124,1 165,2.5 198,2 199,52 197.5,108 199,164 198,189 185,194 171,189 156,196 140,190 123,197 106,191 89,198 72,191 55,197 38,191 21,196 4,190 1.5,142 2.5,88 1,36',
  '1.5,2.5 42,1 88,3 134,1.5 174,3 198.5,2 197.5,58 199,116 197.5,172 198.5,191 184,196 168,190 151,197 134,191 117,198 99,191 82,197 65,190 48,197 31,190 15,196 2,191 2.5,138 1,78',
]

// Extra-ragged top & bottom torn certificate/newspaper cutout
export const SHREDDED_TORN_POLYGON =
  '3,6 18,2 34,7 52,2 71,6 90,1 110,6 129,2 148,6 167,2 184,6 198,3 196,48 199,96 196,144 198,191 183,196 167,191 150,197 132,191 114,198 96,191 78,197 60,191 42,197 24,191 6,195 2,146 4,94 1,42'

// Angled corner-cut portrait backing matching Page 1 reference
export const PORTRAIT_TORN_POLYGON =
  '34,5 68,2 104,4 138,2 166,14 188,42 195,88 198,142 199,182 176,191 148,188 118,195 88,190 58,196 32,190 12,186 15,138 10,88 14,44'

export function getCutoutPolygon(src: string, variant?: 'default' | 'portrait' | 'shredded') {
  if (variant === 'portrait') return PORTRAIT_TORN_POLYGON
  if (variant === 'shredded') return SHREDDED_TORN_POLYGON
  return REALISTIC_TORN_POLYGONS[src.length % REALISTIC_TORN_POLYGONS.length]
}
