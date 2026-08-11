'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type CancionPopurri = {
  id: string
  titulo: string
  tonalidadOriginal: string
  tonalidadActual: string
  letraConAcordes: string
  transicionSugerida?: string
}

export function usePopurriRealtime(
  iglesiaId: string,
  codigoSesion: string = 'CULTO-DOMINGO',
  esLider: boolean = false
) {
  const supabase = createClient()
  const [canciones, setCanciones] = useState<CancionPopurri[]>([])
  const [transposicionGlobal, setTransposicionGlobal] = useState(0)

  // 1. Cargar el estado inicial del popurrí filtrado por iglesia y sesión
  useEffect(() => {
    if (!iglesiaId) return

    async function cargarInicial() {
      const { data } = await supabase
        .from('popurris')
        .select('*')
        .eq('iglesia_id', iglesiaId)
        .eq('codigo_sesion', codigoSesion)
        .maybeSingle() // maybeSingle evita errores si el registro aún no existe

      if (data) {
        setCanciones(data.canciones || [])
        setTransposicionGlobal(data.transposicion_global || 0)
      }
    }

    cargarInicial()
  }, [iglesiaId, codigoSesion, supabase])

  // 2. Suscribirse en tiempo real al canal específico de esta iglesia
  useEffect(() => {
    if (!iglesiaId) return

    const nombreCanal = `popurri-${iglesiaId}-${codigoSesion}`

    const canal = supabase
      .channel(nombreCanal)
      .on(
        'postgres_changes',
        {
          event: '*', // Escucha INSERTs y UPDATEs
          schema: 'public',
          table: 'popurris',
          filter: `iglesia_id=eq.${iglesiaId}`,
        },
        (payload) => {
          const nuevoEstado = payload.new as any
          if (nuevoEstado && nuevoEstado.codigo_sesion === codigoSesion) {
            setCanciones(nuevoEstado.canciones || [])
            setTransposicionGlobal(nuevoEstado.transposicion_global || 0)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [iglesiaId, codigoSesion, supabase])

  // 3. Función exclusiva para que el Líder actualice en la BD por iglesia
  const actualizarPopurriComoLider = async (
    nuevasCanciones: CancionPopurri[],
    nuevaTransposicionGlobal: number = transposicionGlobal
  ) => {
    if (!esLider || !iglesiaId) return

    // Actualización optimista local
    setCanciones(nuevasCanciones)
    setTransposicionGlobal(nuevaTransposicionGlobal)

    // Guardado en Supabase resuelto con el constraint compuesto (iglesia_id, codigo_sesion)
    await supabase
      .from('popurris')
      .upsert(
        {
          iglesia_id: iglesiaId,
          codigo_sesion: codigoSesion,
          canciones: nuevasCanciones,
          transposicion_global: nuevaTransposicionGlobal,
        },
        { onConflict: 'iglesia_id,codigo_sesion' }
      )
  }

  return {
    canciones,
    transposicionGlobal,
    actualizarPopurriComoLider,
  }
}