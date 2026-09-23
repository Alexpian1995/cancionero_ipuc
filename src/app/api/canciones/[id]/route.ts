import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  // 1) Usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { id } = await params

  // 2) Verificar que la canción existe (y opcionalmente que el usuario puede borrarla)
  const { data: cancion, error: errFind } = await supabase
    .from('canciones')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (errFind || !cancion) {
    return NextResponse.json({ error: 'Canción no encontrada' }, { status: 404 })
  }

  // 3) Eliminar primero dependencias (popurri_canciones, si tenés FK con RESTRICT)
  await supabase.from('popurri_canciones').delete().eq('cancion_id', id)

  // 4) Eliminar la canción
  const { error } = await supabase.from('canciones').delete().eq('id', id)

  if (error) {
    console.error('Error eliminando canción:', error)
    return NextResponse.json(
      { error: 'No se pudo eliminar la canción' },
      { status: 500 }
    )
  }

  return NextResponse.json({ exito: true })
}