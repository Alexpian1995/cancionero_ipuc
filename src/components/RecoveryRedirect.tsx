'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function RecoveryRedirect() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Cuando Supabase procesa el token del email de recuperación,
      // redirigimos a la página de nueva contraseña
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/admin/nueva-contrasena')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  return null
}