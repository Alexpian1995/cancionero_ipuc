export type Cancion = {
  id: string
  titulo: string
  tipo: 'himno' | 'coro' | 'adoracion' | 'alabanza'
  libro: 'Lluvias de Bendicion' | 'Manantial de Inspiracion' | 'Coros Varios' | 'Otro'
  tonalidad: string | null
  tempo: 'rapido' | 'medio' | 'lento' | null
  bpm: number | null
  temas: string[] | null
  letra: string | null
  numero_himno: number | null
  verificado: boolean
  aportado_por: string | null
  created_at: string
  updated_at: string
}