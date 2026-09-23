import { createClient } from '@/lib/supabase/server'
import { CancionCard } from '@/components/canciones/CancionCard'
import { 
  FunnelIcon, 
  BookOpenIcon, 
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

type SearchParams = {
  tema?: string
  tonalidad?: string
  tempo?: string
  page?: string
}

const ELEMENTOS_POR_PAGINA = 15

export default async function LluviasDeBendicionPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { tema, tonalidad, tempo, page } = await searchParams
  const paginaActual = Math.max(1, parseInt(page || '1', 10))
  const supabase = await createClient()

  // Paginación en Supabase con `.range()`
  const desde = (paginaActual - 1) * ELEMENTOS_POR_PAGINA
  const hasta = desde + ELEMENTOS_POR_PAGINA - 1

  let query = supabase
    .from('canciones')
    .select('id, titulo, libro, tonalidad, tempo, temas', { count: 'exact' })
    .ilike('libro', '%Lluvias de Bendicion%')
    .order('titulo')

  // Filtro por búsqueda de tema / título
  if (tema) {
    query = query.or(`titulo.ilike.%${tema}%,temas.ilike.%${tema}%`)
  }

  if (tonalidad) query = query.eq('tonalidad', tonalidad)
  if (tempo) query = query.eq('tempo', tempo)

  // Aplicar rango para la página activa
  query = query.range(desde, hasta)

  const { data: canciones, count, error } = await query

  const totalCanciones = count ?? 0
  const totalPaginas = Math.ceil(totalCanciones / ELEMENTOS_POR_PAGINA)

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">Error al cargar el himnario:</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    )
  }

  const hayFiltrosActivos = Boolean(tema || tonalidad || tempo)

  // Helper para generar URLs preservando los filtros actuales
  const crearUrlPagina = (nuevaPagina: number) => {
    const params = new URLSearchParams()
    if (tema) params.set('tema', tema)
    if (tonalidad) params.set('tonalidad', tonalidad)
    if (tempo) params.set('tempo', tempo)
    params.set('page', nuevaPagina.toString())
    return `/lluvias-de-bendicion?${params.toString()}`
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Encabezado de Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F2C4C]/5 text-[#0F2C4C] ring-1 ring-[#0F2C4C]/10">
            <BookOpenIcon className="h-6 w-6 text-[#1B5FA8]" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-[#0F2C4C]">
              Lluvias de Bendición
            </h1>
            <p className="text-xs text-slate-500">
              Himnal tradicional congregacional y arreglos
            </p>
          </div>
        </div>
        <div className="text-xs font-medium text-slate-500 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm self-start sm:self-auto">
          {totalCanciones} {totalCanciones === 1 ? 'alabanza' : 'alabanzas'}
        </div>
      </div>

      {/* Barra de Filtros Integrada */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm">
        <form method="GET" className="flex flex-col md:flex-row items-center gap-3">
          {/* Input de Búsqueda por Tema / Título */}
          <div className="w-full md:flex-1 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <MagnifyingGlassIcon className="h-4 w-4" />
            </span>
            <input
              type="text"
              name="tema"
              defaultValue={tema ?? ''}
              placeholder="Buscar por tema (ej: fidelidad, amor)..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 py-2 text-sm text-slate-700 focus:border-[#1B5FA8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]/20 transition-all"
            />
          </div>

          {/* Filtro Tonalidad */}
          <div className="w-full md:w-44">
            <select
              name="tonalidad"
              defaultValue={tonalidad ?? ''}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-700 focus:border-[#1B5FA8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]/20 transition-all cursor-pointer"
            >
              <option value="">Tonalidad (todas)</option>
              <option value="C">C (Do)</option>
              <option value="D">D (Re)</option>
              <option value="E">E (Mi)</option>
              <option value="F">F (Fa)</option>
              <option value="G">G (Sol)</option>
              <option value="A">A (La)</option>
              <option value="B">B (Si)</option>
              <option value="Cm">Cm (Do menor)</option>
              <option value="Dm">Dm (Re menor)</option>
              <option value="Em">Em (Mi menor)</option>
              <option value="Fm">Fm (Fa menor)</option>
              <option value="Gm">Gm (Sol menor)</option>
              <option value="Am">Am (La menor)</option>
              <option value="Bm">Bm (Si menor)</option>
            </select>
          </div>

          {/* Filtro Tempo */}
          <div className="w-full md:w-44">
            <select
              name="tempo"
              defaultValue={tempo ?? ''}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-700 focus:border-[#1B5FA8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]/20 transition-all cursor-pointer"
            >
              <option value="">Tempo (todos)</option>
              <option value="rapido">⚡ Rápido</option>
              <option value="medio">🎵 Medio</option>
              <option value="lento">🕊️ Lento</option>
            </select>
          </div>

          {/* Botón Acciones */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="submit"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F2C4C] px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#0B223C] transition-colors focus:ring-2 focus:ring-[#0F2C4C]/20"
            >
              <FunnelIcon className="h-4 w-4" />
              Filtrar
            </button>

            {hayFiltrosActivos && (
              <Link
                href="/lluvias-de-bendicion"
                className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                title="Limpiar filtros"
              >
                <XMarkIcon className="h-5 w-5" />
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Lista de Alabanzas */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        {canciones && canciones.length > 0 ? (
          <>
            <ul className="divide-y divide-slate-100 space-y-2">
              {canciones.map((c) => (
                <li key={c.id} className="pt-2 first:pt-0">
                  <CancionCard cancion={c} />
                </li>
              ))}
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
          </>
        ) : (
          <div className="text-center py-12">
            <BookOpenIcon className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-2 text-sm font-semibold text-slate-800">No se encontraron cantos</h3>
            <p className="mt-1 text-xs text-slate-500">
              Prueba cambiando la búsqueda, tonalidad o borrando los filtros activos.
            </p>
            {hayFiltrosActivos && (
              <Link
                href="/lluvias-de-bendicion"
                className="mt-4 inline-flex items-center text-xs font-semibold text-[#1B5FA8] hover:underline"
              >
                Limpiar búsqueda
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}