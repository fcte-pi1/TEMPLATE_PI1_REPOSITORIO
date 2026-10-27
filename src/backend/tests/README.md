# Testar a telemetria

Este guia mostra como testar manualmente o fluxo ESP → API → PostgreSQL e como
executar os testes automatizados. Os comandos `curl` usam Bash (Linux/macOS ou
Git Bash). No Windows, podem ser executados no Git Bash ou adaptados para
PowerShell.

## O que as rotas fazem

| Rota | Uso |
|---|---|
| `POST /api/sessions` | Cria uma execução no banco. A telemetria recebida é associada à execução ativa. |
| `GET /api/sessions/active` | Consulta qual execução está ativa. |
| `POST /api/telemetry` | Recebe uma leitura da ESP e grava métricas e posição. |
| `GET /api/telemetry/current` | Consulta a última amostra salva, priorizando uma execução ativa. |
| `GET /api/telemetry/status` | Informa se a ESP enviou um pacote nos últimos 5 segundos. |
| `GET /api/sessions/{id}/telemetry` | Consulta o histórico de uma execução, com paginação. |
| `POST /api/sessions/{id}/finish` | Finaliza a execução ativa. |

`current` e `status` têm propósitos diferentes: `current` lê os últimos valores
persistidos no banco; `status` informa quando o backend recebeu o último pacote.
Mesmo quando a leitura não muda e não gera uma nova linha, o recebimento do
pacote atualiza o status da conexão.

## 1. Iniciar o backend

Na pasta `src/backend`, inicie o serviço que contém a API e o PostgreSQL:

```bash
docker compose up -d backend
```

Confirme que a API está acessível:

```bash
curl http://localhost:8000/health
```

Esperado: `"status":"ok"` e `"database":"connected"`.

Se estiver executando o `curl` em outro computador da rede, substitua
`localhost` pelo IP do computador que está rodando o backend.

## 2. Criar ou identificar a execução

Confira primeiro se já existe uma execução ativa:

```bash
curl http://localhost:8000/api/sessions/active
```

Se a resposta for `null`, crie uma execução:

```bash
curl -X POST http://localhost:8000/api/sessions \
  -H 'Content-Type: application/json' \
  -d '{"tipo":"4x4"}'
```

Guarde o `id` retornado. Se a resposta for `409`, já existe uma execução
ativa: use o ID retornado por `/api/sessions/active` para consultar os dados
dela. Não crie outra até finalizar a execução ativa.

## 3. Enviar uma amostra de teste

Este é o formato aninhado usado pela ESP:

```bash
curl -X POST http://localhost:8000/api/telemetry \
  -H 'Content-Type: application/json' \
  -d '{
    "position":{"row":1,"col":2},
    "metrics":{"speed_cm_s":0.325,"rpm":120,"battery_pct":87},
    "events":[],
    "generated_at":"2026-10-19T12:00:00Z"
  }'
```

Esperado: HTTP `200`, `"saved":true` e `execucao_id` igual ao ID da execução
ativa. Se enviar os mesmos valores de novo, a API pode responder
`"saved":false` e `"status":"unchanged"`: isso significa que a leitura foi
recebida, mas foi omitida para reduzir gravações repetidas.

## 4. Consultar a última leitura e a conexão

Última amostra salva:

```bash
curl http://localhost:8000/api/telemetry/current
```

Confira `execucao_id`, `telemetry_sample_id`, `metrics`, `position` e
`connected`. Com os valores do exemplo, a posição é `{ "row": 1, "col": 2 }`.

Estado da conexão:

```bash
curl http://localhost:8000/api/telemetry/status
```

Após enviar um pacote, espere `"connected":true`. Se nenhum pacote chegar por
mais de 5 segundos, deve mudar para `false`. Esse timeout pode ser alterado pela
variável `ESP_CONNECTION_TIMEOUT_MS`.

## 5. Consultar o histórico da execução

Troque `2` pelo ID guardado no passo 2:

```bash
curl 'http://localhost:8000/api/sessions/2/telemetry?limit=100&offset=0'
```

A resposta inclui o `execucao_id`, a quantidade total e a lista `samples`.
Use `offset=100`, `offset=200` e assim por diante para buscar as páginas
seguintes. `limit` aceita de 1 a 1000 amostras.

## 6. Conferir diretamente no PostgreSQL (opcional)

No ambiente Docker padrão do projeto:

```bash
docker compose exec backend psql -U micromouse -d micromouse
```

No prompt do PostgreSQL, consulte as amostras da execução:

```sql
SELECT id, execucao_id, tempo_relativo_ms, nivel_bateria_pct,
       velocidade_instantanea_cm_s, rpm_motor_esq, rpm_motor_dir
FROM amostra_telemetria
WHERE execucao_id = 2
ORDER BY id DESC
LIMIT 20;
```

Para sair do `psql`, execute `\q`.

## 7. Finalizar a execução

Substitua `2` pelo ID da execução criada para o teste:

```bash
curl -X POST http://localhost:8000/api/sessions/2/finish \
  -H 'Content-Type: application/json' \
  -d '{"status":"interrompido"}'
```

## Testes automatizados

Na pasta `src/backend`, execute os testes que cobrem as rotas e a lógica de
telemetria, além dos testes do seed:

```bash
./venv/bin/python -m pytest -q \
  tests/test_telemetry_routes.py \
  tests/test_telemetry_service.py \
  tests/test_seed.py

./venv/bin/python -m pytest -q tests/test_execution_data.py -k session_telemetry
```

Os testes das rotas de telemetria usam um banco simulado para validar a resposta
sem alterar dados reais. Os testes cobrem leitura da última amostra, execução
inexistente/sem amostras, conexão recente/expirada e consulta ao histórico.

Última execução neste ambiente: **23 testes passaram** no primeiro comando e
**2 passaram** no teste da rota de histórico. A suíte completa não terminou no
limite de 20 segundos usado nesta verificação; por isso, use os comandos
direcionados acima para validar a telemetria sem esperar pelos demais testes.

Para rodar a suíte completa:

```bash
./venv/bin/python -m pytest -q
```

Os testes de `tests/test_database.py` exigem PostgreSQL disponível. A suíte
completa também inclui rotas exercitadas com `TestClient`; se elas não
finalizarem no ambiente local, rode os testes específicos acima e confira se o
versão do conjunto instalado de FastAPI/Starlette/httpx é compatível.
