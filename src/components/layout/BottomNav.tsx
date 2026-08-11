import Link from 'next/link'
import { IconLluvia, IconManantial, IconCoros } from '@/components/ui/Icons'

export function BottomNav() {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E5E9] flex justify-around py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <Link href="/" className="flex flex-col items-center gap-0.5 px-3 py-1 text-[#0F2C4C]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />
        </svg>
        <span className="text-[10px]">Inicio</span>
      </Link>
      <Link href="/lluvias-de-bendicion" className="flex flex-col items-center gap-0.5 px-3 py-1 text-[#1B5FA8]">
        <IconLluvia className="w-5 h-5" />
        <span className="text-[10px]">Lluvias</span>
      </Link>
      <Link href="/manantial-de-inspiracion" className="flex flex-col items-center gap-0.5 px-3 py-1 text-[#D9A544]">
        <IconManantial className="w-5 h-5" />
        <span className="text-[10px]">Manantial</span>
      </Link>
      <Link href="/coros" className="flex flex-col items-center gap-0.5 px-3 py-1 text-[#0F2C4C]">
        <IconCoros className="w-5 h-5" />
        <span className="text-[10px]">Coros</span>
      </Link>
    </nav>
  )
}