'use server'

import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

function generarSlug(nombre: string): string {
  const base = nombre
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  // 🆕 Sufijo aleatorio de 5 caracteres para garantizar unicidad
  // incluso si dos iglesias se llaman igual
  const sufijo = Math.random().toString(36).substring(2, 7)
  return `${base}-${sufijo}`
}

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

  const slug = generarSlug(nombreIglesia)

  const supabaseAdmin = getSupabaseAdmin()

  // 1. Crear el usuario en Auth (email es único por defecto en Supabase)
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
    // Si el error es de email duplicado, dar mensaje claro
    if (authError?.message?.toLowerCase().includes('already') ||
        authError?.message?.toLowerCase().includes('duplic')) {
      return { error: 'Ya existe una cuenta con ese correo electrónico.' }
    }
    return { error: authError?.message || 'Error al crear la cuenta de usuario.' }
  }

  // 2. Prueba de 30 días
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 30)

  // 3. Crear iglesia con slug único
  const { error: iglesiaError } = await supabaseAdmin.from('iglesias').insert({
    nombre: nombreIglesia,
    slug: slug,
    lider_id: authData.user.id,
    estado_suscripcion: 'trial',
    fin_suscripcion: trialEndsAt.toISOString(),
    plan: 'pro_trial',
  })

  if (iglesiaError) {
    // Si por alguna razón el slug chocó (muy raro), reintentar con otro
    if (iglesiaError.code === '23505') {
      const slugRetry = generarSlug(nombreIglesia)
      const { error: retryError } = await supabaseAdmin.from('iglesias').insert({
        nombre: nombreIglesia,
        slug: slugRetry,
        lider_id: authData.user.id,
        estado_suscripcion: 'trial',
        fin_suscripcion: trialEndsAt.toISOString(),
        plan: 'pro_trial',
      })
      if (retryError) {
        // Rollback: borrar el usuario creado
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return { error: `Error al registrar la iglesia: ${retryError.message}` }
      }
    } else {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return { error: `Error al registrar la iglesia: ${iglesiaError.message}` }
    }
  }

  // 4. Iniciar sesión
  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return { error: `Cuenta creada, pero falló el inicio de sesión: ${signInError.message}` }
  }

  redirect('/popurri')
}