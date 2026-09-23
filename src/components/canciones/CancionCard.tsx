'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

export function CancionCard({ cancion, onDelete }: { cancion: any; onDelete?: (id: string) => void }) {
  const supabase = createClient()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [estaEliminando, setEstaEliminando] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsAdmin(!!data.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleEliminar = async (e: React.MouseEvent) => {
    e.preventDefault()

    if (!confirm(`¿Estás seguro de que deseas eliminar la alabanza "${cancion.titulo}"?`)) {
      return
    }

    try {
      setEstaEliminando(true)

      if (onDelete) {
        onDelete(cancion.id)
      }

      const res = await fetch(`/api/canciones/${cancion.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('No se pudo eliminar la canción')
      }

      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Hubo un error al intentar eliminar la canción.')
    } finally {
      setEstaEliminando(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
      <Link 
        href={`/canciones/${cancion.id}`} 
        className="flex items-center gap-3 min-w-0 flex-1 mr-4 hover:opacity-80 transition-opacity"
      >
        <span className="text-amber-500 font-medium text-xs shrink-0">⚡</span>
        <h3 className="font-semibold text-slate-800 text-sm truncate">{cancion.titulo}</h3>
      </Link>

      <div className="flex items-center gap-2 shrink-0">
        <span className="px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 rounded-lg">
          {cancion.categoria || cancion.libro || 'General'}
        </span>
        <span className="w-6 h-6 flex items-center justify-center text-xs font-bold text-sky-700 bg-sky-50 rounded-lg">
          {cancion.tonalidad || 'C'}
        </span>

        {isAdmin && (
          <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1">
            <Link
              href={`/admin/editar/${cancion.id}`}
              className="p-1.5 text-slate-400 hover:text-[#1B5FA8] hover:bg-slate-100 rounded-lg transition-colors"
              title="Editar canción"
            >
              <PencilSquareIcon className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={handleEliminar}
              disabled={estaEliminando}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Eliminar canción"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}