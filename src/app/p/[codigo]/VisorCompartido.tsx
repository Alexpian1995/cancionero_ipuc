'use client'

import { useRouter } from 'next/navigation'
import PopurriDetalleView from '@/app/popurri/PopurriDetalleView'
import { QrCodeIcon } from '@heroicons/react/24/outline'

type Props = {
  popurri: any[]
  titulo: string
  lider: string | null
  codigo: string
}

export function VisorCompartido({ popurri, titulo, lider, codigo }: Props) {
  const router = useRouter()

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F2C4C] text-white rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-[#D9A544] rounded-xl">
            <QrCodeIcon className="w-5 h-5 text-[#0F2C4C]" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#D9A544] font-bold">
              Popurrí compartido · Código {codigo}
            </p>
            <h1 className="font-bold text-sm mt-0.5">
              {titulo}
              {lider && <span className="text-slate-300 font-normal"> · por {lider}</span>}
            </h1>
          </div>
        </div>
      </div>

      <PopurriDetalleView
        popurriInicial={popurri}
        catalogo={[]}
        onVolver={() => router.push('/')}
      />
    </div>
  )
}