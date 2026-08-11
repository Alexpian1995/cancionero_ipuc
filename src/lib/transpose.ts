const NOTAS_SOSTENIDOS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const NOTAS_BEMOLES    = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

const TONOS_BEMOLES = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm']

export function transponerNotaIndividual(nota: string, semitonos: number, preferirBemoles: boolean = false): string {
  if (!nota) return nota
  const notaLimpia = nota.trim()
  
  let index = NOTAS_SOSTENIDOS.indexOf(notaLimpia)
  if (index === -1) {
    index = NOTAS_BEMOLES.indexOf(notaLimpia)
  }

  if (index === -1) return nota

  let nuevoIndex = (index + semitonos) % 12
  if (nuevoIndex < 0) nuevoIndex += 12

  const escalaTarget = preferirBemoles ? NOTAS_BEMOLES : NOTAS_SOSTENIDOS
  return escalaTarget[nuevoIndex]
}

export function transponerNota(acorde: string, semitonos: number, tonoBase: string = 'E'): string {
  if (semitonos === 0 || !acorde) return acorde

  // Determinar si en la nueva tonalidad conviene usar bemoles
  const tonoTranspuesto = transponerNotaIndividual(tonoBase.replace(/m$/, ''), semitonos)
  const preferirBemoles = TONOS_BEMOLES.includes(tonoTranspuesto)

  // Separar nota raíz y sufijo (ej: "F#m7" -> "F#", "m7")
  const match = acorde.match(/^([A-G][b#]?)(.*)$/)
  if (!match) return acorde

  const [, raiz, sufijo] = match
  const nuevaRaiz = transponerNotaIndividual(raiz, semitonos, preferirBemoles)

  return `${nuevaRaiz}${sufijo}`
}