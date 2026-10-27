-- Acelera a busca da amostra mais recente de cada execução.
CREATE INDEX IF NOT EXISTS ix_amostra_telemetria_execucao_id_id
    ON amostra_telemetria (execucao_id, id DESC);

CREATE INDEX IF NOT EXISTS ix_amostra_movimento_execucao_id_id
    ON amostra_movimento (execucao_id, id DESC);
