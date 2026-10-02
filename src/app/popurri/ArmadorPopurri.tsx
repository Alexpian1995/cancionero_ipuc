'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react' // 🆕
import {
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MusicalNoteIcon,
  SparklesIcon,
  DocumentDuplicateIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  PlayIcon,
  UserIcon,
  CheckIcon,
  FolderIcon,
  InformationCircleIcon,
  LockClosedIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  QrCodeIcon, // 🆕
} from '@heroicons/react/24/outline'

import PopurriDetalleView from './PopurriDetalleView'
import { exportarPopurriAPDF } from '@/lib/pdfExport'
import {
  guardarOActualizarPopurri,
  obtenerEstadoSuscripcion,
  obtenerBibliotecaPopurris,
  eliminarPopurri,
} from '@/actions/iglesia'

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
  temas?: string[]
  score?: number
  razon?: string | null
}

type Lider = {
  id: string
  nombre: string
}

const TONALIDADES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bbm']
const POR_PAGINA = 10

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

const SOSTENIDOS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const BEMOLES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

function indiceNota(nota: string): number {
  let i = SOSTENIDOS.indexOf(nota)
  if (i === -1) i = BEMOLES.indexOf(nota)
  return i
}

function distanciaSemitonos(origen: string, destino: string): number {
  const a = indiceNota(origen)
  const b = indiceNota(destino)
  if (a === -1 || b === -1) return 0
  return ((b - a) % 12 + 12) % 12
}

function transponerNota(nota: string, semitonos: number): string {
  const idx = indiceNota(nota)
  if (idx === -1) return nota
  const escala = nota.includes('b') ? BEMOLES : SOSTENIDOS
  return escala[(idx + semitonos) % 12]
}

function transponerAcorde(acorde: string, semitonos: number): string {
  if (acorde.includes('/')) {
    const [principal, bajo] = acorde.split('/')
    return `${transponerAcorde(principal, semitonos)}/${transponerAcorde(bajo, semitonos)}`
  }
  const match = acorde.match(/^([A-G][#b]?)(.*)$/)
  if (!match) return acorde
  return transponerNota(match[1], semitonos) + match[2]
}

const ACORDE_REGEX =
  /\b([A-G][#b]?(?:m7b5|maj7|min7|m7|dim7|aug7|sus[24]|add9|maj|min|dim|aug|m|\d)*(?:\/[A-G][#b]?)?)(?![A-Za-z0-9])/g

function transponerLineaAcordes(linea: string, semitonos: number): string {
  return linea.replace(ACORDE_REGEX, (match) => transponerAcorde(match, semitonos))
}

const TOKEN_ACORDE =
  /^[A-G][#b]?(?:m7b5|maj7|min7|m7|dim7|aug7|sus[24]|add9|maj|min|dim|aug|m|\d)*(?:\/[A-G][#b]?)?$/

function esLineaDeAcordes(linea: string): boolean {
  const palabras = linea.trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return false
  const acordes = palabras.filter((p) => TOKEN_ACORDE.test(p))
  return acordes.length > 0 && acordes.length / palabras.length >= 0.8
}

function transponerLetraCompleta(letra: string, semitonos: number): string {
  if (!semitonos || !letra) return letra
  return letra
    .split('\n')
    .map((linea) => (esLineaDeAcordes(linea) ? transponerLineaAcordes(linea, semitonos) : linea))
    .join('\n')
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

  const [modoEnVivo, setModoEnVivo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [guardadoExitoso, setGuardadoExitoso] = useState(false)

  const [vistaBiblioteca, setVistaBiblioteca] = useState(false)
  const [popurrisGuardados, setPopurrisGuardados] = useState<any[]>([])
  const [cargandoBiblioteca, setCargandoBiblioteca] = useState(false)
  const [eliminandoPopurri, setEliminandoPopurri] = useState<string | null>(null)

  const [modoFiltroArmonico, setModoFiltroArmonico] = useState(false)
  const [filtroTono, setFiltroTono] = useState('D')
  const [filtroTempo, setFiltroTempo] = useState('lento')
  const [filtroTipo, setFiltroTipo] = useState('todos')

  const [promptBusqueda, setPromptBusqueda] = useState('')
  const [cargando, setCargando] = useState(false)
  const [explicacion, setExplicacion] = useState('')

  const [autenticado, setAutenticado] = useState<boolean | null>(null)
  const [paginaActual, setPaginaActual] = useState(1)

  // Estados para exportar a PDF
  const [modalExportar, setModalExportar] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [modoPDF, setModoPDF] = useState<'musico' | 'cantante'>('musico')
  const [orientacionPDF, setOrientacionPDF] = useState<'portrait' | 'landscape'>('portrait')

  // 🆕 Estados para compartir con QR
  const [modalCompartir, setModalCompartir] = useState(false)
  const [linkCompartir, setLinkCompartir] = useState('')
  const [codigoSesionActual, setCodigoSesionActual] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setAutenticado(!!data.user)
    })
  }, [])

  useEffect(() => {
    setPaginaActual(1)
  }, [busqueda, filtroTono, filtroTempo, filtroTipo, modoFiltroArmonico, seleccionadas.length])

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
    setLiderId(popurriResumen.lider_id || popurriResumen.liderId || '')
    setNombreLiderManual(popurriResumen.nombre_lider_manual || popurriResumen.nombreLider || '')
    // 🆕 Cargar el código de sesión del popurrí guardado
    setCodigoSesionActual(popurriResumen.codigo_sesion || '')

    const cancionesCargadas = (popurriResumen.canciones || popurriResumen.popurri_canciones || []).map((item: any) => {
      const infoCancion = item.canciones || {}
      const idCancion = item.cancion_id || item.id || infoCancion.id
      const delCatalogo = cancionesDisponibles.find((c) => c.id === idCancion)

      return {
        ...delCatalogo,
        ...infoCancion,
        id: idCancion,
        titulo: infoCancion.titulo || delCatalogo?.titulo || 'Canción sin título',
        tonoSeleccionado: item.tonalidad || delCatalogo?.tonalidad || 'C',
        notas: item.transicion || '',
      }
    })

    setSeleccionadas(cancionesCargadas)
    setVistaBiblioteca(false)
  }

  const handleEliminarPopurri = async (e: React.MouseEvent, id: string, titulo: string) => {
    e.stopPropagation()
    if (!confirm(`¿Eliminar el popurrí "${titulo}"? Esta acción no se puede deshacer.`)) return

    setEliminandoPopurri(id)
    const res = await eliminarPopurri(id)
    setEliminandoPopurri(null)

    if (res.exito) {
      setPopurrisGuardados((prev) => prev.filter((p) => p.id !== id))
      if (popurriIdActual === id) {
        setPopurriIdActual(undefined)
        setNombrePopurri('Nuevo Popurrí / Medley')
        setSeleccionadas([])
        setCodigoSesionActual('') // 🆕 resetear código
      }
    } else {
      alert('Error al eliminar: ' + (res.error || 'desconocido'))
    }
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

  const totalPaginas = Math.max(1, Math.ceil(cancionesFiltradas.length / POR_PAGINA))
  const cancionesPagina = useMemo(() => {
    const inicio = (paginaActual - 1) * POR_PAGINA
    return cancionesFiltradas.slice(inicio, inicio + POR_PAGINA)
  }, [cancionesFiltradas, paginaActual])

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
        })
      })

      if (res.status === 401) {
        setAutenticado(false)
        setExplicacion('Iniciá sesión para usar el sugeridor de canciones.')
        return
      }

      const data = await res.json()

      if (data.exito && Array.isArray(data.sugerencias)) {
        const sugeridas = data.sugerencias.map((s: Cancion) => ({
          ...s,
          tonoSeleccionado: s.tonalidad || 'C',
          notas: ''
        }))

        if (sugeridas.length === 0) {
          setSeleccionadas([])
          setExplicacion(data.explicacion)
          return
        }

        setExplicacion(data.explicacion)
        setSeleccionadas(sugeridas)
      }
    } catch (err) {
      console.error(err)
      setExplicacion('Error al consultar sugerencias. Intentá de nuevo.')
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

      if (res.status === 401) {
        alert('Iniciá sesión para usar las transiciones automáticas.')
        return
      }

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

      // 🆕 Guardar el código de sesión retornado
      if (res.codigoSesion) {
        setCodigoSesionActual(res.codigoSesion)
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

  // EXPORTAR A PDF
  const handleExportarPDF = async () => {
    if (seleccionadas.length === 0) {
      alert('Agregá al menos una canción al popurrí para exportar.')
      return
    }

    setExportando(true)
    try {
      const cancionesParaPDF = seleccionadas.map((item) => {
        const tonoOrig = item.tonalidad || 'C'
        const tonoSel = item.tonoSeleccionado || tonoOrig
        const semitonos = distanciaSemitonos(tonoOrig, tonoSel)

        return {
          titulo: item.titulo,
          tonalidadOriginal: tonoOrig,
          tonalidadActual: tonoSel,
          letraConAcordes: transponerLetraCompleta(
            item.acordes || item.letra || 'Letra y acordes no disponibles',
            semitonos
          ),
          transicionSugerida: item.notas || undefined,
        }
      })

      await exportarPopurriAPDF({
        titulo: nombrePopurri || 'Popurrí sin título',
        lider: obtenerNombreLider() || undefined,
        canciones: cancionesParaPDF,
        modo: modoPDF,
        orientacion: orientacionPDF,
      })

      setModalExportar(false)
    } catch (err) {
      console.error('Error exportando PDF:', err)
      alert('Error al generar el PDF: ' + (err instanceof Error ? err.message : 'desconocido'))
    } finally {
      setExportando(false)
    }
  }

  // 🆕 COMPARTIR CON QR
  const abrirCompartir = () => {
    if (!codigoSesionActual) {
      alert('Primero guardá el popurrí para generar su código QR.')
      return
    }
    setLinkCompartir(`${window.location.origin}/p/${codigoSesionActual}`)
    setModalCompartir(true)
  }

  const copiarLink = () => {
    navigator.clipboard.writeText(linkCompartir)
    alert('¡Link copiado al portapapeles! 🎉')
  }

  const compartirWhatsApp = () => {
    const texto = `🎵🙏 Popurrí de adoración "${nombrePopurri}" — Código ${codigoSesionActual}. Escaneá o entrá acá: ${linkCompartir}`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoSesionActual)
    alert(`Código ${codigoSesionActual} copiado 🎉`)
  }

  const copiarResumen = () => {
    const lider = obtenerNombreLider()

    const NUMEROS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '']
    const EMOJI_TEMPO: Record<string, string> = {
      lento: '🕊️',
      medio: '🎶',
      rapido: '⚡',
      rápido: '⚡',
    }
    const DIV = '•┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈•'

    let texto = ''

    texto += `🎵✨ *POPURRÍ DE ADORACIÓN* ✨🎵\n`
    texto += `━━━━━━━━━━━━━━━━━━━━━━\n`
    texto += `📌 *${nombrePopurri.toUpperCase()}*\n`
    if (lider) texto += `👤 Líder: *${lider}*\n`
    texto += `🎼 ${seleccionadas.length} ${seleccionadas.length === 1 ? 'canción' : 'canciones'}\n\n`

    seleccionadas.forEach((c, idx) => {
      texto += `${DIV}\n\n`

      const num = NUMEROS[idx] ?? `*${idx + 1}.*`
      texto += `${num} *${c.titulo.toUpperCase()}*\n\n`

      const cambio =
        c.tonalidad && c.tonalidad !== c.tonoSeleccionado
          ? `  ↩️ _(original: ${c.tonalidad})_`
          : ''
      texto += `🎹 Tono: *${c.tonoSeleccionado}*${cambio}\n`

      const tempo = (c.tempo || '').toLowerCase()
      if (tempo) texto += `${EMOJI_TEMPO[tempo] || '🎵'} Tempo: _${c.tempo}_\n`

      if (idx < seleccionadas.length - 1) {
        const sig = seleccionadas[idx + 1]
        texto += `\n⬇️ *${c.tonoSeleccionado} → ${sig.tonoSeleccionado}*`
        if (sig.notas) texto += `\n🔄 _${sig.notas}_`
        texto += `\n\n`
      } else {
        texto += '\n'
      }
    })

    texto += `${DIV}\n\n`
    texto += `🙏 *¡Bendiciones en el ministerio!*\n`
    texto += `📲 _Generado con Cancionero IPUC_`

    navigator.clipboard.writeText(texto)
    alert('¡Esquema de popurrí copiado al portapapeles! 🎉')
  }

  if (modoEnVivo) {
    const popurriAdaptado = seleccionadas.map((item) => {
      const tonoOrig = item.tonalidad || 'C'
      const tonoSel = item.tonoSeleccionado || tonoOrig
      const semitonos = distanciaSemitonos(tonoOrig, tonoSel)

      return {
        id: item.id,
        titulo: item.titulo,
        tonalidadOriginal: tonoSel,
        tonalidadActual: tonoSel,
        letraConAcordes: transponerLetraCompleta(
          item.acordes || item.letra || 'Letra y acordes no disponibles',
          semitonos
        ),
        transicionSugerida: item.notas,
      }
    })

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
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-800 text-sm min-w-0 flex-1 truncate">{item.titulo}</h4>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {/* 🆕 Botón QR para compartir desde biblioteca */}
                      {item.codigo_sesion && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setCodigoSesionActual(item.codigo_sesion)
                            setLinkCompartir(`${window.location.origin}/p/${item.codigo_sesion}`)
                            setModalCompartir(true)
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Compartir con QR"
                        >
                          <QrCodeIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleEliminarPopurri(e, item.id, item.titulo)}
                        disabled={eliminandoPopurri === item.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Eliminar popurrí"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {(item.nombre_lider_manual || item.nombreLider) && (
                    <p className="text-[11px] text-slate-500">👤 Líder: {item.nombre_lider_manual || item.nombreLider}</p>
                  )}

                  {item.codigo_sesion && (
                    <p className="text-[10px] text-[#1B5FA8] font-mono font-bold">
                      Código: {item.codigo_sesion}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className="inline-block text-[10px] font-bold bg-[#1B5FA8]/10 text-[#1B5FA8] px-2.5 py-0.5 rounded-md">
                      {(item.canciones || item.popurri_canciones || []).length || 0} canciones
                    </span>
                    <span className="text-[11px] text-[#1B5FA8] font-bold">
                      {eliminandoPopurri === item.id ? 'Eliminando...' : 'Cargar ➔'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-4">
            {autenticado === false ? (
              <div className="bg-gradient-to-br from-[#0F2C4C] to-[#1B5FA8] p-6 rounded-2xl text-white space-y-3 shadow-md text-center">
                <LockClosedIcon className="w-9 h-9 mx-auto text-[#D9A544]" />
                <h3 className="font-bold text-sm">Asistente de IA para Popurrís</h3>
                <p className="text-[11px] text-slate-200 leading-relaxed">
                  Por respeto a los derechos de autor, el sugeridor inteligente y las
                  letras con acordes están disponibles solo para directores y músicos
                  registrados de la iglesia.
                </p>
                <Link
                  href="/admin/login"
                  className="inline-block px-5 py-2.5 bg-[#D9A544] text-[#0F2C4C] font-bold text-xs rounded-xl hover:bg-[#e8b95f] transition-colors"
                >
                  Iniciar sesión
                </Link>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[#0F2C4C] to-[#1B5FA8] p-4 rounded-2xl text-white space-y-3 shadow-md">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-[#D9A544]" />
                  <h3 className="font-bold text-sm">Asistente de IA para Popurrís</h3>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={promptBusqueda}
                    onChange={(e) => setPromptBusqueda(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && consultarSugerencias()}
                    placeholder="Ej: canciones sobre fidelidad de Dios"
                    className="w-full text-xs text-white placeholder:text-slate-300 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D9A544] font-medium"
                  />

                  <button
                    onClick={consultarSugerencias}
                    disabled={cargando || !promptBusqueda.trim()}
                    className="w-full bg-[#D9A544] text-[#0F2C4C] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#e8b95f] transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cargando ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Analizando canciones...
                      </span>
                    ) : (
                      '✨ Sugerir canciones'
                    )}
                  </button>
                </div>

                {explicacion && (
                  <div className="text-[11px] text-slate-100 bg-white/10 p-3 rounded-xl border border-white/10 space-y-2">
                    <p className="italic flex items-start gap-2">
                      <InformationCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{explicacion}</span>
                    </p>

                    {seleccionadas.length > 0 && seleccionadas.some(s => s.razon) && (
                      <ul className="space-y-1.5 pl-6 pt-1 border-t border-white/10">
                        {seleccionadas.slice(0, 6).map((c) => (
                          <li key={c.id} className="flex items-start gap-1.5">
                            <span className="text-[#D9A544] font-bold">•</span>
                            <div className="min-w-0">
                              <span className="font-semibold text-white">"{c.titulo}"</span>
                              <span className="text-slate-300"> — {c.libro || 'Cancionero IPUC'}</span>
                              {c.razon && (
                                <p className="text-slate-300 italic text-[10px]">{c.razon}</p>
                              )}
                            </div>
                          </li>
                        ))}
                        {seleccionadas.length > 6 && (
                          <li className="text-[10px] text-slate-400 italic">
                            +{seleccionadas.length - 6} más en el armador
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="font-bold font-display text-base text-[#0F2C4C]">Catálogo de Alabanzas</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {cancionesFiltradas.length} {cancionesFiltradas.length === 1 ? 'canción' : 'canciones'}
                    {totalPaginas > 1 && ` · Página ${paginaActual} de ${totalPaginas}`}
                  </p>
                </div>
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

              <div className="space-y-2">
                {cancionesPagina.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No hay canciones para este filtro</p>
                ) : (
                  cancionesPagina.map((c) => (
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

              {totalPaginas > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                              : 'text-slate-600 hover:bg-slate-100'
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
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
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
                      onClick={() => setModalExportar(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-700 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" />
                      Exportar PDF
                    </button>

                    {/* 🆕 BOTÓN COMPARTIR CON QR */}
                    <button
                      onClick={abrirCompartir}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      <QrCodeIcon className="w-4 h-4" />
                      Compartir
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
                  <p className="text-xs text-slate-400 mt-1">Usá el asistente de IA o agregá canciones manualmente</p>
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
                            {item.score !== undefined && item.score > 0 && (
                              <span className="text-[10px] text-emerald-600 font-semibold">
                                ✨ Relevancia: {Math.min(item.score, 20)}/20
                              </span>
                            )}
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

      {/* ═══════════════════════════════════════════════════ */}
      {/* MODAL DE EXPORTAR A PDF                          */}
      {/* ═══════════════════════════════════════════════════ */}
      {modalExportar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#0F2C4C] text-lg">Exportar Popurrí a PDF</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Descargá tu popurrí para verlo sin conexión a internet
                </p>
              </div>
              <button
                onClick={() => setModalExportar(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Modo de exportación
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setModoPDF('musico')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    modoPDF === 'musico'
                      ? 'border-[#1B5FA8] bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MusicalNoteIcon className={`w-4 h-4 ${modoPDF === 'musico' ? 'text-[#1B5FA8]' : 'text-slate-400'}`} />
                    <span className={`text-sm font-bold ${modoPDF === 'musico' ? 'text-[#1B5FA8]' : 'text-slate-700'}`}>
                      Músico
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Letra con acordes encima</p>
                </button>

                <button
                  onClick={() => setModoPDF('cantante')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    modoPDF === 'cantante'
                      ? 'border-[#1B5FA8] bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <UserIcon className={`w-4 h-4 ${modoPDF === 'cantante' ? 'text-[#1B5FA8]' : 'text-slate-400'}`} />
                    <span className={`text-sm font-bold ${modoPDF === 'cantante' ? 'text-[#1B5FA8]' : 'text-slate-700'}`}>
                      Cantante
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Solo la letra, sin acordes</p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Orientación de página
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setOrientacionPDF('portrait')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    orientacionPDF === 'portrait'
                      ? 'border-[#1B5FA8] bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <div className={`w-5 h-7 border-2 rounded-sm ${
                      orientacionPDF === 'portrait' ? 'border-[#1B5FA8]' : 'border-slate-400'
                    }`}></div>
                    <span className={`text-sm font-bold ${
                      orientacionPDF === 'portrait' ? 'text-[#1B5FA8]' : 'text-slate-700'
                    }`}>
                      Vertical
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setOrientacionPDF('landscape')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    orientacionPDF === 'landscape'
                      ? 'border-[#1B5FA8] bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <div className={`w-7 h-5 border-2 rounded-sm ${
                      orientacionPDF === 'landscape' ? 'border-[#1B5FA8]' : 'border-slate-400'
                    }`}></div>
                    <span className={`text-sm font-bold ${
                      orientacionPDF === 'landscape' ? 'text-[#1B5FA8]' : 'text-slate-700'
                    }`}>
                      Horizontal
                    </span>
                  </div>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                💡 Horizontal es ideal para el modo músico: caben más acordes por línea.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Resumen</p>
              <div className="text-xs text-slate-700 space-y-0.5">
                <p><strong>{seleccionadas.length}</strong> canciones en el popurrí</p>
                <p>Título: <strong>{nombrePopurri || 'Sin título'}</strong></p>
                <p>Líder: <strong>{obtenerNombreLider() || 'No especificado'}</strong></p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setModalExportar(false)}
                disabled={exportando}
                className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleExportarPDF}
                disabled={exportando}
                className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-[#0F2C4C] rounded-xl hover:bg-[#1B5FA8] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {exportando ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generando...
                  </>
                ) : (
                  <>
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Descargar PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* 🆕 MODAL COMPARTIR CON QR                        */}
      {/* ═══════════════════════════════════════════════════ */}
      {modalCompartir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4 text-center">
            <div>
              <h3 className="font-bold text-[#0F2C4C] text-lg">Compartir popurrí</h3>
              <p className="text-xs text-slate-500 mt-1">
                Quien escanee el código verá el popurrí completo
                <strong> solo si tiene cuenta con plan activo</strong>.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-xl border-2 border-slate-200">
                <QRCodeSVG value={linkCompartir} size={180} level="M" />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Código de sesión</p>
              <button
                onClick={copiarCodigo}
                className="text-lg font-bold tracking-widest text-[#1B5FA8] hover:underline cursor-pointer"
                title="Click para copiar"
              >
                {codigoSesionActual}
              </button>
            </div>

            <input
              readOnly
              value={linkCompartir}
              onFocus={(e) => e.target.select()}
              className="w-full text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={copiarLink}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                📋 Copiar link
              </button>
              <button
                onClick={compartirWhatsApp}
                className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
              >
                💬 WhatsApp
              </button>
            </div>

            <button
              onClick={() => setModalCompartir(false)}
              className="w-full px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}