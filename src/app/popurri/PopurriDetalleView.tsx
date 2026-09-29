'use client'

import { useState, useRef, useLayoutEffect } from 'react'
import { 
  ArrowLeftIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  PlusIcon,
  MusicalNoteIcon,
  UserIcon,
  ArrowsPointingOutIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline'

type CancionPopurri = {
  id: string
  titulo: string
  tonalidadOriginal: string
  tonalidadActual: string
  letraConAcordes: string
  transicionSugerida?: string
}

type Props = {
  popurriInicial: any[]
  catalogo?: Array<{ id: string; titulo: string; tonalidad: string | null; acordes?: string; letra?: string }>
  onVolver?: () => void
}

const NOTAS_SOSTENIDOS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const NOTAS_BEMAOLES   = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

function transponerNota(nota: string, semitonos: string | number): string {
  let idx = NOTAS_SOSTENIDOS.indexOf(nota as string)
  let usaBoles = false

  if (idx === -1) {
    idx = NOTAS_BEMAOLES.indexOf(nota as string)
    usaBoles = true
  }

  if (idx === -1) return nota || 'C'

  const escala = usaBoles ? NOTAS_BEMAOLES : NOTAS_SOSTENIDOS
  const nuevoIdx = (idx + (semitonos as number) + 120) % 12
  return escala[nuevoIdx]
}

function transponerAcorde(acorde: string, semitonos: number): string {
  if (semitonos === 0) return acorde

  if (acorde.includes('/')) {
    const [principal, bajo] = acorde.split('/')
    return `${transponerAcorde(principal, semitonos)}/${transponerAcorde(bajo, semitonos)}`
  }

  const match = acorde.match(/^([A-G][#b]?)(.*)$/)
  if (!match) return acorde

  const root = match[1]
  const extension = match[2]
  const nuevaRaiz = transponerNota(root, semitonos)

  return `${nuevaRaiz}${extension}`
}

function transponerTextoArmonico(texto: string, semitonos: number): string {
  if (semitonos === 0 || !texto) return texto
  const regexAcordes = /\b([A-G][#b]?(?:m|maj|min|dim|aug|sus\d*|\d+)*(?:\/[A-G][#b]?)?)\b/g
  return texto.replace(regexAcordes, (match) => transponerAcorde(match, semitonos))
}

function limpiarAcordesParaCantante(texto: string): string {
  if (!texto) return ''
  const lineas = texto.split('\n')
  const lineasFiltradas = lineas.filter((linea) => {
    const lineaLimpia = linea.trim()
    if (!lineaLimpia) return true
    const palabras = lineaLimpia.split(/\s+/)
    const esLineaDeAcordes = palabras.every((palabra) => 
      /^[A-G][#b]?(?:m|maj|min|dim|aug|sus\d*|\d+)*(?:\/[A-G][#b]?)?$/i.test(palabra)
    )
    return !esLineaDeAcordes
  })
  return lineasFiltradas.join('\n')
}

// 🆕 Divide la letra en estrofas (bloques separados por líneas vacías)
// para que cada una se mantenga íntegra en una columna (no se parte a la mitad)
function dividirEnEstrofas(texto: string): string[] {
  if (!texto) return []
  const lineas = texto.split('\n')
  const estrofas: string[] = []
  let bloqueActual: string[] = []

  for (const linea of lineas) {
    if (linea.trim() === '') {
      if (bloqueActual.length > 0) {
        estrofas.push(bloqueActual.join('\n'))
        bloqueActual = []
      }
    } else {
      bloqueActual.push(linea)
    }
  }

  if (bloqueActual.length > 0) {
    estrofas.push(bloqueActual.join('\n'))
  }

  return estrofas
}

export default function PopurriDetalleView({ popurriInicial = [], catalogo = [], onVolver }: Props) {
  const cancionesNormalizadas: CancionPopurri[] = popurriInicial.map((item, index) => ({
    id: item.id || item.cancionId || `cancion-${index}`,
    titulo: item.titulo || 'Canción sin título',
    tonalidadOriginal: item.tonalidadOriginal || item.tonalidad || 'C',
    tonalidadActual: item.tonalidadActual || item.tonalidad || 'C',
    letraConAcordes: item.letraConAcordes || item.letra || item.acordes || 'Letra y acordes no disponibles',
    transicionSugerida: item.transicion || item.transicionSugerida
  }))

  const [canciones, setCanciones] = useState<CancionPopurri[]>(cancionesNormalizadas)
  const [indiceActivo, setIndiceActivo] = useState(0)
  const [transposicionesIndiv, setTransposicionesIndiv] = useState<Record<string, number>>({})
  const [transposicionGlobal, setTransposicionGlobal] = useState(0)
  const [modoVista, setModoVista] = useState<'musico' | 'cantante'>('musico')
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false)

  // 🆕 Control de tamaño de fuente (override manual del auto-ajuste)
  const [tamanoLetraFS, setTamanoLetraFS] = useState(32)
  const [columnas, setColumnas] = useState<1 | 2 | 3>(3)
  const [tamanoManual, setTamanoManual] = useState(false) // si el usuario ajustó manualmente

  const contenedorFSRef = useRef<HTMLDivElement>(null)
  const textoFSRef = useRef<HTMLDivElement>(null)

  const cancionActiva = canciones[indiceActivo]

  const semitonosIndivActivos = cancionActiva ? (transposicionesIndiv[cancionActiva.id] || 0) : 0
  const semitonosTotalesActivos = transposicionGlobal + semitonosIndivActivos

  const tonalidadCalculada = cancionActiva 
    ? transponerNota(cancionActiva.tonalidadActual, semitonosTotalesActivos)
    : ''

  const textoTranspuesto = cancionActiva
    ? transponerTextoArmonico(cancionActiva.letraConAcordes, semitonosTotalesActivos)
    : ''

  const textoFinal = modoVista === 'cantante' 
    ? limpiarAcordesParaCantante(textoTranspuesto)
    : textoTranspuesto

  const estrofas = dividirEnEstrofas(textoFinal)

  // ✅ AUTO-AJUSTE: solo si el usuario NO ajustó manualmente
  useLayoutEffect(() => {
    if (!isFullScreenOpen || !cancionActiva) return

    const contenedor = contenedorFSRef.current
    const texto = textoFSRef.current
    if (!contenedor || !texto) return

    contenedor.scrollTop = 0

    // Si el usuario ajustó manualmente, respetar su preferencia
    if (tamanoManual) return

    const ajustarTamano = () => {
      let tamano = 42
      const minimo = 20

      texto.style.fontSize = `${tamano}px`

      let intentos = 0
      while (texto.scrollHeight > contenedor.clientHeight && tamano > minimo && intentos < 30) {
        tamano -= 2
        texto.style.fontSize = `${tamano}px`
        intentos++
      }

      setTamanoLetraFS(tamano)
    }

    ajustarTamano()
    window.addEventListener('resize', ajustarTamano)
    return () => window.removeEventListener('resize', ajustarTamano)
  }, [isFullScreenOpen, indiceActivo, transposicionGlobal, transposicionesIndiv, modoVista, cancionActiva, tamanoManual, columnas])

  // 🆕 Al cambiar de canción, resetear el ajuste manual
  useLayoutEffect(() => {
    setTamanoManual(false)
    setTamanoLetraFS(32)
  }, [indiceActivo])

  const cambiarTransposicionIndividual = (cancionId: string, delta: number) => {
    setTransposicionesIndiv(prev => ({
      ...prev,
      [cancionId]: (prev[cancionId] || 0) + delta
    }))
  }

  const cambiarTransposicionGlobal = (delta: number) => {
    setTransposicionGlobal(prev => prev + delta)
  }

  const agregarCancionAlPopurri = (item: typeof catalogo[0]) => {
    const nueva: CancionPopurri = {
      id: `${item.id}-${Date.now()}`,
      titulo: item.titulo,
      tonalidadOriginal: item.tonalidad || 'C',
      tonalidadActual: item.tonalidad || 'C',
      letraConAcordes: item.acordes || item.letra || 'Letra y acordes no disponibles'
    }
    setCanciones([...canciones, nueva])
  }

  // 🆕 Controles de zoom
  const aumentarLetra = () => {
    setTamanoManual(true)
    setTamanoLetraFS(prev => Math.min(prev + 4, 80))
  }

  const reducirLetra = () => {
    setTamanoManual(true)
    setTamanoLetraFS(prev => Math.max(prev - 4, 16))
  }

  const resetearZoom = () => {
    setTamanoManual(false)
    setTamanoLetraFS(32)
  }

  const toggleFullScreen = () => {
    const el = document.documentElement
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
  }

  return (
    <div className="bg-slate-100 min-h-screen p-4 md:p-6 text-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PANEL IZQUIERDO: Estructura del Popurrí */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-lg text-[#0F2C4C] border-b border-slate-100 pb-3">
              Estructura del Popurrí
            </h2>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {canciones.map((cancion, idx) => {
                const shiftIndiv = transposicionesIndiv[cancion.id] || 0
                const shiftTotal = transposicionGlobal + shiftIndiv
                const tonoModificado = transponerNota(cancion.tonalidadActual, shiftTotal)
                const esActiva = idx === indiceActivo

                return (
                  <div
                    key={cancion.id}
                    onClick={() => setIndiceActivo(idx)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                      esActiva 
                        ? 'border-[#1B5FA8] bg-blue-50/50 shadow-sm' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-xs font-bold text-slate-400 w-4">
                        {idx + 1}.
                      </span>
                      <p className={`text-sm font-bold truncate ${esActiva ? 'text-[#1B5FA8]' : 'text-slate-700'}`}>
                        {cancion.titulo}
                      </p>
                    </div>

                    <span className="text-xs font-extrabold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0 ml-2">
                      {tonoModificado}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {catalogo.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Añadir más al Popurrí
              </h3>
              <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1">
                {catalogo.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 text-xs transition-all"
                  >
                    <span className="font-semibold text-slate-700 truncate">{cat.titulo}</span>
                    <button
                      onClick={() => agregarCancionAlPopurri(cat)}
                      className="p-1 text-[#1B5FA8] bg-blue-50 rounded-lg hover:bg-[#1B5FA8] hover:text-white transition-colors"
                      title="Añadir a la lista"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PANEL DERECHO: Visor En Vivo */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Popurrí Activo
              </span>
              <h1 className="text-xl font-bold text-[#0F2C4C] truncate">
                {cancionActiva?.titulo || 'Sin selección'}
              </h1>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setIsFullScreenOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0F2C4C] text-white font-bold text-xs hover:bg-[#1B5FA8] transition-all shadow-sm"
              >
                <ArrowsPointingOutIcon className="w-4 h-4 text-[#D9A544]"/>
                Pantalla Completa
              </button>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-600 px-2">Tono Global:</span>
                <button
                  onClick={() => cambiarTransposicionGlobal(-1)}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center shadow-xs"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-extrabold text-[#1B5FA8]">
                  {transposicionGlobal > 0 ? `+${transposicionGlobal}` : transposicionGlobal}
                </span>
                <button
                  onClick={() => cambiarTransposicionGlobal(1)}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center shadow-xs"
                >
                  +
                </button>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setModoVista('musico')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                    modoVista === 'musico' ? 'bg-white text-[#1B5FA8] shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <MusicalNoteIcon className="w-3.5 h-3.5" /> Músico
                </button>
                <button
                  onClick={() => setModoVista('cantante')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                    modoVista === 'cantante' ? 'bg-white text-[#1B5FA8] shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" /> Cantante
                </button>
              </div>

              {onVolver && (
                <button
                  onClick={onVolver}
                  className="flex items-center gap-1.5 bg-[#0F2C4C] text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-[#1B5FA8] transition-colors shadow-xs"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5" /> Volver al Armador
                </button>
              )}
            </div>
          </div>

          {cancionActiva && (
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-500">
                    Tonalidad Actual: <strong className="text-[#1B5FA8] text-base">{tonalidadCalculada}</strong>
                  </span>

                  <div className="flex items-center bg-slate-50 border border-slate-200 p-0.5 rounded-lg ml-2">
                    <button
                      onClick={() => cambiarTransposicionIndividual(cancionActiva.id, -1)}
                      className="w-6 h-6 rounded bg-white font-bold text-xs text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-xs"
                      title="Bajar 1 semitono"
                    >
                      -
                    </button>
                    <span className="text-[11px] font-bold text-slate-500 px-2">
                      {semitonosIndivActivos > 0 ? `+${semitonosIndivActivos}` : semitonosIndivActivos}
                    </span>
                    <button
                      onClick={() => cambiarTransposicionIndividual(cancionActiva.id, 1)}
                      className="w-6 h-6 rounded bg-white font-bold text-xs text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-xs"
                      title="Subir 1 semitono"
                    >
                      +
                    </button>
                  </div>
                </div>

                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  Canción {indiceActivo + 1} de {canciones.length}
                </span>
              </div>

              {cancionActiva.transicionSugerida && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 font-medium italic">
                  💡 Transición: {cancionActiva.transicionSugerida}
                </div>
              )}

              <div className="overflow-x-auto">
                <pre className={`font-mono text-base leading-relaxed whitespace-pre-wrap ${
                  modoVista === 'cantante' ? 'text-slate-800 font-sans text-lg font-medium' : 'text-slate-800'
                }`}>
                  {textoFinal}
                </pre>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-6">
                <button
                  onClick={() => setIndiceActivo(prev => Math.max(0, prev - 1))}
                  disabled={indiceActivo === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold disabled:opacity-40 transition-all"
                >
                  <ChevronLeftIcon className="w-4 h-4" /> Anterior
                </button>

                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Usa los botones para cambiar de canción en vivo
                </span>

                <button
                  onClick={() => setIndiceActivo(prev => Math.min(canciones.length - 1, prev + 1))}
                  disabled={indiceActivo === canciones.length - 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B5FA8] hover:bg-[#0F2C4C] text-white text-xs font-bold disabled:opacity-40 transition-all shadow-sm"
                >
                  Siguiente <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 🆕 MODAL DE PANTALLA COMPLETA REDISEÑADO (tipo cancionero) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isFullScreenOpen && cancionActiva && (
        <div className="fixed inset-0 z-50 bg-[#0F2C4C] text-white flex flex-col">
          
          {/* Header */}
          <div className="w-full flex items-center justify-between border-b border-white/10 px-6 md:px-10 py-4 shrink-0">
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-widest text-[#D9A544] font-bold">
                Modo Presentación · {modoVista === 'musico' ? 'Músico' : 'Cantante'}
              </span>
              <h2 className="text-lg md:text-2xl font-bold mt-0.5 truncate">{cancionActiva.titulo}</h2>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <span className="px-3 py-1.5 bg-[#D9A544] text-[#0F2C4C] rounded-lg font-extrabold text-sm">
                {tonalidadCalculada}
              </span>
              <span className="text-xs text-white/50 px-2 hidden md:inline">
                {indiceActivo + 1}/{canciones.length}
              </span>
              <button
                onClick={toggleFullScreen}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Pantalla completa del navegador"
              >
                <ArrowsPointingInIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsFullScreenOpen(false)}
                className="px-3 py-2 bg-white/10 hover:bg-red-500/80 rounded-lg text-white font-bold text-xs transition-colors"
              >
                ✕ Cerrar
              </button>
            </div>
          </div>

          {/* Controles de zoom y columnas */}
          <div className="w-full flex items-center justify-between gap-3 px-6 md:px-10 py-2 border-b border-white/5 bg-white/[0.02] shrink-0 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Letra:</span>
              <button
                onClick={reducirLetra}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors"
                title="Reducir letra"
              >
                <MagnifyingGlassMinusIcon className="w-3.5 h-3.5" /> A-
              </button>
              <span className="text-xs font-bold text-white/70 w-10 text-center">{tamanoLetraFS}px</span>
              <button
                onClick={aumentarLetra}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors"
                title="Agrandar letra"
              >
                A+ <MagnifyingGlassPlusIcon className="w-3.5 h-3.5" />
              </button>
              {tamanoManual && (
                <button
                  onClick={resetearZoom}
                  className="text-[10px] text-white/50 hover:text-white underline px-2"
                >
                  auto
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Columnas:</span>
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setColumnas(n as 1 | 2 | 3)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                    columnas === n
                      ? 'bg-[#D9A544] text-[#0F2C4C]'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {cancionActiva.transicionSugerida && (
              <div className="text-xs text-[#D9A544] italic hidden lg:block">
                💡 {cancionActiva.transicionSugerida}
              </div>
            )}
          </div>

          {/* Zona de letra en columnas */}
          <div
            ref={contenedorFSRef}
            className="flex-1 min-h-0 overflow-y-auto px-6 md:px-10 py-6"
          >
            <div
              ref={textoFSRef}
              className={`
                w-full
                ${columnas === 1 ? 'columns-1' : columnas === 2 ? 'columns-1 md:columns-2' : 'columns-1 md:columns-2 xl:columns-3'}
                gap-x-10 gap-y-4
                ${modoVista === 'cantante' ? 'font-sans font-medium' : 'font-mono'}
                leading-[1.4]
              `}
              style={{ fontSize: `${tamanoLetraFS}px` }}
            >
              {estrofas.map((estrofa, i) => (
                <div
                  key={i}
                  className="break-inside-avoid mb-6"
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {estrofa}
                </div>
              ))}
            </div>
          </div>

          {/* Navegación entre canciones */}
          <div className="w-full flex items-center justify-between border-t border-white/10 px-6 md:px-10 py-4 shrink-0">
            <button
              onClick={() => setIndiceActivo(prev => Math.max(0, prev - 1))}
              disabled={indiceActivo === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold disabled:opacity-30 transition-all"
            >
              <ChevronLeftIcon className="w-4 h-4" /> Anterior
            </button>

            <div className="text-center">
              <p className="text-sm text-white/70 font-semibold">
                Canción {indiceActivo + 1} de {canciones.length}
              </p>
              <p className="text-[10px] text-white/40">
                ← → teclas para navegar · ESC para cerrar
              </p>
            </div>

            <button
              onClick={() => setIndiceActivo(prev => Math.min(canciones.length - 1, prev + 1))}
              disabled={indiceActivo === canciones.length - 1}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#D9A544] hover:bg-[#e8b95f] text-[#0F2C4C] text-sm font-bold disabled:opacity-30 transition-all"
            >
              Siguiente <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}