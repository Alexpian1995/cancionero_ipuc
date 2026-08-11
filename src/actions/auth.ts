'use server'

import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function registrarLiderEIglesia(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nombreIglesia = formData.get('nombreIglesia') as string

  if (!email || !password || !nombreIglesia) {
    return { error: 'Todos los campos son obligatorios.' }
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  const slug = nombreIglesia
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  const supabaseAdmin = getSupabaseAdmin()

  // 1. Crear el usuario en Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nombre_iglesia: nombreIglesia,
      rol: 'lider',
    },
  })

  if (authError || !authData.user) {
    return { error: authError?.message || 'Error al crear la cuenta de usuario.' }
  }

  // 2. Calcular exacto 30 días en el futuro
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 30)

  // 3. Crear el registro de la iglesia usando el campo "fin_suscripcion"
  const { error: iglesiaError } = await supabaseAdmin.from('iglesias').insert({
    nombre: nombreIglesia,
    slug: slug,
    lider_id: authData.user.id,
    estado_suscripcion: 'trial',
    fin_suscripcion: trialEndsAt.toISOString(),
    plan: 'pro_trial',
  })

  if (iglesiaError) {
    return { error: `Error al registrar la iglesia: ${iglesiaError.message}` }
  }

  // 4. Iniciar sesión con el cliente del servidor para guardar cookies correctamente
  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return { error: `Cuenta creada, pero falló el inicio de sesión: ${signInError.message}` }
  }

  // 5. Redireccionar tras confirmar la cookie de sesión
  redirect('/popurri')
}