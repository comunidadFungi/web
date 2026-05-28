export interface ProductVariant {
  id: string
  label: string
  price: number
}

export interface Product {
  id: string
  name: string
  description: string
  longDescription?: string
  price: number
  image: string
  images?: string[]
  category: string
  access: 'public' | 'members'
  stock: number
  slug: string
  features?: string[]
  variants?: ProductVariant[]
  requiresPrescription?: boolean
  effectsTable?: StrainEffect
}

export interface StrainEffect {
  mental: number
  corporal: number
  estimulante: number
  creatividad: number
  disolucion: number
}

export interface CartItem extends Product {
  quantity: number
  selectedVariant?: ProductVariant
}
