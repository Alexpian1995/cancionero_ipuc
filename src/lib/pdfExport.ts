import jsPDF from 'jspdf'

type CancionParaPDF = {
  titulo: string
  tonalidadOriginal: string
  tonalidadActual: string
  letraConAcordes: string
  transicionSugerida?: string
}

type OpcionesExport = {
  titulo: string
  lider?: string
  canciones: CancionParaPDF[]
  modo: 'musico' | 'cantante'
  orientacion: 'portrait' | 'landscape'
}

// Tipo RGB como TUPLA (3 números exactos) para tipado estricto
type RGB = [number, number, number]

// Regex para detectar líneas que son solo acordes
const TOKEN_ACORDE = /^[A-G][#b]?(?:m7b5|maj7|min7|m7|dim7|aug7|sus[24]|add9|maj|min|dim|aug|m|\d+)*(?:\/[A-G][#b]?)?$/

function esLineaDeAcordes(linea: string): boolean {
  const palabras = linea.trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return false
  const acordes = palabras.filter((p) => TOKEN_ACORDE.test(p))
  return acordes.length > 0 && acordes.length / palabras.length >= 0.8
}

// Elimina líneas de acordes (para modo cantante)
function quitarAcordes(texto: string): string {
  return texto
    .split('\n')
    .filter((linea) => !esLineaDeAcordes(linea))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
}

// Divide el texto en estrofas (bloques separados por línea vacía)
function dividirEnEstrofas(texto: string): string[][] {
  const lineas = texto.split('\n')
  const estrofas: string[][] = []
  let bloque: string[] = []

  for (const linea of lineas) {
    if (linea.trim() === '') {
      if (bloque.length > 0) {
        estrofas.push(bloque)
        bloque = []
      }
    } else {
      bloque.push(linea)
    }
  }
  if (bloque.length > 0) estrofas.push(bloque)

  return estrofas
}

export async function exportarPopurriAPDF(opciones: OpcionesExport) {
  const { titulo, lider, canciones, modo, orientacion } = opciones

  const pdf = new jsPDF({
    orientation: orientacion,
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const marginX = 15
  const marginY = 15
  const contentWidth = pageWidth - marginX * 2
  const esPaisaje = orientacion === 'landscape'

  // ═══ COLORES (tipados como tupla RGB) ═══
  const AZUL: RGB = [15, 44, 76]
  const DORADO: RGB = [217, 165, 68]
  const GRIS: RGB = [100, 116, 139]
  const NEGRO: RGB = [30, 41, 59]
  const ACORDE_COLOR: RGB = [27, 95, 168]
  const AMBAR_FONDO: RGB = [254, 249, 195]
  const AMBAR_BORDE: RGB = [253, 230, 138]
  const AMBAR_TEXTO: RGB = [120, 53, 15]
  const SLATE_BG: RGB = [248, 250, 252]
  const LINEA: RGB = [226, 232, 240]

  // ═══ HELPER: footer de página ═══
  const dibujarFooter = (numPagina: number) => {
    pdf.setFontSize(8)
    pdf.setTextColor(GRIS[0], GRIS[1], GRIS[2])
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Cancionero IPUC · ${titulo}`, marginX, pageHeight - 8)
    pdf.text(`Página ${numPagina}`, pageWidth - marginX, pageHeight - 8, { align: 'right' })
  }

  // ═══════════════════════════════════════════════════
  // PORTADA
  // ═══════════════════════════════════════════════════
  let y = marginY + 30

  pdf.setFillColor(AZUL[0], AZUL[1], AZUL[2])
  pdf.rect(0, 0, pageWidth, 60, 'F')

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Cancionero IPUC', marginX, 22)

  pdf.setTextColor(DORADO[0], DORADO[1], DORADO[2])
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Popurrí de Adoración', marginX, 30)

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(esPaisaje ? 28 : 24)
  pdf.setFont('helvetica', 'bold')
  const tituloCorto = titulo.length > 50 ? titulo.slice(0, 48) + '...' : titulo
  pdf.text(tituloCorto, marginX, 50)

  y = 80

  pdf.setTextColor(NEGRO[0], NEGRO[1], NEGRO[2])
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'normal')

  if (lider) {
    pdf.setTextColor(GRIS[0], GRIS[1], GRIS[2])
    pdf.setFont('helvetica', 'bold')
    pdf.text('LÍDER:', marginX, y)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(NEGRO[0], NEGRO[1], NEGRO[2])
    pdf.text(lider, marginX + 20, y)
    y += 8
  }

  pdf.setTextColor(GRIS[0], GRIS[1], GRIS[2])
  pdf.setFont('helvetica', 'bold')
  pdf.text('FECHA:', marginX, y)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(NEGRO[0], NEGRO[1], NEGRO[2])
  pdf.text(new Date().toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric'
  }), marginX + 20, y)
  y += 8

  pdf.setTextColor(GRIS[0], GRIS[1], GRIS[2])
  pdf.setFont('helvetica', 'bold')
  pdf.text('MODO:', marginX, y)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(NEGRO[0], NEGRO[1], NEGRO[2])
  pdf.text(modo === 'musico' ? 'Músico (con acordes)' : 'Cantante (solo letra)', marginX + 20, y)
  y += 8

  pdf.setTextColor(GRIS[0], GRIS[1], GRIS[2])
  pdf.setFont('helvetica', 'bold')
  pdf.text('CANCIONES:', marginX, y)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(NEGRO[0], NEGRO[1], NEGRO[2])
  pdf.text(`${canciones.length}`, marginX + 28, y)
  y += 15

  // Tabla de contenido
  pdf.setDrawColor(LINEA[0], LINEA[1], LINEA[2])
  pdf.setLineWidth(0.3)
  pdf.line(marginX, y, pageWidth - marginX, y)
  y += 8

  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(AZUL[0], AZUL[1], AZUL[2])
  pdf.text('Repertorio', marginX, y)
  y += 10

  pdf.setFontSize(11)
  canciones.forEach((c, idx) => {
    if (y > pageHeight - 30) {
      pdf.addPage()
      y = marginY
    }

    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(NEGRO[0], NEGRO[1], NEGRO[2])
    const tituloCancion = c.titulo.length > 60 ? c.titulo.slice(0, 58) + '...' : c.titulo
    pdf.text(`${idx + 1}. ${tituloCancion}`, marginX, y)

    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(DORADO[0], DORADO[1], DORADO[2])
    pdf.text(c.tonalidadActual, pageWidth - marginX, y, { align: 'right' })

    y += 7
  })

  dibujarFooter(1)

  // ═══════════════════════════════════════════════════
  // PÁGINAS DE CANCIONES
  // ═══════════════════════════════════════════════════
  let numPagina = 2

  canciones.forEach((cancion, idxCancion) => {
    pdf.addPage()
    numPagina++
    y = marginY

    // Encabezado de canción
    pdf.setFillColor(SLATE_BG[0], SLATE_BG[1], SLATE_BG[2])
    pdf.rect(0, 0, pageWidth, 28, 'F')

    pdf.setFontSize(esPaisaje ? 18 : 16)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(AZUL[0], AZUL[1], AZUL[2])
    const t = cancion.titulo.length > 70 ? cancion.titulo.slice(0, 68) + '...' : cancion.titulo
    pdf.text(`${idxCancion + 1}. ${t}`, marginX, 15)

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(DORADO[0], DORADO[1], DORADO[2])
    pdf.text(`Tono: ${cancion.tonalidadActual}`, pageWidth - marginX, 15, { align: 'right' })

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(GRIS[0], GRIS[1], GRIS[2])
    if (cancion.tonalidadOriginal !== cancion.tonalidadActual) {
      pdf.text(`Original: ${cancion.tonalidadOriginal}`, marginX, 22)
    }

    y = 36

    // Transición sugerida
    if (cancion.transicionSugerida) {
      pdf.setFillColor(AMBAR_FONDO[0], AMBAR_FONDO[1], AMBAR_FONDO[2])
      pdf.setDrawColor(AMBAR_BORDE[0], AMBAR_BORDE[1], AMBAR_BORDE[2])
      pdf.roundedRect(marginX, y, contentWidth, 10, 1, 1, 'FD')
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(AMBAR_TEXTO[0], AMBAR_TEXTO[1], AMBAR_TEXTO[2])
      const transicion = cancion.transicionSugerida.length > 120
        ? cancion.transicionSugerida.slice(0, 118) + '...'
        : cancion.transicionSugerida
      pdf.text(`Transición: ${transicion}`, marginX + 3, y + 6)
      y += 15
    }

    // Preparar el texto
    const textoBase = modo === 'cantante'
      ? quitarAcordes(cancion.letraConAcordes)
      : cancion.letraConAcordes

    const estrofas = dividirEnEstrofas(textoBase)
    const alturaMaxima = pageHeight - marginY - 10

    // Configuración de fuente según modo
    if (modo === 'musico') {
      pdf.setFont('courier', 'normal')
      pdf.setFontSize(esPaisaje ? 10 : 9.5)
    } else {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(esPaisaje ? 12 : 11)
    }

    const lineHeight = modo === 'musico' ? 4.5 : 5.2

    estrofas.forEach((estrofa) => {
      const alturaEstrofa = estrofa.length * lineHeight + 5

      if (y + alturaEstrofa > alturaMaxima) {
        dibujarFooter(numPagina)
        pdf.addPage()
        numPagina++
        y = marginY
      }

      estrofa.forEach((linea) => {
        const esAcorde = modo === 'musico' && esLineaDeAcordes(linea)

        if (esAcorde) {
          pdf.setFont('courier', 'bold')
          pdf.setTextColor(ACORDE_COLOR[0], ACORDE_COLOR[1], ACORDE_COLOR[2])
        } else if (modo === 'cantante') {
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(NEGRO[0], NEGRO[1], NEGRO[2])
        } else {
          pdf.setFont('courier', 'normal')
          pdf.setTextColor(NEGRO[0], NEGRO[1], NEGRO[2])
        }

        const maxChars = modo === 'musico' ? 80 : 70
        const texto = linea.length > maxChars ? linea.slice(0, maxChars - 2) + '..' : linea
        pdf.text(texto || ' ', marginX, y)

        y += lineHeight
      })

      y += 3
    })

    dibujarFooter(numPagina)
  })

  // ═══ GUARDAR ═══
  const fecha = new Date().toISOString().split('T')[0]
  const nombreArchivo = `${titulo.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${fecha}.pdf`
  pdf.save(nombreArchivo)
}