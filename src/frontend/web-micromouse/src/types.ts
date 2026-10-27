export type Ponto = { x: number; y: number };
export type Posicao = Ponto & { direcao: 'N' | 'S' | 'L' | 'O' };

export const CELULA_CM = 18; // lado de cada célula

export const LABIRINTOS = {
    '4x4': { linhas: 4, colunas: 4 },
    '8x4': { linhas: 8, colunas: 4 },
    '12x4': { linhas: 12, colunas: 4 },
} as const;
export type TipoLabirinto = keyof typeof LABIRINTOS;



export type Telemetria ={
    status: 'Em execução' | 'Concluído' | 'Interrompido';
    algoritmo: string;
    tempoMS: number;
    celulasPercorridas: number;
    posicao: Posicao;
    velocidade: number;
    rpm: number;
    bateria: number;
    labirinto: {
        linhas: number;
        colunas: number;
    }
};