import { useEffect, useState } from "react";
import { api, type ApiPosition } from "../api";
import type { Posicao, Telemetria } from "../types";

const STATUS: Record<string, Telemetria['status']> = {
    em_execucao: 'Em execução',
    concluido: 'Concluído',
    interrompido: 'Interrompido'
}

function direcao(anterior: ApiPosition | undefined, atual: ApiPosition): Posicao['direcao'] {
    if(!anterior || atual.row > anterior.row) return 'S'
    if(atual.row < anterior.row) return 'N'
    if(atual.col > anterior.col) return 'L'
    return 'O'
}

export function useLabirinto(){
    const [telemetria, setTelemetria] = useState<Telemetria | null>(null);
    const [trajetoria, setTrajetoria] = useState<Posicao[]>([]);

    useEffect(()=>{
        async function atualizar(){
            try{
                const sessao = await api.sessaoAtiva();
                if(!sessao){
                    setTelemetria(null);
                    setTrajetoria([]);
                    return;
                }
                const [labirinto, caminho, metricas] = await Promise.all([
                    api.labirinto(sessao.id),
                    api.trajetoria(sessao.id),
                    api.metricas(sessao.id)
                ]);
                const pontos = caminho.map((ponto, index) => ({ //api vai falar row para x e col para y
                    x: ponto.col,
                    y: ponto.row,
                    direcao: direcao(caminho[index-1], ponto)
                }));
                setTrajetoria(pontos);
                setTelemetria({
                    status: STATUS[sessao.status] ?? 'Interrompido',
                    algoritmo: sessao.algorithm,
                    tempoMS: sessao.tempo_total_ms ?? 0,
                    celulasPercorridas: caminho.length,
                    posicao: pontos[pontos.length-1] ?? {x: 0, y: 0, direcao: 'N'},
                    velocidade: metricas.speed_cm_s,
                    rpm: metricas.rpm,
                    bateria: metricas.battery_pct,
                    labirinto: {
                        linhas: labirinto.size,
                        colunas: labirinto.size
                    },
                })
            } catch{setTelemetria(null);}
        }
        atualizar()
        const relogio = setInterval(atualizar, 1000)
        return()=> clearInterval(relogio)
    }, [])
    return{telemetria, trajetoria}
}