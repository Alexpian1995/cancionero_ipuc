'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function RecuperarPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [cargando, setCargando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setCargando(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/nueva-contrasena`,
    })

    setCargando(false)

    if (error) {
      setError(error.message)
      return
    }

    setEnviado(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="text-center space-y-2">
          <EnvelopeIcon className="w-10 h-10 text-[#1B5FA8] mx-auto" />
          <h1 className="text-xl font-bold font-display text-[#0F2C4C]">
            Recuperar contraseña
          </h1>
          <p className="text-xs text-slate-500">
            Te enviaremos un email con un enlace para crear una nueva contraseña
          </p>
        </div>

        {enviado ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800">
                Si el email <strong>{email}</strong> está registrado, recibirás un enlace para
                restablecer tu contraseña. Revisá también la carpeta de spam.
              </p>
            </div>
            <Link
              href="/admin/login"
              className="block text-center text-xs font-semibold text-[#1B5FA8] hover:underline"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRecuperar} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
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
              {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>

            <Link
              href="/admin/login"
              className="flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-[#1B5FA8]"
            >
              <ArrowLeftIcon className="w-3 h-3" />
              Volver al inicio de sesión
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}