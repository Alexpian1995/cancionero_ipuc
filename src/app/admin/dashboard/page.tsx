import { createClient } from '@/lib/supabase/server'
// ... tus otros imports

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Obtener el total de todas las canciones registradas
  const { count: totalCanciones } = await supabase
    .from('canciones')
    .select('*', { count: 'exact', head: true })

  // 2. Conteo por categoría (usando ilike para tolerar tildes o variaciones)
  const { count: lluviasCount } = await supabase
    .from('canciones')
    .select('*', { count: 'exact', head: true })
    .ilike('libro', '%Lluvias%')

  const { count: manantialCount } = await supabase
    .from('canciones')
    .select('*', { count: 'exact', head: true })
    .ilike('libro', '%Manantial%')

  // Coros y Adoración (incluye Coros Varios, General o nulos para que no se pierda ninguna)
  const { count: corosCount } = await supabase
    .from('canciones')
    .select('*', { count: 'exact', head: true })
    .or('libro.ilike.%Coros%,libro.ilike.%General%,libro.is.null')

  return (
    <div className="space-y-6">
      {/* Banner / Buscador */}
      {/* ... */}

      {/* Catálogos Disponibles */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-3">Catálogos Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Tarjeta 1: Lluvias de Bendición */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Lluvias de Bendición</h3>
              <p className="text-xs text-slate-500">Himnal tradicional con arreglos</p>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
              {lluviasCount ?? 0}
            </span>
          </div>

          {/* Tarjeta 2: Manantial de Inspiración */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Manantial de Inspiración</h3>
              <p className="text-xs text-slate-500">Coros y cantos emblemáticos</p>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
              {manantialCount ?? 0}
            </span>
          </div>

          {/* Tarjeta 3: Coros y Adoración (Receptor de canciones generales) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Coros y Adoración</h3>
              <p className="text-xs text-slate-500">Repertorio de adoración congregacional</p>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
              {corosCount ?? 0}
            </span>
          </div>

        </div>
      </div>
    </div>
  )
}