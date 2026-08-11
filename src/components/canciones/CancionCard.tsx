'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'

export function CancionCard({ cancion, onDelete }: { cancion: any; onDelete?: (id: string) => void }) {
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Verificar si hay un usuario autenticado al cargar el componente
    supabase.auth.getUser().then(({ data }) => {
      setIsAdmin(!!data.user)
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
      {/* Enlace que cubre la información principal de la canción */}
      <Link 
        href={`/canciones/${cancion.id}`} 
        className="flex items-center gap-3 min-w-0 flex-1 mr-4 hover:opacity-80 transition-opacity"
      >
        <span className="text-amber-500 font-medium text-xs shrink-0">⚡</span>
        <h3 className="font-semibold text-slate-800 text-sm truncate">{cancion.titulo}</h3>
      </Link>

      <div className="flex items-center gap-2 shrink-0">
        <span className="px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 rounded-lg">
          {cancion.categoria || 'General'}
        </span>
        <span className="w-6 h-6 flex items-center justify-center text-xs font-bold text-sky-700 bg-sky-50 rounded-lg">
          {cancion.tonalidad || 'C'}
        </span>

        {/* Acciones de Administrador */}
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
              onClick={(e) => {
                e.preventDefault()
                onDelete && onDelete(cancion.id)
              }}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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