'use client'

export default function AdminError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0E6D0] p-8">
      <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-2xl w-full shadow">
        <h2 className="text-xl font-bold text-red-700 mb-2">Error en el panel admin</h2>
        <p className="text-sm text-gray-600 mb-4">{error.message}</p>
        {error.digest && (
          <p className="text-xs text-gray-400">Digest: {error.digest}</p>
        )}
        <pre className="text-xs bg-gray-50 rounded p-3 overflow-auto max-h-48 text-gray-700">
          {error.stack}
        </pre>
      </div>
    </div>
  )
}
