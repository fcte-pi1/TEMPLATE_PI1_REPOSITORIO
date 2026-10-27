<!--
Instruções do template da disciplina para esta pasta:

# _Firmware_
Esta pasta deverá armazenar arquivos referentes a:

- Código-fonte para microcontroladores e SOCs: [Arduino](https://www.arduino.cc/), [ESP32](https://www.espressif.com/), [Raspberry Pi](https://www.raspberrypi.com/), dentre outros.
- Projetos de organização destes códigos, caso utilize IDEs: [Arduino IDE](https://www.arduino.cc/en/software/), [Visual Studio](https://visualstudio.microsoft.com/pt-br/downloads/) etc.
- Arquivos de configuração: ```CMakeLists.txt``` se for usar [CMake](https://cmake.org/download/), ```Makefile``` se for usar [make](https://www.cs.colby.edu/maxwell/courses/tutorials/maketutor/) etc.

Evite incluir:
- Artefatos de compilação: os arquivos de saída compilados (binários, arquivos objeto, .hex, .elf) devem ser gerados pelo processo de compilação e não incluídos no repositório.
- Arquivos temporários/específicos do sistema operacional: Arquivos como .DS_Store (macOS) ou arquivos de configuração do editor (a menos que esteja usando uma configuração compartilhada como .editorconfig).
- Configurações pessoais: Arquivos de configuração locais específicos da máquina do desenvolvedor.

> [!WARNING]
> **Não acrescente arquivos referentes a _hardware_ nesta pasta.** Eles deverão ser armazenados na pasta [hw](https://github.com/fcte-pi1/template/tree/main/hw) deste repositório.
-->

# Firmware do Micromouse

Firmware do ESP32 DevKit, feito com PlatformIO e o framework Arduino. Este documento registra o que foi implementado, como funciona, os problemas encontrados e o estado de cada parte.

## Como compilar e testar

| Ação | Comando |
|---|---|
| Compilar | `pio run` |
| Gravar por USB | comentar as linhas `upload_protocol`/`upload_port` do `platformio.ini` e rodar `pio run -t upload` |
| Gravar por WiFi (OTA) | conectar na [rede do robô](#rede-wifi-do-robô) e rodar `pio run -t upload` |
| Monitor serial | `pio device monitor` (115200) |
| Testes no computador | `pio test -e native` |

O projeto usa a plataforma **pioarduino** (Arduino-ESP32 3.x), definida no `platformio.ini`.

### Rede WiFi do robô

Ao ligar, o ESP32 cria a própria rede WiFi (modo Access Point), configurada em `ota_manager.cpp`:

| | |
|---|---|
| Rede | `Xaropinho-WiFi` |
| Senha | `pi12pi34` |
| IP do robô | `192.168.4.1` |

1. Ligue o robô e espere alguns segundos (a calibração do giroscópio leva ~2,4 s).
2. No computador ou no celular, conecte na rede `Xaropinho-WiFi` com a senha acima. O computador recebe um IP da faixa 192.168.4.x, normalmente 192.168.4.2.
3. Com a conexão feita, dá para:
   - gravar o firmware por OTA (`pio run -t upload`);
   - comandar o robô pelo navegador: `http://192.168.4.1/direita`, `/esquerda` (giro de 90°) e `/parar`;
   - receber a telemetria: o robô envia os dados para `http://192.168.4.2:8000/api/telemetry`, então o backend precisa rodar no computador conectado com esse IP e aceitando conexões de fora (`uvicorn ... --host 0.0.0.0`; o padrão só aceita o próprio computador).

Enquanto estiver na rede do robô, o computador fica sem internet.

As regras de cada módulo que não dependem do hardware (contas, filtros e máquinas de estado) ficam em headers sem Arduino (`*_logic.h`) e são testadas no computador com Unity, na pasta `test/`.

## Energia: INA219 e proteção da bateria

Issue #121 (parte do INA219), PR #123.

### O que faz

O INA219 (endereço 0x40) fica na entrada da bateria LiPo 2S e mede a tensão e a corrente de todo o robô. A cada ciclo de 100 ms do loop, o firmware lê o sensor e:

- calcula a **tensão da bateria** como tensão do barramento + queda no shunt, que é a tensão nos terminais da bateria;
- suaviza tensão, corrente e potência com uma **média móvel exponencial** (α = 0,2);
- estima o **percentual de carga** por uma tabela de tensão por célula (3,30 V = 0% a 4,20 V = 100%), com interpolação entre os pontos;
- **corta os motores** se a tensão ficar abaixo de 6,6 V por 2 s seguidos, para proteger a LiPo contra descarga profunda;
- avisa **bateria baixa** abaixo de 7,0 V e **sobrecorrente** acima de 2 A por 500 ms.

O corte fica **travado**: depois de acionado, não volta mesmo que a tensão suba quando os motores param. A exigência de 2 s evita cortes falsos pelas quedas rápidas de tensão na partida dos motores.

No `setup()`, a função `verificarI2C()` confere se os cinco dispositivos do barramento respondem (INA219, MPU6050 e os três lasers) e avisa se algum laser ficou no endereço padrão 0x29, o que indica falha na troca de endereço pelo XSHUT.

### Arquivos

| Arquivo | Conteúdo |
|---|---|
| `power.h` / `power.cpp` | Leitura do INA219, filtro e funções `obter_tensao_bateria()`, `obter_corrente_mA()`, `obter_potencia_mW()`, `obter_bateria_pct()`, `bateriaCritica()` e `sobrecorrente()` |
| `power_logic.h` | Percentual de carga e máquina de estados da bateria (`MonitorBateria`), sem Arduino |
| `i2c_check.h` / `i2c_check.cpp` | Verificação dos dispositivos I2C no boot |
| `config.h` | Endereço do INA219 e limites: `BAT_V_ALERTA`, `BAT_V_CORTE`, `BAT_TEMPO_CONFIRMACAO_MS`, `I_SOBRECORRENTE_MA`, `I_SOBRECORRENTE_TEMPO_MS` |

No `main.cpp`, o loop chama `updatePower()` e, se `bateriaCritica()` for verdadeiro, `stopMotors()`. A serial mostra a linha `[ENERGIA]` com tensão, corrente, potência e percentual, e os mesmos valores vão para a telemetria.

### Testes

Nove testes no computador (`test/test_power_logic`): percentual nos limites, interpolação e monotonicidade da tabela; queda curta que não corta; subtensão sustentada que corta; corte travado; alerta antes do corte; sobrecorrente só depois do tempo limite; e corte funcionando quando o `millis()` estoura.

### Problemas e soluções

| Problema | Solução |
|---|---|
| O `main` não compilava: `ledcAttach` não existe no core 2 do Arduino-ESP32 | Troca para a plataforma pioarduino (core 3) |
| Usar -1 como "sem leitura" no filtro falharia com corrente negativa, que aparece por ruído perto de zero | Indicador separado (`temLeitura`) para a primeira leitura |
| Uma leitura com falha no I2C entraria no filtro como zero | Cada leitura confere `success()`; se falhar, mantém a última leitura válida |
| A partida dos motores derruba a tensão por instantes e cortaria a bateria cheia | O corte exige 2 s abaixo do limite |
| O teste do estouro do `millis()` não detectava um erro inserido de propósito | Teste reforçado com uma verificação antes do tempo limite |

### Estado

- **Implementado e testes passando.**
- **Falta a bancada teste de bancada**

## Giroscópio: calibração de bias e zona morta

Issue #119, PR #124.

### O que faz

O MPU6050 (endereço 0x68) mede a velocidade de giro no eixo Z, que é integrada para obter o ângulo do robô. Todo giroscópio tem um desvio (bias): mesmo parado, mede uma pequena rotação, e na integração isso vira um ângulo que cresce sem parar. A calibração mede esse desvio no boot e o subtrai das leituras.

No `initIMU()`:

1. Lê **800 amostras** do eixo Z com o robô parado, uma a cada 3 ms (~2,4 s).
2. Calcula a **média** (o bias) e o **desvio padrão** das leituras pelo método de Welford, que não precisa guardar as amostras na memória.
3. Se o desvio passar de 0,5 °/s, o robô foi mexido durante a calibração: ela é **repetida até 3 vezes**. Se todas falharem, usa a última média e avisa na serial.
4. Leituras com falha no I2C são descartadas. Se sobrarem menos da metade, a tentativa é invalidada.

Durante a execução, o `updateIMU()` subtrai o bias e aplica uma **zona morta** de 0,25 °/s: abaixo disso, a rotação é considerada zero, o que impede o ruído de acumular no ângulo com o robô parado.

### Arquivos

| Arquivo | Conteúdo |
|---|---|
| `imu.h` / `imu.cpp` | Inicialização, calibração e integração do ângulo. `imuCalibrada()` informa se a calibração foi confiável |
| `imu_logic.h` | `EstatisticaGiro` (média e desvio), `aplicarZonaMorta()` e `calibracaoValida()`, sem Arduino |
| `config.h` | `IMU_AMOSTRAS_CALIBRACAO`, `IMU_INTERVALO_AMOSTRA_MS`, `IMU_TENTATIVAS_CALIBRACAO`, `IMU_LIMITE_MOVIMENTO_DPS`, `IMU_ZONA_MORTA_DPS` |

A interface pública (`getYawAngle()`, `getYawRate()`, `resetYawAngle()`) foi mantida, porque o giro de 90° e a telemetria dependem dela.

### Testes

Sete testes no computador (`test/test_imu_logic`): média e desvio de um conjunto conhecido; desvio zero com sinal constante; calibração recusada com poucas amostras; calibração aceita com ruído pequeno; calibração recusada quando o robô é tocado no meio; zona morta zerando abaixo do limite e mantendo acima, nos dois sentidos.

### Problemas e soluções

| Problema | Solução |
|---|---|
| A calibração anterior usava 150 amostras e não percebia se o robô fosse mexido; o bias saía errado sem aviso e o ângulo derivava a corrida toda | 800 amostras, detecção de movimento pelo desvio e até 3 tentativas |
| O retorno de `getEvent()` era ignorado, e uma falha no I2C virava leitura | Leituras com falha são descartadas, na calibração e no `updateIMU()` |
| Parâmetros fixos no meio do código | Todos no `config.h` |
| Na integração com a telemetria, o código novo voltava a usar a zona morta fixa e ignorava falhas de leitura | O `updateIMU()` passou a guardar os eixos X e Y para a telemetria mantendo a zona morta do `config.h` e o descarte de falhas |
| O giro de 90° bloqueia o loop por até 2 s; o ângulo ficava parado durante o giro e depois era integrado de uma vez com um intervalo errado | A IMU é atualizada dentro do laço do giro, e o tempo do loop é reiniciado ao terminar |

### Estado

- **Implementado e testado no computador.**
- **Falta a bancada:** o critério de aceite da #119 é o ângulo ficar estável e próximo de zero por 60 s com o robô parado. A meta proposta é deriva menor que 1° em 60 s. Também falta conferir o bias e o desvio impressos na serial e ajustar a zona morta e o limite de movimento, se preciso.
