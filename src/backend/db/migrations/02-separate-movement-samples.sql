-- Migra bancos já existentes sem apagar o histórico.
BEGIN;

ALTER TABLE execucao
    ADD COLUMN algoritmo varchar(100) NOT NULL DEFAULT 'Flood Fill';

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

INSERT INTO amostra_movimento (
    execucao_id, tempo_relativo_ms, giro_x_deg_s, giro_y_deg_s,
    giro_z_deg_s, pos_x, pos_y
)
SELECT
    execucao_id, tempo_relativo_ms, giro_x_deg_s, giro_y_deg_s,
    giro_z_deg_s, pos_x, pos_y
FROM amostra_telemetria;

ALTER TABLE amostra_telemetria
    DROP COLUMN status_conexao,
    DROP COLUMN giro_x_deg_s,
    DROP COLUMN giro_y_deg_s,
    DROP COLUMN giro_z_deg_s,
    DROP COLUMN pos_x,
    DROP COLUMN pos_y;

COMMIT;
