'use client'

export function TransposerControls({
  semitonos,
  onChange,
  onReset,
}: {
  semitonos: number
  onChange: (val: number) => void
  onReset: () => void
}) {
  return (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
      <button
        type="button"
        onClick={() => onChange(semitonos - 1)}
        className="w-7 h-7 flex items-center justify-center font-bold text-slate-700 bg-white rounded-lg shadow-xs hover:bg-slate-50"
      >
        -
      </button>
      <button
        type="button"
        onClick={onReset}
        className="px-2 h-7 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        {semitonos > 0 ? `+${semitonos}` : semitonos}
      </button>
      <button
        type="button"
        onClick={() => onChange(semitonos + 1)}
        className="w-7 h-7 flex items-center justify-center font-bold text-slate-700 bg-white rounded-lg shadow-xs hover:bg-slate-50"
      >
        +
      </button>
    </div>
  )
}