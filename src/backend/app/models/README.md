# Models: o formato dos dados

Os modelos descrevem **que dados a API manipula** e **como eles aparecem no JSON**.
São classes [Pydantic](https://docs.pydantic.dev/): cada uma valida os próprios
dados e gera o schema que aparece em http://127.0.0.1:8000/docs.

As rotas e o mock não inventam formatos — todos leem e escrevem estes modelos.

## Arquivos

| Arquivo | Entidade | O que representa |
|---|---|---|
| `execution.py` | `Execution` | Uma corrida completa: id, labirinto, tempos, status, resultado. |
| `maze.py` | `Maze`, `Cell`, `Position` | O labirinto, a célula e uma posição. |
| `path.py` | `PathPoint` | Um ponto da trajetória do robô. |
| `metrics.py` | `Metrics` | As métricas atuais: velocidade, RPM, bateria. |
| `event.py` | `Event`, `EventType` | Uma linha do log de eventos. |
| `__init__.py` | — | Reexporta tudo, para `from app.models import Execution`. |

## A convenção de eixos

Esta é a decisão mais fácil de esquecer, então está escrita aqui **uma vez só**:

- `row` cresce para **baixo** (sul). `row = 0` é a fileira de cima.
- `col` cresce para a **direita** (leste). `col = 0` é a coluna da esquerda.
- O robô começa em `start` e termina em `goal`, ambos do tipo `Position`.

Em cada `Cell`, as quatro paredes seguem esta convenção:

| Campo | Parede entre a célula e... |
|---|---|
| `parede_norte` | a célula de cima: `(row - 1, col)` |
| `parede_sul`   | a célula de baixo: `(row + 1, col)` |
| `parede_leste` | a célula da direita: `(row, col + 1)` |
| `parede_oeste` | a célula da esquerda: `(row, col - 1)` |

A borda externa do labirinto é fechada: as células da primeira e da última
fileira (e coluna) têm a parede correspondente marcada como `True`.

**As paredes são simétricas por construção.** Se `(r, c)` tem `parede_leste`,
então `(r, c + 1)` tem `parede_oeste`. O teste `test_walls_are_symmetric`
garante isso.

### Por que não `wall_plus_y`?

Os nomes antigos (`wall_plus_y`, `wall_minus_y`, `wall_plus_x`, `wall_minus_x`)
eram ambíguos: `wall_plus_y` sugeria "parede no sentido positivo de y", mas
na verdade significava "parede ao norte". O nome mentia. Os nomes atuais
(`parede_norte`, `parede_sul`, `parede_leste`, `parede_oeste`) dizem o que
querem dizer sem precisar consultar a convenção.

## Enums

| Enum | Valores | Onde é usado |
|---|---|---|
| `ExecutionStatus` | `em_execucao`, `concluido`, `interrompido` | `Execution.status` |
| `ExecutionResult` | `sucesso`, `falha` | `Execution.resultado` (só quando concluída) |
| `EventType` | `info`, `warning`, `error`, `decision` | `Event.type` |

Os valores são strings em português, alinhados com a documentação do projeto.

## Por que Pydantic

- **Validação automática**: um `Cell` sem `parede_norte` falha na hora, não na
  hora de o front reclamar.
- **Schema para o `/docs`**: o Swagger mostra o formato exato de cada resposta.
- **Serialização correta**: `datetime` vira ISO 8601 UTC, `Enum` vira string.
- **Contrato com o front**: os campos que aparecem aqui são os campos que o
  TypeScript vai tipar.