'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Cancion {
  id: string
  titulo: string
  libro: string
  tonalidad: string
  tempo: string
  letra: string
}

// ✅ Mismos valores que usa el formulario de CREAR (y que consultan las páginas de sección)
const LIBROS = ['Lluvias de Bendición', 'Manantial de Inspiración', 'Coros y Adoración']

const TONOS_MAYORES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const TONOS_MENORES = ['Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'Abm', 'Am', 'Bbm', 'Bm']

// Convierte valores viejos/inconsistentes de la BD al nombre canónico
function normalizarLibro(libro?: string): string {
  const mapa: Record<string, string> = {
    'himnos': 'Manantial de Inspiración',
    'manantial de inspiracion': 'Manantial de Inspiración',
    'lluvias de bendicion': 'Lluvias de Bendición',
    'coros y adoracion': 'Coros y Adoración',
    'coros varios': 'Coros y Adoración',
    'coros': 'Coros y Adoración',
  }
  const clave = (libro || '').trim().toLowerCase()
  return mapa[clave] || LIBROS[0]
}

export function EditarCancionForm({ cancion }: { cancion: Cancion }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    titulo: cancion.titulo || '',
    libro: normalizarLibro(cancion.libro),
    tonalidad: cancion.tonalidad || 'C',
    tempo: cancion.tempo || 'Medio',
    letra: cancion.letra || '',
  })

  const RUTA_DETALLE_BASE = '/canciones/'

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('canciones')
      .update(formData)
      .eq('id', cancion.id)

    setLoading(false)

    if (!error) {
      router.push(`${RUTA_DETALLE_BASE}${cancion.id}`)
      router.refresh()
    } else {
      alert('Error al guardar la canción: ' + error.message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Título
          </label>
          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Libro / Categoría
          </label>
          <select
            name="libro"
            value={formData.libro}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5FA8] cursor-pointer"
          >
            {LIBROS.map((libro) => (
              <option key={libro} value={libro}>{libro}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tonalidad Principal
          </label>
          <select
            name="tonalidad"
            value={formData.tonalidad}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5FA8] cursor-pointer"
          >
            <optgroup label="Mayores">
              {TONOS_MAYORES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </optgroup>
            <optgroup label="Menores">
              {TONOS_MENORES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </optgroup>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tempo
          </label>
          <select
            name="tempo"
            value={formData.tempo}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
          >
            <option value="Lento">Lento</option>
            <option value="Medio">Medio</option>
            <option value="Rápido">Rápido</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Letra y Acordes Completo
        </label>
        <textarea
          name="letra"
          rows={16}
          value={formData.letra}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
          placeholder="Pega la letra con los acordes en las líneas superiores..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <Link
          href={`${RUTA_DETALLE_BASE}${cancion.id}`}
          className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2C4C] rounded-xl hover:bg-[#1B5FA8] transition-colors disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  )
}