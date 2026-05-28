'use client'

import { Product } from '@/types'
import ProductCard from './ProductCard'

export default function HomeProducts({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map(p => (
        <ProductCard key={p.id} product={p} isLoggedIn={false} />
      ))}
    </div>
  )
}
