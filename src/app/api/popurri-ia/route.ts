import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sugerirTransicion } from '@/lib/tonalidades'

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════

const SOLFEO_A_ANGLO: Record<string, string> = {
  'do': 'C', 're': 'D', 'mi': 'E', 'fa': 'F', 'sol': 'G', 'la': 'A', 'si': 'B',
}

const NUMEROS_PALABRA: Record<string, number> = {
  'un': 1, 'una': 1, 'uno': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
  'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10, 'once': 11,
  'doce': 12, 'trece': 13, 'catorce': 14, 'quince': 15, 'veinte': 20
}

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ═══════════════════════════════════════════════════════════════
// SINÓNIMOS Y VOCABULARIO SEMÁNTICO
// ═══════════════════════════════════════════════════════════════

const SINONIMOS_TEMA: Record<string, string[]> = {
  fe:        ['creer', 'confiar', 'confianza', 'creo'],
  esperanza: ['esperar', 'futuro', 'manana', 'promesa', 'promesas'],
  amor:      ['amar', 'amado', 'amada', 'querer'],
  gracia:    ['favor', 'misericordia', 'compasion'],
  perdon:    ['perdonar', 'perdona', 'limpio'],
  salvacion: ['salvar', 'salvador', 'salvo', 'redimir', 'redentor'],
  paz:       ['tranquilidad', 'calma', 'sosiego', 'reposo'],
  gozo:      ['alegria', 'gozoso', 'jubilo', 'feliz', 'celebrar', 'regocijo'],
  adoracion: ['adorar', 'postrarse', 'rendirse'],
  alabanza:  ['alabar', 'exaltar', 'magnificar'],
  fidelidad: ['fiel', 'cumple', 'prometido'],
  cruz:      ['calvario', 'madero', 'crucificado'],
  resurreccion: ['resucito', 'resucitar', 'vive', 'levanto'],
  santidad:  ['santo', 'puro', 'limpio'],
  poder:     ['poderoso', 'fuerte', 'fortaleza'],
  gloria:    ['glorioso', 'majestad'],
  refugio:   ['esconder', 'proteccion', 'amparo', 'refugiarse'],
  guia:      ['guiar', 'camino', 'direccion', 'conducir'],
  consuelo:  ['consolar', 'alivio', 'confortar'],
  presencia: ['estar aqui', 'cerca', 'acompana', 'junto a mi'],
  padre:     ['papa', 'abba', 'hijo'],
  espiritu:  ['espiritu santo', 'fuego', 'llama', 'consolador'],
  sangre:    ['derramada', 'cordero'],
  nombre:    ['jesus', 'yeshua'],
}

const PALABRAS_VACIAS_TEMA = new Set([
  'dios', 'senor', 'jesus', 'cristo', 'aleluya', 'amen', 'cielo', 'tierra',
  'corazon', 'alma', 'vida', 'mundo', 'hoy', 'siempre', 'eterno'
])

// ═══════════════════════════════════════════════════════════════
// PUNTUACIÓN DE RELEVANCIA
// ═══════════════════════════════════════════════════════════════

function puntuarTema(cancion: any, palabrasTema: string[]): number {
  const titulo = normalizarTexto(cancion.titulo || '')
  const letra = normalizarTexto(cancion.letra || '')
  const tags: string[] = Array.isArray(cancion.temas)
    ? cancion.temas.map((t: string) => normalizarTexto(t))
    : []

  let score = 0

  for (const palabra of palabrasTema) {
    const variantes = [palabra, ...(SINONIMOS_TEMA[palabra] || [])]
    for (const v of variantes) {
      const re = new RegExp(`\\b${escapeRegex(v)}\\b`, 'g')
      if (tags.includes(v)) score += 10
      const enTitulo = titulo.match(re)
      if (enTitulo) score += 5 * enTitulo.length
      const enLetra = letra.match(re)
      if (enLetra) score += Math.min(enLetra.length, 5)
    }
  }

  return score
}

// ═══════════════════════════════════════════════════════════════
// GENERADOR DE RAZONES (tono conversacional)
// ═══════════════════════════════════════════════════════════════

function generarRazon(cancion: any, palabrasTema: string[]): string {
  const titulo = normalizarTexto(cancion.titulo || '')
  const letra = normalizarTexto(cancion.letra || '')
  const tags: string[] = Array.isArray(cancion.temas)
    ? cancion.temas.map((t: string) => normalizarTexto(t))
    : []

  const coincidencias: string[] = []
  const enTitulo: string[] = []
  const enLetra: string[] = []

  for (const palabra of palabrasTema) {
    const variantes = [palabra, ...(SINONIMOS_TEMA[palabra] || [])]
    for (const v of variantes) {
      const re = new RegExp(`\\b${escapeRegex(v)}\\b`, 'g')
      if (tags.includes(v)) coincidencias.push(v)
      if (titulo.match(re)) enTitulo.push(v)
      if (letra.match(re)) enLetra.push(v)
    }
  }

  if (enTitulo.length > 0) {
    const unicas = [...new Set(enTitulo)].slice(0, 2)
    return `Habla de ${unicas.join(' y ')} en su título y letra`
  }

  if (coincidencias.length > 0 && enLetra.length > 0) {
    const unicas = [...new Set([...coincidencias, ...enLetra])].slice(0, 2)
    return `Toca temas de ${unicas.join(' y ')}`
  }

  if (enLetra.length > 0) {
    const unicas = [...new Set(enLetra)].slice(0, 2)
    return `Menciona ${unicas.join(' y ')} en su letra`
  }

  return 'Encaja con tu búsqueda'
}

function generarMensajeIA(
  tema: string | null,
  tonalidades: string[],
  modo: string | null,
  tipo: string | null,
  tempo: string | null,
  cantidad: number
): string {
  const partes: string[] = []

  if (tema) partes.push(`sobre *${tema}*`)
  if (modo) partes.push(`en tonos ${modo}es`)
  if (tonalidades.length > 0) partes.push(`en ${tonalidades.join(' y ')}`)
  if (tipo) partes.push(`de tipo ${tipo}`)
  if (tempo) partes.push(`con tempo ${tempo}`)

  if (partes.length === 0) {
    return `Encontré ${cantidad} canción(es) en tu catálogo:`
  }

  return `Si buscas canciones ${partes.join(' ')}, estas pueden servirte:`
}

// ═══════════════════════════════════════════════════════════════
// EXTRACCIÓN DE RESTRICCIONES DEL PROMPT
// ═══════════════════════════════════════════════════════════════

function extraerTonalidades(prompt: string): string[] {
  const p = normalizarTexto(prompt)
  const pOriginal = prompt
  const encontradas: string[] = []

  const agregar = (nota: string, alt: string | undefined, modo: string | undefined) => {
    const esMenor = ['m', 'min', 'menor', 'minor'].includes((modo || '').toLowerCase())
    const clave = `${nota.toUpperCase()}${alt || ''}${esMenor ? 'm' : ''}`
    if (!encontradas.includes(clave)) encontradas.push(clave)
  }

  const anglo = /\b([A-G])(#|b)?\s*(menor|minor|mayor|major|m|min)?\b/gi
  let m
  while ((m = anglo.exec(pOriginal))) {
    if (m[1].toUpperCase() === 'A' && !m[3] && !m[2]) {
      const antes = pOriginal.substring(Math.max(0, m.index - 5), m.index).toLowerCase()
      if (/\b(a|para|con|de|en|por|sin|sobre)\s*$/i.test(antes)) continue
    }
    agregar(m[1].toLowerCase(), m[2], m[3])
  }

  if (encontradas.length === 0) {
    const mayus = prompt.match(/\b[A-G](?:#|b)?[mM]?\b/g)
    if (mayus) {
      for (const tok of mayus) {
        if (tok === 'A') continue
        const m = tok.match(/^([A-G])(#|b)?([mM])?$/)
        if (m) agregar(m[1].toLowerCase(), m[2], m[3])
      }
    }
  }

  const solfeoRegex = /\b(do|re|mi|fa|sol|la|si)\s*(sostenido|sostenidos|bemol|bemoles|#|b)?\s*(menor|minor|mayor|major)?\b/gi
  while ((m = solfeoRegex.exec(p))) {
    const tieneModo = !!m[3]
    const tieneAlt = !!m[2]

    const antes = p.substring(Math.max(0, m.index - 10), m.index)
    const conGuia = /(?:tono|tonalidad|tonos|tonalidades|clave|key|en|de)\s+$/.test(antes)
    if (!tieneModo && !tieneAlt && !conGuia) continue

    const nota = SOLFEO_A_ANGLO[m[1].toLowerCase()]
    if (nota) {
      let alt: string | undefined = undefined
      if (m[2]) {
        const altLower = m[2].toLowerCase()
        if (altLower.includes('sostenido') || altLower === '#') alt = '#'
        else if (altLower.includes('bemol') || altLower === 'b') alt = 'b'
      }
      agregar(nota.toLowerCase(), alt, m[3])
    }
  }

  const majmin = /\b([a-g])(#|b)?(maj|min|m)\b/gi
  while ((m = majmin.exec(p))) {
    const esMenor = ['m', 'min'].includes(m[3].toLowerCase())
    agregar(m[1].toLowerCase(), m[2], esMenor ? 'menor' : 'mayor')
  }

  return encontradas
}

function extraerModo(prompt: string): 'mayor' | 'menor' | null {
  const p = normalizarTexto(prompt)
  if (/\b(menores|menor)\b/.test(p)) return 'menor'
  if (/\b(mayores|mayor)\b/.test(p)) return 'mayor'
  return null
}

function extraerTempo(prompt: string): string | null {
  const p = normalizarTexto(prompt)
  if (/\b(lenta|lentas|lento|lentos|suave|suaves|slow|tranquila|tranquilas|tranquilo|tranquilos|calmada|calmadas|calmado|calmados|pausada|pausadas|pausado|pausados|adoracion)\b/.test(p)) return 'lento'
  if (/\b(media|medias|medio|medios|medium|moderada|moderadas|moderado|moderados|normal)\b/.test(p)) return 'medio'
  if (/\b(rapida|rapidas|rapido|rapidos|alegre|alegres|movida|movidas|movido|movidos|upbeat|viva|vivas|vivo|vivos|fiesta|jubilosa|jubilosas|jubiloso|jubilosos|energetica|energeticas|energetico|energeticos|alabanza)\b/.test(p)) return 'rapido'
  return null
}

function extraerTipo(prompt: string): string | null {
  const p = normalizarTexto(prompt)
  if (/\b(coros?|corito|coritos)\b/.test(p)) return 'coro'
  if (/\b(himnos?|himnario)\b/.test(p)) return 'himno'
  if (/\badoracion\b/.test(p)) return 'adoracion'
  if (/\b(alabanzas?)\b/.test(p)) return 'alabanza'
  return null
}

function extraerCantidad(prompt: string): number | null {
  const p = normalizarTexto(prompt)
  const matchNum = p.match(/\b(\d{1,2})\s+(?:canciones?|cantos?|alabanzas?|himnos?|coros?|coritos?)\b/i)
  if (matchNum) return parseInt(matchNum[1], 10)

  const palabrasRegex = new RegExp(`\\b(${Object.keys(NUMEROS_PALABRA).join('|')})\\s+(?:canciones?|cantos?|alabanzas?|himnos?|coros?|coritos?)\\b`, 'i')
  const matchPalabra = p.match(palabrasRegex)
  if (matchPalabra) return NUMEROS_PALABRA[matchPalabra[1].toLowerCase()] ?? null

  if (/\bun\s+par\b/.test(p)) return 2
  return null
}

function extraerTema(prompt: string): string | null {
  const p = normalizarTexto(prompt)
  const stopwords = /\b(dame|da|das|me|te|se|nos|les|mi|mis|tu|tus|su|sus|hasme|hazme|haz|hacer|crea|creame|crear|arma|armame|armar|genera|generame|generar|busca|buscame|buscar|ponme|poneme|pon|pasame|pasa|trae|traeme|quiero|necesito|pide|pideme|elige|selecciona|seleccioname|prepara|preparame|toca|canta|cantemos|cantar|cantando|hagamos|podes|puedes|puede|podria|podrias|deberias|regalame|mandame|enviame|mostrame|ensename|decime|sugiereme|recomiendame|recomienda|colocame|un|una|unos|unas|el|la|los|las|lista|listas|popurri|popurris|medley|canciones|cancion|cantos|canto|coro|coros|alabanza|alabanzas|himno|himnos|que|sea|sean|hablen|habla|trate|traten|sobre|de|del|en|tono|tonos|tonalidad|tonalidades|clave|claves|key|para|con|y|o|por|favor|porfa|please|tiempo|tempo|ritmo|lenta|lentas|lento|lentos|rapida|rapidas|rapido|rapidos|suave|suaves|media|medias|medio|medios|alegre|alegres|movida|movidas|do|re|mi|fa|sol|la|si|sostenido|sostenidos|bemol|bemoles|mayor|mayores|menor|menores|minor|major|slow|tranquila|tranquilas|tranquilo|tranquilos|calmada|calmados|calmado|calmadas|pausada|pausados|pausado|pausadas|medium|moderada|moderados|moderado|moderadas|normal|upbeat|viva|vivas|vivo|vivos|fiesta|jubilosa|jubilosas|jubiloso|jubilosos|energetica|energeticas|energetico|energeticos|adoracion|alabanza|worship|voy|vamos|[a-g](?:#|b)?m?)\b/g

  const tema = p
    .replace(/\d+/g, ' ')
    .replace(stopwords, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return tema || null
}

// ═══════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export async function POST(req: Request) {
  try {
    const { accion, prompt, tonoOrigen, tonoDestino, cancionOrigen, cancionDestino } = await req.json()

    if (accion === 'sugerir_popurri') {
      if (!prompt || prompt.trim().length === 0) {
        return NextResponse.json({ exito: false, mensaje: 'Falta el texto de búsqueda' })
      }

      const tonalidades = extraerTonalidades(prompt)
      const cantidad = extraerCantidad(prompt)
      const tempo = extraerTempo(prompt)
      const tipo = extraerTipo(prompt)
      const tema = extraerTema(prompt)
      const modo = extraerModo(prompt)

      const supabase = await createClient()

      let query = supabase
        .from('canciones')
        .select('id, titulo, tonalidad, tempo, tipo, libro, letra, temas')

      if (tonalidades.length === 1) {
        query = query.eq('tonalidad', tonalidades[0])
      } else if (tonalidades.length > 1) {
        query = query.in('tonalidad', tonalidades)
      }

      const { data: canciones, error } = await query

      if (error) {
        if (error.message?.includes('temas')) {
          const { data: cancionesFallback, error: errorFallback } = await supabase
            .from('canciones')
            .select('id, titulo, tonalidad, tempo, tipo, libro, letra')

          if (errorFallback) {
            console.error('Error fallback:', errorFallback)
            return NextResponse.json({ exito: false, mensaje: 'Error consultando el catálogo' }, { status: 500 })
          }
          return procesarSugerencias(cancionesFallback || [], { tonalidades, cantidad, tempo, tipo, tema, modo })
        }

        console.error('Error en consulta Supabase:', error)
        return NextResponse.json({ exito: false, mensaje: 'Error consultando el catálogo' }, { status: 500 })
      }

      return procesarSugerencias(canciones || [], { tonalidades, cantidad, tempo, tipo, tema, modo })
    }

    if (accion === 'obtener_transicion') {
      if (!tonoOrigen || !tonoDestino) {
        return NextResponse.json({ exito: false, mensaje: 'Faltan las tonalidades de origen y destino' })
      }

      const transicion = sugerirTransicion(tonoOrigen, tonoDestino)

      return NextResponse.json({
        exito: true,
        transicion: cancionOrigen && cancionDestino
          ? `De "${cancionOrigen}" (${tonoOrigen}) a "${cancionDestino}" (${tonoDestino}): ${transicion}`
          : transicion,
      })
    }

    return NextResponse.json({ exito: false, mensaje: 'Acción no válida' })
  } catch (error) {
    console.error('Error en /api/popurri-ia:', error)
    return NextResponse.json({ exito: false, mensaje: 'Error interno del servidor' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════
// LÓGICA DE SUGERENCIA
// ═══════════════════════════════════════════════════════════════

function procesarSugerencias(
  canciones: any[],
  filtros: {
    tonalidades: string[]
    cantidad: number | null
    tempo: string | null
    tipo: string | null
    tema: string | null
    modo: string | null
  }
) {
  const { tonalidades, cantidad, tempo, tipo, tema, modo } = filtros
  const tonoTexto = tonalidades.length > 0 ? ` en ${tonalidades.join(' y ')}` : ''

  if (canciones.length === 0) {
    return NextResponse.json({
      exito: true,
      sugerencias: [],
      tonoPedido: tonalidades,
      explicacion: tonalidades.length
        ? `No hay canciones${tonoTexto} en tu catálogo.`
        : 'No se encontraron canciones que coincidan con la búsqueda.',
    })
  }

  let resultados: any[] = canciones

  const palabrasTema = tema
    ? normalizarTexto(tema)
        .split(' ')
        .filter((w) => w.length >= 2 && !PALABRAS_VACIAS_TEMA.has(w))
    : []
  const temaDisplay = palabrasTema.join(' ')

  if (palabrasTema.length > 0) {
    const puntuadas = resultados
      .map((c: any) => ({ cancion: c, score: puntuarTema(c, palabrasTema) }))
      .filter((x) => x.score >= 2)
      .sort((a, b) => b.score - a.score)

    if (puntuadas.length > 0) {
      resultados = puntuadas.map((x) => ({ ...x.cancion, score: x.score }))
    } else {
      return NextResponse.json({
        exito: true,
        sugerencias: [],
        tonoPedido: tonalidades,
        explicacion: `No hay canciones que hablen claramente de "${temaDisplay}"${tonoTexto} en tu catálogo.`,
      })
    }
  }

  if (modo) {
    const conModo = resultados.filter((c: any) => {
      const t = (c.tonalidad || '').trim()
      if (!t) return false
      return modo === 'menor' ? t.endsWith('m') : !t.endsWith('m')
    })
    if (conModo.length > 0) {
      resultados = conModo
    } else {
      return NextResponse.json({
        exito: true,
        sugerencias: [],
        tonoPedido: tonalidades,
        explicacion: `No hay canciones en tonos ${modo}es${tonoTexto} en tu catálogo.`,
      })
    }
  }

  if (tempo) {
    const raiz = tempo === 'rapido' ? 'rapid' : tempo === 'lento' ? 'lent' : 'medi'
    const etiqueta = tempo === 'rapido' ? 'rápidas' : tempo === 'lento' ? 'lentas' : 'de tempo medio'
    const conTempo = resultados.filter((c: any) =>
      normalizarTexto(c.tempo || '').includes(raiz)
    )
    const hayDatosTempo = resultados.some((c: any) => (c.tempo || '').trim() !== '')

    if (conTempo.length > 0) {
      resultados = conTempo
    } else if (hayDatosTempo) {
      return NextResponse.json({
        exito: true,
        sugerencias: [],
        tonoPedido: tonalidades,
        explicacion: `No hay canciones ${etiqueta}${tonoTexto} en tu catálogo.`,
      })
    }
  }

  if (tipo) {
    const conTipo = resultados.filter((c: any) =>
      normalizarTexto(c.tipo || '').includes(tipo!)
    )
    const hayDatosTipo = resultados.some((c: any) => (c.tipo || '').trim() !== '')

    if (conTipo.length > 0) {
      resultados = conTipo
    } else if (hayDatosTipo) {
      return NextResponse.json({
        exito: true,
        sugerencias: [],
        tonoPedido: tonalidades,
        explicacion: `No hay canciones de tipo ${tipo}${tonoTexto} en tu catálogo.`,
      })
    }
  }

  const sugerencias = resultados.slice(0, cantidad || 10)

  const sugerenciasConRazon = sugerencias.map((c: any) => ({
    ...c,
    razon: palabrasTema.length > 0 ? generarRazon(c, palabrasTema) : null,
  }))

  const mensajeIA = generarMensajeIA(
    temaDisplay,
    tonalidades,
    modo,
    tipo,
    tempo,
    sugerenciasConRazon.length
  )

  return NextResponse.json({
    exito: true,
    sugerencias: sugerenciasConRazon,
    tonoPedido: tonalidades,
    mensajeIA,
    explicacion: mensajeIA,
  })
}