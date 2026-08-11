import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 1. Inicializar cliente de Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 2. Obtener el usuario autenticado actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isLoginPage = pathname === '/admin/login'
  const isAdminRoute = pathname.startsWith('/admin')

  // 3. Redirigir al inicio si ya está autenticado e intenta ir al login
  if (isLoginPage && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 4. Bloquear el acceso si no está autenticado e intenta ir a rutas dentro de /admin
  if (isAdminRoute && !isLoginPage && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 5. Validación de Administrador consultando la tabla 'administradores' y su rol
  if (isAdminRoute && !isLoginPage && user) {
    const { data: admin, error } = await supabase
      .from('administradores')
      .select('rol')
      .eq('id', user.id)
      .eq('rol', 'ADMIN')
      .single()

    if (error || !admin) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}