import Link from 'next/link'
import {
  SparklesIcon,
  MusicalNoteIcon,
  MagnifyingGlassIcon,
  ArrowsPointingOutIcon,
  DocumentArrowDownIcon,
  FolderIcon,
  CheckCircleIcon,
  PlayIcon,
  ClockIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline'

const PASOS = [
  {
    n: 1,
    titulo: 'Creá tu cuenta gratis',
    detalle:
      'Registrate con tu correo y el nombre de tu iglesia. Al instante obtenés 30 días de prueba con acceso completo, sin tarjeta de crédito.',
  },
  {
    n: 2,
    titulo: 'Explorá el catálogo',
    detalle:
      'Tres cancioneros disponibles: Lluvias de Bendición, Manantial de Inspiración y Coros y Adoración, con tonalidad, tempo y categoría de cada alabanza.',
  },
  {
    n: 3,
    titulo: 'Buscá al instante',
    detalle:
      'Escribí un título o incluso un fragmento de la letra ("oh Dios eterno…") y el buscador encuentra la canción en milisegundos.',
  },
  {
    n: 4,
    titulo: 'Armá tu popurrí',
    detalle:
      'Agregá canciones manualmente o pedile al asistente de IA un popurrí por tema ("canciones sobre la fidelidad de Dios").',
  },
  {
    n: 5,
    titulo: 'Ajustá tonos y transiciones',
    detalle:
      'Transponé cada canción al tono de tus cantores y dejá que la IA te sugiera la modulación entre una y otra.',
  },
  {
    n: 6,
    titulo: 'Guardalo en tu biblioteca',
    detalle:
      'Cada popurrí queda guardado con su código de sesión para que lo cargues en segundos la próxima vez.',
  },
  {
    n: 7,
    titulo: 'Usalo en vivo durante el culto',
    detalle:
      'El Modo Presentación muestra letra y acordes en pantalla completa, con columnas y zoom para proyector. Incluye versión "Cantante" sin acordes.',
  },
  {
    n: 8,
    titulo: 'Llevalo sin internet',
    detalle:
      'Exportá el popurrí a PDF en modo músico (con acordes) o cantante (solo letra) para imprimir o ver offline en la iglesia.',
  },
]

const FUNCIONES = [
  { icon: MagnifyingGlassIcon, titulo: 'Búsqueda inteligente', detalle: 'Por título o por fragmento de letra, con resultados al instante.' },
  { icon: SparklesIcon, titulo: 'Asistente de IA', detalle: 'Sugiere canciones por tema y explica por qué las eligió.' },
  { icon: MusicalNoteIcon, titulo: 'Transposición automática', detalle: 'Cambiá el tono y todos los acordes se reescriben solos.' },
  { icon: ArrowsPointingOutIcon, titulo: 'Modo Presentación', detalle: 'Pantalla completa para proyector, con modo músico y cantante.' },
  { icon: DocumentArrowDownIcon, titulo: 'Exportar a PDF', detalle: 'Tu popurrí completo para usar sin conexión a internet.' },
  { icon: FolderIcon, titulo: 'Biblioteca personal', detalle: 'Popurrís guardados con código de sesión para reutilizar.' },
]

export default function AcercaPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-12">
      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F2C4C] via-[#153a63] to-[#1B5FA8] p-8 sm:p-12 text-white shadow-xl">
        <div className="relative z-10 space-y-5">
          <span className="inline-block px-3 py-1 bg-[#D9A544] text-[#0F2C4C] text-[10px] font-bold uppercase tracking-widest rounded-full">
            Asistente de Alabanza IPUC
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Todo tu cancionero, listo para el culto
          </h1>
          <p className="text-slate-200 text-sm sm:text-base max-w-2xl leading-relaxed">
            Cancionero IPUC reúne los himnarios de la iglesia en una sola plataforma: buscá
            alabanzas, armá popurrís con ayuda de IA, transponé tonos, proyectá en vivo y
            llevate todo en PDF — aunque no haya internet en el templo.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/registro"
              className="px-5 py-3 bg-[#D9A544] text-[#0F2C4C] font-bold text-sm rounded-xl hover:bg-[#e8b95f] transition-colors shadow-md"
            >
              Registrarme gratis (30 días)
            </Link>
            <Link
              href="/demo"
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 font-bold text-sm rounded-xl transition-colors border border-white/20"
            >
              <PlayIcon className="w-4 h-4 text-[#D9A544]" />
              Probar el demo
            </Link>
          </div>
        </div>
      </div>

      {/* ═══ PASO A PASO ═══ */}
      <section className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0F2C4C]">Cómo funciona, paso a paso</h2>
          <p className="text-xs text-slate-500 mt-1">De registrarte a dirigir el culto con un solo clic.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PASOS.map((paso) => (
            <div key={paso.n} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2 hover:border-[#1B5FA8] transition-colors">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#0F2C4C] text-[#D9A544] font-bold text-sm">
                {paso.n}
              </span>
              <h3 className="font-bold text-slate-800 text-sm">{paso.titulo}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{paso.detalle}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FUNCIONES ═══ */}
      <section className="space-y-6">
        <h2 className="font-display text-2xl font-bold text-[#0F2C4C]">Funciones principales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FUNCIONES.map((f) => (
            <div key={f.titulo} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <f.icon className="w-6 h-6 text-[#1B5FA8]" />
              <h3 className="font-bold text-slate-800 text-sm">{f.titulo}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{f.detalle}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PLANES ═══ */}
      <section className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0F2C4C]">Planes y precios</h2>
          <p className="text-xs text-slate-500 mt-1">Empezá gratis y quedate si te sirve para tu ministerio.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Prueba gratis */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-[#1B5FA8]" />
              <h3 className="font-bold text-[#0F2C4C]">Prueba gratuita</h3>
            </div>
            <p className="text-3xl font-bold text-[#0F2C4C]">
              $0 <span className="text-xs font-semibold text-slate-500">/ 30 días</span>
            </p>
            <ul className="space-y-2">
              {[
                'Acceso completo al catálogo (3 cancioneros)',
                'Armador de popurrís con asistente de IA',
                'Modo Presentación para proyector',
                'Exportación a PDF sin internet',
                'Sin tarjeta de crédito',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/registro"
              className="block text-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Comenzar prueba gratis
            </Link>
          </div>

          {/* Plan mensual */}
          <div className="relative bg-gradient-to-br from-[#0F2C4C] to-[#1B5FA8] rounded-2xl p-6 shadow-lg space-y-4 text-white">
            <span className="absolute -top-3 right-5 px-3 py-1 bg-[#D9A544] text-[#0F2C4C] text-[10px] font-bold uppercase tracking-widest rounded-full">
              Recomendado
            </span>
            <div className="flex items-center gap-2">
              <CreditCardIcon className="w-5 h-5 text-[#D9A544]" />
              <h3 className="font-bold">Plan Ministerio</h3>
            </div>
            <p className="text-3xl font-bold">
              $10.000 <span className="text-xs font-semibold text-slate-300">COP / mes</span>
            </p>
            <ul className="space-y-2">
              {[
                'Todo lo incluido en la prueba',
                'Biblioteca de popurrís ilimitada',
                'Nuevas canciones y funciones incluidas',
                'Soporte por correo prioritario',
                'Cancelás cuando quieras, sin permanencia',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-slate-200">
                  <CheckCircleIcon className="w-4 h-4 text-[#D9A544] shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="mailto:alexanderalzate53@gmail.com?subject=Quiero%20suscribirme%20a%20Cancionero%20IPUC"
              className="block text-center px-4 py-2.5 bg-[#D9A544] hover:bg-[#e8b95f] text-[#0F2C4C] font-bold text-xs rounded-xl transition-colors"
            >
              Suscribirme al terminar mi prueba
            </a>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
          💡 Al finalizar los 30 días de prueba podés seguir <strong>consultando el catálogo
          gratuitamente</strong>. La suscripción mensual desbloquea el armador de popurrís, el
          asistente de IA, el modo en vivo y la exportación a PDF.
        </p>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
        <h2 className="font-display text-xl font-bold text-[#0F2C4C]">
          ¿Listo para dirigir tu próxima alabanza sin papeles?
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Unite a las congregaciones que ya ensayan y adoran con Cancionero IPUC.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/registro"
            className="px-6 py-3 bg-[#0F2C4C] hover:bg-[#1B5FA8] text-white font-bold text-sm rounded-xl transition-colors"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/legal"
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
          >
            Ver políticas legales
          </Link>
        </div>
      </section>
    </div>
  )
}