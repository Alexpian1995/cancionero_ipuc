'use client'

import { useState } from 'react'
import { registrarLiderEIglesia } from '@/actions/auth'

export default function RegistroPage() {
  const [mensajeError, setMensajeError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setMensajeError(null)
    const res = await registrarLiderEIglesia(formData)
    if (res?.error) {
      setMensajeError(res.error)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <h2 className="text-xl font-bold text-[#0F2C4C] mb-2">Registro de Líder e Iglesia</h2>
      <p className="text-xs text-slate-500 mb-4">Crea la cuenta para tu congregación o grupo de música.</p>

      {mensajeError && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-200">
          {mensajeError}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de la Iglesia / Congregación</label>
          <input 
            type="text" 
            name="nombreIglesia" 
            required 
            placeholder="Ej: IPUC Central Medellín"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]" 
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
          <input 
            type="email" 
            name="email" 
            required 
            placeholder="correo@ejemplo.com"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]" 
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña</label>
          <input 
            type="password" 
            name="password" 
            minLength={6}
            required 
            placeholder="Mínimo 6 caracteres"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]" 
          />
        </div>

        <button 
          type="submit"
          className="w-full bg-[#1B5FA8] text-white font-bold py-2.5 rounded-xl hover:bg-[#0F2C4C] transition-colors text-sm"
        >
          Crear cuenta y comenzar prueba
        </button>
      </form>
    </div>
  )
}