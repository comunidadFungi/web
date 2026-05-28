import Link from 'next/link'
import { CheckCircle, Storefront, House } from '@phosphor-icons/react/dist/ssr'

export default function SuccessPage({ searchParams }: { searchParams: { order?: string } }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <CheckCircle weight="fill" size={80} className="text-[#6B8F71] mx-auto mb-6" />
        <h1 className="font-display text-3xl font-bold text-[#4A1E0A] mb-3">¡Pago exitoso!</h1>
        {searchParams.order && (
          <p className="text-[#7A3B1E] text-sm mb-2">Orden: <strong>{searchParams.order}</strong></p>
        )}
        <p className="text-[#7A3B1E] mb-8 leading-relaxed">
          Tu pedido fue procesado correctamente. Te enviaremos un correo con los detalles y despacho.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/productos" className="flex items-center justify-center gap-2 bg-[#C4513A] text-white px-8 py-3 rounded-full hover:bg-[#A83D28] transition-colors">
            <Storefront weight="fill" size={18} />
            Seguir comprando
          </Link>
          <Link href="/" className="flex items-center justify-center gap-2 border border-[#4A1E0A] text-[#4A1E0A] px-8 py-3 rounded-full hover:bg-[#4A1E0A] hover:text-[#F5ECD7] transition-colors">
            <House weight="fill" size={18} />
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
