/**
 * Static catalog data for the customize guide page.
 * Pure data — no JSX, no animations, no Framer Motion.
 * Easy to swap for CMS-driven data later.
 */

export const SIZES = [
  { name: 'A5', dims: '148 × 210 mm', price: 'Rp35.000', desc: 'Ukuran klasik notebook — pas untuk catatan harian dan planning.' },
  { name: 'B5', dims: '176 × 250 mm', price: 'Rp45.000', desc: 'Lebih lega untuk workbook atau portofolio ringan.' },
  { name: 'A6', dims: '105 × 148 mm', price: 'Rp25.000', desc: 'Mini pocketbook — sempurna untuk journal atau buku harian.' },
] as const;

export const COVERS = [
  { name: 'Matt',    swatch: '#8a8274', texture: 'none',    desc: 'Doff halus, bebas glare, cocok untuk kover minimalis.' },
  { name: 'Glossy',  swatch: '#c8c0a8', texture: 'glossy', desc: 'Kilau subtle yang memberi kesan premium pada warna.' },
  { name: 'Kanvas',  swatch: '#c4b99a', texture: 'linen',   desc: 'Tekstur kain klasik — terasa like linen tote bag.' },
  { name: 'Leather', swatch: '#6b4a35', texture: 'leather', desc: 'Tampilan leatherette elegan untuk koleksi atau gift.' },
] as const;

export const PAPERS = [
  { name: 'Bookpaper', swatch: '#e8dcc8', lines: true,  desc: 'Cream tint, tekstur halus — nyaman untuk baca jangka panjang.' },
  { name: 'HVS',       swatch: '#f8f8f8', lines: false, desc: 'Putih bersih, cocok untuk catatan atau sketch.' },
  { name: 'Art Paper', swatch: '#ffffff', lines: true,  desc: 'Glossy permukaan, terbaik untuk foto dan ilustrasi.' },
  { name: 'Matt',      swatch: '#f0ede8', lines: true,  desc: 'Doff halus, minimize glare, reading-friendly.' },
] as const;

export const EDGES = [
  { name: 'Plain',     swatch: 'bg-brand-200',                                                desc: 'Natural tanpa tambahan — simple dan clean.' },
  { name: 'Emas',      swatch: 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300', desc: 'Foil emas di sisi halaman — signature luxury touch.' },
  { name: 'Perak',     swatch: 'bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300',    desc: 'Silver metallic spray — modern dan understated.' },
  { name: 'Merah',     swatch: 'bg-gradient-to-r from-red-700 via-red-500 to-red-700',       desc: 'Spray merah bold — standout untuk edisi spesial.' },
  { name: 'Biru',      swatch: 'bg-gradient-to-r from-blue-800 via-blue-600 to-blue-800',    desc: 'Deep navy spray — corporate dan profesional.' },
  { name: 'Stenciled', swatch: 'bg-brand-300',                                                desc: 'Pattern berulang di sisi — detail yang terdeteksi.' },
] as const;

export const EXTRAS = [
  { name: 'Headband',    detail: 'Pita tenun di punggung' },
  { name: 'Pita',        detail: 'Penanda halaman satin' },
  { name: 'Dust Jacket', detail: 'Sampul pelindung luar' },
] as const;

export const TOTAL_SECTIONS = '05';