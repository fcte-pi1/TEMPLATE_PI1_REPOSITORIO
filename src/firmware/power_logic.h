#pragma once

#include <stdint.h>

// Estimativa do nível de carga pela tensão
inline float bateriaPercentual(float tensaoPack, int celulas) {
  static const float V[]   = {3.30f, 3.61f, 3.69f, 3.73f, 3.77f, 3.80f, 3.84f, 3.87f, 3.95f, 4.02f, 4.11f, 4.20f};
  static const float PCT[] = {0.0f,  5.0f,  10.0f, 20.0f, 30.0f, 40.0f, 50.0f, 60.0f, 70.0f, 80.0f, 90.0f, 100.0f};
  const int n = sizeof(V) / sizeof(V[0]);

  float v = tensaoPack / celulas;
  if (v <= V[0]) return 0.0f;
  if (v >= V[n - 1]) return 100.0f;

  for (int k = 1; k < n; k++) {
    if (v < V[k]) {
      return PCT[k - 1] + (PCT[k] - PCT[k - 1]) * (v - V[k - 1]) / (V[k] - V[k - 1]);
    }
  }
  return 100.0f;
}

enum EstadoBateria { BATERIA_NORMAL, BATERIA_BAIXA, BATERIA_CRITICA };

struct LimitesBateria {
  float vAlerta;
  float vCorte;
  uint32_t tempoConfirmacaoMs;   // Tensão precisa ficar abaixo do limite por esse tempo
  float iSobrecorrenteMA;
  uint32_t tempoSobrecorrenteMs;
};

class MonitorBateria {
public:
  explicit MonitorBateria(const LimitesBateria &limites) : lim(limites) {}

  void atualizar(float tensaoV, float correnteMA, uint32_t agoraMs) {
    if (estadoAtual != BATERIA_CRITICA) {
      if (persistiu(tensaoV < lim.vCorte, abaixoCorte, desdeCorte, agoraMs, lim.tempoConfirmacaoMs)) {
        estadoAtual = BATERIA_CRITICA;
      } else if (estadoAtual == BATERIA_NORMAL &&
                 persistiu(tensaoV < lim.vAlerta, abaixoAlerta, desdeAlerta, agoraMs, lim.tempoConfirmacaoMs)) {
        estadoAtual = BATERIA_BAIXA;
      }
    }
    emSobrecorrente = persistiu(correnteMA > lim.iSobrecorrenteMA, acimaCorrente, desdeCorrente,
                                agoraMs, lim.tempoSobrecorrenteMs);
  }

  EstadoBateria estado() const { return estadoAtual; }
  bool sobrecorrente() const { return emSobrecorrente; }

private:
  static bool persistiu(bool condicao, bool &ativa, uint32_t &desde, uint32_t agora, uint32_t tempo) {
    if (!condicao) {
      ativa = false;
      return false;
    }
    if (!ativa) {
      ativa = true;
      desde = agora;
    }
    return (uint32_t)(agora - desde) >= tempo;
  }

  LimitesBateria lim;
  EstadoBateria estadoAtual = BATERIA_NORMAL;
  bool emSobrecorrente = false;

  bool abaixoCorte = false;
  uint32_t desdeCorte = 0;
  bool abaixoAlerta = false;
  uint32_t desdeAlerta = 0;
  bool acimaCorrente = false;
  uint32_t desdeCorrente = 0;
};
