import { createClient } from '@/lib/supabase/server'
import { CancionViewer } from '@/components/canciones/CancionViewer'
import { notFound } from 'next/navigation'

export default async function DetalleCancionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: cancion, error } = await supabase
    .from('canciones')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !cancion) {
    notFound()
  }

  return (
    <main className="max-w-6xl mx-auto py-6">
      <CancionViewer cancion={cancion} />
    </main>
  )
}