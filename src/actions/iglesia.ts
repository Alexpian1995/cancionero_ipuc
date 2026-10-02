'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function generarCodigoSesion(longitud = 6): string {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let codigo = ''
  for (let i = 0; i < longitud; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length))
  }
  return codigo
}

// 1. OBTENER BIBLIOTECA
export async function obtenerBibliotecaPopurris() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { exito: false, codigo: 'NO_AUTENTICADO', popurris: [] }
  }

  const { data, error } = await supabase
    .from('popurris')
    .select(`
      id,
      titulo,
      codigo_sesion,
      created_at,
      nombre_lider_manual,
      popurri_canciones (
        id,
        cancion_id,
        orden,
        tonalidad,
        transicion,
        canciones ( id, titulo )
      )
    `)
    .eq('lider_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error obteniendo biblioteca:', error)
    return { exito: false, codigo: 'ERROR_DB', popurris: [] }
  }

  const popurrisFormateados = data.map((item) => ({
    ...item,
    canciones: item.popurri_canciones || []
  }))

  return { exito: true, popurris: popurrisFormateados }
}

// 2. CARGAR UN POPURRÍ COMPLETO
export async function obtenerPopurriPorId(popurriId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { exito: false, codigo: 'NO_AUTENTICADO' }
  }

  const { data, error } = await supabase
    .from('popurris')
    .select(`
      id,
      titulo,
      codigo_sesion,
      nombre_lider_manual,
      lider_id,
      popurri_canciones (
        id,
        cancion_id,
        orden,
        tonalidad,
        transicion,
        canciones (
          id,
          titulo,
          letra,
          tonalidad
        )
      )
    `)
    .eq('id', popurriId)
    .eq('lider_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { exito: false, codigo: 'NO_ENCONTRADO', error: 'Popurrí no encontrado o sin permisos' }
    }
    console.error('Error cargando popurrí:', error)
    return { exito: false, codigo: 'ERROR_DB', error: 'No pudimos cargar el popurrí' }
  }

  const popurriFormateado = {
    ...data,
    canciones: (data.popurri_canciones || []).map((item: any) => {
      const infoCancion = item.canciones || {}
      return {
        id: item.id,
        cancionId: item.cancion_id || infoCancion.id,
        orden: item.orden,
        tonalidad: item.tonalidad,
        transicion: item.transicion,
        titulo: infoCancion.titulo || item.titulo || 'Canción sin título',
        letra: infoCancion.letra || 'Letra no disponible',
      }
    }).sort((a: any, b: any) => a.orden - b.orden)
  }

  return { exito: true, popurri: popurriFormateado }
}

// 3. GUARDAR O ACTUALIZAR UN POPURRÍ
export async function guardarOActualizarPopurri(datos: {
  id?: string
  titulo: string
  liderId?: string | null
  nombreLider?: string
  iglesiaId?: string
  canciones: Array<{
    cancionId?: string
    cancion_id?: string
    id?: string
    orden: number
    tonalidad: string
    transicion?: string
  }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      exito: false,
      codigo: 'NO_AUTENTICADO',
      error: 'Debes iniciar sesión para guardar popurrís. ¡Tienes 30 días de prueba gratis!',
    }
  }

  const userIdActual = user.id
  let popurriId = datos.id
  let codigoSesion = ''
  let existeEnBaseDatos = false

  if (popurriId) {
    const { data: verif } = await supabase
      .from('popurris')
      .select('id, codigo_sesion, lider_id')
      .eq('id', popurriId)
      .eq('lider_id', userIdActual)
      .maybeSingle()

    if (verif) {
      existeEnBaseDatos = true
      codigoSesion = verif.codigo_sesion

      const { error: errUpdate } = await supabase
        .from('popurris')
        .update({
          titulo: datos.titulo,
          nombre_lider_manual: datos.nombreLider || null,
        })
        .eq('id', popurriId)

      if (errUpdate) {
        console.error('Error actualizando popurrí:', errUpdate)
        return {
          exito: false,
          codigo: 'ERROR_UPDATE',
          error: 'No pudimos actualizar el popurrí. Inténtalo de nuevo.',
        }
      }

      await supabase.from('popurri_canciones').delete().eq('popurri_id', popurriId)
    }
  }

  if (!popurriId || !existeEnBaseDatos) {
    codigoSesion = generarCodigoSesion()

    const { data: nuevo, error: errInsert } = await supabase
      .from('popurris')
      .insert({
        titulo: datos.titulo || 'Nuevo Popurrí / Medley',
        codigo_sesion: codigoSesion,
        lider_id: userIdActual,
        nombre_lider_manual: datos.nombreLider || null,
        iglesia_id: datos.iglesiaId || null,
      })
      .select('id, codigo_sesion')
      .single()

    if (errInsert) {
      console.error('Error insertando popurrí:', errInsert)

      if (errInsert.code === '42501') {
        return {
          exito: false,
          codigo: 'SIN_PERMISOS',
          error: 'Tu sesión expiró o no tienes permisos. Vuelve a iniciar sesión e inténtalo de nuevo.',
        }
      }

      if (errInsert.code === '23503' || errInsert.code === '23514') {
        return {
          exito: false,
          codigo: 'ERROR_VALIDACION',
          error: 'Hay un problema con los datos del popurrí. Verifica la información e inténtalo de nuevo.',
        }
      }

      return {
        exito: false,
        codigo: 'ERROR_DB',
        error: 'No pudimos guardar el popurrí. Inténtalo nuevamente en unos segundos.',
      }
    }

    popurriId = nuevo.id
  }

  if (datos.canciones && datos.canciones.length > 0) {
    const detalle = datos.canciones
      .map((item: any, index) => {
        const idEncontrado = item.cancionId || item.cancion_id || item.id

        return {
          popurri_id: popurriId,
          cancion_id: idEncontrado,
          orden: item.orden ?? index + 1,
          tonalidad: item.tonalidad || 'C',
          transicion: item.transicion || null,
        }
      })
      .filter((item) => item.cancion_id && typeof item.cancion_id === 'string' && item.cancion_id.trim() !== '')

    if (detalle.length > 0) {
      const { error: errDetalle } = await supabase
        .from('popurri_canciones')
        .insert(detalle)

      if (errDetalle) {
        console.error('Error insertando canciones:', errDetalle)
        return {
          exito: false,
          codigo: 'ERROR_CANCIONES',
          error: 'El popurrí se guardó pero hubo un problema con las canciones. Inténtalo de nuevo.',
        }
      }
    }
  }

  return { exito: true, popurriId, codigoSesion }
}

// 4. ELIMINAR POPURRÍ (MEJORADO)
export async function eliminarPopurri(
  popurriId: string
): Promise<{ exito: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { exito: false, error: 'Debes iniciar sesión para eliminar popurrís.' }
  }

  const { data: verif, error: errVerif } = await supabase
    .from('popurris')
    .select('id, lider_id')
    .eq('id', popurriId)
    .maybeSingle()

  if (errVerif) {
    console.error('Error verificando popurrí:', errVerif)
    return { exito: false, error: 'Error al verificar el popurrí.' }
  }

  if (!verif) {
    return { exito: false, error: 'Popurrí no encontrado.' }
  }

  if (verif.lider_id !== user.id) {
    return { exito: false, error: 'No tienes permisos para eliminar este popurrí.' }
  }

  // 1) Eliminar canciones hijas
  const { data: cancionesEliminadas, error: errCanciones } = await supabase
    .from('popurri_canciones')
    .delete()
    .eq('popurri_id', popurriId)
    .select()

  if (errCanciones) {
    console.error('Error eliminando canciones:', errCanciones)
    return { exito: false, error: 'Error al eliminar las canciones del popurrí.' }
  }

  console.log(`Eliminadas ${cancionesEliminadas?.length || 0} canciones del popurrí`)

  // 2) Eliminar popurrí con verificación
  const { data: eliminados, error: errDelete } = await supabase
    .from('popurris')
    .delete()
    .eq('id', popurriId)
    .select()

  if (errDelete) {
    console.error('Error eliminando popurrí:', errDelete)
    return { exito: false, error: 'No pudimos eliminar el popurrí.' }
  }

  if (!eliminados || eliminados.length === 0) {
    console.error('RLS bloqueó la eliminación del popurrí')
    return {
      exito: false,
      error: 'La base de datos rechazó la eliminación. Verificá las políticas RLS.',
    }
  }

  console.log(`Popurrí ${popurriId} eliminado correctamente`)

  revalidatePath('/popurri')
  return { exito: true }
}

// 5. ESTADO DE SUSCRIPCIÓN
// 5. ESTADO DE SUSCRIPCIÓN (con exención para admin)
export async function obtenerEstadoSuscripcion() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      autenticado: false,
      tieneSuscripcionValida: false,
      usuarioId: null,
      iglesiaId: null,
    }
  }

  // 🆕 Los administradores SIEMPRE tienen acceso completo, sin chequeo de suscripción
  const { data: adminRow } = await supabase
    .from('administradores')
    .select('rol')
    .eq('id', user.id)
    .eq('rol', 'ADMIN')
    .maybeSingle()

  if (adminRow) {
    // Buscamos su iglesia solo para tener el iglesiaId (si la tuviera), sin bloquear
    const { data: iglesia } = await supabase
      .from('iglesias')
      .select('id')
      .eq('lider_id', user.id)
      .maybeSingle()

    return {
      autenticado: true,
      tieneSuscripcionValida: true, // ✅ admin nunca expira
      usuarioId: user.id,
      iglesiaId: iglesia?.id || null,
    }
  }

  // ─── Usuarios normales: chequeo de suscripción real ───
  const { data: iglesia } = await supabase
    .from('iglesias')
    .select('id, estado_suscripcion, fin_suscripcion')
    .eq('lider_id', user.id)
    .maybeSingle()

  let tieneSuscripcionValida = false
  if (iglesia) {
    if (iglesia.estado_suscripcion === 'active') {
      tieneSuscripcionValida = true
    } else if (iglesia.estado_suscripcion === 'trial' && iglesia.fin_suscripcion) {
      const fin = new Date(iglesia.fin_suscripcion)
      tieneSuscripcionValida = fin > new Date()
    }
  }

  return {
    autenticado: true,
    tieneSuscripcionValida,
    usuarioId: user.id,
    iglesiaId: iglesia?.id || null,
  }
}