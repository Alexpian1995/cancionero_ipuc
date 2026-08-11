import { createClient } from '@/lib/supabase/server'
import { CancionCard } from '@/components/canciones/CancionCard'
import { IconLluvia, IconManantial, IconCoros } from '@/components/ui/Icons'
import Link from 'next/link'
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

type SearchParams = { q?: string; page?: string }

const ELEMENTOS_POR_PAGINA = 15

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { q, page } = await searchParams
  const paginaActual = Math.max(1, parseInt(page || '1', 10))
  const supabase = await createClient()

  // Conteo total general para el panel
  const { data: todas } = await supabase.from('canciones').select('libro, tipo')

  const normalizar = (str?: string | null) => 
    str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : ""

  const contarLluvias = todas?.filter((c) => normalizar(c.libro).includes('lluvias')).length ?? 0
  const contarManantial = todas?.filter((c) => normalizar(c.libro).includes('manantial')).length ?? 0
  const contarCoros = todas?.filter((c) => 
    normalizar(c.libro).includes('coros') || 
    c.tipo === 'coro' || 
    c.tipo === 'adoracion'
  ).length ?? 0

  // Paginación en Supabase con `.range()` y `{ count: 'exact' }`
  const desde = (paginaActual - 1) * ELEMENTOS_POR_PAGINA
  const hasta = desde + ELEMENTOS_POR_PAGINA - 1

  let query = supabase
    .from('canciones')
    .select('id, titulo, libro, tonalidad, tempo', { count: 'exact' })
    .order('titulo')

  if (q && q.trim().length > 0) {
    const términos = q.trim().split(/\s+/).map((p) => `${p}:*`).join(' & ')
    query = query.textSearch('busqueda', términos, { config: 'spanish' })
  }

  // Aplicar rango para la página activa
  query = query.range(desde, hasta)

  const { data: canciones, count, error } = await query

  const totalCanciones = count ?? 0
  const totalPaginas = Math.ceil(totalCanciones / ELEMENTOS_POR_PAGINA)

  if (error) {
    return <div className="p-6 bg-red-50 text-red-600 rounded-xl">Error cargando canciones: {error.message}</div>
  }

  // Helper para preservar las búsquedas al cambiar de página
  const crearUrlPagina = (nuevaPagina: number) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    params.set('page', nuevaPagina.toString())
    return `/?${params.toString()}`
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Banner del Dashboard & Buscador */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F2C4C] via-[#153a63] to-[#1B5FA8] p-6 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Asistente de Alabanza IPUC
          </h1>
          <p className="mt-2 text-slate-200 text-sm sm:text-base">
            Encuentra tonalidades, tempos y letras al instante durante el culto o ensayo.
          </p>

          {/* Buscador Contextual */}
          <form method="GET" className="mt-6 relative flex items-center">
            <MagnifyingGlassIcon className="absolute left-4 h-5 w-5 text-gray-400" />
            <input
              type="text"
              name="q"
              placeholder="Buscar por título, coro o frase de la letra..."
              defaultValue={q}
              className="w-full rounded-2xl bg-white pl-11 pr-28 py-3.5 text-slate-800 shadow-md focus:outline-none focus:ring-4 focus:ring-[#D9A544]/50 text-sm sm:text-base placeholder-slate-400"
            />
            <button
              type="submit"
              className="absolute right-2 bg-[#D9A544] text-[#0F2C4C] hover:bg-[#e8b95f] font-semibold px-4 py-2 rounded-xl text-sm transition-colors shadow-sm"
            >
              Buscar
            </button>
          </form>
        </div>
      </div>

      {/* Tarjetas / Categorías */}
      <div>
        <h2 className="text-lg font-bold text-[#0F2C4C] mb-4 font-display">Catálogos Disponibles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Link href="/lluvias-de-bendicion" className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:border-[#1B5FA8] hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <IconLluvia className="w-8 h-8 text-[#1B5FA8]" />
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{contarLluvias}</span>
            </div>
            <p className="font-display font-semibold text-[#0F2C4C] text-base group-hover:text-[#1B5FA8] transition-colors">Lluvias de Bendición</p>
            <p className="text-xs text-slate-500 mt-1">Himnal tradicional con arreglos</p>
          </Link>

          <Link href="/manantial-de-inspiracion" className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:border-[#D9A544] hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <IconManantial className="w-8 h-8 text-[#D9A544]" />
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{contarManantial}</span>
            </div>
            <p className="font-display font-semibold text-[#0F2C4C] text-base group-hover:text-[#D9A544] transition-colors">Manantial de Inspiración</p>
            <p className="text-xs text-slate-500 mt-1">Coros y cantos emblemáticos</p>
          </Link>

          <Link href="/coros" className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:border-[#0F2C4C] hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <IconCoros className="w-8 h-8 text-[#0F2C4C]" />
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{contarCoros}</span>
            </div>
            <p className="font-display font-semibold text-[#0F2C4C] text-base group-hover:text-blue-900 transition-colors">Coros y Adoración</p>
            <p className="text-xs text-slate-500 mt-1">Repertorio de adoración congregacional</p>
          </Link>
        </div>
      </div>

      {/* Lista de Canciones */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-xl font-bold text-[#0F2C4C]">
              {q ? `Resultados para "${q}"` : 'Directorio de Canciones'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalCanciones} {totalCanciones === 1 ? 'alabanza encontrada' : 'alabanzas en total'}
            </p>
          </div>
        </div>

        <ul className="space-y-3">
          {canciones && canciones.length > 0 ? (
            canciones.map((c) => (
              <li key={c.id}>
                <CancionCard cancion={c} />
              </li>
            ))
          ) : (
            <p className="text-center text-slate-400 text-xs py-8">
              No se encontraron canciones registradas.
            </p>
          )}
        </ul>

        {/* Controles de Paginación */}
        {totalPaginas > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-5 mt-6 text-xs text-slate-500 gap-3">
            <div>
              Mostrando <span className="font-bold text-slate-700">{desde + 1}</span> a{' '}
              <span className="font-bold text-slate-700">{Math.min(hasta + 1, totalCanciones)}</span> de{' '}
              <span className="font-bold text-slate-700">{totalCanciones}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {paginaActual > 1 ? (
                <Link
                  href={crearUrlPagina(paginaActual - 1)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </Link>
              ) : (
                <span className="p-2 rounded-xl border border-slate-100 text-slate-300 cursor-not-allowed">
                  <ChevronLeftIcon className="w-4 h-4" />
                </span>
              )}

              <span className="px-3 py-1.5 font-bold text-slate-700 bg-slate-100 rounded-xl border border-slate-200">
                Página {paginaActual} de {totalPaginas}
              </span>

              {paginaActual < totalPaginas ? (
                <Link
                  href={crearUrlPagina(paginaActual + 1)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </Link>
              ) : (
                <span className="p-2 rounded-xl border border-slate-100 text-slate-300 cursor-not-allowed">
                  <ChevronRightIcon className="w-4 h-4" />
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}