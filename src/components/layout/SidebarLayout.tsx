'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  HomeIcon,
  BookOpenIcon,
  MusicalNoteIcon,
  SparklesIcon,
  PlusCircleIcon,
  AdjustmentsVerticalIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const mainNavigation = [
  { name: 'Inicio Dashboard', href: '/', icon: HomeIcon },
  { name: 'Lluvias de Bendición', href: '/lluvias-de-bendicion', icon: BookOpenIcon },
  { name: 'Manantial de Inspiración', href: '/manantial-de-inspiracion', icon: BookOpenIcon },
  { name: 'Coros y Adoración', href: '/coros', icon: MusicalNoteIcon },
  { name: 'Armador de Popurrís', href: '/popurri', icon: SparklesIcon, badge: 'IA' },
]

const adminNavigation = [
  { name: 'Añadir Canción', href: '/admin/crear', icon: PlusCircleIcon },
  { name: 'Administrar', href: '/admin', icon: AdjustmentsVerticalIcon },
]

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function checkUserAndRole() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: admin } = await supabase
          .from('administradores')
          .select('rol')
          .eq('id', user.id)
          .eq('rol', 'ADMIN')
          .single()

        setIsAdmin(!!admin)
      }
    }

    checkUserAndRole()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      if (currentUser) {
        const { data: admin } = await supabase
          .from('administradores')
          .select('rol')
          .eq('id', currentUser.id)
          .eq('rol', 'ADMIN')
          .single()

        setIsAdmin(!!admin)
      } else {
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsAdmin(false)
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#0F2C4C] text-slate-300 flex flex-col justify-between p-4 shrink-0 border-r border-slate-800 transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          <div className="flex items-center justify-between px-2 mb-8 mt-1">
            <div className="flex items-center gap-3">
              <Image
                src="/logoipuc.png"
                alt="Cancionero IPUC"
                width={32}
                height={32}
                className="object-contain"
              />
              <div>
                <h1 className="font-bold text-white text-sm leading-tight">Cancionero IPUC</h1>
                <p className="text-[11px] text-[#D9A544] font-medium">Asistente de Alabanza</p>
              </div>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 text-slate-400 hover:text-white md:hidden rounded-lg hover:bg-white/10"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
              Explorar
            </p>
            <nav className="space-y-1">
              {mainNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${
                      isActive
                        ? 'bg-[#D9A544] text-[#0F2C4C] font-semibold shadow-xs'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-amber-400/20 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          {isAdmin && (
            <div className="pt-4 border-t border-white/10">
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                Gestión
              </p>
              <nav className="space-y-1">
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${
                        isActive
                          ? 'bg-white/15 text-white font-semibold'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}
        </div>

        <div className="space-y-3 pt-4 border-t border-white/10">
          {user ? (
            <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 min-w-0">
                <UserIcon className="h-4 w-4 text-[#D9A544] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white truncate" title={user.email}>
                    {user.email}
                  </p>
                  <p className="text-[9px] text-emerald-400 font-medium">
                    {isAdmin ? 'Modo Admin' : 'Líder de Alabanza'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors ml-1"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/admin/login"
              className="flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-all"
            >
              <ArrowLeftOnRectangleIcon className="h-4 w-4 text-[#D9A544]" />
              Acceso Directores
            </Link>
          )}

          <div className="px-1 text-slate-500">
            <p className="text-[11px] font-semibold text-slate-400">Cancionero IPUC</p>
            <p className="text-[10px]">Versión 1.0 (2026)</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white/80 backdrop-blur-sm border-b border-slate-200/80 px-4 md:px-8 flex items-center justify-between md:justify-end shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl md:hidden transition-colors"
            aria-label="Abrir menú"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Modo Culto Activo
          </div>
        </header>

        <div className="flex-1 overflow-y-auto flex flex-col justify-between">
          <main className="p-4 md:p-8">{children}</main>

          <footer className="mt-auto border-t border-slate-200/80 bg-white/50 px-4 md:px-8 py-4 text-center text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Cancionero IPUC — Anderson Alzate. Todos los derechos reservados.</p>
          </footer>
        </div>
      </div>
    </div>
  )
}