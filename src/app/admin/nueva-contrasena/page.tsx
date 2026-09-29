'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { KeyIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

type EstadoVerificacion = 'verificando' | 'lista' | 'error'

export default function NuevaPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [estado, setEstado] = useState<EstadoVerificacion>('verificando')

  useEffect(() => {
    let cancelado = false

    const marcarLista = () => {
      if (!cancelado) {
        setEstado('lista')
        setError('')
      }
    }

    // 1) Intentar con la sesión ya establecida
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelado && data.session) marcarLista()
    })

    // 2) Escuchar cuando Supabase procesa el token del email y crea la sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelado && session) marcarLista()
    })

    // 3) Solo si después de 6 segundos NO hay sesión, mostrar error
    const timer = setTimeout(async () => {
      if (cancelado) return
      const { data } = await supabase.auth.getSession()
      if (!data.session) setEstado('error')
    }, 6000)

    return () => {
      cancelado = true
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setCargando(true)
    const { error } = await supabase.auth.updateUser({ password })
    setCargando(false)

    if (error) {
      setError(error.message)
      return
    }

    setExito(true)
    // Cerramos la sesión de recovery y mandamos al login para probar la nueva clave
    setTimeout(async () => {
      await supabase.auth.signOut()
      router.push('/admin/login')
    }, 2500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="text-center space-y-2">
          <KeyIcon className="w-10 h-10 text-[#1B5FA8] mx-auto" />
          <h1 className="text-xl font-bold font-display text-[#0F2C4C]">
            Nueva contraseña
          </h1>
          <p className="text-xs text-slate-500">
            Elegí una nueva contraseña para tu cuenta
          </p>
        </div>

        {/* Estado: verificando el enlace */}
        {estado === 'verificando' && (
          <div className="text-center py-6 space-y-3">
            <svg className="animate-spin h-6 w-6 text-[#1B5FA8] mx-auto" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-xs text-slate-500">Verificando enlace de recuperación...</p>
          </div>
        )}

        {/* Estado: enlace inválido / expirado */}
        {estado === 'error' && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700">
              El enlace de recuperación expiró o no es válido. Solicitá uno nuevo.
            </div>
            <Link
              href="/admin/recuperar"
              className="block text-center text-xs font-semibold text-[#1B5FA8] hover:underline"
            >
              Solicitar un nuevo enlace
            </Link>
          </div>
        )}

        {/* Estado: éxito */}
        {exito && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-800">
              Contraseña actualizada correctamente. Serás redirigido al login...
            </p>
          </div>
        )}

        {/* Estado: lista para cambiar la contraseña */}
        {estado === 'lista' && !exito && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirmar contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-2.5 rounded-xl bg-[#0F2C4C] text-white font-bold text-sm hover:bg-[#1B5FA8] disabled:opacity-50 transition-colors"
            >
              {cargando ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}