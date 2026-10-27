# Orçamento

## Valor da hora do estudante

O custo da mão de obra considera o valor que o governo investe por estudante: **R$ 52.533,00 por aluno por ano**, custo médio dos alunos de universidades federais com base em dados de 2023 do Ministério da Educação.

- Fonte: [Poder360 – Alunos de universidades federais têm custo médio anual de R$ 52.533](https://www.poder360.com.br/poder-economia/alunos-de-universidades-federais-tem-custo-medio-anual-de-r-52-533/)

A carga horária anual de um estudante foi estimada em **720 h** (curso de 3.600 h concluído em 5 anos). O valor da hora é:

```
R$ 52.533,00 ÷ 720 h = R$ 72,96 por hora
```

O esforço do projeto é de **1.728 h** (18 membros × ~96 h por membro, conforme o [Termo de Abertura do Projeto](./1%20-%20TAP.md)):

```
1.728 h × R$ 72,96 = R$ 126.074,88
```

## Planilha de custos

| **Item de Custo** | **Qtde.** | **Previsto (R$)** | **Realizado (R$)** |
|---|:---:|---:|---:|
| **Mão de Obra** | | | |
| Estudante (R$ 72,96/h) | 1.728 h previstas / 691,2 h realizadas | 126.074,88 | 50.429,95 |
| **Serviços** | | | |
| Impressão 3D: filamento PLA (R$ 60,00 ÷ 18 membros = R$ 3,33 por membro) | 18 cotas | 60,00 | - |
| **Equipamentos e Materiais: componentes eletrônicos** | | **406,19** | **406,19** |
| Motor N20 com encoder | 3 | | 91,79 |
| Sensor de distância VL53L0X | 4 | | 57,20 |
| Giroscópio/acelerômetro MPU-6050 | 1 | | 13,33 |
| Ponte H | 2 | | 29,79 |
| Regulador MP1584EN | 2 | | 27,58 |
| Regulador AMS1117 | 1 | | 6,99 |
| Regulador LM2596 | 2 | | 24,99 |
| ESP32 Wroom32 | 2 | | 85,68 |
| Sensor de tensão e corrente INA219 | 1 | | 22,95 |
| Capacitores eletrolíticos 100 µF/16 V | 10 | | 1,70 |
| Capacitores cerâmicos 100 nF/50 V | 20 | | 2,20 |
| Kit de jumpers | 1 | | 18,00 |
| Termo retrátil | 1 | | 23,99 |
| **Equipamentos e Materiais: baterias, carregadores e conectores** | | **145,40** | **0,00** |
| Bateria LiPo 2S 7,4 V 1500 mAh 30C (ainda não adquirida) | 1 | 145,40 | - |
| **Equipamentos e Materiais: rodas e chapas** | | **39,64** | **39,64** |
| Rodas de 34 mm para motor N20 | 2 | | 24,65 |
| Roda esfera deslizante | 1 | | 14,99 |
| Chapas de MDF (gratuitas) | - | 0,00 | 0,00 |
| <span style="color: blue;">**TOTAL**</span> | | **126.726,11** | **50.875,78** |

## Observações

- O total **previsto** (R$ 126.726,11) soma a mão de obra (R$ 126.074,88), o PLA (R$ 60,00), os componentes eletrônicos (R$ 406,19), a bateria (R$ 145,40) e as rodas (R$ 39,64). Os valores dos componentes e das rodas são os das compras reais.
- O total **realizado** (R$ 50.875,78) soma a mão de obra até 30/09/2026 (R$ 50.429,95) e as compras de material já feitas (R$ 445,83). As compras foram financiadas pela contribuição de R$ 30,00 por membro (R$ 480,00 arrecadados), o que deixa **R$ 34,17 em caixa**. Faltam a bateria e o PLA para completar o material previsto.
- A mão de obra realizada considera o período de 10/08/2026 (primeira aula, AT1) a 30/09/2026: 32 dias úteis, descontados o feriado de 07/09 e a Semana Universitária (21 a 25/09). Com a carga de ~6 h por semana (1,2 h por dia útil) por membro, são 38,4 h por membro e 691,2 h para os 18 membros:

```
691,2 h × R$ 72,96 = R$ 50.429,95
```

- A mão de obra não é desembolso do grupo: é o valor estimado do investimento público no esforço dos estudantes.
