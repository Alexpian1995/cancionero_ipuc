import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { VisorCompartido } from '../[codigo]/VisorCompartido'
import { LockClosedIcon, ClockIcon } from '@heroicons/react/24/outline'

export default async function PopurriCompartidoPage({
  params,
}: {
  params: Promise<{ codigo: string }>
}) {
  const { codigo } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 🔒 1. Sin sesión → al login (y vuelve acá después)
  if (!user) {
    redirect(`/admin/login?next=/p/${codigo}`)
  }

  // 🔒 2. Verificar suscripción (admin exento)
  const { data: adminRow } = await supabase
    .from('administradores')
    .select('rol')
    .eq('id', user.id)
    .eq('rol', 'ADMIN')
    .maybeSingle()

  let suscripcionValida = !!adminRow

  if (!suscripcionValida) {
    const { data: iglesia } = await supabase
      .from('iglesias')
      .select('estado_suscripcion, fin_suscripcion')
      .eq('lider_id', user.id)
      .maybeSingle()

    if (iglesia?.estado_suscripcion === 'active') {
      suscripcionValida = true
    } else if (iglesia?.estado_suscripcion === 'trial' && iglesia.fin_suscripcion) {
      suscripcionValida = new Date(iglesia.fin_suscripcion) > new Date()
    }
  }

  if (!suscripcionValida) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white rounded-2xl border border-amber-200 p-8 text-center shadow-sm space-y-4">
        <ClockIcon className="w-12 h-12 mx-auto text-amber-500" />
        <h2 className="text-xl font-bold font-display text-[#0F2C4C]">
          Tu periodo de prueba finalizó
        </h2>
        <p className="text-sm text-slate-600">
          Para ver popurrís compartidos necesitás una suscripción activa.
          Suscribite por $10.000 COP/mes y accedé a todo el contenido.
        </p>
        <div className="flex justify-center gap-2">
          <Link
            href="/acerca"
            className="px-5 py-2.5 bg-[#D9A544] text-[#0F2C4C] font-bold text-xs rounded-xl hover:bg-[#e8b95f]"
          >
            Ver planes
          </Link>
          <a
            href="mailto:alexanderalzate53@gmail.com?subject=Quiero%20suscribirme"
            className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
          >
            Contactar
          </a>
        </div>
      </div>
    )
  }

  // 🔒 3. Cargar el popurrí con cliente admin (server-side, seguro)
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('popurris')
    .select(`
      id, titulo, codigo_sesion, nombre_lider_manual, lider_id,
      popurri_canciones (
        id, cancion_id, orden, tonalidad, transicion,
        canciones ( id, titulo, letra, tonalidad )
      )
    `)
    .eq('codigo_sesion', codigo.toUpperCase())
    .maybeSingle()

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm space-y-3">
        <LockClosedIcon className="w-12 h-12 mx-auto text-slate-300" />
        <h2 className="text-xl font-bold font-display text-[#0F2C4C]">
          Popurrí no encontrado
        </h2>
        <p className="text-sm text-slate-600">
          El código <strong>{codigo.toUpperCase()}</strong> no existe o fue eliminado.
        </p>
        <Link href="/" className="inline-block px-5 py-2.5 bg-[#1B5FA8] text-white font-bold text-xs rounded-xl hover:bg-[#0F2C4C]">
          Ir al inicio
        </Link>
      </div>
    )
  }

  // Adaptar al formato del visor
  const popurriAdaptado = (data.popurri_canciones || [])
    .sort((a: any, b: any) => a.orden - b.orden)
    .map((item: any) => ({
      id: item.cancion_id,
      titulo: item.canciones?.titulo || 'Canción sin título',
      tonalidadOriginal: item.canciones?.tonalidad || 'C',
      tonalidadActual: item.tonalidad || item.canciones?.tonalidad || 'C',
      letraConAcordes: item.canciones?.letra || 'Letra no disponible',
      transicionSugerida: item.transicion || undefined,
    }))

  return (
    <VisorCompartido
      popurri={popurriAdaptado}
      titulo={data.titulo}
      lider={data.nombre_lider_manual}
      codigo={data.codigo_sesion}
    />
  )
}