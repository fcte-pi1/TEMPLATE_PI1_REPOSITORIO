# Mock: dados simulados e simulação do robô

Enquanto o robô e o banco de dados não estão integrados, os dados da tela Labirinto vêm desta pasta.

| Arquivo | O que faz |
|---|---|
| `__init__.py` | Cria o `state`: os dados em memória que as rotas leem (execução, labirinto, trajetória, métricas e eventos). |
| `seed.py` | A execução de exemplo `0847` (Flood Fill, já concluída), com trajetória, métricas e eventos. |
| `maze.py` | O labirinto 4×4, desenhado em texto (ASCII) e convertido para o modelo `Maze`. |
| `simulation.py` | A simulação: faz o robô andar pela trajetória do seed, uma célula por segundo. |
| `dev_server.py` | O servidor de desenvolvimento: o mesmo app de produção, com a simulação ligada. |

## Dois jeitos de rodar

Os dois rodam a partir de `src/backend`. Os comandos completos estão no [README da API](../routes/README.md).

| Servidor | O que o front mostra | Quando usar |
|---|---|---|
| `app.main:app` | Os dados parados do seed. | Na operação normal, nos testes e para tirar prints dos dados. |
| `app.mock.dev_server:app` | O robô andando. | Para testar o polling do front, ou seja, a tela se atualizando sozinha. |

## Como a simulação funciona

A issue #111 pede, como tarefa opcional, "nova posição, métrica e evento a cada 1 s, para testar o polling do front".

### `start_run()`: rebobina

Põe o robô na primeira célula, com status `em_execucao`, tempo 0 e bateria em 100%. Também limpa os eventos, registra o início e guarda em `started_at` o horário em que a corrida começou.

### `tick()`: um passo

Cada chamada faz quatro coisas:

1. anda **uma célula**, a próxima da rota (`ROUTE`, que é a trajetória do seed);
2. soma 1 s ao tempo, ou seja, 1000 em `tempo_total_ms`, que é em milissegundos;
3. atualiza as **métricas**: 18 cm/s, 101 rpm e bateria 0,5% menor;
4. registra um **evento** com a nova posição.

Na última célula, o status vira `concluido`, a velocidade e o rpm vão a zero e o evento de chegada é registrado. Depois disso, `tick()` não faz mais nada.

Para saber qual é a próxima célula, o tamanho da trajetória funciona como marcador de página: com `n` células percorridas, a próxima é `ROUTE[n]`.

### `update()`: o relógio de 1 s

Não há nada rodando em segundo plano. Quando chega um pedido, `update()` calcula quantos segundos se passaram desde o `start_run()` e chama `tick()` uma vez para cada segundo que ainda não foi contado. Como o tempo da execução é em milissegundos, a comparação é `tempo_total_ms < segundos * 1000`.

Como o front pergunta a cada 1 s, na prática o robô anda uma célula por segundo. Se ninguém perguntar nada por um tempo, o próximo pedido "alcança" tudo de uma vez.

### `dev_server.py`: onde a simulação é ligada

1. Importa o `app` de produção (`app.main`) sem mudar nada nele.
2. Chama `start_run()` quando o servidor sobe. É o "play".
3. Adiciona um *middleware*, que é uma função que roda antes de todo pedido. Ela chama `update()` e depois deixa o pedido seguir para a rota, que então lê o estado já atualizado.

## Por que assim

- **O código de produção não conhece a simulação.** As rotas e o `main.py` não importam nada dela; só o `dev_server` importa. Por isso o `app.main` nunca carrega a simulação e não gasta memória com ela.
- **O robô não teletransporta.** Ele segue a trajetória do seed, e os testes de `tests/test_seed.py` garantem que ela não atravessa paredes. Quando o seed mudou de 16×16 para 4×4, a simulação acompanhou sozinha, sem nenhuma mudança na lógica.
- **Os números vêm da documentação do projeto:**
  - cada célula tem 18 cm, então uma célula por segundo dá 18 cm/s;
  - a roda tem 34 mm, ou seja, uns 10,7 cm por volta. A 18 cm/s, isso dá uns 101 rpm;
  - a bateria cai 0,5% por segundo, um exagero de propósito para a mudança aparecer na tela. A queda real seria de uns 0,02% por segundo.
- **Sem thread e sem mexer no `main.py`:** calcular os passos atrasados a cada pedido tem o mesmo efeito para quem faz polling, sem nada rodando em segundo plano.

## Testando a simulação

### Na mão, pelo Python interativo

```powershell
cd src\backend
.venv\Scripts\python
```

Quando aparecer o `>>>`, digite um comando por vez. O que vem depois do `#` é o que o Python deve responder, e não precisa ser digitado.

```python
from app.mock import state, simulation
simulation.start_run()
simulation.tick()
state.path[-1]      # PathPoint(row=1, col=0)
state.metrics       # Metrics(speed_cm_s=18.0, rpm=101.0, battery_pct=99.5)
```

Para sair, digite `exit()`.

### Com o servidor: um "front de mentira"

No terminal 1, dentro de `src/backend`:

```powershell
.venv\Scripts\python -m uvicorn app.mock.dev_server:app --reload --host 0.0.0.0
```

No terminal 2, cole o bloco abaixo. Ele pergunta a posição e a bateria a cada 1 s, como o front faz:

```powershell
while ($true) {
    $m = Invoke-RestMethod http://127.0.0.1:8000/api/sessions/0847/metrics
    $p = (Invoke-RestMethod http://127.0.0.1:8000/api/sessions/0847/path)[-1]
    "posicao ($($p.row), $($p.col))  bateria $($m.battery_pct)%"
    Start-Sleep 1
}
```

Deve aparecer uma linha por segundo, de `posicao (1, 0)  bateria 99.5%` até `posicao (3, 3)  bateria 97%`, que é a meta, em 6 s. Para parar, aperte `Ctrl+C`.

## Limitações

- O "play" acontece quando o servidor sobe. Para recomeçar a corrida, é preciso reiniciar o servidor.
- A simulação percorre um caminho pronto, o do seed. Ela não explora o labirinto como o Flood Fill de verdade faria.
- Ainda não há testes automáticos para a simulação.
