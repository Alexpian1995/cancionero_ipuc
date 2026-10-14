'use client'

import Link from 'next/link'

export default function RegistroPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h2 className="font-display text-2xl font-bold text-[#0F2C4C]">
          Registro cerrado
        </h2>

        <p className="text-sm text-slate-600 leading-relaxed">
          Alabakey se encuentra actualmente en <strong>etapa de uso privado</strong>
          {' '}y no está aceptando nuevos registros públicos.
        </p>

        <p className="text-xs text-slate-500 leading-relaxed">
          Si considerás que esta herramienta podría ser útil para tu ministerio
          en el futuro, podés escribirnos y te avisaremos cuando abramos nuevos cupos.
        </p>

        <a
          href="mailto:alexanderalzate53@gmail.com?subject=Interesado%20en%20Alabakey"
          className="inline-block px-5 py-2.5 bg-[#D9A544] text-[#0F2C4C] font-bold text-xs rounded-xl hover:bg-[#e8b95f] transition-colors"
        >
          Contactar al desarrollador
        </a>

        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            ¿Ya tenés una cuenta autorizada?{' '}
            <Link
              href="/admin/login"
              className="font-semibold text-[#1B5FA8] hover:underline"
            >
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}