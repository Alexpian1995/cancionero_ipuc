'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { LockClosedIcon } from '@heroicons/react/24/outline'

interface Cancion {
  id: string
  titulo: string
  libro: string
  tonalidad: string
  tempo: string
  letra: string
  temas?: string[] | null
  estado_legal?: string | null
  nota_legal?: string | null
}

const LIBROS = ['Lluvias de Bendición', 'Manantial de Inspiración', 'Coros y Adoración']

const TONOS_MAYORES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']
const TONOS_MENORES = ['Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm']

const CATEGORIAS_TEMATICAS = [
  { value: '', label: '— Sin categoría (opcional) —' },
  { value: 'infantil', label: '🧒 Infantil / Niños' },
  { value: 'evangelismo', label: '📢 Evangelismo / Llamado al altar' },
  { value: 'perdon', label: '🙏 Perdón' },
  { value: 'fe', label: '✝️ Fe / Confianza' },
  { value: 'amor', label: '❤️ Amor de Dios' },
  { value: 'gratitud', label: '🙌 Gratitud / Gracias' },
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

const ESTADOS_LEGALES = [
  { value: 'pendiente', label: '⚠️ Pendiente de permiso' },
  { value: 'dominio_publico', label: '✅ Dominio público' },
  { value: 'permiso_escrito', label: '✅ Permiso escrito del autor' },
  { value: 'licencia', label: '📘 Licencia (CCLI / editorial)' },
  { value: 'no_publicar', label: '🚫 No publicar' },
]

function normalizarLibro(libro?: string): string {
  const sinTildes = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

  const mapa: Record<string, string> = {
    'himnos': 'Manantial de Inspiración',
    'manantial de inspiracion': 'Manantial de Inspiración',
    'lluvias de bendicion': 'Lluvias de Bendición',
    'coros y adoracion': 'Coros y Adoración',
    'coros varios': 'Coros y Adoración',
    'coros': 'Coros y Adoración',
  }

  const clave = sinTildes(libro || '')
  return mapa[clave] || LIBROS[0]
}

export function EditarCancionForm({ cancion }: { cancion: Cancion }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [autenticado, setAutenticado] = useState<boolean | null>(null)
  const [formData, setFormData] = useState({
    titulo: cancion.titulo || '',
    libro: normalizarLibro(cancion.libro),
    tonalidad: cancion.tonalidad || 'C',
    tempo: cancion.tempo || 'Medio',
    categoria: Array.isArray(cancion.temas) && cancion.temas.length > 0 ? cancion.temas[0] : '',
    estado_legal: cancion.estado_legal || 'pendiente',
    nota_legal: cancion.nota_legal || '',
    letra: cancion.letra || '',
  })

  const RUTA_DETALLE_BASE = '/canciones/'

  // Verificar sesión al montar
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setAutenticado(!!data.user)
    })
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!autenticado) {
      alert('Debés iniciar sesión para editar canciones.')
      router.push('/admin/login')
      return
    }

    setLoading(true)

    const supabase = createClient()

    // ⚠️ Nota: al no incluir "tipo" en datosAGuardar,
    // el UPDATE no toca esa columna y se conserva su valor actual en la BD.
    const { categoria, ...resto } = formData
    const datosAGuardar = {
      ...resto,
      temas: categoria === '' ? null : [categoria],
    }

    const { error } = await supabase
      .from('canciones')
      .update(datosAGuardar)
      .eq('id', cancion.id)

    setLoading(false)

    if (!error) {
      router.push(`${RUTA_DETALLE_BASE}${cancion.id}`)
      router.refresh()
    } else if (
      error.code === '42501' ||
      error.message?.toLowerCase().includes('row-level security') ||
      error.message?.toLowerCase().includes('permission')
    ) {
      alert('No tenés permisos para editar esta canción. Contactá al administrador.')
    } else {
      alert('Error al guardar la canción: ' + error.message)
    }
  }

  // Pantalla de carga mientras verifica sesión
  if (autenticado === null) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 shadow-sm text-center">
        <p className="text-sm text-slate-500">Verificando sesión...</p>
      </div>
    )
  }

  // Pantalla si no está logueado
  if (!autenticado) {
    return (
      <div className="bg-gradient-to-br from-[#0F2C4C] to-[#1B5FA8] p-10 rounded-2xl text-white text-center shadow-lg space-y-4">
        <LockClosedIcon className="w-12 h-12 mx-auto text-[#D9A544]" />
        <h2 className="text-xl font-bold font-display">Iniciá sesión para editar canciones</h2>
        <p className="text-sm text-slate-200 max-w-md mx-auto">
          Solo directores y músicos registrados pueden modificar el cancionero.
        </p>
        <Link
          href="/admin/login"
          className="inline-block px-6 py-3 bg-[#D9A544] text-[#0F2C4C] font-bold text-sm rounded-xl hover:bg-[#e8b95f] transition-colors"
        >
          Iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
      {/* Banner de contexto */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs">
        <span>
          Estás editando <strong>"{cancion.titulo}"</strong>. Los cambios se publican al guardar.
        </span>
      </div>

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
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
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
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5FA8] cursor-pointer"
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
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5FA8] cursor-pointer"
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

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Categoría temática <span className="text-slate-400 font-normal">(opcional)</span>
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
        </div>

        {/* ⚖️ ESTADO LEGAL */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Estado legal <span className="text-slate-400 font-normal">(copyright)</span>
          </label>
          <select
            name="estado_legal"
            value={formData.estado_legal}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
          >
            {ESTADOS_LEGALES.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nota / respaldo legal <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            name="nota_legal"
            value={formData.nota_legal}
            onChange={handleChange}
            placeholder="Ej: email del autor 15/03/2026, Drive/permisos/"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
          />
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
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
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