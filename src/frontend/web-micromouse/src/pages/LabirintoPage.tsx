import { useState, type ReactNode } from 'react'
import { Percurso } from '../components/Percurso'
import { SeletorLabirinto } from '../components/SeletorLabirinto'
import { useLabirinto } from '../hooks/useLabirinto'
import { LABIRINTOS, type TipoLabirinto } from '../types'

const mmss = (ms: number) => new Date(ms).toISOString().slice(14, 19)

export function LabirintoPage() {
  const [tipo, setTipo] = useState<TipoLabirinto>('4x4')
  const { telemetria, trajetoria } = useLabirinto()
  const{linhas, colunas} = telemetria?.labirinto ?? LABIRINTOS[tipo]

  const status = telemetria?.status ?? 'Sem conexão'

  return (
    <main className="flex-1 overflow-y-auto px-4 pb-4 pt-[136px] text-slate-200 sm:p-12">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl text-slate-100">Labirinto</h1>
          <p className="mt-1 text-xs text-slate-500">{tipo}</p>
        </div>
        <Status texto={status} />
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-white/5 bg-card p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-100">Labirinto Atual</h2>
            <div className="flex items-center gap-3">
              <SeletorLabirinto valor={tipo} onChange={setTipo} />
              <Status texto={status} />
            </div>
          </div>
          <Percurso key={tipo} linhas={linhas} colunas={colunas} trajetoria={trajetoria} />
        </section>

        <div className="flex flex-col gap-4">
          <Card titulo="Detalhes da Execução">
            <Campo nome="tipo" valor={tipo} />
            <Campo nome="tempo" valor={telemetria && mmss(telemetria.tempoMS)} />
            <Campo nome="Células visitadas" valor={telemetria?.celulasPercorridas} />
            <Campo nome="Posição" valor={telemetria && `(${telemetria.posicao.x}, ${telemetria.posicao.y})`} />
          </Card>

          <Card titulo="Métricas da Corrida">
            <div className="grid grid-cols-2 gap-3">
              <Metrica nome="Velocidade" valor={telemetria?.velocidade} unidade="cm/s" cor="text-cyan-400" />
              <Metrica nome="RPM" valor={telemetria?.rpm} unidade="rpm" cor="text-cyan-400" />
              <Metrica nome="Bateria" valor={telemetria?.bateria} unidade="%" cor="text-emerald-400" />
              <Metrica nome="Tempo" valor={telemetria && mmss(telemetria.tempoMS)} cor="text-slate-100" />
            </div>
            <div className="mt-5 flex justify-between text-[10px] text-slate-400">
              <span>Bateria restante</span>
              <span>{telemetria ? `${telemetria.bateria}%` : '-'}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-cyan-500" style={{ width: `${telemetria?.bateria ?? 0}%` }} />
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}

function Status({ texto }: { texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-cyan-800/70 bg-cyan-950/60 px-2.5 py-1 text-xs text-cyan-400">
      <span className="text-[8px]">●</span>
      {texto}
    </span>
  )
}

function Card({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-white/5 bg-card p-6">
      <h2 className="mb-5 text-lg font-semibold text-slate-100">{titulo}</h2>
      {children}
    </section>
  )
}

type Valor = string | number | null | undefined

function Campo({ nome, valor }: { nome: string; valor: Valor }) {
  return (
    <div className="flex justify-between py-2.5 text-sm">
      <span className="text-slate-400">{nome}</span>
      <span className="font-semibold text-slate-100">{valor ?? '-'}</span>
    </div>
  )
}

function Metrica({ nome, valor, unidade, cor }: { nome: string; valor: Valor; unidade?: string; cor: string }) {
  return (
    <div className="rounded-md bg-bloco p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">{nome}</div>
      <div className={`mt-3 text-sm font-semibold ${cor}`}>
        {valor ?? '-'} {unidade && <span className="text-[10px] font-normal text-slate-500">{unidade}</span>}
      </div>
    </div>
  )
}
