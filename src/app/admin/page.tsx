'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  MusicalNoteIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'

type Cancion = {
  id: string
  titulo: string
  libro: string | null
  tonalidad: string | null
  tempo: string | null
  tipo: string | null
  temas: string[] | null
  letra: string | null
  estado_legal: string | null
  nota_legal: string | null
}

const CATEGORIAS_TEMATICAS = [
  { value: '', label: '— Sin categoría —' },
  { value: 'infantil', label: '🧒 Infantil / Niños' },
  { value: 'evangelismo', label: '📢 Evangelismo / Llamado' },
  { value: 'perdon', label: '🙏 Perdón' },
  { value: 'fe', label: '✝️ Fe / Confianza' },
  { value: 'amor', label: '❤️ Amor de Dios' },
  { value: 'gratitud', label: '🙌 Gratitud / Gracias' },
  { value: 'adoracion', label: '🕊️ Adoración' },
  { value: 'alabanza', label: '🎵 Alabanza / Gozo' },
  { value: 'esperanza', label: '🌅 Esperanza' },
  { value: 'sanidad', label: '💪 Sanidad' },
  { value: 'fidelidad', label: '🤝 Fidelidad' },
  { value: 'salvacion', label: '🛟 Salvación' },
  { value: 'unicidad', label: '1️⃣ Unicidad de Dios' },
  { value: 'navidad', label: '🎄 Navidad' },
  { value: 'segunda venida', label: '☁️ Segunda Venida' },
  { value: 'familia', label: '👨‍ Familia' },
  { value: 'oracion', label: '🙇 Oración' },
]

const ESTADOS_LEGALES = [
  { value: 'dominio_publico', label: '✅ Dominio público' },
  { value: 'permiso_escrito', label: '✅ Permiso escrito' },
  { value: 'licencia', label: '📘 Licencia (CCLI/editorial)' },
  { value: 'pendiente', label: '⚠️ Pendiente de permiso' },
  { value: 'no_publicar', label: '🚫 No publicar' },
]

const BADGE_ESTADO: Record<string, string> = {
  dominio_publico: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  permiso_escrito: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  licencia: 'bg-sky-50 text-sky-700 border-sky-200',
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  no_publicar: 'bg-red-50 text-red-700 border-red-200',
}

const ADMIN_EMAILS = ['alexanderalzate53@gmail.com']
const POR_PAGINA = 10
const LIBROS = ['Lluvias de Bendición', 'Manantial de Inspiración', 'Coros y Adoración']

function labelEstado(v?: string | null): string {
  const found = ESTADOS_LEGALES.find((e) => e.value === v)
  return found ? found.label : '⚠️ Pendiente'
}

function labelCategoria(value: string | null | undefined): string {
  if (!value) return 'Sin categoría'
  const found = CATEGORIAS_TEMATICAS.find((c) => c.value === value)
  return found ? found.label : value
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [autenticado, setAutenticado] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [canciones, setCanciones] = useState<Cancion[]>([])

  const [busqueda, setBusqueda] = useState('')
  const [filtroLibro, setFiltroLibro] = useState('todos')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroEstado, setFiltroEstado] = useState('todas')
  const [filtroLegal, setFiltroLegal] = useState('todos')

  const [seleccionadas, setSeleccionadas] = useState<string[]>([])
  const [categoriaLote, setCategoriaLote] = useState('')
  const [estadoLote, setEstadoLote] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const [paginaActual, setPaginaActual] = useState(1)

  // 🔒 Guard de autenticación + validación de email admin
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/admin/login')
        return
      }
      const email = (data.user.email || '').toLowerCase()
      if (!ADMIN_EMAILS.includes(email)) {
        alert('No tienes permisos para acceder al panel de administración.')
        supabase.auth.signOut().then(() => router.push('/admin/login'))
        return
      }
      setAutenticado(true)
      cargarCanciones()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setPaginaActual(1)
  }, [busqueda, filtroLibro, filtroCategoria, filtroEstado, filtroLegal])

  const cargarCanciones = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('canciones')
      .select('id, titulo, libro, tonalidad, tempo, tipo, temas, letra, estado_legal, nota_legal')
      .order('titulo', { ascending: true })

    if (!error && data) setCanciones(data as Cancion[])
    setCargando(false)
  }

  const filtradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    return canciones.filter((c) => {
      if (q && !c.titulo.toLowerCase().includes(q)) return false
      if (filtroLibro !== 'todos' && c.libro !== filtroLibro) return false
      const cat = c.temas?.[0] || ''
      if (filtroCategoria === 'sin' && cat !== '') return false
      if (filtroCategoria !== 'todas' && filtroCategoria !== 'sin' && cat !== filtroCategoria) return false
      if (filtroEstado === 'incompletas' && (c.tempo && c.temas?.length)) return false
      if (filtroEstado === 'completas' && (!c.tempo || !c.temas?.length)) return false
      const estado = c.estado_legal || 'pendiente'
      if (filtroLegal === 'listas') {
        if (!['dominio_publico', 'permiso_escrito', 'licencia'].includes(estado)) return false
      } else if (filtroLegal !== 'todos' && estado !== filtroLegal) return false
      return true
    })
  }, [canciones, busqueda, filtroLibro, filtroCategoria, filtroEstado, filtroLegal])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA))
  const cancionesPagina = useMemo(() => {
    const inicio = (paginaActual - 1) * POR_PAGINA
    return filtradas.slice(inicio, inicio + POR_PAGINA)
  }, [filtradas, paginaActual])

  const stats = useMemo(() => {
    const sinCategoria = canciones.filter((c) => !c.temas?.length).length
    const sinTempo = canciones.filter((c) => !c.tempo).length
    const listas = canciones.filter((c) =>
      ['dominio_publico', 'permiso_escrito', 'licencia'].includes(c.estado_legal || '')
    ).length
    const pendientes = canciones.filter((c) => !c.estado_legal || c.estado_legal === 'pendiente').length
    const bloqueadas = canciones.filter((c) => c.estado_legal === 'no_publicar').length
    return { total: canciones.length, sinCategoria, sinTempo, listas, pendientes, bloqueadas }
  }, [canciones])

  const toggleSeleccion = (id: string) => {
    setSeleccionadas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleTodas = () => {
    if (seleccionadas.length === filtradas.length) setSeleccionadas([])
    else setSeleccionadas(filtradas.map((c) => c.id))
  }

  const eliminarUna = async (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar "${titulo}"? Esta acción no se puede deshacer.`)) return
    const { error } = await supabase.from('canciones').delete().eq('id', id)
    if (error) alert('Error al eliminar: ' + error.message)
    else {
      setCanciones((prev) => prev.filter((c) => c.id !== id))
      setMensaje(`✅ "${titulo}" eliminada`)
    }
  }

  const asignarCategoriaLote = async () => {
    if (seleccionadas.length === 0 || !categoriaLote) return
    setProcesando(true)
    const { error } = await supabase.from('canciones').update({ temas: [categoriaLote] }).in('id', seleccionadas)
    setProcesando(false)
    if (error) alert('Error al asignar: ' + error.message)
    else {
      setMensaje(`✅ Categoría asignada a ${seleccionadas.length} canción(es)`)
      setSeleccionadas([])
      cargarCanciones()
    }
  }

  const asignarEstadoLote = async () => {
    if (seleccionadas.length === 0 || !estadoLote) return
    setProcesando(true)
    const { error } = await supabase.from('canciones').update({ estado_legal: estadoLote }).in('id', seleccionadas)
    setProcesando(false)
    if (error) alert('Error al asignar: ' + error.message)
    else {
      setMensaje(`✅ Estado legal asignado a ${seleccionadas.length} canción(es)`)
      setSeleccionadas([])
      cargarCanciones()
    }
  }

  const eliminarLote = async () => {
    if (seleccionadas.length === 0) return
    if (!confirm(`¿Eliminar ${seleccionadas.length} canción(es) seleccionadas?`)) return
    setProcesando(true)
    const { error } = await supabase.from('canciones').delete().in('id', seleccionadas)
    setProcesando(false)
    if (error) alert('Error al eliminar: ' + error.message)
    else {
      setMensaje(`✅ ${seleccionadas.length} canción(es) eliminadas`)
      setSeleccionadas([])
      cargarCanciones()
    }
  }

  if (!autenticado) {
    return <div className="p-10 text-center text-slate-500">Verificando sesión...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#0F2C4C]">Administración</h1>
          <p className="text-xs text-slate-500">Gestioná tu catálogo de alabanzas</p>
        </div>
        <Link
          href="/admin/crear"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F2C4C] text-white font-bold text-xs hover:bg-[#1B5FA8] transition-all shadow-sm"
        >
          <PlusIcon className="w-4 h-4 text-[#D9A544]" />
          Nueva Canción
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
          <p className="text-xl font-bold text-[#0F2C4C]">{stats.total}</p>
        </div>
        <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
            <ShieldCheckIcon className="w-3 h-3" /> Listas
          </p>
          <p className="text-xl font-bold text-emerald-700">{stats.listas}</p>
        </div>
        <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 shadow-sm">
          <p className="text-[10px] font-bold text-amber-600 uppercase">Pendientes</p>
          <p className="text-xl font-bold text-amber-700">{stats.pendientes}</p>
        </div>
        <div className="bg-red-50 p-3 rounded-2xl border border-red-200 shadow-sm">
          <p className="text-[10px] font-bold text-red-600 uppercase">Bloqueadas</p>
          <p className="text-xl font-bold text-red-700">{stats.bloqueadas}</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Sin categoría</p>
          <p className="text-xl font-bold text-amber-600">{stats.sinCategoria}</p>
        </div>
      </div>

      {mensaje && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs">
          <CheckIcon className="w-4 h-4" />
          {mensaje}
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
            <FunnelIcon className="w-4 h-4 text-[#1B5FA8]" />
            Filtros
          </div>
          <p className="text-[10px] text-slate-400">
            {filtradas.length} {filtradas.length === 1 ? 'resultado' : 'resultados'}
            {totalPaginas > 1 && ` · Página ${paginaActual} de ${totalPaginas}`}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Buscar por título..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
          />
          <select value={filtroLibro} onChange={(e) => setFiltroLibro(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]">
            <option value="todos">Todos los libros</option>
            {LIBROS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]">
            <option value="todas">Todas las categorías</option>
            <option value="sin">Sin categoría</option>
            {CATEGORIAS_TEMATICAS.filter((c) => c.value).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={filtroLegal} onChange={(e) => setFiltroLegal(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]">
            <option value="todos">Todo estado legal</option>
            <option value="listas">✅ Listas para publicar</option>
            {ESTADOS_LEGALES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]">
            <option value="todas">Todo estado</option>
            <option value="incompletas">Incompletas</option>
            <option value="completas">Completas</option>
          </select>
        </div>
      </div>

      {seleccionadas.length > 0 && (
        <div className="bg-[#0F2C4C] p-3 rounded-2xl flex flex-wrap items-center gap-2 shadow-md">
          <span className="text-white text-xs font-bold shrink-0">{seleccionadas.length} seleccionada(s)</span>
          <select value={categoriaLote} onChange={(e) => setCategoriaLote(e.target.value)}
            className="rounded-xl border border-white/20 bg-white/10 text-white text-xs px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[#D9A544]">
            <option value="" className="text-slate-800">Categoría...</option>
            {CATEGORIAS_TEMATICAS.filter((c) => c.value).map((c) => <option key={c.value} value={c.value} className="text-slate-800">{c.label}</option>)}
          </select>
          <button onClick={asignarCategoriaLote} disabled={procesando || !categoriaLote}
            className="px-3 py-2 rounded-xl bg-[#D9A544] text-[#0F2C4C] font-bold text-xs hover:bg-[#e8b95f] disabled:opacity-50">
            Asignar categoría
          </button>
          <select value={estadoLote} onChange={(e) => setEstadoLote(e.target.value)}
            className="rounded-xl border border-white/20 bg-white/10 text-white text-xs px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[#D9A544]">
            <option value="" className="text-slate-800">Estado legal...</option>
            {ESTADOS_LEGALES.map((e) => <option key={e.value} value={e.value} className="text-slate-800">{e.label}</option>)}
          </select>
          <button onClick={asignarEstadoLote} disabled={procesando || !estadoLote}
            className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-50">
            Asignar estado
          </button>
          <button onClick={eliminarLote} disabled={procesando}
            className="px-3 py-2 rounded-xl bg-red-500 text-white font-bold text-xs hover:bg-red-600 disabled:opacity-50">
            Eliminar
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {cargando ? (
          <p className="text-xs text-slate-500 py-10 text-center">Cargando canciones...</p>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-12">
            <MusicalNoteIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No hay canciones con estos filtros</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-10">
                      <input
                        type="checkbox"
                        checked={seleccionadas.length === filtradas.length && filtradas.length > 0}
                        onChange={toggleTodas}
                        className="accent-[#1B5FA8]"
                      />
                    </th>
                    <th className="p-3 font-bold text-slate-600">Título</th>
                    <th className="p-3 font-bold text-slate-600">Tono</th>
                    <th className="p-3 font-bold text-slate-600">Categoría</th>
                    <th className="p-3 font-bold text-slate-600">Estado legal</th>
                    <th className="p-3 font-bold text-slate-600 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cancionesPagina.map((c) => {
                    const cat = c.temas?.[0] || ''
                    const estado = c.estado_legal || 'pendiente'
                    const incompleta = !c.tempo || !cat
                    return (
                      <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3">
                          <input type="checkbox" checked={seleccionadas.includes(c.id)} onChange={() => toggleSeleccion(c.id)} className="accent-[#1B5FA8]" />
                        </td>
                        <td className="p-3 font-semibold text-slate-800">
                          {c.titulo}
                          {incompleta && (
                            <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md" title="Falta tempo o categoría">
                              <ExclamationTriangleIcon className="w-3 h-3" />
                              incompleta
                            </span>
                          )}
                          {c.nota_legal && (
                            <span className="ml-1 text-slate-400" title={c.nota_legal}>📎</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">{c.tonalidad || '—'}</span>
                        </td>
                        <td className="p-3 text-xs text-slate-600">{labelCategoria(cat)}</td>
                        <td className="p-3">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${BADGE_ESTADO[estado] || BADGE_ESTADO.pendiente}`}>
                            {labelEstado(estado)}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/admin/editar/${c.id}`} className="p-1.5 text-slate-400 hover:text-[#1B5FA8] hover:bg-slate-100 rounded-lg" title="Editar">
                              <PencilSquareIcon className="w-4 h-4" />
                            </Link>
                            <button onClick={() => eliminarUna(c.id, c.titulo)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  Anterior
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPaginas) }).map((_, i) => {
                    let pageNum: number
                    if (totalPaginas <= 5) {
                      pageNum = i + 1
                    } else if (paginaActual <= 3) {
                      pageNum = i + 1
                    } else if (paginaActual >= totalPaginas - 2) {
                      pageNum = totalPaginas - 4 + i
                    } else {
                      pageNum = paginaActual - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPaginaActual(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                          paginaActual === pageNum
                            ? 'bg-[#1B5FA8] text-white'
                            : 'text-slate-600 hover:bg-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}