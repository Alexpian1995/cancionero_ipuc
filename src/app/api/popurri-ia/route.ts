import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sugerirTransicion } from '@/lib/tonalidades'

// ═══════════════════════════════════════════════════════════════
// PARSER UNIVERSAL DE PROMPTS
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

// ═══════════════════════════════════════════════════════════════
// EXTRACCIÓN DE TONALIDADES
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

  const stopwords = /\b(dame|da|das|me|te|se|nos|les|mi|mis|tu|tus|su|sus|hasme|hazme|haz|hacer|crea|creame|crear|arma|armame|armar|genera|generame|generar|busca|buscame|buscar|ponme|poneme|pon|pasame|pasa|trae|traeme|quiero|necesito|pide|pideme|elige|selecciona|seleccioname|prepara|preparame|toca|canta|cantemos|cantar|cantando|hagamos|podes|puedes|puede|podria|podrias|deberias|regalame|mandame|enviame|mostrame|ensename|decime|sugiereme|recomiendame|recomienda|colocame|un|una|unos|unas|el|la|los|las|lista|listas|popurri|popurris|medley|canciones|cancion|cantos|canto|coro|coros|alabanza|alabanzas|himno|himnos|que|sea|sean|hablen|habla|trate|traten|sobre|de|del|en|tono|tonalidad|clave|key|para|con|y|o|por|favor|porfa|please|tiempo|tempo|ritmo|lenta|lentas|lento|lentos|rapida|rapidas|rapido|rapidos|suave|suaves|media|medias|medio|medios|alegre|alegres|movida|movidas|do|re|mi|fa|sol|la|si|sostenido|sostenidos|bemol|bemoles|mayor|mayores|menor|menores|minor|major|slow|tranquila|tranquilas|tranquilo|tranquilos|calmada|calmados|calmado|calmadas|pausada|pausados|pausado|pausadas|medium|moderada|moderados|moderado|moderadas|normal|upbeat|viva|vivas|vivo|vivos|fiesta|jubilosa|jubilosas|jubiloso|jubilosos|energetica|energeticas|energetico|energeticos|adoracion|alabanza|worship|voy|vamos|[a-g](?:#|b)?m?)\b/g

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

      const supabase = await createClient()

      let query = supabase
        .from('canciones')
        .select('id, titulo, tonalidad, tempo, tipo, libro, letra')

      if (tonalidades.length === 1) {
        query = query.eq('tonalidad', tonalidades[0])
      } else if (tonalidades.length > 1) {
        query = query.in('tonalidad', tonalidades)
      }

      const { data: canciones, error } = await query

      if (error) {
        console.error('Error en consulta Supabase:', error)
        return NextResponse.json({ exito: false, mensaje: 'Error consultando el catálogo' }, { status: 500 })
      }

      const tonoTexto = tonalidades.length > 0 ? ` en ${tonalidades.join(' y ')}` : ''

      if (!canciones || canciones.length === 0) {
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

      // ─── TEMA (con red de seguridad) ───
      if (tema) {
        const temaNorm = normalizarTexto(tema)
        const conTema = resultados.filter((c: any) => {
          const textoCompleto = `${normalizarTexto(c.titulo || '')} ${normalizarTexto(c.letra || '')}`
          return temaNorm.split(' ').some((palabra) => textoCompleto.includes(palabra))
        })
        if (conTema.length > 0) resultados = conTema
      }

      // ─── TEMPO: estricto si hay datos, vacío si no coincide ───
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
          // Hay tempos cargados pero ninguno coincide → VACÍO
          return NextResponse.json({
            exito: true,
            sugerencias: [],
            tonoPedido: tonalidades,
            explicacion: `No hay canciones ${etiqueta}${tonoTexto} en tu catálogo.`,
          })
        }
        // Si ninguna tiene tempo cargado, no filtrar (no hay datos)
      }

      // ─── TIPO: estricto si hay datos, vacío si no coincide ───
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

      return NextResponse.json({
        exito: true,
        sugerencias,
        tonoPedido: tonalidades,
        explicacion: sugerencias.length > 0
          ? `Se encontraron ${sugerencias.length} canción(es)${tonoTexto}${tema ? ` sobre ${tema}` : ''}.`
          : `No se encontraron canciones que coincidan con la búsqueda.`,
      })
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