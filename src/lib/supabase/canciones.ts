import { createClient } from './client'

export type CancionBase = {
  id: string
  titulo: string
  libro: string | null
  tonalidad: string | null
}

export type CancionDetalle = CancionBase & {
  letra_con_acordes: string
}

/**
 * Carga ligera: solo descarga los metadatos necesarios para listar y buscar.
 * Evita transferir letras y acordes pesados en la consulta inicial.
 */
export async function obtenerCatalogoLiviano(): Promise<CancionBase[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('canciones')
    .select('id, titulo, libro, tonalidad')
    .order('titulo', { ascending: true })

  if (error) {
    console.error('Error cargando canciones:', error)
    return []
  }

  return data || []
}

/**
 * Carga diferida: trae la letra y acordes únicamente cuando el usuario
 * selecciona una canción específica.
 */
export async function obtenerDetalleCancion(id: string): Promise<CancionDetalle | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('canciones')
    .select('id, titulo, libro, tonalidad, letra_con_acordes')
    .eq('id', id)
    .single()

  if (error) {
    console.error(`Error al obtener detalle de la canción ${id}:`, error)
    return null
  }

  return data
}