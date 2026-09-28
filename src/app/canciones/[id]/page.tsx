import { createClient } from '@/lib/supabase/server'
import { CancionViewer } from '@/components/canciones/CancionViewer'
import { ArrowLeftIcon, PencilSquareIcon, UserIcon, LockClosedIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// Estados legales que permiten mostrar el contenido
const ESTADOS_PUBLICOS = ['dominio_publico', 'permiso_escrito', 'licencia']

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

  const estado = cancion.estado_legal || 'pendiente'
  const esPublicaLegal = ESTADOS_PUBLICOS.includes(estado)

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

      {/* Cabecera de la Canción (pública: título, tono, tempo, libro) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-[#1B5FA8] uppercase tracking-wider">
            {cancion.libro || 'Cancionero IPUC'}
          </span>
          <h1 className="font-display text-2xl font-bold text-[#0F2C4C] mt-1">
            {cancion.titulo}
          </h1>

          {/* ⚖️ Badge de estado legal */}
          {user && (
            <div className="mt-2">
              {esPublicaLegal ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  <ShieldCheckIcon className="w-3 h-3" />
                  {estado === 'dominio_publico' ? 'Dominio público' : estado === 'permiso_escrito' ? 'Permiso del autor' : 'Con licencia'}
                </span>
              ) : estado === 'no_publicar' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                  <ExclamationTriangleIcon className="w-3 h-3" />
                  No publicar públicamente
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  <ExclamationTriangleIcon className="w-3 h-3" />
                  Pendiente de permiso
                </span>
              )}
            </div>
          )}
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

      {/* 🔒 Visor de Letra con guard de sesión */}
      {user ? (
        <>
          {/* Advertencia para canciones en revisión (aún con login) */}
          {!esPublicaLegal && estado !== 'no_publicar' && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <ExclamationTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Esta canción está <strong>pendiente de permiso</strong>. Mostrada solo a usuarios registrados para uso interno de ensayo y culto.
              </p>
            </div>
          )}

          {/* Vista normal para usuarios logueados */}
          <CancionViewer cancion={cancion} />
        </>
      ) : (
        /* ─── SIN LOGIN: mensaje de acceso restringido ─── */
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#0F2C4C] to-[#1B5FA8] p-8 text-white text-center space-y-4 shadow-sm">
          <LockClosedIcon className="w-10 h-10 mx-auto text-[#D9A544]" />
          <div>
            <h2 className="font-display font-bold text-lg">Letra y acordes disponibles para miembros</h2>
            <p className="text-xs text-slate-200 mt-2 max-w-md mx-auto">
              Por respeto a los derechos de autor, la letra y los acordes de esta canción
              se muestran únicamente a directores y músicos registrados, para uso en
              ensayo y culto.
            </p>
          </div>
          <Link
            href="/admin/login"
            className="inline-block px-6 py-2.5 bg-[#D9A544] text-[#0F2C4C] font-bold text-xs rounded-xl hover:bg-[#e8b95f] transition-colors shadow-sm"
          >
            Iniciar sesión para ver la letra
          </Link>
          <p className="text-[10px] text-slate-300 pt-2">
            ¿Sos parte de una iglesia y todavía no tenés cuenta? Contactanos.
          </p>
        </div>
      )}
    </div>
  )
}