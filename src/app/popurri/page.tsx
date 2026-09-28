import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArmadorPopurri } from '@/app/popurri/ArmadorPopurri'

export default async function PopurrisPage() {
  const supabase = await createClient()

  // 🔒 GUARD DE AUTENTICACIÓN: solo músicos/directores registrados
  // Si no hay sesión, redirige ANTES de consultar letras/acordes
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin/login')
  }

  const { data: canciones } = await supabase
    .from('canciones')
    .select('id, titulo, libro, tonalidad, tempo, tipo, letra, temas')
    .order('titulo')

  const cancionesMapeadas = (canciones || []).map((c) => ({
    id: String(c.id),
    titulo: c.titulo || '',
    libro: c.libro ?? null,
    tonalidad: c.tonalidad ?? null,
    tempo: c.tempo ?? null,
    tipo: c.tipo ?? null,
    letra: c.letra ?? null,
    temas: (c as any).temas ?? null, // ← agregado para que el sugeridor use los tags
  }))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#0F2C4C]">
          Armador de Popurrís & Medleys
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Combina alabanzas, define tonos de transición y genera el esquema del bloque para tus ensayos y cultos.
        </p>
      </div>

      <ArmadorPopurri cancionesDisponibles={cancionesMapeadas} />
    </div>
  )
}