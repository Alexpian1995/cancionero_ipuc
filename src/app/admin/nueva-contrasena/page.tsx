'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { KeyIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function NuevaPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  useEffect(() => {
    // Verifica que venga de un enlace válido (hash con access_token)
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setError('El enlace de recuperación expiró o no es válido. Solicitá uno nuevo.')
      }
    })
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
    setTimeout(() => router.push('/admin/login'), 2500)
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

        {exito ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-800">
              Contraseña actualizada correctamente. Serás redirigido al login...
            </p>
          </div>
        ) : (
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