'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PopurriDetalleView from '@/app/popurri/PopurriDetalleView'

// Himnos de dominio público para el demo
const SUBLIME_GRACIA = `G                  G7
Sublime gracia, dulce son
C               G
que a un infeliz salvó;
G            D7
fui ciego, mas hoy veo yo,
G        D7    G
perdido, y me halló.

G                 G7
La gracia me enseñó a temer
C              G
y mis temores calmó;
G             D7
y al punto que empecé a creer
G       D7    G
mi alma se alegró.`

const NOCHE_DE_PAZ = `C                 G7
Noche de paz, noche de amor,
C                    F
todo duerme en derredor;
C                F
entre los pastores fiel
C           G7
vela el pueblo de Israel:
C         F
es el niño Jesús,
C      G7     C
es el niño Jesús.`

const POPURRI_DEMO = [
  {
    id: 'demo-1',
    titulo: 'Sublime gracia',
    tonalidadOriginal: 'G',
    tonalidadActual: 'G',
    letraConAcordes: SUBLIME_GRACIA,
    transicionSugerida: undefined,
  },
  {
    id: 'demo-2',
    titulo: 'Noche de paz',
    tonalidadOriginal: 'C',
    tonalidadActual: 'C',
    letraConAcordes: NOCHE_DE_PAZ,
    transicionSugerida: 'De G pasá a C bajando suave (G → C).',
  },
]

export default function DemoPage() {
  const router = useRouter()

  return (
    <div className="space-y-4">
      {/* Banner del demo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F2C4C] text-white rounded-2xl px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#D9A544] font-bold">
            Demo público · sin registro
          </p>
          <h1 className="font-bold text-sm mt-0.5">
            Probá el Modo Presentación con himnos de dominio público
          </h1>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Transponé tonos, cambiá de canción, ajustá columnas y abrí pantalla completa.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/registro"
            className="px-3 py-2 bg-[#D9A544] text-[#0F2C4C] rounded-xl text-xs font-bold hover:bg-[#e8b95f] transition-colors"
          >
            Registrarme gratis
          </Link>
          <Link
            href="/acerca"
            className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors"
          >
            Conocer más
          </Link>
        </div>
      </div>

      {/* Visor reutilizado */}
      <PopurriDetalleView
        popurriInicial={POPURRI_DEMO}
        catalogo={[]}
        onVolver={() => router.push('/acerca')}
      />
    </div>
  )
}