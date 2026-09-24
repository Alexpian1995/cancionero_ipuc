'use client'

import { useState } from 'react'
import { TransposerControls } from './TransposerControls'
import { MusicalNoteIcon, UserIcon } from '@heroicons/react/24/outline'

interface Cancion {
  titulo: string
  tonalidad: string
  letra: string
}

// ================= TRANSPOSICIÓN =================
const SOSTENIDOS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const BEMOLES    = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

function transponerNota(nota: string, semitonos: number): string {
  let idx = SOSTENIDOS.indexOf(nota)
  if (idx === -1) idx = BEMOLES.indexOf(nota)
  if (idx === -1) return nota

  let usaBemoles: boolean
  if (nota.includes('#')) usaBemoles = false
  else if (nota.includes('b')) usaBemoles = true
  else usaBemoles = semitonos < 0

  const escala = usaBemoles ? BEMOLES : SOSTENIDOS
  return escala[(idx + semitonos + 120) % 12]
}

function transponerAcorde(acorde: string, semitonos: number): string {
  if (semitonos === 0) return acorde

  if (acorde.includes('/')) {
    const [principal, bajo] = acorde.split('/')
    return `${transponerAcorde(principal, semitonos)}/${transponerAcorde(bajo, semitonos)}`
  }

  const match = acorde.match(/^([A-G][#b]?)(.*)$/)
  if (!match) return acorde
  return transponerNota(match[1], semitonos) + match[2]
}

const ACORDE_REGEX =
  /\b([A-G][#b]?(?:m7b5|maj7|min7|m7|dim7|aug7|sus[24]|add9|maj|min|dim|aug|m|\d)*(?:\/[A-G][#b]?)?)(?![A-Za-z0-9])/g

function transponerLineaAcordes(linea: string, semitonos: number): string {
  if (semitonos === 0 || !linea) return linea
  return linea.replace(ACORDE_REGEX, (match) => transponerAcorde(match, semitonos))
}

// ================= COMPONENTE (named export) =================
export function CancionViewer({ cancion }: { cancion?: Cancion }) {
  const [modo, setModo] = useState<'musico' | 'cantante'>('musico')
  const [semitonos, setSemitonos] = useState<number>(0)

  if (!cancion) {
    return <div className="p-6 text-center text-slate-500">Cargando...</div>
  }

  const tonalidadBase = cancion.tonalidad || 'E'
  const tonalidadActual = transponerNota(tonalidadBase, semitonos)
  const lineas = (cancion.letra || '').split('\n')

  // Token de acorde válido: C, D#m, G/B, F#m7, Bsus4, E/G#...
  const TOKEN_ACORDE =
    /^[A-G][#b]?(?:m7b5|maj7|min7|m7|dim7|aug7|sus[24]|add9|maj|min|dim|aug|m|\d)*(?:\/[A-G][#b]?)?$/

  const esLineaDeAcordes = (linea: string) => {
    const palabras = linea.trim().split(/\s+/).filter(Boolean)
    if (palabras.length === 0) return false
    const acordes = palabras.filter((p) => TOKEN_ACORDE.test(p))
    // Casi todos los tokens deben ser acordes reales para ser línea de acordes
    return acordes.length > 0 && acordes.length / palabras.length >= 0.8
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-4xl mx-auto space-y-6">
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

          {modo === 'musico' && (
            <TransposerControls
              semitonos={semitonos}
              onChange={setSemitonos}
              onReset={() => setSemitonos(0)}
            />
          )}
        </div>
      </div>

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
                  {transponerLineaAcordes(linea, semitonos)}
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