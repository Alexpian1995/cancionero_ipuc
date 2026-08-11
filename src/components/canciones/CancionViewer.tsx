'use client'

import { useState } from 'react'
import { transponerNota } from '@/lib/transpose'
import { TransposerControls } from './TransposerControls'
import { MusicalNoteIcon, UserIcon } from '@heroicons/react/24/outline'

interface Cancion {
  titulo: string
  tonalidad: string
  letra: string
}

// Regex optimizada para capturar notas/acordes individuales (sin capturar la / directamente como parte del acorde)
const ACORDE_REGEX = /\b([A-G][b#]?(?:m|maj7|min7|m7|maj|dim|aug|sus[24]?|add[9]|\d)*)\b/g

export function CancionViewer({ cancion }: { cancion?: Cancion }) {
  const [modo, setModo] = useState<'musico' | 'cantante'>('musico')
  const [semitonos, setSemitonos] = useState<number>(0)

  if (!cancion) {
    return <div className="p-6 text-center text-slate-500">Cargando...</div>
  }

  const tonalidadBase = cancion.tonalidad || 'E'
  const tonalidadActual = transponerNota(tonalidadBase, semitonos, tonalidadBase)
  const lineas = (cancion.letra || '').split('\n')

  // Detecta si una línea contiene mayoritariamente acordes
  const esLineaDeAcordes = (linea: string) => {
    const palabras = linea.trim().split(/\s+/).filter(Boolean)
    if (palabras.length === 0) return false
    
    // Evalúa palabras ignorando barras de bajo
    const palabrasLimpia = linea.replace(/\//g, ' ').match(/\b[A-G][b#]?[^\s]*\b/g) || []
    return palabrasLimpia.length / palabras.length >= 0.4
  }

  // Transpone individualmente cada nota o acorde en la línea respetando la / y manteniendo espacios
  const transponerLineaAcordes = (linea: string) => {
    return linea.replace(ACORDE_REGEX, (acorde) => 
      transponerNota(acorde, semitonos, tonalidadBase)
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-4xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{cancion.titulo}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-slate-500">Tono actual:</span>
            <span className="px-2.5 py-0.5 text-xs font-bold text-sky-700 bg-sky-50 rounded-md border border-sky-200/60 font-mono">
              {tonalidadActual}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector Modo */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setModo('musico')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                modo === 'musico'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <MusicalNoteIcon className="h-4 w-4 text-amber-500" />
              Músico
            </button>
            <button
              type="button"
              onClick={() => setModo('cantante')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                modo === 'cantante'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserIcon className="h-4 w-4 text-emerald-600" />
              Cantante
            </button>
          </div>

          {/* Control Transposición */}
          {modo === 'musico' && (
            <TransposerControls
              semitonos={semitonos}
              onChange={setSemitonos}
              onReset={() => setSemitonos(0)}
            />
          )}
        </div>
      </div>

      {/* Visor de Letra y Acordes */}
      <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 overflow-x-auto">
        <pre className="font-mono text-sm leading-relaxed text-slate-800 whitespace-pre">
          {lineas.map((linea, idx) => {
            const esAcorde = esLineaDeAcordes(linea)

            if (modo === 'cantante' && esAcorde) {
              return null
            }

            if (esAcorde) {
              return (
                <span key={idx} className="block font-bold text-sky-600 select-none">
                  {transponerLineaAcordes(linea)}
                </span>
              )
            }

            return <span key={idx} className="block text-slate-700">{linea || ' '}</span>
          })}
        </pre>
      </div>
    </div>
  )
}