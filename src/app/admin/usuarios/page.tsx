import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listarUsuariosAdmin } from '@/actions/adminUsuarios'
import { GestorUsuarios } from '@/components/admin/GestorUsuarios'

const ADMIN_EMAILS = ['alexanderalzate53@gmail.com']

export default async function UsuariosAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')
  if (!ADMIN_EMAILS.includes((user.email || '').toLowerCase())) redirect('/admin')

  const res = await listarUsuariosAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#0F2C4C]">Gestión de Usuarios</h1>
        <p className="text-xs text-slate-500">
          Consultá, editá y administrá todas las cuentas registradas en la plataforma
        </p>
      </div>

      {res.exito ? (
        <GestorUsuarios usuarios={res.usuarios} />
      ) : (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
          Error al cargar usuarios: {res.error}
        </div>
      )}
    </div>
  )
}