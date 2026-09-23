import { createClient } from '@/lib/supabase/server'
import { CancionViewer } from '@/components/canciones/CancionViewer'
import { ArrowLeftIcon, PencilSquareIcon, UserIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function DetalleCancionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // ✅ Verificar sesión en el servidor
  const { data: { user } } = await supabase.auth.getUser()

  const { data: cancion, error } = await supabase
    .from('canciones')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !cancion) {
    notFound()
  }

  return (
    <main className="max-w-6xl mx-auto py-6 px-4">
      {/* Header con navegación y acciones */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0F2C4C] transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver al directorio
        </Link>

        {user ? (
          <Link
            href={`/admin/editar/${cancion.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-[#0F2C4C] hover:bg-slate-200 transition-colors"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Editar Canción
          </Link>
        ) : (
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-[#0F2C4C] hover:bg-slate-200 transition-colors"
          >
            <UserIcon className="h-4 w-4" />
            Iniciar Sesión
          </Link>
        )}
      </div>

      <CancionViewer cancion={cancion} />
    </main>
  )
}