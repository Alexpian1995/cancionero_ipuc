'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LockClosedIcon, EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setErrorMsg('Credenciales incorrectas: ' + error.message)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200/80 bg-white p-8 shadow-lg">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0F2C4C] transition-colors"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Volver al Inicio
        </Link>

        <div className="text-center">
          <Image
            src="/logoipuc.png"
            alt="IPUC"
            width={48}
            height={48}
            className="mx-auto object-contain"
          />
          <h2 className="mt-3 font-display text-2xl font-bold text-[#0F2C4C]">
            Acceso Administrador
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Ingresa para gestionar alabanzas y repertorios
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <EnvelopeIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ipuc.org"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-800 focus:border-[#1B5FA8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <LockClosedIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-800 focus:border-[#1B5FA8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#0F2C4C] py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#0B223C] disabled:opacity-50 transition-all"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}