import { Product } from '@/types'

export const products: Product[] = [
  // --- MICRODOSIS ---
  {
    id: '1',
    slug: 'microdosis-01',
    name: 'Cápsulas Microdosis 0,1 gr',
    description: 'Cápsulas de microdosis de 0,1 gr. Ideal para comenzar. A pedido según receta médica.',
    longDescription: 'Nuestras cápsulas de microdosis de 0,1 gr son la opción de entrada para quienes inician su proceso terapéutico con psilocibina. Cada cápsula contiene 0,1 gramos de hongo medicinal deshidratado y molido, asegurando una dosificación exacta y consistente. Producidas bajo estrictos protocolos de calidad y pureza.',
    price: 55000,
    image: '/images/productos/microdosis-01.webp',
    images: ['/images/productos/microdosis-01.webp'],
    category: 'Microdosis',
    access: 'public',
    stock: 50,
    requiresPrescription: true,
    features: ['Dosificación exacta 0,1 gr', 'Hongo deshidratado y molido', 'Apto para principiantes', 'A pedido con receta médica'],
    variants: [
      { id: 'micro-01-30', label: '30 unidades', price: 55000 },
      { id: 'micro-01-60', label: '60 unidades', price: 102000 },
    ],
  },
  {
    id: '2',
    slug: 'microdosis-02',
    name: 'Cápsulas Microdosis 0,2 gr',
    description: 'Cápsulas de microdosis de 0,2 gr. Mayor intensidad para protocolos avanzados. A pedido según receta médica.',
    longDescription: 'Las cápsulas de microdosis de 0,2 gr están indicadas para quienes ya han experimentado con la dosis de 0,1 gr y buscan una mayor profundidad en su proceso. Cada cápsula contiene 0,2 gramos de hongo medicinal deshidratado, producidas con los mismos estándares de pureza y precisión.',
    price: 64000,
    image: '/images/productos/microdosis-02.webp',
    images: ['/images/productos/microdosis-02.webp'],
    category: 'Microdosis',
    access: 'public',
    stock: 50,
    requiresPrescription: true,
    features: ['Dosificación exacta 0,2 gr', 'Hongo deshidratado y molido', 'Protocolo avanzado', 'A pedido con receta médica'],
    variants: [
      { id: 'micro-02-30', label: '30 unidades', price: 64000 },
      { id: 'micro-02-60', label: '60 unidades', price: 120000 },
    ],
  },

  // --- HONGOS SECOS (Macrodosis) ---
  {
    id: '3',
    slug: 'hongos-iceberg',
    name: 'Hongos Secos — Iceberg',
    description: 'Cepa visual e introspectiva. Carga mental profunda con claridad fría. Ideal para creatividad. Requiere receta médica.',
    longDescription: 'Iceberg es una variante albina muy visual e introspectiva. Se destaca por una carga mental profunda pero con una "claridad" fría (de ahí su nombre), ideal para potenciar la creatividad sin tanto agobio físico. Una de las cepas más valoradas por quienes buscan introspección con foco mental.',
    price: 22000,
    image: '/images/productos/hongos-iceberg.webp',
    images: ['/images/productos/hongos-iceberg.webp'],
    category: 'Macrodosis',
    access: 'public',
    stock: 30,
    requiresPrescription: true,
    features: ['Alta creatividad', 'Claridad mental', 'Cepa albina visual', 'Requiere receta médica'],
    variants: [
      { id: 'iceberg-2g', label: '2 gr', price: 22000 },
      { id: 'iceberg-5g', label: '5 gr', price: 45000 },
    ],
    effectsTable: { mental: 4, corporal: 3, estimulante: 2, creatividad: 5, disolucion: 4 },
  },
  {
    id: '4',
    slug: 'hongos-dcmac350',
    name: 'Hongos Secos — DC Mac350',
    description: 'Variante de alta potencia. Mayor concentración de alcaloides. Disolución del yo intensa. Requiere receta médica.',
    longDescription: 'DC Mac350 es una joya de potencia. Al ser una variante de Penis Envy, suele tener concentraciones de alcaloides mucho más altas. Es la que más probablemente te lleve a una disolución del yo rápida si no se respeta la dosis. Se recomienda experiencia previa y acompañamiento profesional.',
    price: 22000,
    image: '/images/productos/hongos-dcmac350.webp',
    images: ['/images/productos/hongos-dcmac350.webp'],
    category: 'Macrodosis',
    access: 'public',
    stock: 30,
    requiresPrescription: true,
    features: ['Alta concentración de alcaloides', 'Disolución del yo profunda', 'Requiere experiencia previa', 'Requiere receta médica'],
    variants: [
      { id: 'dcmac-2g', label: '2 gr', price: 22000 },
      { id: 'dcmac-5g', label: '5 gr', price: 45000 },
    ],
    effectsTable: { mental: 5, corporal: 4, estimulante: 3, creatividad: 4, disolucion: 5 },
  },

  // --- ACEITES SUBLINGUALES ---
  {
    id: '7',
    slug: 'aceite-cbd-sublingual',
    name: 'Aceite CBD Sublingual 1.000 mg',
    description: 'Aceite CBD sublingual de 1.000 mg. Calidad garantizada, dosificación precisa.',
    longDescription: 'Aceite CBD sublingual de alta calidad con 1.000 mg de CBD. Formulado para uso sublingual, permite una absorción rápida y eficiente. Ideal como complemento en protocolos terapéuticos. Disponible en presentaciones de 15 ml y 30 ml.',
    price: 25000,
    image: '/images/productos/aceite-cbd.webp',
    images: ['/images/productos/aceite-cbd.webp'],
    category: 'Aceites',
    access: 'public',
    stock: 40,
    requiresPrescription: false,
    features: ['1.000 mg CBD', 'Uso sublingual', 'Absorción rápida', 'Calidad garantizada'],
    variants: [
      { id: 'cbd-15ml', label: '15 ml', price: 25000 },
      { id: 'cbd-30ml', label: '30 ml', price: 45000 },
    ],
  },
]

export function getProductBySlug(slug: string): Product | undefined {
  return products.find(p => p.slug === slug)
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(price)
}
