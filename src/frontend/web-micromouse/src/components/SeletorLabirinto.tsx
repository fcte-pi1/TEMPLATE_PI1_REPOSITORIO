import { useState } from 'react'
import { CELULA_CM, LABIRINTOS, type TipoLabirinto } from '../types'

const TIPOS = Object.keys(LABIRINTOS) as TipoLabirinto[]

type Props = { valor: TipoLabirinto; onChange: (tipo: TipoLabirinto) => void }

export function SeletorLabirinto({ valor, onChange }: Props) {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="relative" onKeyDown={e => e.key === 'Escape' && setAberto(false)}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={aberto}
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-white/5"
      >
        {valor}
        <span className={`text-[9px] text-slate-500 transition-transform ${aberto ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAberto(false)} />
          <ul className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-slate-700 bg-card py-1 shadow-xl shadow-black/50">
            {TIPOS.map(tipo => (
              <li key={tipo}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(tipo)
                    setAberto(false)
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-white/5 ${
                    tipo === valor ? 'text-cyan-400' : 'text-slate-200'
                  }`}
                >
                  <span>
                    {tipo === valor ? '✓ ' : ''}
                    {tipo}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {LABIRINTOS[tipo].linhas * CELULA_CM}×{LABIRINTOS[tipo].colunas * CELULA_CM} cm
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
