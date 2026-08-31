export const metadata = { title: 'Sin conexión — Comunidad Fungi' }

export default function OfflinePage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-md text-center">
        <p className="text-5xl mb-4">🍄</p>
        <h1 className="font-display text-2xl font-bold text-[#4A1E0A] mb-3">Sin conexión</h1>
        <p className="text-[#7A3B1E] text-sm leading-relaxed">
          No hay conexión a internet en este momento. Los datos del dispensario no se guardan en
          el dispositivo a propósito, para que nunca veas stock ni dosis desactualizados.
        </p>
        <p className="text-[#7A3B1E] text-sm mt-3">
          Vuelve a intentarlo cuando recuperes la señal.
        </p>
      </div>
    </div>
  )
}
