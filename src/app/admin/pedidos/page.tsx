import { createClient } from '@/lib/supabase-server'
import OrderStatusSelect from './OrderStatusSelect'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'En proceso',
  completed: 'Completado',
  cancelled: 'Cancelado',
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function PedidosPage() {
  const supabase = await createClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[#4A1E0A]">Pedidos</h1>
        <p className="text-[#7A3B1E] mt-1">{orders?.length ?? 0} pedidos en total</p>
      </div>

      {!orders?.length ? (
        <div className="bg-white rounded-2xl border border-[#E8D5B5] p-16 text-center text-[#7A3B1E]">
          No hay pedidos registrados aún.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8D5B5] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5ECD7] border-b border-[#E8D5B5]">
                  <th className="text-left px-5 py-3 font-semibold text-[#4A1E0A]">ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#4A1E0A]">Usuario</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#4A1E0A]">Total</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#4A1E0A]">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#4A1E0A]">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-[#E8D5B5] last:border-0 hover:bg-[#FAF3E5] transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-[#7A3B1E]">{order.id.slice(0, 8)}…</td>
                    <td className="px-4 py-4 text-[#4A1E0A]">{order.user_email ?? '—'}</td>
                    <td className="px-4 py-4 text-right font-semibold text-[#4A1E0A]">
                      ${order.total.toLocaleString('es-CL')}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#7A3B1E]">
                      {new Date(order.created_at).toLocaleDateString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
