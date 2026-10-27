# Banco de dados — PostgreSQL

Banco relacional que guarda o histórico de corridas do Micromouse: labirintos, execuções, telemetria amostrada e paredes detectadas. Roda em um container Docker com PostgreSQL 18.

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e **aberto** (o Docker Compose já vem incluso)

## Estrutura de arquivos

```
src/backend/
├── .env.example         # modelo das variáveis de ambiente (versionado)
├── .env                 # variáveis reais, com a senha (NÃO versionado)
├── docker-compose.yml   # sobe o container do PostgreSQL
└── db/
    ├── 01-schema.sql    # cria as tabelas
    └── README.md        # este arquivo
```

Todo arquivo `.sql` dentro de `db/` é executado automaticamente, **em ordem alfabética**, na primeira vez que o banco é criado. Por isso o prefixo numérico (`01-`, `02-`, ...).

## Modelo de dados

O modelo completo (MER e DER) está documentado em [4.4 - Projeto conceitual de software](../../../docs/4.4%20-%20Projeto%20conceitual%20de%20software.md#persistência-de-dados). O `01-schema.sql` é a implementação física dele.

| Tabela | O que guarda |
| :-- | :-- |
| `labirinto` | Labirintos cadastrados (nome e tipo). |
| `execucao` | Cada corrida do Micromouse em um labirinto: início, fim, tempo total, status, algoritmo, resultado e velocidade média. |
| `amostra_telemetria` | Leituras de bateria, consumo, velocidade e RPM recebidas durante a corrida. |
| `amostra_movimento` | Leituras de posição e giroscópio recebidas durante a corrida. |
| `parede_detectada` | Paredes mapeadas pelo Micromouse durante a corrida (célula e lado). |

**Relacionamentos:**

- Um `labirinto` tem várias `execucao` (1:N)
- Uma `execucao` tem várias `amostra_telemetria` (1:N)
- Uma `execucao` tem várias `amostra_movimento` (1:N)
- Uma `execucao` tem várias `parede_detectada` (1:N)

### Valores aceitos

O banco recusa qualquer valor fora destas listas:

| Coluna | Valores |
| :-- | :-- |
| `labirinto.tipo` | `4x4`, `8x4`, `12x4` |
| `execucao.status` | `em_execucao` (padrão), `concluido`, `interrompido` |
| `execucao.resultado` | `sucesso`, `falha` (fica vazio enquanto a corrida não termina) |
| `amostra_telemetria.nivel_bateria_pct` | de `0` a `100` |
| `parede_detectada.lado` | `norte`, `sul`, `leste`, `oeste` |

### Regras de integridade (RNF-SW05)

- Não é possível criar uma execução de um labirinto inexistente, nem uma amostra/parede de uma execução inexistente.
- Não é possível **apagar** um labirinto que tenha execuções, nem uma execução que tenha amostras ou paredes. O histórico fica protegido.
- A mesma parede (mesma célula e mesmo lado) não pode ser registrada duas vezes na mesma execução.

## Configuração

> Todos os comandos deste README são executados dentro da pasta `src/backend`.

1. Crie o `.env` a partir do modelo:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Preencha as variáveis no `.env`:

   | Variável | Para que serve |
   | :-- | :-- |
   | `POSTGRES_USER` | Usuário do banco (ex.: `micromouse`) |
   | `POSTGRES_PASSWORD` | Senha do usuário |
   | `POSTGRES_DB` | Nome do banco (ex.: `micromouse`) |
   | `POSTGRES_PORT` | Porta do **seu computador** onde o banco vai ficar acessível (normalmente `5432`) |


## Subindo o banco

```powershell
docker compose up -d
```

Para conferir se deu certo:

```powershell
docker compose logs backend
```

O log deve mostrar o `01-schema.sql` sendo executado e terminar com `database system is ready to accept connections`:

```
running /docker-entrypoint-initdb.d/01-schema.sql
BEGIN
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
COMMIT
...
database system is ready to accept connections
```

## Acessando o banco

Pelo terminal, sem precisar instalar nada (não pede senha):

```powershell
docker compose exec backend sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Comandos úteis dentro do `psql`:

| Comando | O que faz |
| :-- | :-- |
| `\dt` | Lista as tabelas |
| `\d execucao` | Mostra as colunas e regras de uma tabela |
| `\q` | Sai |

Por um programa externo (pgAdmin, DBeaver, backend):

| Campo | Valor |
| :-- | :-- |
| Host | `localhost` |
| Porta | valor de `POSTGRES_PORT` |
| Usuário / senha / banco | valores do `.env` |

## Alterando o schema

> ⚠️ **Importante:** o `01-schema.sql` e as variáveis do `.env` só são aplicados **na primeira vez** que o banco é criado. Editar o schema ou trocar a senha depois **não muda o banco que já existe**.

Para aplicar uma mudança, é preciso recriar o banco do zero:

```powershell
docker compose down -v
docker compose up -d
```

> 🚨 **O `-v` apaga todos os dados do banco**, incluindo o histórico de corridas. Use apenas em desenvolvimento.

Para atualizar um banco existente preservando as amostras, execute o script de migração `db/migrations/02-separate-movement-samples.sql` pelo pgAdmin/DBeaver ou pelo `psql`. Não use `docker compose down -v` para essa atualização.

No Bash, a partir de `src/backend`, aplique também o índice para acelerar consultas de amostras recentes:

```bash
docker compose exec -T backend sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < db/migrations/02-separate-movement-samples.sql
docker compose exec -T backend sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < db/migrations/03-index-telemetry-samples.sql
```

## Comandos de referência

| Comando | Efeito |
| :-- | :-- |
| `docker compose up -d backend` | Liga o backend e o PostgreSQL integrado |
| `docker compose down` | Desliga o banco e **mantém** os dados |
| `docker compose down -v` | Desliga o banco e **apaga todos os dados** |
| `docker compose ps` | Mostra se o backend/PostgreSQL está rodando |
| `docker compose logs backend` | Mostra os logs do backend e PostgreSQL |

## No dia da apresentação

1. Abrir o Docker Desktop e esperar ele iniciar.
2. Em `src/backend`, criar o `.env` a partir do `.env.example` (seção [Configuração](#configuração)).
3. Rodar `docker compose up -d`.
4. Conferir com `docker compose logs backend`.

> 🚨 **Nunca rode `docker compose down -v` no dia**: o histórico de corridas será perdido. Para desligar, use apenas `docker compose down`.

## Problemas comuns

| Sintoma | Causa provável | Solução |
| :-- | :-- | :-- |
| `port is already allocated` ao subir | Outro programa (ex.: PostgreSQL instalado) já usa a porta | Troque `POSTGRES_PORT` no `.env` (ex.: `5433`) e rode `docker compose up -d` de novo |
| Mudei o `01-schema.sql` e nada mudou | O schema só roda na criação do banco | Veja [Alterando o schema](#alterando-o-schema) |
| `ERROR` no log ao subir | Erro de SQL no `01-schema.sql` | Corrija a linha indicada no log e recrie com `docker compose down -v` + `docker compose up -d` |
| `failed to connect to the docker API` | Docker Desktop fechado | Abra o Docker Desktop e espere ele iniciar |
