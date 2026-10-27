import { BatteryCard } from "../components/telemetria/BatteryCard";
import { GyroscopeCard } from "../components/telemetria/GyroscopeCard";
import { MotorRPMCard } from "../components/telemetria/MotorRPMCard"; 
import { SpeedCard } from "../components/telemetria/SpeedCard";
import { useTelemetry } from "../hooks/useTelemetry";

import { Percurso } from "../components/Percurso";
import { useEffect, useState } from "react";
import { LABIRINTOS, type Posicao, type TipoLabirinto } from "../types";
import { TbRestore } from "react-icons/tb";


export function TelemetryPage() {
  const [tipo, setTipo] = useState<TipoLabirinto>('4x4')
  const [iniciada, setIniciada] = useState(false)
  const [tempoSegundos, setTempoSegundos] = useState(0)
  const [trajetoria] = useState<Posicao[]>([])
  const telemetry = useTelemetry();
  const { linhas, colunas } = LABIRINTOS[tipo]

  useEffect(() => {
    if (!iniciada) return
    const id = window.setInterval(() => setTempoSegundos(t => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [iniciada])

  const tempo = `${String(Math.floor(tempoSegundos / 60)).padStart(2, '0')}:${String(tempoSegundos % 60).padStart(2, '0')}`
  const posicaoAtual = trajetoria.at(-1)

  const batteryPercent =
    typeof telemetry.battery === "number"
      ? telemetry.battery
      : telemetry.battery &&
          typeof telemetry.battery === "object" &&
          "value" in telemetry.battery
        ? Number(telemetry.battery.value)
        : 0;
  return (
    <main className="flex-1 overflow-y-auto px-4 pb-4 pt-34 text-slate-200 sm:p-12">
      
     <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
       <h1 className="text-2xl font-semibold text-slate-100">Telemetria</h1>
       <div
        className="
          grid w-full gap-4 sm:gap-5
          grid-cols-[repeat(auto-fit,minmax(240px,1fr))]
        "
      >
        {/* BATERIA */}
        <BatteryCard battery={batteryPercent} />

        {/* VELOCIDADE */}
        <SpeedCard
          speed={telemetry.averageSpeed}
        />

        {/* MOTORES */}
       <MotorRPMCard
        leftRpm={telemetry.motors.leftRpm}
        rightRpm={telemetry.motors.rightRpm}
       />

        {/* GIROSCÓPIO */}
        <GyroscopeCard
          x={telemetry.gyro.x}
          y={telemetry.gyro.y}
          z={telemetry.gyro.z}
          
        />
        
       </div>
     </header>
      <div className="mt-6 grid items-start gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-white/5 bg-card p-5 lg:col-start-2 lg:row-start-1">
          <h2 className="mb-5 text-sm font-semibold text-slate-100">Configurar execução</h2>
          <label htmlFor="tipo-labirinto" className="mb-2 block text-xs text-slate-400">Tipo do labirinto</label>
          <select
            id="tipo-labirinto"
            value={tipo}
            onChange={event => setTipo(event.target.value as TipoLabirinto)}
            disabled={iniciada}
            className="w-full rounded-md border border-slate-700 bg-[#08111F] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500 disabled:opacity-60"
          >
            {Object.keys(LABIRINTOS).map(opcao => <option key={opcao} value={opcao}>{opcao}</option>)}
          </select>
         <div className="flex items-center gap-20">
           <button
            type="button"
            onClick={() => {
              setTempoSegundos(0)
              setIniciada(true)
            }}
            disabled={iniciada || !telemetry.connected}
            className="mt-5 w-full rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {iniciada ? 'Execução iniciada' : 'Iniciar'}
          </button>

          <button 
           disabled={!iniciada && telemetry.connected}
          onClick={()=> {
            setTempoSegundos(0)
              setIniciada(false)
          }} className="flex w-10  h-10 cursor-pointer  items-center justify-center rounded-md  mt-5  bg-cyan-600/10 border border-cyan-600/20 disabled:cursor-not-allowed disabled:opacity-50 ">
              <TbRestore className="w-5  h-5 text-cyan-600"/>
          </button>
         </div>
        </section>
        
        
        <section className="rounded-xl border border-white/5 bg-card p-5 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <h2 className="mb-5 text-sm font-semibold text-slate-100">Percurso</h2>
          <Percurso key={tipo} linhas={linhas} colunas={colunas} trajetoria={trajetoria} mostrarControles={false} />
        </section>


        <section className="rounded-xl border border-white/5 bg-card p-5 lg:col-start-2 lg:row-start-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-100">Execução atual</h2>
            <span className="text-xs text-cyan-400">{iniciada ? 'Em execução' : 'Aguardando início'}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Resumo nome="Tempo" valor={tempo} />
            <Resumo nome="Posição" valor={posicaoAtual ? `(${posicaoAtual.x}, ${posicaoAtual.y})` : '—'} />
            <Resumo nome="Células visitadas" valor={trajetoria.length || '—'} />
          </div>
        </section>

       
      </div>
    </main>
  );
}

function Resumo({ nome, valor }: { nome: string; valor: string | number }) {
  return (
    <div className="rounded-md bg-bloco p-3">
      <div className="text-xs text-slate-400">{nome}</div>
      <div className="mt-2 text-sm font-semibold text-slate-100">{valor}</div>
    </div>
  )
}
