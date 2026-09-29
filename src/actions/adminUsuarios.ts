'use server'

import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAILS = ['alexanderalzate53@gmail.com']

export type UsuarioAdmin = {
  id: string
  email: string | null
  creado: string | null
  ultimoAcceso: string | null
  nombre: string | null       // nombre_iglesia desde user_metadata
  iglesia: string | null      // nombre de la tabla iglesias
  iglesiaId: string | null
  plan: string | null
  estado: string | null
  finSuscripcion: string | null
}

async function verificarAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  return ADMIN_EMAILS.includes((user.email || '').toLowerCase())
}

// ─── LISTAR TODOS LOS USUARIOS ───
export async function listarUsuariosAdmin(): Promise<{ exito: boolean; usuarios: UsuarioAdmin[]; error?: string }> {
  if (!(await verificarAdmin())) {
    return { exito: false, usuarios: [], error: 'Sin permisos de administrador' }
  }

  const admin = getSupabaseAdmin()
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })

  if (error) return { exito: false, usuarios: [], error: error.message }

  const usuariosAuth = data.users
  const ids = usuariosAuth.map((u) => u.id)

  // Traer iglesias donde lider_id sea uno de los usuarios
  let iglesias: Array<{
    id: string
    nombre: string | null
    lider_id: string | null
    plan: string | null
    estado_suscripcion: string | null
    fin_suscripcion: string | null
  }> = []

  if (ids.length > 0) {
    const q = await admin
      .from('iglesias')
      .select('id, nombre, lider_id, plan, estado_suscripcion, fin_suscripcion')
      .in('lider_id', ids)

    if (!q.error && q.data) iglesias = q.data
  }

  const mapaIglesias = new Map(
    iglesias.map((i) => [i.lider_id, i])
  )

  const usuarios: UsuarioAdmin[] = usuariosAuth.map((u) => {
    const meta = (u.user_metadata || {}) as Record<string, any>
    const iglesia = mapaIglesias.get(u.id)

    return {
      id: u.id,
      email: u.email || null,
      creado: u.created_at || null,
      ultimoAcceso: u.last_sign_in_at || null,
      // Fallback: primero tabla iglesias, luego user_metadata
      nombre: iglesia?.nombre || meta.nombre_iglesia || null,
      iglesiaId: iglesia?.id || null,
      iglesia: iglesia?.nombre || meta.nombre_iglesia || null,
      plan: iglesia?.plan || null,
      estado: iglesia?.estado_suscripcion || null,
      finSuscripcion: iglesia?.fin_suscripcion || null,
    }
  })

  // Más recientes primero
  usuarios.sort((a, b) => (b.creado || '').localeCompare(a.creado || ''))

  return { exito: true, usuarios }
}

// ─── EDITAR USUARIO (nombre iglesia + plan) ───
export async function actualizarUsuarioAdmin(
  userId: string,
  datos: { nombre: string; iglesia: string }
): Promise<{ exito: boolean; error?: string }> {
  if (!(await verificarAdmin())) return { exito: false, error: 'Sin permisos' }

  const admin = getSupabaseAdmin()

  // Buscar la iglesia por lider_id
  const { data: iglesia, error: qError } = await admin
    .from('iglesias')
    .select('id, lider_id')
    .eq('lider_id', userId)
    .maybeSingle()

  if (qError) return { exito: false, error: qError.message }

  if (iglesia) {
    const { error } = await admin
      .from('iglesias')
      .update({ nombre: datos.iglesia || datos.nombre })
      .eq('id', iglesia.id)

    if (error) return { exito: false, error: error.message }
  }

  // Actualizar también user_metadata para consistencia
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { nombre_iglesia: datos.iglesia || datos.nombre },
  })

  revalidatePath('/admin/usuarios')
  return { exito: true }
}

// ─── ELIMINAR USUARIO ───
export async function eliminarUsuarioAdmin(userId: string): Promise<{ exito: boolean; error?: string }> {
  if (!(await verificarAdmin())) return { exito: false, error: 'Sin permisos' }

  const admin = getSupabaseAdmin()

  // Proteger al admin principal
  const { data: objetivo } = await admin.auth.admin.getUserById(userId)
  const emailObjetivo = (objetivo?.user?.email || '').toLowerCase()
  if (ADMIN_EMAILS.includes(emailObjetivo)) {
    return { exito: false, error: 'No podés eliminar la cuenta de administrador principal' }
  }

  // Borrar iglesia del líder
  await admin.from('iglesias').delete().eq('lider_id', userId)

  // Borrar el usuario de auth
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { exito: false, error: error.message }

  revalidatePath('/admin/usuarios')
  return { exito: true }
}