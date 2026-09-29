'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  UsersIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

import { actualizarUsuarioAdmin, eliminarUsuarioAdmin, type UsuarioAdmin } from '@/actions/adminUsuarios'

const ADMIN_EMAILS = ['alexanderalzate53@gmail.com']

export function GestorUsuarios({ usuarios: iniciales }: { usuarios: UsuarioAdmin[] }) {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState(iniciales)
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState<UsuarioAdmin | null>(null)
  const [formIglesia, setFormIglesia] = useState('')
  const [procesando, setProcesando] = useState(false)

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    if (!q) return usuarios
    return usuarios.filter(
      (u) =>
        (u.email || '').toLowerCase().includes(q) ||
        (u.nombre || '').toLowerCase().includes(q) ||
        (u.iglesia || '').toLowerCase().includes(q)
    )
  }, [usuarios, busqueda])

  const esAdmin = (u: UsuarioAdmin) =>
    ADMIN_EMAILS.includes((u.email || '').toLowerCase())

  const abrirEdicion = (u: UsuarioAdmin) => {
    setEditando(u)
    setFormIglesia(u.iglesia || u.nombre || '')
  }

  const guardarEdicion = async () => {
    if (!editando) return
    setProcesando(true)
    const res = await actualizarUsuarioAdmin(editando.id, {
      nombre: formIglesia,
      iglesia: formIglesia,
    })
    setProcesando(false)

    if (res.exito) {
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === editando.id ? { ...u, nombre: formIglesia, iglesia: formIglesia } : u
        )
      )
      setEditando(null)
      router.refresh()
    } else {
      alert('Error al guardar: ' + res.error)
    }
  }

  const eliminar = async (u: UsuarioAdmin) => {
    if (!confirm(`¿Eliminar la cuenta de ${u.email}? Esta acción no se puede deshacer.`)) return
    setProcesando(true)
    const res = await eliminarUsuarioAdmin(u.id)
    setProcesando(false)

    if (res.exito) {
      setUsuarios((prev) => prev.filter((x) => x.id !== u.id))
      router.refresh()
    } else {
      alert('Error al eliminar: ' + res.error)
    }
  }

  const fmtFecha = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  const diasRestantes = (iso: string | null) => {
    if (!iso) return null
    const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
    return diff
  }

  return (
    <div className="space-y-4">
      {/* Buscador + contador */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
            <UsersIcon className="w-4 h-4 text-[#1B5FA8]" />
            Usuarios registrados
          </div>
          <p className="text-[10px] text-slate-400">
            {filtrados.length} de {usuarios.length}
          </p>
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por email o iglesia..."
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filtrados.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-10">No se encontraron usuarios</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-3 font-bold text-slate-600">Email</th>
                  <th className="p-3 font-bold text-slate-600">Iglesia</th>
                  <th className="p-3 font-bold text-slate-600">Plan</th>
                  <th className="p-3 font-bold text-slate-600">Registrado</th>
                  <th className="p-3 font-bold text-slate-600">Último acceso</th>
                  <th className="p-3 font-bold text-slate-600 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((u) => {
                  const isAdminUser = esAdmin(u)
                  const dias = diasRestantes(u.finSuscripcion)

                  return (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{u.email}</div>
                        {isAdminUser && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md mt-1">
                            <ShieldCheckIcon className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600">
                        {isAdminUser ? (
                          <span className="text-xs text-slate-400 italic">Administrador del sistema</span>
                        ) : u.iglesia ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[#1B5FA8] bg-[#1B5FA8]/10 px-2 py-0.5 rounded-md">
                            <BuildingOfficeIcon className="w-3 h-3" />
                            {u.iglesia}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3">
                        {isAdminUser ? (
                          <span className="inline-block text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            MASTER
                          </span>
                        ) : u.plan ? (
                          <span className="inline-block text-[10px] font-bold text-[#1B5FA8] bg-[#1B5FA8]/10 px-2 py-0.5 rounded-md">
                            {u.plan.replace('_', ' ').toUpperCase()}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3 text-xs text-slate-500">{fmtFecha(u.creado)}</td>
                      <td className="p-3 text-xs text-slate-500">
                        {fmtFecha(u.ultimoAcceso)}
                        {!isAdminUser && u.estado === 'trial' && dias !== null && (
                          <div className={`mt-1 text-[10px] font-semibold ${
                            dias < 0 ? 'text-red-600' : dias < 7 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {dias < 0 ? `Expirado hace ${Math.abs(dias)}d` : `${dias}d restantes`}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {isAdminUser ? (
                          <span className="text-[10px] text-slate-400 italic">—</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => abrirEdicion(u)}
                              className="p-1.5 text-slate-400 hover:text-[#1B5FA8] hover:bg-slate-100 rounded-lg"
                              title="Editar"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => eliminar(u)}
                              disabled={procesando}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40"
                              title="Eliminar"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de edición */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#0F2C4C]">Editar usuario</h3>
              <button onClick={() => setEditando(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">{editando.email}</p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre de la iglesia
              </label>
              <input
                type="text"
                value={formIglesia}
                onChange={(e) => setFormIglesia(e.target.value)}
                placeholder="Ej: IPUC Central Medellín"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5FA8]"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Este nombre se mostrará al líder cuando inicie sesión.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditando(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                disabled={procesando}
                className="px-4 py-2 text-xs font-bold text-white bg-[#1B5FA8] rounded-xl hover:bg-[#0F2C4C] disabled:opacity-50"
              >
                {procesando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}