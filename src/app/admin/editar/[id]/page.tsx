import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { EditarCancionForm } from './EditarCancionForm'

export default async function EditarCancionPage({
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/cancion/${id}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0F2C4C] transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Cancelar y Volver
        </Link>
        <h1 className="text-xl font-bold text-[#0F2C4C]">Editar Canción</h1>
      </div>

      <EditarCancionForm cancion={cancion} />
    </div>
  )
}