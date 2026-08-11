'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  PlusIcon, 
  TrashIcon, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  MusicalNoteIcon,
  SparklesIcon,
  DocumentDuplicateIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  PlayIcon,
  UserIcon,
  CheckIcon,
  FolderIcon
} from '@heroicons/react/24/outline'

import PopurriDetalleView from './PopurriDetalleView'
import { guardarOActualizarPopurri, obtenerEstadoSuscripcion, obtenerBibliotecaPopurris } from '@/actions/iglesia'

type Cancion = {
  id: string
  titulo: string
  libro: string | null
  tonalidad: string | null
  tempo: string | null
  tipo: string | null
  bpm?: number | null
  letra?: string
  acordes?: string
}

type Lider = {
  id: string
  nombre: string
}

const TONALIDADES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bbm']

const FAMILIAS_ARMONICAS: Record<string, string[]> = {
  'C': ['C', 'Am', 'F', 'G', 'Dm'],
  'C#': ['C#', 'A#m', 'F#', 'G#'],
  'D': ['D', 'Bm', 'G', 'A', 'Em'],
  'Eb': ['Eb', 'Cm', 'Ab', 'Bb'],
  'E': ['E', 'C#m', 'A', 'B', 'F#m'],
  'F': ['F', 'Dm', 'Bb', 'C', 'Gm'],
  'F#': ['F#', 'D#m', 'B', 'C#'],
  'G': ['G', 'Em', 'C', 'D', 'Am'],
  'Ab': ['Ab', 'Fm', 'Db', 'Eb'],
  'A': ['A', 'F#m', 'D', 'E', 'Bm'],
  'Bb': ['Bb', 'Gm', 'Eb', 'F'],
  'B': ['B', 'G#m', 'E', 'F#'],
}

interface ArmadorPopurriProps {
  cancionesDisponibles: Cancion[]
  lideresDisponibles?: Lider[]
  iglesiaId?: string
}

export function ArmadorPopurri({ cancionesDisponibles, lideresDisponibles = [], iglesiaId }: ArmadorPopurriProps) {
  const router = useRouter()
  const [nombrePopurri, setNombrePopurri] = useState('Nuevo Popurrí / Medley')
  const [popurriIdActual, setPopurriIdActual] = useState<string | undefined>(undefined)
  const [liderId, setLiderId] = useState<string>('')
  const [nombreLiderManual, setNombreLiderManual] = useState<string>('')
  const [seleccionadas, setSeleccionadas] = useState<Array<Cancion & { tonoSeleccionado: string; notas?: string }>>([])
  const [busqueda, setBusqueda] = useState('')

  // Estados de interfaz y persistencia
  const [modoEnVivo, setModoEnVivo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [guardadoExitoso, setGuardadoExitoso] = useState(false)

  // Estados de Biblioteca de Popurrís
  const [vistaBiblioteca, setVistaBiblioteca] = useState(false)
  const [popurrisGuardados, setPopurrisGuardados] = useState<any[]>([])
  const [cargandoBiblioteca, setCargandoBiblioteca] = useState(false)

  // Estados del Filtro Armónico
  const [modoFiltroArmonico, setModoFiltroArmonico] = useState(false)
  const [filtroTono, setFiltroTono] = useState('D')
  const [filtroTempo, setFiltroTempo] = useState('lento')
  const [filtroTipo, setFiltroTipo] = useState('todos')

  // Estados Prompt de Búsqueda Temática
  const [promptBusqueda, setPromptBusqueda] = useState('')
  const [cargando, setCargando] = useState(false)
  const [explicacion, setExplicacion] = useState('')

  const normalizar = (str?: string | null) => 
    str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : ""

  const obtenerNombreLider = () => {
    if (liderId) {
      const lider = lideresDisponibles.find(l => l.id === liderId)
      return lider ? lider.nombre : ''
    }
    return nombreLiderManual
  }

  const cargarBiblioteca = async () => {
    setCargandoBiblioteca(true)
    try {
      const res = await obtenerBibliotecaPopurris()
      if (res?.exito) {
        setPopurrisGuardados(res.popurris || [])
      }
    } catch (error) {
      console.error('Error al cargar la biblioteca:', error)
    } finally {
      setCargandoBiblioteca(false)
    }
  }

  const seleccionarPopurri = (popurriResumen: any) => {
  setPopurriIdActual(popurriResumen.id)
  setNombrePopurri(popurriResumen.titulo || 'Popurrí sin título')
  setLiderId(popurriResumen.liderId || '')
  setNombreLiderManual(popurriResumen.nombreLider || '')

  const cancionesCargadas = (popurriResumen.canciones || []).map((item: any) => {
    const infoCancion = item.canciones || {}
    const idCancion = item.cancion_id || item.id || infoCancion.id
    const delCatalogo = cancionesDisponibles.find((c) => c.id === idCancion)

    return {
      ...delCatalogo,   // letra, acordes, tempo, etc. del catálogo
      ...infoCancion,   // lo que venga de la base pisa al catálogo
      id: idCancion,
      titulo: infoCancion.titulo || delCatalogo?.titulo || 'Canción sin título',
      tonoSeleccionado: item.tonalidad || delCatalogo?.tonalidad || 'C',
      notas: item.transicion || '',
    }
  })

  setSeleccionadas(cancionesCargadas)
  setVistaBiblioteca(false)
}

  const obtenerCancionesFiltradas = () => {
    const noSeleccionadas = cancionesDisponibles.filter(
      (c) => !seleccionadas.some((s) => s.id === c.id)
    )

    if (!modoFiltroArmonico) {
      return {
        resultados: noSeleccionadas.filter((c) =>
          normalizar(c.titulo).includes(normalizar(busqueda))
        ),
        esFallback: false
      }
    }

    const tonosCompatibles = filtroTono !== 'todos' && FAMILIAS_ARMONICAS[filtroTono]
      ? FAMILIAS_ARMONICAS[filtroTono]
      : [filtroTono]

    const coincideTono = (c: Cancion) => 
      filtroTono === 'todos' || 
      tonosCompatibles.some((t) => normalizar(t) === normalizar(c.tonalidad))

    const coincideTempo = (c: Cancion) =>
      filtroTempo === 'todos' || normalizar(c.tempo) === normalizar(filtroTempo)

    const coincideTipo = (c: Cancion) =>
      filtroTipo === 'todos' || normalizar(c.tipo) === normalizar(filtroTipo)

    const estrictos = noSeleccionadas.filter(
      (c) => coincideTono(c) && coincideTempo(c) && coincideTipo(c)
    )

    if (estrictos.length > 0) {
      return { resultados: estrictos, esFallback: false }
    }

    const relajados = noSeleccionadas.filter((c) => coincideTono(c))
    return { resultados: relajados, esFallback: relajados.length > 0 && modoFiltroArmonico }
  }

  const { resultados: cancionesFiltradas, esFallback } = obtenerCancionesFiltradas()

  const consultarSugerencias = async () => {
    if (!promptBusqueda.trim()) return
    setCargando(true)
    setExplicacion('')

    try {
      const res = await fetch('/api/popurri-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'sugerir_popurri',
          prompt: promptBusqueda,
          cancionesDisponibles
        })
      })

      const data = await res.json()
      if (data.exito && data.sugerencias) {
        setExplicacion(data.explicacion)

        const nuevasSugeridas = data.sugerencias.map((s: Cancion) => ({
          ...s,
          tonoSeleccionado: s.tonalidad || 'C',
          notas: ''
        }))

        setSeleccionadas(nuevasSugeridas)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  const pedirTransicion = async (idx: number) => {
    if (idx <= 0) return
    const prev = seleccionadas[idx - 1]
    const actual = seleccionadas[idx]

    try {
      const res = await fetch('/api/popurri-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'obtener_transicion',
          tonoOrigen: prev.tonoSeleccionado,
          tonoDestino: actual.tonoSeleccionado,
          cancionOrigen: prev.titulo,
          cancionDestino: actual.titulo
        })
      })

      const data = await res.json()
      if (data.exito && data.transicion) {
        cambiarNotas(idx, data.transicion)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const agregarCancion = (cancion: Cancion) => {
    const tonoInicial = (modoFiltroArmonico && filtroTono !== 'todos') ? filtroTono : (cancion.tonalidad || 'C')
    setSeleccionadas([
      ...seleccionadas,
      {
        ...cancion,
        tonoSeleccionado: tonoInicial,
        notas: ''
      }
    ])
  }

  const removerCancion = (index: number) => {
    setSeleccionadas(seleccionadas.filter((_, i) => i !== index))
  }

  const mover = (index: number, direccion: 'arriba' | 'abajo') => {
    const nuevoOrden = [...seleccionadas]
    const targetIndex = direccion === 'arriba' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= nuevoOrden.length) return
    const temp = nuevoOrden[index]
    nuevoOrden[index] = nuevoOrden[targetIndex]
    nuevoOrden[targetIndex] = temp
    setSeleccionadas(nuevoOrden)
  }

  const cambiarTono = (index: number, nuevoTono: string) => {
    const copias = [...seleccionadas]
    copias[index].tonoSeleccionado = nuevoTono
    setSeleccionadas(copias)
  }

  const cambiarNotas = (index: number, nota: string) => {
    const copias = [...seleccionadas]
    copias[index].notas = nota
    setSeleccionadas(copias)
  }

  const handleGuardarPopurri = async () => {
    if (seleccionadas.length === 0) return
    setGuardando(true)
    setGuardadoExitoso(false)

    try {
      const estado = await obtenerEstadoSuscripcion()

      if (!estado.autenticado) {
        alert('Debes iniciar sesión para guardar popurrís. ¡Tienes 30 días de prueba gratis!')
        router.push('/admin/login')
        return
      }

      if (!estado.tieneSuscripcionValida) {
        alert('Tu periodo de prueba de 30 días ha finalizado. Por favor suscríbete para continuar guardando tus popurrís.')
        return
      }

      const datosPopurri = {
        id: popurriIdActual,
        titulo: nombrePopurri,
        liderId: estado.usuarioId || liderId || null,
        nombreLider: obtenerNombreLider(),
        iglesiaId: estado.iglesiaId || iglesiaId,
        canciones: seleccionadas.map((c, orden) => ({
          cancionId: c.id,
          orden,
          tonalidad: c.tonoSeleccionado,
          transicion: c.notas || ''
        }))
      }

      const res = await guardarOActualizarPopurri(datosPopurri)

      if (!res.exito) {
        alert(res.error || 'Ocurrió un error al intentar guardar el popurrí')
        return
      }

      if (res.popurriId) {
        setPopurriIdActual(res.popurriId)
      }

      setGuardadoExitoso(true)
      setTimeout(() => setGuardadoExitoso(false), 3000)
    } catch (err: any) {
      console.error('Error al guardar popurrí:', err)
      alert(`Error al guardar el popurrí: ${err.message || ''}`)
    } finally {
      setGuardando(false)
    }
  }

  const copiarResumen = () => {
    const lider = obtenerNombreLider()
    let texto = `*🎵 POPURRÍ: ${nombrePopurri.toUpperCase()} 🎵*\n`
    if (lider) {
      texto += `👤 *Líder:* ${lider}\n`
    }
    texto += `\n`

    seleccionadas.forEach((c, idx) => {
      texto += `*${idx + 1}. ${c.titulo}*\n`
      texto += `   • Tono: *${c.tonoSeleccionado}* ${c.tempo ? `(${c.tempo})` : ''}\n`
      if (c.notas) texto += `   • Nota/Transición: _${c.notas}_\n`
      if (idx < seleccionadas.length - 1) {
        texto += `   ⬇️ _(Transición)_ \n`
      }
      texto += `\n`
    })
    navigator.clipboard.writeText(texto)
    alert('¡Esquema de popurrí copiado al portapapeles!')
  }

  if (modoEnVivo) {
    const popurriAdaptado = seleccionadas.map(item => ({
      id: item.id,
      titulo: item.titulo,
      tonalidadOriginal: item.tonalidad || 'C',
      tonalidadActual: item.tonoSeleccionado,
      letraConAcordes: item.acordes || item.letra || 'Letra y acordes no disponibles',
      transicionSugerida: item.notas
    }))

    return (
      <PopurriDetalleView 
        popurriInicial={popurriAdaptado} 
        catalogo={cancionesDisponibles}
        onVolver={() => setModoEnVivo(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => {
            if (!vistaBiblioteca) cargarBiblioteca()
            setVistaBiblioteca(!vistaBiblioteca)
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F2C4C] text-white font-bold text-xs hover:bg-[#1B5FA8] transition-all shadow-sm"
        >
          <FolderIcon className="w-4 h-4 text-[#D9A544]" />
          {vistaBiblioteca ? '✍️ Volver al Armador' : '📚 Mis Popurrís Guardados'}
        </button>
      </div>

      {vistaBiblioteca ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-[#0F2C4C]">Biblioteca de Popurrís Guardados</h3>
          
          {cargandoBiblioteca ? (
            <p className="text-xs text-slate-500 py-8 text-center">Cargando popurrís...</p>
          ) : popurrisGuardados.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No tienes popurrís guardados aún.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popurrisGuardados.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => seleccionarPopurri(item)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-[#1B5FA8] hover:shadow-md cursor-pointer transition-all bg-slate-50 hover:bg-white space-y-2"
                >
                  <h4 className="font-bold text-slate-800 text-sm">{item.titulo}</h4>
                  {item.nombreLider && (
                    <p className="text-[11px] text-slate-500">👤 Líder: {item.nombreLider}</p>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <span className="inline-block text-[10px] font-bold bg-[#1B5FA8]/10 text-[#1B5FA8] px-2.5 py-0.5 rounded-md">
                      {item.canciones?.length || 0} canciones
                    </span>
                    <span className="text-[11px] text-[#1B5FA8] font-bold">Cargar ➔</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-gradient-to-br from-[#0F2C4C] to-[#1B5FA8] p-4 rounded-2xl text-white space-y-3 shadow-md">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-[#D9A544]" />
                <h3 className="font-bold text-sm">Sugeridor por Temática</h3>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promptBusqueda}
                  onChange={(e) => setPromptBusqueda(e.target.value)}
                  placeholder="Ej: canciones sobre fidelidad de Dios"
                  className="w-full text-xs text-white placeholder:text-slate-300 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D9A544] font-medium"
                />
                <button
                  onClick={consultarSugerencias}
                  disabled={cargando}
                  className="bg-[#D9A544] text-[#0F2C4C] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#e8b95f] transition-colors shrink-0 disabled:opacity-50"
                >
                  {cargando ? 'Buscando...' : 'Sugerir'}
                </button>
              </div>

              {explicacion && (
                <p className="text-[11px] text-slate-100 bg-white/10 p-2.5 rounded-xl italic border border-white/10">
                  ✨ {explicacion}
                </p>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="font-bold font-display text-base text-[#0F2C4C]">Catálogo de Alabanzas</h2>
                <button
                  onClick={() => setModoFiltroArmonico(!modoFiltroArmonico)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    modoFiltroArmonico 
                      ? 'bg-[#1B5FA8] text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FunnelIcon className="w-3.5 h-3.5" />
                  {modoFiltroArmonico ? 'Filtro Armónico' : 'Sugerir por Tono'}
                </button>
              </div>

              {modoFiltroArmonico ? (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">TONO BASE</label>
                      <select
                        value={filtroTono}
                        onChange={(e) => setFiltroTono(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs font-bold text-[#0F2C4C] rounded-lg p-2"
                      >
                        <option value="todos">Todos</option>
                        {TONALIDADES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">TEMPO</label>
                      <select
                        value={filtroTempo}
                        onChange={(e) => setFiltroTempo(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs font-bold text-[#0F2C4C] rounded-lg p-2"
                      >
                        <option value="todos">Todos</option>
                        <option value="lento">Lento</option>
                        <option value="medio">Medio</option>
                        <option value="rapido">Rápido</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">TIPO</label>
                      <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs font-bold text-[#0F2C4C] rounded-lg p-2"
                      >
                        <option value="todos">Todos</option>
                        <option value="adoracion">Adoración</option>
                        <option value="coro">Coro</option>
                        <option value="himno">Himno</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Buscar por título para añadir..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
                />
              )}

              {esFallback && (
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Sin coincidencias exactas. Mostrando canciones armónicamente compatibles.</span>
                </div>
              )}

              <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
                {cancionesFiltradas.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No hay canciones para este filtro</p>
                ) : (
                  cancionesFiltradas.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => agregarCancion(c)}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#1B5FA8] hover:bg-slate-50 cursor-pointer transition-all group"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-[#1B5FA8]">{c.titulo}</p>
                        <span className="text-[10px] font-bold text-slate-500">Tono orig: {c.tonalidad || 'N/A'}</span>
                      </div>
                      <button className="p-1.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-[#1B5FA8] group-hover:text-white">
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <input
                  type="text"
                  value={nombrePopurri}
                  onChange={(e) => setNombrePopurri(e.target.value)}
                  className="text-xl font-bold font-display text-[#0F2C4C] bg-transparent border-b border-dashed border-slate-300 focus:border-[#1B5FA8] focus:outline-none py-1 w-full sm:w-auto"
                />
                
                {seleccionadas.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleGuardarPopurri}
                      disabled={guardando}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {guardadoExitoso ? (
                        <>
                          <CheckIcon className="w-4 h-4" />
                          Guardado
                        </>
                      ) : (
                        guardando ? 'Guardando...' : 'Guardar'
                      )}
                    </button>

                    <button
                      onClick={() => setModoEnVivo(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1B5FA8] text-white font-bold text-xs hover:bg-[#0F2C4C] transition-colors shadow-sm"
                    >
                      <PlayIcon className="w-4 h-4" />
                      Ver Modo En Vivo
                    </button>

                    <button
                      onClick={copiarResumen}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D9A544] text-[#0F2C4C] font-bold text-xs hover:bg-[#e8b95f] transition-colors shadow-sm"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                      Copiar
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 text-slate-600 font-bold text-xs shrink-0">
                  <UserIcon className="w-4 h-4 text-[#1B5FA8]" />
                  <span>Líder a cargo:</span>
                </div>

                {lideresDisponibles.length > 0 ? (
                  <select
                    value={liderId}
                    onChange={(e) => {
                      setLiderId(e.target.value)
                      setNombreLiderManual('')
                    }}
                    className="w-full bg-white border border-slate-200 text-xs font-semibold text-[#0F2C4C] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
                  >
                    <option value="">-- Seleccionar Líder --</option>
                    {lideresDisponibles.map((lider) => (
                      <option key={lider.id} value={lider.id}>
                        {lider.nombre}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Nombre del líder de alabanza..."
                    value={nombreLiderManual}
                    onChange={(e) => setNombreLiderManual(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
                  />
                )}
              </div>

              {seleccionadas.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                  <MusicalNoteIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">El Popurrí está vacío</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {seleccionadas.map((item, idx) => (
                    <div key={item.id} className="relative">
                      {idx > 0 && (
                        <div className="flex items-center justify-between my-2 text-xs text-slate-400 font-semibold gap-2">
                          <div className="h-px bg-slate-200 flex-1"></div>
                          <div className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px]">
                            <span>Transición {seleccionadas[idx - 1].tonoSeleccionado} ➔ {item.tonoSeleccionado}</span>
                            <button
                              onClick={() => pedirTransicion(idx)}
                              className="text-[#1B5FA8] hover:underline font-bold flex items-center gap-1 ml-1"
                              title="Sugerir modulación automática"
                            >
                              <LightBulbIcon className="w-3 h-3 text-[#D9A544]" />
                              Modular
                            </button>
                          </div>
                          <div className="h-px bg-slate-200 flex-1"></div>
                        </div>
                      )}

                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-[#0F2C4C] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{item.titulo}</h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <select
                            value={item.tonoSeleccionado}
                            onChange={(e) => cambiarTono(idx, e.target.value)}
                            className="bg-white border border-slate-200 text-xs font-bold text-[#1B5FA8] rounded-lg px-2 py-1"
                          >
                            {TONALIDADES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>

                          <input
                            type="text"
                            placeholder="Nota o transición..."
                            value={item.notas}
                            onChange={(e) => cambiarNotas(idx, e.target.value)}
                            className="bg-white border border-slate-200 text-xs text-slate-600 rounded-lg px-2.5 py-1 w-36 sm:w-44"
                          />

                          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                            <button onClick={() => mover(idx, 'arriba')} disabled={idx === 0} className="p-1 text-slate-400 disabled:opacity-20">
                              <ArrowUpIcon className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => mover(idx, 'abajo')} disabled={idx === seleccionadas.length - 1} className="p-1 text-slate-400 disabled:opacity-20">
                              <ArrowDownIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button onClick={() => removerCancion(idx)} className="p-1.5 text-red-400 hover:text-red-600">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}