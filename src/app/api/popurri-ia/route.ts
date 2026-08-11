import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sugerirTransicion } from '@/lib/tonalidades'

export async function POST(req: Request) {
  try {
    const { accion, prompt, tonoOrigen, tonoDestino, cancionOrigen, cancionDestino } = await req.json()

    if (accion === 'sugerir_popurri') {
      if (!prompt || prompt.trim().length === 0) {
        return NextResponse.json({ exito: false, mensaje: 'Falta el texto de búsqueda' })
      }

      const supabase = await createClient()
      const promptMinus = prompt
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")

      // 1. Extraer Tono
      const tonoMatch = promptMinus.match(/(?:tono|en)\s+([a-g][#b]?)\b/i)
      const tonoBuscado = tonoMatch ? tonoMatch[1].toUpperCase() : null

      // 2. Extraer Tempo
      let tempoBuscado: string | null = null
      if (/lenta|lentas|lento|lentos|suave/.test(promptMinus)) tempoBuscado = 'lento'
      if (/rapida|rapidas|rapido|rapidos|alegre/.test(promptMinus)) tempoBuscado = 'rapido'

      // 3. Limpiar stopwords, tipos de formato y palabras de control
      const palabrasLimpia = promptMinus
        .replace(/\b(dame|una|un|lista|listas|popurri|medley|canciones|cancion|coro|coros|alabanza|alabanzas|himno|himnos|que|sea|sean|hablen|habla|en|tono|de|del|sobre|para|con|la|las|los|y|por|tiempo|tempo|ritmo|lenta|lentas|lento|lentos|rapida|rapidas|rapido|rapidos)\b/g, '')
        .trim()
        .split(/\s+/)
        .filter((p: string) => p.length >= 2)

      // 4. Traer catálogo completo de Supabase
      let query = supabase.from('canciones').select('id, titulo, tonalidad, tempo, tipo, libro, letra')

      if (tonoBuscado) {
        query = query.eq('tonalidad', tonoBuscado)
      }

      const { data: canciones, error } = await query

      if (error) {
        console.error('Error en consulta Supabase:', error)
        return NextResponse.json({ exito: false, mensaje: 'Error consultando el catálogo' }, { status: 500 })
      }

      if (!canciones || canciones.length === 0) {
        return NextResponse.json({
          exito: true,
          sugerencias: [],
          explicacion: `No se encontraron canciones que coincidan con la búsqueda.`,
        })
      }

      // 5. Filtrar en memoria
      const resultados = canciones.filter((c: any) => {
        const tituloNorm = (c.titulo || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        const letraNorm = (c.letra || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        
        // Normalización de tildes para el campo `tempo` en BD
        const tempoCancion = (c.tempo || '')
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")

        const textoCompleto = `${tituloNorm} ${letraNorm}`

        // Si se pidió un tempo específico, verificar coincidencia
        if (tempoBuscado && tempoCancion) {
          const coincideTempo = tempoBuscado === 'lento' 
            ? ['lento', 'lenta', 'suave', 'medio'].some(t => tempoCancion.includes(t))
            : ['rapido', 'rapida', 'alegre'].some(t => tempoCancion.includes(t))

          if (!coincideTempo) return false
        }

        // Si quedaron palabras clave de temática específica (ej: "fidelidad", "dios"), filtrar por texto
        if (palabrasLimpia.length > 0) {
          return palabrasLimpia.some((kw: string) => textoCompleto.includes(kw))
        }

        return true
      })

      return NextResponse.json({
        exito: true,
        sugerencias: resultados.slice(0, 10),
        explicacion: resultados.length > 0
          ? `Se encontraron ${resultados.length} canción(es) que coinciden con los criterios.`
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