#include <Arduino.h>
#include <Wire.h>
#include "i2c_check.h"
#include "config.h"

struct DispositivoI2C {
  uint8_t endereco;
  const char *nome;
};

static const DispositivoI2C ESPERADOS[] = {
  {INA219_ADDR,    "INA219"},
  {ADDR_IMU,       "MPU6050"},
  {ADDR_LASER_ESQ, "Laser Esq"},
  {ADDR_LASER_FTE, "Laser Fte"},
  {ADDR_LASER_DIR, "Laser Dir"},
};

static const uint8_t ADDR_LASER_PADRAO = 0x29;

static bool responde(uint8_t endereco) {
  Wire.beginTransmission(endereco);
  return Wire.endTransmission() == 0;
}

// Deve ser chamada depois de initLasers()
bool verificarI2C() {
  bool todosOk = true;
  for (const DispositivoI2C &d : ESPERADOS) {
    bool ok = responde(d.endereco);
    Serial.printf("[I2C] 0x%02X %-9s %s\n", d.endereco, d.nome, ok ? "OK" : "FALHA");
    todosOk = todosOk && ok;
  }

  if (responde(ADDR_LASER_PADRAO)) {
    Serial.println("[I2C] Ha um laser no endereco padrao 0x29 (falha na troca via XSHUT)");
    todosOk = false;
  }

  if (!todosOk) Serial.println("[I2C] Verifique a fiacao dos dispositivos com FALHA");
  return todosOk;
}
