type Calidad = 'mayor' | 'menor'

type InfoTonalidad = {
  posicion: number // 0-11 en el círculo de quintas
  calidad: Calidad
}

// Posición en el círculo de quintas: C=0, G=1, D=2, A=3, E=4, B=5, F#=6, Db=7, Ab=8, Eb=9, Bb=10, F=11
const POSICION_MAYOR: Record<string, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, Gb: 6,
  Db: 7, 'C#': 7, Ab: 8, Eb: 9, 'D#': 9, Bb: 10, F: 11,
}

// Los menores relativos comparten posición con su mayor relativo
const POSICION_MENOR: Record<string, number> = {
  Am: 0, Em: 1, Bm: 2, 'F#m': 3, 'C#m': 4, 'G#m': 5, Abm: 5,
  'D#m': 6, Ebm: 6, 'A#m': 7, Bbm: 7, Fm: 8, Cm: 9, Gm: 10, Dm: 11,
}

function analizarTonalidad(tono: string): InfoTonalidad | null {
  const limpio = tono.trim()
  if (limpio.endsWith('m') && POSICION_MENOR[limpio] !== undefined) {
    return { posicion: POSICION_MENOR[limpio], calidad: 'menor' }
  }
  if (POSICION_MAYOR[limpio] !== undefined) {
    return { posicion: POSICION_MAYOR[limpio], calidad: 'mayor' }
  }
  return null
}

export function distanciaArmonica(tonoA: string, tonoB: string): number {
  const infoA = analizarTonalidad(tonoA)
  const infoB = analizarTonalidad(tonoB)
  if (!infoA || !infoB) return 99 // tonalidad no reconocida, va al final

  const diferencia = Math.abs(infoA.posicion - infoB.posicion)
  const distanciaCirculo = Math.min(diferencia, 12 - diferencia)

  // Mismo puesto en el círculo pero distinta calidad = relativas (muy cercanas)
  if (distanciaCirculo === 0 && infoA.calidad !== infoB.calidad) return 0.5

  return distanciaCirculo
}

export function ordenarPorCercania<T extends { tonalidad: string | null }>(
  tonoBase: string,
  canciones: T[]
): T[] {
  return [...canciones].sort((a, b) => {
    const distA = a.tonalidad ? distanciaArmonica(tonoBase, a.tonalidad) : 99
    const distB = b.tonalidad ? distanciaArmonica(tonoBase, b.tonalidad) : 99
    return distA - distB
  })
}

export function sugerirTransicion(tonoOrigen: string, tonoDestino: string): string {
  const infoOrigen = analizarTonalidad(tonoOrigen)
  const infoDestino = analizarTonalidad(tonoDestino)

  if (!infoOrigen || !infoDestino) {
    return 'No se reconoce una de las tonalidades ingresadas.'
  }
  if (tonoOrigen === tonoDestino) {
    return 'Misma tonalidad: no se necesita transición.'
  }

  const distancia = distanciaArmonica(tonoOrigen, tonoDestino)

  if (distancia === 0.5) {
    return `${tonoOrigen} y ${tonoDestino} son relativas (comparten armadura). Puedes pasar directamente, o usar el acorde de ${tonoDestino} como puente en el último compás.`
  }
  if (distancia === 1) {
    return `${tonoOrigen} y ${tonoDestino} están a un paso en el círculo de quintas. Usa el acorde V7 de ${tonoDestino} como puente antes de resolver.`
  }
  if (distancia === 2) {
    return `Modulación cercana: prueba un acorde ii-V7 hacia ${tonoDestino}, o un acorde común entre ambas tonalidades como pivote.`
  }
  return `Tonalidades distantes (${tonoOrigen} → ${tonoDestino}). Se recomienda un puente instrumental de 2-4 compases o una modulación cromática gradual.`
}