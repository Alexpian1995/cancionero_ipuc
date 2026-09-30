import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_EMAILS = ['alexanderalzate53@gmail.com']

// 🆕 Rutas que cualquier usuario LOGUEADO puede usar (no solo admin)
const RUTAS_USUARIO_LOGUEADO = [
  '/admin/crear',
  '/admin/editar',
  // Si después querés que también puedan editar sus propias canciones:
  // '/admin/editar',
]

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isLoginPage = pathname === '/admin/login'
  const isPublicAuthRoute =
    pathname.startsWith('/admin/recuperar') ||
    pathname.startsWith('/admin/nueva-contrasena')
  const isAdminRoute = pathname.startsWith('/admin')

  // 🆕 ¿Es una ruta permitida para cualquier usuario logueado?
  const esRutaUsuarioLogueado = RUTAS_USUARIO_LOGUEADO.some((r) =>
    pathname === r || pathname.startsWith(`${r}/`)
  )

  // 1. Si ya está autenticado e intenta ir al login → al inicio
  if (isLoginPage && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 2. Si NO está autenticado e intenta ir a /admin (excepto login y recuperación) → al login
  if (isAdminRoute && !isLoginPage && !isPublicAuthRoute && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // 3. Validación de admin (solo rutas protegidas, no aplica a recuperación)
  if (isAdminRoute && !isLoginPage && !isPublicAuthRoute && user) {
    // 🆕 Si la ruta está permitida para usuarios logueados, solo exige sesión → dejar pasar
    if (esRutaUsuarioLogueado) {
      return supabaseResponse
    }

    // Resto de rutas /admin: exigen ser admin
    const email = (user.email || '').toLowerCase()

    if (!ADMIN_EMAILS.includes(email)) {
      return NextResponse.redirect(new URL('/', request.url))
    }

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