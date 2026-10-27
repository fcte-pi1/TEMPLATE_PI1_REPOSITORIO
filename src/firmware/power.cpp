#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_INA219.h>
#include "power.h"
#include "power_logic.h"
#include "config.h"

static Adafruit_INA219 ina219(INA219_ADDR);
static bool ativo = false;
static bool temLeitura = false;

static MonitorBateria monitor({BAT_V_ALERTA, BAT_V_CORTE, BAT_TEMPO_CONFIRMACAO_MS,
                               I_SOBRECORRENTE_MA, I_SOBRECORRENTE_TEMPO_MS});
static EstadoBateria estadoAvisado = BATERIA_NORMAL;
static bool sobrecorrenteAvisada = false;

// inicializando com -1 para indicar que eh leitura invalida
static float tensaoV = -1.0f;
static float correnteMA = -1.0f;
static float potenciaMW = -1.0f;

static const float ALFA_FILTRO = 0.2f;

static float filtrar(float anterior, float novo) {
  if (!temLeitura) return novo;
  return anterior + ALFA_FILTRO * (novo - anterior);
}

bool initPower() {
  if (!ina219.begin(&Wire)) {
    Serial.println("[ENERGIA] INA219 nao encontrado (0x40)");
    return false;
  }
  ina219.setCalibration_32V_2A();
  ativo = true;
  Serial.println("[ENERGIA] INA219 inicializado em 0x40");
  return true;
}

void updatePower() {
  if (!ativo) return;

  float vBus = ina219.getBusVoltage_V();
  bool ok = ina219.success();
  float vShunt = ina219.getShuntVoltage_mV();
  ok = ok && ina219.success();
  float i = ina219.getCurrent_mA();
  ok = ok && ina219.success();
  float p = ina219.getPower_mW();
  ok = ok && ina219.success();

  if (!ok) return; // Mantém a última leitura válida

  // Tensão nos terminais da bateria
  tensaoV = filtrar(tensaoV, vBus + vShunt / 1000.0f);
  correnteMA = filtrar(correnteMA, i);
  potenciaMW = filtrar(potenciaMW, p);
  temLeitura = true;

  monitor.atualizar(tensaoV, correnteMA, millis());

  // Avisa só na mudança de estado
  if (monitor.estado() != estadoAvisado) {
    estadoAvisado = monitor.estado();
    if (estadoAvisado == BATERIA_BAIXA) {
      Serial.printf("[ENERGIA] Bateria baixa: %.2f V\n", tensaoV);
    } else if (estadoAvisado == BATERIA_CRITICA) {
      Serial.printf("[ENERGIA] Bateria critica: %.2f V, corte acionado\n", tensaoV);
    }
  }
  if (monitor.sobrecorrente() != sobrecorrenteAvisada) {
    sobrecorrenteAvisada = monitor.sobrecorrente();
    if (sobrecorrenteAvisada) {
      Serial.printf("[ENERGIA] Sobrecorrente: %.0f mA\n", correnteMA);
    }
  }
}

float obter_tensao_bateria() { return tensaoV; }
float obter_corrente_mA() { return correnteMA; }
float obter_potencia_mW() { return potenciaMW; }

float obter_bateria_pct() {
  if (!temLeitura) return -1.0f;
  return bateriaPercentual(tensaoV, BAT_CELULAS);
}

bool bateriaCritica() { return monitor.estado() == BATERIA_CRITICA; }
bool sobrecorrente() { return monitor.sobrecorrente(); }
