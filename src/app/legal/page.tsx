import Link from 'next/link'

const SECCIONES = [
  {
    titulo: '1. Propiedad de las letras y acordes',
    contenido: [
      'Las letras y acordes pertenecen a sus respectivos autores y se utilizan con autorización o bajo dominio público, exclusivamente para ensayo y culto de las congregaciones.',
      'Cancionero IPUC no reclama propiedad alguna sobre las obras musicales incluidas en el catálogo. Cada canción indica su estado legal (dominio público, permiso escrito, licencia o pendiente de permiso).',
    ],
  },
  {
    titulo: '2. Solicitud de retiro de contenido (DMCA / derechos de autor)',
    contenido: [
      'Si sos titular de derechos de alguna obra y deseás solicitar su retiro, escribinos a alexanderalzate53@gmail.com y la removeremos en un plazo máximo de 48 horas.',
      'Para agilizar el pedido, incluí: título de la obra, autor/compositor, acreditación de tu titularidad y el enlace o nombre de la canción dentro de la plataforma.',
    ],
  },
  {
    titulo: '3. Uso permitido del contenido',
    contenido: [
      'El material está disponible únicamente para uso ministerial: ensayos, cultos y actividades de la congregación.',
      'Queda prohibida la reproducción, distribución, venta o publicación externa de letras y acordes fuera de la plataforma sin autorización de sus titulares.',
      'La exportación a PDF es para uso interno de tu iglesia y no exime de las restricciones anteriores.',
    ],
  },
  {
    titulo: '4. Cuentas, prueba gratuita y suscripción',
    contenido: [
      'Al registrarte obtenés 30 días de prueba gratuita con acceso completo, sin necesidad de tarjeta de crédito.',
      'Finalizada la prueba, el acceso a las funciones de creación (armador de popurrís, asistente de IA, modo en vivo y exportación a PDF) requiere la suscripción mensual de $10.000 COP.',
      'La consulta del catálogo de canciones permanece disponible gratuitamente después de la prueba.',
      'La suscripción se paga por mes anticipado y podés cancelarla en cualquier momento escribiendo al correo de contacto; el acceso permanece activo hasta el fin del período pago.',
    ],
  },
  {
    titulo: '5. Privacidad y datos personales',
    contenido: [
      'Solo recopilamos los datos necesarios para operar el servicio: correo electrónico, nombre del líder y nombre de la iglesia.',
      'No vendemos ni compartimos tus datos con terceros con fines comerciales.',
      'Los correos transaccionales (bienvenida, recuperación de contraseña y notificaciones) se envían únicamente a tu dirección registrada.',
      'Podés solicitar la eliminación de tu cuenta y sus datos escribiendo a alexanderalzate53@gmail.com.',
    ],
  },
  {
    titulo: '6. Uso del asistente de inteligencia artificial',
    contenido: [
      'Las sugerencias del asistente de IA son orientativas y se basan en el catálogo interno de la plataforma.',
      'El líder es responsable final de la selección de canciones y de su adecuación al momento del culto.',
      'La IA no genera ni modifica letras protegidas: solo organiza y sugiere obras ya cargadas en el catálogo.',
    ],
  },
  {
    titulo: '7. Disponibilidad del servicio',
    contenido: [
      'Trabajamos para que la plataforma esté disponible de forma continua, pero no garantizamos acceso ininterrumpido durante mantenimientos o fallas de proveedores externos.',
      'Tus popurrís guardados permanecen en tu biblioteca mientras tu cuenta esté activa.',
    ],
  },
  {
    titulo: '8. Contacto',
    contenido: [
      'Por cualquier consulta legal, de derechos de autor o de suscripciones: alexanderalzate53@gmail.com.',
      'Última actualización: octubre de 2026.',
    ],
  },
]

export default function LegalPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="bg-gradient-to-br from-[#0F2C4C] to-[#1B5FA8] rounded-3xl p-8 sm:p-10 text-white shadow-xl space-y-3">
        <span className="inline-block px-3 py-1 bg-[#D9A544] text-[#0F2C4C] text-[10px] font-bold uppercase tracking-widest rounded-full">
          Transparencia y respeto al autor
        </span>
        <h1 className="font-display text-3xl font-bold tracking-tight">Políticas Legales</h1>
        <p className="text-slate-200 text-sm max-w-2xl leading-relaxed">
          Nuestro compromiso es servir a la iglesia respetando siempre el trabajo de compositores
          y editoriales. Acá encontrás cómo manejamos el contenido, tus datos y tu suscripción.
        </p>
      </div>

      <div className="space-y-5">
        {SECCIONES.map((s) => (
          <section key={s.titulo} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h2 className="font-display font-bold text-[#0F2C4C] text-base">{s.titulo}</h2>
            {s.contenido.map((parrafo, i) => (
              <p key={i} className="text-xs text-slate-600 leading-relaxed">
                {parrafo}
              </p>
            ))}
          </section>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center space-y-2">
        <p className="text-xs text-amber-900 font-semibold">
          ¿Sos titular de derechos y querés solicitar un retiro?
        </p>
        <a
          href="mailto:alexanderalzate53@gmail.com?subject=Solicitud%20de%20retiro%20de%20contenido"
          className="inline-block px-5 py-2.5 bg-[#0F2C4C] hover:bg-[#1B5FA8] text-white font-bold text-xs rounded-xl transition-colors"
        >
          Escribir a alexanderalzate53@gmail.com
        </a>
        <p className="text-[10px] text-amber-800">Respondemos y removemos el contenido en un máximo de 48 horas.</p>
      </div>

      <p className="text-center text-[11px] text-slate-400">
        <Link href="/acerca" className="text-[#1B5FA8] font-semibold underline">
          Conocé más sobre la app
        </Link>{' '}
        ·{' '}
        <Link href="/registro" className="text-[#1B5FA8] font-semibold underline">
          Crear cuenta gratis
        </Link>
      </p>
    </div>
  )
}