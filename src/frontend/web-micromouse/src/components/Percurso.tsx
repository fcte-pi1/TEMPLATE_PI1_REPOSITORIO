import { useEffect, useState } from 'react'
import type { Ponto, Posicao } from '../types'

const C = 40
const PASSO_MS = 400
const ANGULO: Record<Posicao['direcao'], number> = { N: 0, L: 90, S: 180, O: 270 }

// soma cada giro pelo lado mais curto (O → N = +90°, não −270°), senao o robô da a volta errada.
const anguloAcumulado = (seq: Posicao[]) =>
  seq.reduce((acc, p) => acc + ((((ANGULO[p.direcao] - acc) % 360) + 540) % 360) - 180, 0)

const LEGENDA = [
  ['Trajetória', 'text-emerald-500'],
  ['Robô', 'text-cyan-400'],
  ['Início', 'text-emerald-500'],
  ['Meta', 'text-amber-500'],
]

type Props = { linhas: number; colunas: number; trajetoria: Posicao[]; mostrarControles?: boolean }

export function Percurso({ linhas, colunas, trajetoria, mostrarControles = true }: Props) {

  
  const [passo, setPasso] = useState<number | null>(null)
  const [tocando, setTocando] = useState(false)

  const fim = trajetoria.length - 1
  const atual = passo === null ? fim : Math.min(passo, fim)
  const rodando = tocando && atual < fim
  const visivel = trajetoria.slice(0, atual + 1)
  const robo = visivel.at(-1)

  useEffect(() => {
    if (!rodando) return
    const id = setTimeout(() => setPasso(atual + 1 >= fim ? null : atual + 1), PASSO_MS)
    return () => clearTimeout(id)
  }, [rodando, atual, fim])

  const alternar = () => {
    if (rodando) return setTocando(false)
    if (atual >= fim) setPasso(0)
    setTocando(true)
  }

  const centro = (p: Ponto) => [p.x * C + C / 2, p.y * C + C / 2]
  const [ix, iy] = centro({ x: 0, y: 0 })
  const [mx, my] = centro({ x: colunas - 1, y: linhas - 1 })
  const w = colunas * C
  const h = linhas * C

  return (
    <>
      <svg viewBox={`-2 -2 ${w + 4} ${h + 4}`} className="mx-auto max-h-[60vh] w-full max-w-md">
        <defs>
          <pattern id="grade" width={C} height={C} patternUnits="userSpaceOnUse">
            <path d={`M ${C} 0 L 0 0 0 ${C}`} fill="none" className="stroke-grade" strokeWidth={1} />
          </pattern>
        </defs>
        <rect width={w} height={h} fill="url(#grade)" />
        <rect width={w} height={h} fill="none" stroke="#6366f1" strokeWidth={1.2} />
        <polyline
          points={visivel.map(p => centro(p).join(',')).join(' ')}
          fill="none"
          stroke="#10b981"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Marcador x={ix} y={iy} letra="S" cor="#10b981" />
        <Marcador x={mx} y={my} letra="F" cor="#f59e0b" />
        {robo && (
          <g
            style={{
              transform: `translate(${centro(robo)[0]}px, ${centro(robo)[1]}px) rotate(${anguloAcumulado(visivel)}deg)`,
              transition: 'transform 0.3s',
            }}
          >
            <circle r={8} fill="#22d3ee" opacity={0.2} />
            <circle r={5} fill="#22d3ee" />
            <path d="M 0 -2.8 L 2.4 2 L -2.4 2 Z" fill="#0b1626" />
          </g>
        )}
      </svg>

      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 px-2 text-xs text-slate-300">
        {LEGENDA.map(([nome, cor]) => (
          <li key={nome}>
            <span className={cor}>●</span> {nome}
          </li>
        ))}
      </ul>

      {mostrarControles && <div className="mt-3 flex items-center gap-4 border-t border-slate-800 pt-3">
        <button
          type="button"
          onClick={alternar}
          disabled={fim < 1}
          className="shrink-0 rounded-md border border-cyan-800/70 bg-cyan-950/60 px-3 py-1.5 text-xs text-cyan-400 transition-colors hover:bg-cyan-900/60 disabled:opacity-40"
        >
          {rodando ? '❚❚ Pausar' : '▶ Reproduzir'}
        </button>
        <input
          type="range"
          aria-label="Passo do replay"
          min={0}
          max={Math.max(fim, 0)}
          value={Math.max(atual, 0)}
          disabled={fim < 1}
          onChange={e => {
            const v = Number(e.target.value)
            setTocando(false)
            setPasso(v >= fim ? null : v)
          }}
          className="barra-replay w-full"
        />
      </div>}
    </>
  )
}

function Marcador({ x, y, letra, cor }: { x: number; y: number; letra: string; cor: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={5} fill={cor} />
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={6} fontWeight={700} fill="#0b1626">
        {letra}
      </text>
    </g>
  )
}
