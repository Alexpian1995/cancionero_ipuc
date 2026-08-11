import { createClient } from '@/lib/supabase/server'
import { CancionCard } from '@/components/canciones/CancionCard'
import { 
  BookOpenIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon 
} from '@heroicons/react/24/outline'
import Link from 'next/link'

const LIBRO = 'Manantial de Inspiración' as const
const ELEMENTOS_POR_PAGINA = 15

type SearchParams = {
  tema?: string
  tonalidad?: string
  tempo?: string
  page?: string
}

export default async function ManantialDeInspiracionPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { tema, tonalidad, tempo, page } = await searchParams
  const paginaActual = Math.max(1, parseInt(page || '1', 10))
  const supabase = await createClient()

  // Calcular el rango para la paginación
  const desde = (paginaActual - 1) * ELEMENTOS_POR_PAGINA
  const hasta = desde + ELEMENTOS_POR_PAGINA - 1

  let query = supabase
    .from('canciones')
    .select('id, titulo, libro, tonalidad, tempo, temas', { count: 'exact' })
    .eq('libro', LIBRO)
    .order('titulo')

  if (tonalidad) query = query.eq('tonalidad', tonalidad)
  if (tempo) query = query.eq('tempo', tempo)
  if (tema) query = query.contains('temas', [tema])

  // Aplicar paginación
  query = query.range(desde, hasta)

  const { data: canciones, count, error } = await query

  const totalCanciones = count ?? 0
  const totalPaginas = Math.ceil(totalCanciones / ELEMENTOS_POR_PAGINA)

  if (error) {
    return <div className="p-8 text-red-600">Error: {error.message}</div>
  }

  // Helper para preservar los filtros en la navegación entre páginas
  const crearUrlPagina = (nuevaPagina: number) => {
    const params = new URLSearchParams()
    if (tema) params.set('tema', tema)
    if (tonalidad) params.set('tonalidad', tonalidad)
    if (tempo) params.set('tempo', tempo)
    params.set('page', nuevaPagina.toString())
    return `/manantial-de-inspiracion?${params.toString()}`
  }

  return (
    <main className="min-h-screen p-6 max-w-5xl mx-auto space-y-6">
      {/* Cabecera del Himnario */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 text-sky-600">
            <BookOpenIcon className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{LIBRO}</h1>
            <p className="text-xs text-slate-500">Himnal tradicional congregacional y arreglos</p>
          </div>
        </div>

        <div className="px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-full text-xs font-semibold text-slate-600">
          {totalCanciones} {totalCanciones === 1 ? 'alabanza' : 'alabanzas'}
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        <form method="GET" className="flex flex-wrap items-center gap-3">
          {/* Campo de Búsqueda por Tema */}
          <div className="relative flex-1 min-w-[240px]">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="tema"
              placeholder="Buscar por tema (ej: fidelidad, amor)..."
              defaultValue={tema}
              className="w-full pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Filtro Tonalidad */}
          <select
            name="tonalidad"
            defaultValue={tonalidad ?? ''}
            className="px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
          >
            <option value="">Tonalidad (todas)</option>
            <option value="C">C</option>
            <option value="Am">Am</option>
            <option value="G">G</option>
            <option value="D">D</option>
            <option value="E">E</option>
          </select>

          {/* Filtro Tempo */}
          <select
            name="tempo"
            defaultValue={tempo ?? ''}
            className="px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
          >
            <option value="">Tempo (todos)</option>
            <option value="Rápido">Rápido</option>
            <option value="Medio">Medio</option>
            <option value="Lento">Lento</option>
          </select>

          {/* Botón Filtrar */}
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#0F2C4C] hover:bg-[#1B5FA8] text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
          >
            <FunnelIcon className="h-4 w-4" />
            Filtrar
          </button>
        </form>
      </div>

      {/* Lista de Canciones */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        {canciones && canciones.length > 0 ? (
          <>
            <ul className="space-y-3">
              {canciones.map((c) => (
                <li key={c.id}>
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
          <div className="py-12 text-center text-slate-500 text-sm">
            No se encontraron canciones en este himnario.
          </div>
        )}
      </div>
    </main>
  )
}