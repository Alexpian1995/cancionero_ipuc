import { createClient } from '@/lib/supabase/server'
import { CancionViewer } from '@/components/canciones/CancionViewer'
import { ArrowLeftIcon, PencilSquareIcon, UserIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function CancionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // ✅ ¿Hay sesión? (server-side)
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Botón Volver y Acciones */}
      <div className="flex items-center justify-between">
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

      {/* Cabecera de la Canción */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-[#1B5FA8] uppercase tracking-wider">
            {cancion.libro || 'Cancionero IPUC'}
          </span>
          <h1 className="font-display text-2xl font-bold text-[#0F2C4C] mt-1">
            {cancion.titulo}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {cancion.tonalidad && (
            <div className="text-center px-4 py-2 rounded-xl bg-[#0F2C4C]/5 border border-[#0F2C4C]/10">
              <span className="block text-[10px] uppercase font-semibold text-slate-400">Tono</span>
              <span className="text-base font-bold text-[#0F2C4C]">{cancion.tonalidad}</span>
            </div>
          )}
          {cancion.tempo && (
            <div className="text-center px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">
              <span className="block text-[10px] uppercase font-semibold text-slate-400">Tempo</span>
              <span className="text-sm font-semibold capitalize text-slate-700">{cancion.tempo}</span>
            </div>
          )}
        </div>
      </div>

      {/* Visor de Letra con Selector de Modo y Transposición */}
      <CancionViewer cancion={cancion} />
    </div>
  )
}