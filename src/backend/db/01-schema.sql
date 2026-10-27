BEGIN;

CREATE TABLE labirinto(
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome varchar(100) NOT NULL UNIQUE,
    tipo varchar(10) NOT NULL CHECK(tipo IN ('4x4', '8x4', '12x4')),
    criado_em timestamp NOT NULL DEFAULT now()
);

CREATE TABLE execucao(
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    labirinto_id integer NOT NULL REFERENCES labirinto(id),
    iniciada_em timestamp NOT NULL DEFAULT now(),
    finalizada_em timestamp,
    tempo_total_ms integer,
    status varchar(20) NOT NULL CHECK(status IN ('em_execucao', 'concluido', 'interrompido')) DEFAULT 'em_execucao',
    algoritmo varchar(100) NOT NULL DEFAULT 'Flood Fill',
    resultado varchar(10) CHECK(resultado IN ('sucesso', 'falha')),
    velocidade_media_cm_s float,
    criado_em timestamp NOT NULL DEFAULT now(),
    quantidade_celulas_visitadas integer
);

CREATE TABLE amostra_telemetria(
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    execucao_id integer NOT NULL REFERENCES execucao(id),
    tempo_relativo_ms integer NOT NULL,
    nivel_bateria_pct float NOT NULL CHECK(nivel_bateria_pct BETWEEN 0 AND 100),
    consumo_eletrico_ma float NOT NULL,
    velocidade_instantanea_cm_s float NOT NULL,
    rpm_motor_esq integer NOT NULL,
    rpm_motor_dir integer NOT NULL
);

CREATE TABLE amostra_movimento(
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    execucao_id integer NOT NULL REFERENCES execucao(id),
    tempo_relativo_ms integer NOT NULL,
    giro_x_deg_s float NOT NULL,
    giro_y_deg_s float NOT NULL,
    giro_z_deg_s float NOT NULL,
    pos_x integer NOT NULL,
    pos_y integer NOT NULL
);

CREATE INDEX ix_amostra_telemetria_execucao_id_id
    ON amostra_telemetria (execucao_id, id DESC);
CREATE INDEX ix_amostra_movimento_execucao_id_id
    ON amostra_movimento (execucao_id, id DESC);

CREATE TABLE parede_detectada(
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    execucao_id integer NOT NULL REFERENCES execucao(id),
    celula_x integer NOT NULL,
    celula_y integer NOT NULL,
    lado varchar(10) NOT NULL CHECK(lado IN ('norte', 'sul', 'leste', 'oeste')),
    detectada_em timestamp NOT NULL DEFAULT now(),
    UNIQUE(execucao_id, celula_x, celula_y, lado)
);

COMMIT;
