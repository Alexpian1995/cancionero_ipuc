'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const TONOS_MAYORES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const TONOS_MENORES = ['Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'Abm', 'Am', 'Bbm', 'Bm']

// 🆕 Categorías temáticas (coinciden con los grupos del sugeridor)
const CATEGORIAS_TEMATICAS = [
  { value: '', label: '— Sin categoría (opcional) —' },
  { value: 'infantil', label: '🧒 Infantil / Niños' },
  { value: 'evangelismo', label: '📢 Evangelismo / Llamado al altar' },
  { value: 'perdon', label: '🙏 Perdón' },
  { value: 'fe', label: '✝️ Fe / Confianza' },
  { value: 'amor', label: '❤️ Amor de Dios' },
  { value: 'gratitud', label: ' Gratitud / Gracias' },
  { value: 'adoracion', label: '🕊️ Adoración' },
  { value: 'alabanza', label: '🎵 Alabanza / Gozo' },
  { value: 'esperanza', label: '🌅 Esperanza' },
  { value: 'sanidad', label: '💪 Sanidad' },
  { value: 'fidelidad', label: '🤝 Fidelidad' },
  { value: 'salvacion', label: '🛟 Salvación' },
  { value: 'unicidad', label: '1️⃣ Unicidad de Dios' },
  { value: 'navidad', label: '🎄 Navidad' },
  { value: 'segunda venida', label: '☁️ Segunda Venida' },
  { value: 'familia', label: '👨‍👩‍👧 Familia' },
  { value: 'oracion', label: '🙇 Oración' },
]

export function CrearCancionForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    libro: 'Lluvias de Bendición',
    tonalidad: 'C',
    tempo: 'Medio',
    categoria: '', // 🆕 opcional, arranca vacía
    letra: '',
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

    // Guardamos la categoría como tag en `temas` (array de 1) → el sugeridor le da +10
    const { categoria, ...resto } = formData
    const datosAGuardar = {
      ...resto,
      temas: categoria === '' ? null : [categoria],
    }

    const { data, error } = await supabase
      .from('canciones')
      .insert([datosAGuardar])
      .select()
      .single()

    setLoading(false)

    if (!error && data) {
      router.push(`${RUTA_DETALLE_BASE}${data.id}`)
      router.refresh()
    } else {
      alert('Error al guardar la canción: ' + (error?.message || 'Ocurrió un error inesperado'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Título de la Canción *
          </label>
          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            placeholder="Ej: Grande es tu fidelidad"
            required
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Libro / Himnario *
          </label>
          <select
            name="libro"
            value={formData.libro}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
          >
            <option value="Lluvias de Bendición">Lluvias de Bendición</option>
            <option value="Manantial de Inspiración">Manantial de Inspiración</option>
            <option value="Coros y Adoración">Coros y Adoración</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tonalidad Base *
          </label>
          <select
            name="tonalidad"
            value={formData.tonalidad}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
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
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
          >
            <option value="Lento">Lento</option>
            <option value="Medio">Medio</option>
            <option value="Rápido">Rápido</option>
          </select>
        </div>

        {/* 🆕 SELECT DE CATEGORÍA TEMÁTICA (OPCIONAL) */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Categoría temática <span className="text-slate-400 font-normal">(opcional — ayuda al sugeridor de popurrís)</span>
          </label>
          <select
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
          >
            {CATEGORIAS_TEMATICAS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 mt-1">
            Si elegís una categoría, el sugeridor priorizará esta canción cuando busques ese tema. Si la dejás vacía, intentará detectarla por la letra.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Letra y Acordes (Líneas de acordes arriba de la letra) *
        </label>
        <textarea
          name="letra"
          rows={16}
          value={formData.letra}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
          placeholder={`E              B           B/A  E/G#\n1 Oh Dios eterno, tu misericordia...`}
        />
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2C4C] rounded-xl hover:bg-[#1B5FA8] transition-colors disabled:opacity-50"
        >
          {loading ? 'Creando...' : 'Crear Canción'}
        </button>
      </div>
    </form>
  )
}