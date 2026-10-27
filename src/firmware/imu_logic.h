#pragma once

#include <math.h>
#include <stdint.h>

class EstatisticaGiro {
public:
  void adicionar(float x) {
    n++;
    float delta = x - mediaAtual;
    mediaAtual += delta / n;
    m2 += delta * (x - mediaAtual);
  }

  uint32_t amostras() const { return n; }
  float media() const { return mediaAtual; }
  float desvio() const { return n > 1 ? sqrtf(m2 / (n - 1)) : 0.0f; }

private:
  uint32_t n = 0;
  float mediaAtual = 0.0f;
  float m2 = 0.0f;
};

inline float aplicarZonaMorta(float taxa, float limite) {
  return fabsf(taxa) < limite ? 0.0f : taxa;
}

// Falso se faltaram leituras ou se o robô se mexeu durante a calibração
inline bool calibracaoValida(const EstatisticaGiro &e, float limiteDesvio, uint32_t minAmostras) {
  return e.amostras() >= minAmostras && e.desvio() <= limiteDesvio;
}
