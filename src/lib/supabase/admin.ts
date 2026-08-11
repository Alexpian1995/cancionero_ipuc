// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Faltan las variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local'
    )
  }

  return createClient(supabaseUrl, serviceRoleKey)
}