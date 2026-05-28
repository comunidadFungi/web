import { createClient } from '@/lib/supabase-server'
import { CheckCircle, XCircle } from '@phosphor-icons/react/dist/ssr'

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: docs } = await supabase
    .from('user_documents')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[#4A1E0A]">Usuarios</h1>
        <p className="text-[#7A3B1E] mt-1">{docs?.length ?? 0} usuarios con documentos enviados</p>
      </div>

      {!docs?.length ? (
        <div className="bg-white rounded-2xl border border-[#E8D5B5] p-16 text-center text-[#7A3B1E]">
          No hay usuarios con documentos enviados aún.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8D5B5] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5ECD7] border-b border-[#E8D5B5]">
                  <th className="text-left px-5 py-3 font-semibold text-[#4A1E0A]">Usuario</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#4A1E0A]">CI</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#4A1E0A]">Receta</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#4A1E0A]">Certificado</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#4A1E0A]">Verificado</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#4A1E0A]">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {docs.map(doc => (
                  <tr key={doc.id} className="border-b border-[#E8D5B5] last:border-0 hover:bg-[#FAF3E5] transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-[#7A3B1E]">{doc.user_id.slice(0, 12)}…</td>
                    <td className="px-4 py-4 text-center">
                      <DocIcon url={doc.ci_url} />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <DocIcon url={doc.prescription_url} />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <DocIcon url={doc.certificate_url} />
                    </td>
                    <td className="px-4 py-4 text-center">
                      {doc.verified
                        ? <CheckCircle weight="fill" size={20} className="text-green-500 mx-auto" />
                        : <XCircle weight="fill" size={20} className="text-[#C8923A] mx-auto" />
                      }
                    </td>
                    <td className="px-4 py-4 text-[#7A3B1E]">
                      {new Date(doc.created_at).toLocaleDateString('es-CL')}
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

function DocIcon({ url }: { url: string | null }) {
  if (!url) return <XCircle weight="fill" size={18} className="text-[#E8D5B5] mx-auto" />
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title="Ver documento">
      <CheckCircle weight="fill" size={18} className="text-green-500 mx-auto hover:scale-110 transition-transform" />
    </a>
  )
}
