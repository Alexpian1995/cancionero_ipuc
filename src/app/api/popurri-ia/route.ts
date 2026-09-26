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
// GRUPOS SEMÁNTICOS CRISTIANOS (45+ temas de iglesia)
// ═══════════════════════════════════════════════════════════════

type GrupoTema = { claves: string[]; sinonimos: string[]; raices: string[] }

const GRUPOS_TEMA: GrupoTema[] = [
  // ─── 🌟 UNICIDAD DE DIOS (doctrina central IPUC) ───
  {
    claves: [
      'unicidad', 'uno', 'unico Dios', 'un solo Dios', 'Dios es uno',
      'deidad', 'deidad de Cristo', 'plenitud de la deidad',
      'Jesucristo es Dios', 'Jesus es Dios', 'Cristo es Dios',
      'Dios manifestado en carne', 'Dios en carne', 'manifestacion',
      'Padre en Cristo', 'el Padre es Jesus', 'el Padre es el Hijo',
      'uno es su nombre', 'su nombre es Jesus', 'nombre de Jesus',
      'Jehova es Jesus', 'YHWH', 'YO SOY', 'Emanuel', 'Dios con nosotros',
      'monoteismo', 'no trinidad', 'un solo Señor', 'un solo nombre'
    ],
    sinonimos: [
      'Dios es uno solo', 'el nombre sobre todo nombre', 'Colosenses 2:9',
      'un solo Dios verdadero', 'la deidad habita en Cristo'
    ],
    raices: ['unic', 'deidad', 'manifest']
  },

  // ───  EVANGELISMO EXPANDIDO (llamado al altar, predicación) ───
  {
    claves: [
      'evangelismo', 'evangelio', 'evangelizar', 'buenas nuevas', 'mensaje de salvacion',
      'mision', 'misiones', 'testigo', 'predicar', 'anunciar', 'predicacion',
      'ven a Cristo', 'ven a Jesus', 'ven', 'acercate', 'acercarse', 'llamado', 'invitacion',
      'Cristo te ama', 'Jesus te ama', 'amor de Dios', 'amor de Cristo', 'amor incondicional',
      'amigo', 'amistad', 'Cristo es mi amigo', 'Jesus es mi amigo',
      'pecador', 'pecadora', 'pecadores', 'perdido', 'perdida', 'alejado', 'extraviado',
      'arrepentimiento', 'arrepentirse', 'volverse a Dios', 'conversion',
      'salvacion', 'salvar', 'salvador', 'salvo', 'salva',
      'redencion', 'redimir', 'redentor', 'rescate', 'rescatar', 'rescatado',
      'libertad', 'libre', 'liberar', 'liberacion', 'cadenas rotas', 'romper cadenas',
      'perdon', 'perdonar', 'perdonado', 'limpio', 'lavado', 'purificado',
      'nueva vida', 'nueva criatura', 'nacer de nuevo', 'nuevo nacimiento', 'transformacion',
      'gracia', 'misericordia', 'clemencia',
      'sangre de Cristo', 'sangre de Jesus', 'sangre que limpia',
      'cruz', 'calvario', 'sacrificio', 'precio pagado',
      'bautismo', 'bautizar', 'bautizado', 'aguas', 'en el nombre de Jesus',
      'recibir a Cristo', 'aceptar a Cristo', 'entregar vida', 'rendir vida',
      'llamado al altar', 'pase al frente', 'decision',
      'oye', 'escucha', 'ven a el', 'ven hoy', 'acercate a dios',
      'entregas tu vida', 'entregale tu vida', 'dale tu vida', 'rendir tu vida',
      'el te ama', 'el te quiere', 'te quiere ayudar', 'quiere cambiar tu vida',
      'cambiar tu vida', 'nueva oportunidad', 'hoy es el dia',
      'segunda venida', 'viene a buscar', 'viene por su iglesia', 'no se tarda',
      'volar al cielo', 'se pierda', 'que nadie se pierda'
    ],
    sinonimos: [
      'ganar almas', 'alma', 'almas', 'proposito eterno',
      'hijo prodigo', 'la oveja perdida', 'el buen pastor'
    ],
    raices: ['evangel', 'salv', 'redim', 'liber', 'perdon', 'rescat', 'pecad', 'amig', 'nuev', 'arrepient', 'convert', 'invit', 'llamad', 'bautiz', 'acerc']
  },

  // ─── FE Y RELACIÓN CON DIOS ───
  { claves: ['fe', 'creer', 'confiar', 'confianza', 'creo'], sinonimos: ['fiar'], raices: ['confi'] },
  { claves: ['esperanza', 'esperar', 'futuro', 'promesa', 'promesas'], sinonimos: ['manana', 'anhelo'], raices: ['esper'] },
  { claves: ['amor', 'amar', 'amado', 'amada', 'querer', 'carino'], sinonimos: [], raices: [] },
  { claves: ['gracia', 'favor', 'misericordia', 'compasion', 'bondad'], sinonimos: [], raices: [] },
  { claves: ['paz', 'tranquilidad', 'calma', 'sosiego', 'reposo', 'descanso'], sinonimos: ['shalom'], raices: [] },
  { claves: ['gozo', 'alegria', 'jubilo', 'feliz', 'regocijo', 'celebrar', 'contento'], sinonimos: ['gozoso', 'felices'], raices: ['goz'] },
  { claves: ['fidelidad', 'fiel', 'cumple', 'prometido', 'lealtad'], sinonimos: [], raices: ['fidel'] },
  { claves: ['santidad', 'santo', 'puro', 'limpio', 'apartado'], sinonimos: [], raices: ['sant'] },
  { claves: ['humildad', 'humilde', 'sencillo', 'manso'], sinonimos: [], raices: ['humill'] },
  { claves: ['paciencia', 'paciente', 'esperar', 'longanimidad'], sinonimos: [], raices: ['pacien'] },
  { claves: ['sabiduria', 'sabio', 'entendimiento', 'discernimiento'], sinonimos: [], raices: [] },
  { claves: ['obediencia', 'obedecer', 'cumplir', 'someterse'], sinonimos: [], raices: ['obedec'] },

  // ─── GRATITUD ───
  { claves: ['gracias', 'agradecimiento', 'gratitud', 'agradecer', 'grato', 'dar gracias'], sinonimos: ['reconocido'], raices: ['agradec'] },

  // ─── VICTORIA ───
  { claves: ['victoria', 'triunfo', 'vencedor', 'conquistar'], sinonimos: [], raices: [] },

  // ─── ADORACIÓN Y ALABANZA ───
  { claves: ['adoracion', 'adorar', 'postrarse', 'rendirse', 'reverencia'], sinonimos: [], raices: ['ador'] },
  { claves: ['alabanza', 'alabar', 'exaltar', 'magnificar', 'exaltacion'], sinonimos: [], raices: ['alab'] },
  { claves: ['ofrenda', 'diezmo', 'dar', 'generosidad', 'generoso'], sinonimos: [], raices: [] },

  // ─── CRUZ, PASIÓN Y RESURRECCIÓN ───
  { claves: ['cruz', 'calvario', 'madero', 'crucificado', 'pasion'], sinonimos: ['getsemani'], raices: [] },
  { claves: ['sangre', 'derramada', 'cordero', 'expiacion'], sinonimos: [], raices: [] },
  { claves: ['resurreccion', 'resucito', 'resucitar', 'vive', 'levanto', 'sepulcro vacio'], sinonimos: [], raices: ['resucit'] },

  // ─── NOMBRE DE JESÚS ───
  { claves: ['nombre', 'jesus', 'yeshua', 'cristo', 'senor de senores', 'rey de reyes'], sinonimos: ['nombre sobre todo nombre'], raices: [] },

  // ─── ESPÍRITU SANTO ───
  { claves: ['espiritu', 'fuego', 'llama', 'consolador', 'espiritu santo', 'espiritu de Dios', 'don del espiritu'], sinonimos: ['paracleto', 'lenguas'], raices: [] },

  // ─── DIOS Y SUS ATRIBUTOS ───
  { claves: ['padre', 'papa', 'abba', 'papito'], sinonimos: [], raices: [] },
  { claves: ['poder', 'poderoso', 'fuerte', 'fortaleza', 'omnipotente'], sinonimos: [], raices: [] },
  { claves: ['gloria', 'glorioso', 'majestad', 'majestuoso'], sinonimos: [], raices: ['glor'] },

  // ─── PROTECCIÓN Y REFUGIO ───
  { claves: ['refugio', 'esconder', 'proteccion', 'amparo', 'refugiarse', 'escondedero'], sinonimos: [], raices: [] },
  { claves: ['escudo', 'defensa', 'guardar', 'custodiar', 'proteger'], sinonimos: [], raices: [] },
  { claves: ['guia', 'guiar', 'camino', 'direccion', 'conducir', 'sendero'], sinonimos: [], raices: [] },
  { claves: ['pastor', 'oveja', 'ovejas', 'apacentar', 'cuidado'], sinonimos: [], raices: [] },

  // ─── CONSUELO Y AYUDA ───
  { claves: ['consuelo', 'consolar', 'alivio', 'confortar', 'consolador'], sinonimos: [], raices: ['consuel', 'consol'] },
  { claves: ['sanidad', 'sanar', 'sanador', 'curacion', 'curar', 'salud'], sinonimos: [], raices: ['san', 'cur'] },
  { claves: ['provision', 'proveer', 'sustento', 'abastecer', 'jireh'], sinonimos: [], raices: ['prove'] },
  { claves: ['presencia', 'cerca', 'acompana', 'junto a mi', 'aqui estas'], sinonimos: [], raices: [] },

  // ─── COSECHA Y LUZ ───
  { claves: ['cosecha', 'segar', 'sembrar', 'siembra', 'fruto', 'frutos'], sinonimos: [], raices: [] },
  { claves: ['luz', 'luminoso', 'brillar', 'iluminar', 'antorcha', 'sal'], sinonimos: [], raices: [] },

  // ─── CREACIÓN (tema lírico, distinto de "infantil") ───
  { claves: ['creacion', 'crear', 'universo', 'estrellas', 'luna', 'sol', 'naturaleza', 'cielos', 'montes'], sinonimos: [], raices: ['crea'] },

  // ─── FAMILIA Y RELACIONES ───
  { claves: ['familia', 'hogar', 'casa', 'matrimonio', 'esposos', 'boda', 'aniversario'], sinonimos: [], raices: [] },
  { claves: ['hijos', 'hijo', 'hija', 'hijas', 'padres', 'madre', 'papa', 'mama'], sinonimos: [], raices: [] },
  { claves: ['unidad', 'unidad de la iglesia', 'iglesia', 'comunidad', 'hermandad', 'cuerpo', 'hermanos'], sinonimos: [], raices: [] },

  // ─── SANTA CENA ───
  { claves: ['santa cena', 'comunion', 'cena del senor', 'partir el pan', 'copa', 'pan'], sinonimos: [], raices: [] },

  // ─── ORACIÓN Y VIDA ESPIRITUAL ───
  { claves: ['oracion', 'orar', 'rezar', 'clamar', 'pedir', 'intercesion'], sinonimos: [], raices: ['or'] },
  { claves: ['ayuno', 'ayunar', 'sacrificio', 'disciplina'], sinonimos: [], raices: ['ayun'] },
  { claves: ['palabra', 'biblia', 'escritura', 'versiculo', 'evangelio escrito'], sinonimos: [], raices: [] },
  { claves: ['uncion', 'ungir', 'aceite', 'derramar'], sinonimos: [], raices: ['ung', 'unci'] },

  // ─── HECHOS 2:38 (doctrina IPUC) ───
  { claves: ['Hechos 2:38', 'Hechos dos treinta y ocho', 'nuevo nacimiento', 'nacer de nuevo', 'plan de salvacion'], sinonimos: [], raices: [] },

  // ─── TIEMPOS ESPECIALES ───
  { claves: ['navidad', 'nacimiento', 'pesebre', 'belen', 'reyes magos', 'pastores', 'angel', 'estrella'], sinonimos: [], raices: ['navid'] },
  { claves: ['pascua', 'semana santa', 'cuaresma', 'viernes santo'], sinonimos: [], raices: [] },

  // ─── AVIVAMIENTO Y GUERRA ESPIRITUAL ───
  { claves: ['avivamiento', 'avivar', 'fuego', 'llama', 'renovar', 'despertar'], sinonimos: [], raices: ['aviv'] },
  { claves: ['guerra espiritual', 'batalla', 'armadura', 'enemigo', 'diablo', 'satanas', 'tinieblas', 'demonio'], sinonimos: [], raices: [] },
  { claves: ['segunda venida', 'venida', 'arrebatamiento', 'cielo nuevo', 'eternidad', 'recogida'], sinonimos: [], raices: [] },

  // ─── IDENTIDAD Y METÁFORAS BÍBLICAS ───
  { claves: ['agua viva', 'rio', 'fuente', 'manantial', 'sed'], sinonimos: [], raices: [] },
  { claves: ['pan de vida', 'pan', 'alimento', 'hambre'], sinonimos: [], raices: [] },
  { claves: ['vid', 'parra', 'ramas', 'fruto', 'permanecer'], sinonimos: [], raices: [] },
  { claves: ['puerta', 'camino', 'verdad', 'roca', 'piedra angular'], sinonimos: [], raices: [] },
  { claves: ['reino', 'reino de Dios', 'trono', 'gobernar', 'rey'], sinonimos: [], raices: [] },
  { claves: ['lluvia', 'bendicion', 'bendecir', 'abundancia'], sinonimos: [], raices: ['bend'] },
]

const INDICE_GRUPOS = new Map<string, GrupoTema[]>()
for (const grupo of GRUPOS_TEMA) {
  for (const palabra of [...grupo.claves, ...grupo.sinonimos]) {
    const lista = INDICE_GRUPOS.get(palabra) || []
    lista.push(grupo)
    INDICE_GRUPOS.set(palabra, lista)
  }
}

function variantesDeGrupo(grupo: GrupoTema) {
  const raices = grupo.raices || []
  const exactas = [...new Set([...grupo.claves, ...grupo.sinonimos])].filter(
    (v) => !raices.some((r) => v.startsWith(r))
  )
  return { exactas, raices }
}

const PALABRAS_VACIAS_TEMA = new Set([
  'dios', 'senor', 'jesus', 'cristo', 'aleluya', 'amen', 'cielo', 'tierra',
  'corazon', 'alma', 'vida', 'mundo', 'hoy', 'siempre', 'eterno'
])

// ═══════════════════════════════════════════════════════════════
// DETECTOR DE ESTILO INFANTIL (heurísticas de lenguaje)
// ═══════════════════════════════════════════════════════════════

const VOCABULARIO_INFANTIL = [
  'animalitos', 'arbolitos',  'mamita', 'papito', 'manitos',
  'ojitos', 'corazoncito', 'amiguito', 'amiguitos', 'ninito', 'pequenito',
  'cabecita', 'deditos', 'piececitos', 'sonrisita','dominical', 'escuela dominical',
   'ebd', 'ninos', 'infantil', 'cancioncita', 'enseñar', 'aprendizaje', 'aprender', 
   'juguetes', 'jugar', 'diversion', 'divertido', 'divertida', 'cantar', 'cantando',
    'cancioncita','pajaritos', 'pajarito', 'pajaritos', 'arcoiris', 'colores', 
    'dibujos', 'dibujar', 'valiente', 'valientes', 'valentia',
     'valentia','trenecito', 'barquito', 'barquitos','biblia', 'biblico', 'biblica', 'biblicos', 
     'biblicas', 'biblicamente', 'yoyo', 'pelota', 'pelotas', 'pelotita', 'pelotitas', 'globito', 
     'globitos','noe', 'abrham', 'moises', 'jonas', 'daniel', 'david', 'goliat', 'samuel',
      'telefono','arca','mono','perrito','gatito','conejo','pajarito','pajaritos',
      'caballito','caballitos','manitos','dedito','deditos','piecito','piececitos','ojito','ojitos',
      'narizita','narizitas','mar','peces','pecesitos','pecesito','cielito','cielitos'
      
]

const HISTORIAS_BIBLICAS_INFANTILES: [RegExp, number][] = [
  [/\bnoe\b[\s\S]{0,80}\barca\b|\barca\b[\s\S]{0,80}\bnoe\b/i, 2],
  [/\bdaniel\b[\s\S]{0,80}\bleones\b/i, 2],
  [/\bjonas\b[\s\S]{0,80}\bballena\b|\bballena\b[\s\S]{0,80}\bjonas\b/i, 2],
  [/\bdavid\b[\s\S]{0,80}\bgoliat\b/i, 2],
  [/\bsamuel\b[\s\S]{0,60}\bnino\b|\bnino\b[\s\S]{0,60}\bsamuel\b/i, 2],
]

function detectarEstiloInfantil(letra: string): number {
  const texto = normalizarTexto(letra || '')
  if (!texto) return 0

  let score = 0

  const diminutivos = texto.match(/\b[a-z]+(?:ito|ita|itos|itas)\b/g) || []
  const diminutivosUnicos = new Set(diminutivos)
  score += Math.min(diminutivosUnicos.size, 4) * 1.5

  for (const palabra of VOCABULARIO_INFANTIL) {
    if (texto.includes(palabra)) score += 2
  }

  for (const [patron, puntos] of HISTORIAS_BIBLICAS_INFANTILES) {
    if (patron.test(texto)) score += puntos
  }

  if (/\bpor fe yo se\b|\byo se que mi dios\b|\bjesus me ama\b|\bdios me ama\b/.test(texto)) score += 2

  return score
}

function esCancionInfantil(cancion: any): boolean {
  const tipoBD = normalizarTexto(cancion.tipo || '')
  const tags: string[] = Array.isArray(cancion.temas)
    ? cancion.temas.map((t: string) => normalizarTexto(t))
    : []
  if (tipoBD.includes('infantil')) return true
  if (tags.some((t) => ['infantil', 'infantiles', 'ninos', 'escuela dominical', 'ebd'].includes(t))) return true
  return detectarEstiloInfantil(cancion.letra) >= 4
}

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
  const gruposProcesados = new Set<any>()

  for (const palabra of palabrasTema) {
    const grupos = INDICE_GRUPOS.get(palabra) || []
    const lista = grupos.length > 0
      ? grupos
      : [{ claves: [palabra], sinonimos: [], raices: [] } as GrupoTema]

    for (const grupo of lista) {
      const id = grupos.length > 0 ? grupo : `simple:${palabra}`
      if (gruposProcesados.has(id)) continue
      gruposProcesados.add(id)

      const { exactas, raices } = variantesDeGrupo(grupo)

      for (const v of exactas) {
        const re = new RegExp(`\\b${escapeRegex(v)}\\b`, 'g')
        if (tags.includes(v)) score += 10
        const t = titulo.match(re)
        if (t) score += 5 * t.length
        const l = letra.match(re)
        if (l) score += Math.min(l.length, 5)
      }

      for (const raiz of raices) {
        const re = new RegExp(`\\b${escapeRegex(raiz)}[a-z]*\\b`, 'g')
        const t = titulo.match(re)
        if (t) score += 2 * t.length
        const l = letra.match(re)
        if (l) score += Math.min(l.length, 8) * 1.5
      }
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

  const enTitulo: string[] = []
  const enLetra: string[] = []

  for (const palabra of palabrasTema) {
    const grupos = INDICE_GRUPOS.get(palabra) || []
    const lista = grupos.length > 0
      ? grupos
      : [{ claves: [palabra], sinonimos: [], raices: [] } as GrupoTema]

    for (const grupo of lista) {
      const { exactas, raices } = variantesDeGrupo(grupo)
      const patrones = [
        ...exactas.map((v) => new RegExp(`\\b${escapeRegex(v)}\\b`, 'g')),
        ...raices.map((r) => new RegExp(`\\b${escapeRegex(r)}[a-z]*\\b`, 'g')),
      ]
      for (const re of patrones) {
        const t = titulo.match(re)
        if (t) enTitulo.push(...t)
        const l = letra.match(re)
        if (l) enLetra.push(...l)
      }
    }
  }

  const limpiar = (arr: string[]) =>
    [...new Set(arr.map((w) => w.replace(/[,.;:!]/g, '')))].slice(0, 2)

  if (enTitulo.length > 0) return `Habla de ${limpiar(enTitulo).join(' y ')} en su título y letra`
  if (enLetra.length > 0) return `Menciona ${limpiar(enLetra).join(' y ')} en su letra`
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
        const m = tok.match(/^([A-G](?:#|b)?)([mM])?$/)
        if (m) agregar(m[1][0].toLowerCase(), m[1][1], m[2])
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

// 🔧 FIX 1: Sin adoracion/alabanza (son temas, no tempos)
function extraerTempo(prompt: string): string | null {
  const p = normalizarTexto(prompt)
  if (/\b(lenta|lentas|lento|lentos|suave|suaves|slow|tranquila|tranquilas|tranquilo|tranquilos|calmada|calmadas|calmado|calmados|pausada|pausadas|pausado|pausados)\b/.test(p)) return 'lento'
  if (/\b(media|medias|medio|medios|medium|moderada|moderadas|moderado|moderados|normal)\b/.test(p)) return 'medio'
  if (/\b(rapida|rapidas|rapido|rapidos|alegre|alegres|movida|movidas|movido|movidos|upbeat|viva|vivas|vivo|vivos|fiesta|jubilosa|jubilosas|jubiloso|jubilosos|energetica|energeticas|energetico|energeticos)\b/.test(p)) return 'rapido'
  return null
}

// 🔧 FIX 2: Solo tipos musicales reales (no adoracion/alabanza)
function extraerTipo(prompt: string): string | null {
  const p = normalizarTexto(prompt)
  if (/\b(coros?|corito|coritos)\b/.test(p)) return 'coro'
  if (/\b(himnos?|himnario)\b/.test(p)) return 'himno'
  if (/\b(infantil|infantiles|ninos|de ninos|escuela dominical|ebd)\b/.test(p)) return 'infantil'
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

// 🔧 FIX 3: Stopwords sin adoracion|alabanza (ahora pasan como tema)
function extraerTema(prompt: string): string | null {
  const p = normalizarTexto(prompt)
  const stopwords = /\b(dame|da|das|me|te|se|nos|les|mi|mis|tu|tus|su|sus|hasme|hazme|haz|hacer|crea|creame|crear|arma|armame|armar|genera|generame|generar|busca|buscame|buscar|ponme|poneme|pon|pasame|pasa|trae|traeme|quiero|necesito|pide|pideme|elige|selecciona|seleccioname|prepara|preparame|toca|canta|cantemos|cantar|cantando|hagamos|podes|puedes|puede|podria|podrias|deberias|regalame|mandame|enviame|mostrame|ensename|decime|sugiereme|recomiendame|recomienda|colocame|un|una|unos|unas|el|la|los|las|lista|listas|popurri|popurris|medley|canciones|cancion|cantos|canto|coro|coros|alabanza|alabanzas|himno|himnos|que|sea|sean|hablen|habla|trate|traten|sobre|de|del|en|tono|tonos|tonalidad|tonalidades|clave|claves|key|para|con|y|o|por|favor|porfa|please|tiempo|tempo|ritmo|lenta|lentas|lento|lentos|rapida|rapidas|rapido|rapidos|suave|suaves|media|medias|medio|medios|alegre|alegres|movida|movidas|do|re|mi|fa|sol|la|si|sostenido|sostenidos|bemol|bemoles|mayor|mayores|menor|menores|minor|major|slow|tranquila|tranquilas|tranquilo|tranquilos|calmada|calmados|calmado|calmadas|pausada|pausados|pausado|pausadas|medium|moderada|moderados|moderado|moderadas|normal|upbeat|viva|vivas|vivo|vivos|fiesta|jubilosa|jubilosas|jubiloso|jubilosos|energetica|energeticas|energetico|energeticos|worship|voy|vamos|infantil|infantiles|ninos|nino|nina|ninas|escuela|dominical|ebd|chicos|chiquitos|[a-g](?:#|b)?m?)\b/g

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
    const conTipo = resultados.filter((c: any) => {
      if (tipo === 'infantil') return esCancionInfantil(c)

      const tipoBD = normalizarTexto(c.tipo || '')
      const tags: string[] = Array.isArray(c.temas)
        ? c.temas.map((t: string) => normalizarTexto(t))
        : []
      return tipoBD.includes(tipo!) || tags.includes(tipo!)
    })

    const hayDatosTipo = resultados.some(
      (c: any) => (c.tipo || '').trim() !== '' || (Array.isArray(c.temas) && c.temas.length > 0)
    )

    if (conTipo.length > 0) {
      resultados = conTipo
    } else if (hayDatosTipo && tipo !== 'infantil') {
      return NextResponse.json({
        exito: true,
        sugerencias: [],
        tonoPedido: tonalidades,
        explicacion: `No hay canciones de tipo ${tipo}${tonoTexto} en tu catálogo.`,
      })
    }
  }

  const sugerencias = resultados.slice(0, cantidad || 15)

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