import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { CrearCancionForm } from './CrearCancionForm'

export default function CrearCancionPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0F2C4C] transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver a Administración
        </Link>
        <h1 className="text-xl font-bold text-[#0F2C4C]">Añadir Nueva Canción</h1>
      </div>

      <CrearCancionForm />
    </div>
  )
}