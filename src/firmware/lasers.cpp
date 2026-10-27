#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_VL53L0X.h>
#include "lasers.h"
#include "config.h"

static Adafruit_VL53L0X loxEsq = Adafruit_VL53L0X();
static Adafruit_VL53L0X loxFte = Adafruit_VL53L0X();
static Adafruit_VL53L0X loxDir = Adafruit_VL53L0X();

static void configLongRange(Adafruit_VL53L0X &sensor) {
  sensor.configSensor(Adafruit_VL53L0X::VL53L0X_SENSE_LONG_RANGE);
  sensor.setMeasurementTimingBudgetMicroSeconds(50000);
}

void initLasers() {
  pinMode(XSHUT_ESQ, OUTPUT);
  pinMode(XSHUT_FTE, OUTPUT);
  pinMode(XSHUT_DIR, OUTPUT);

  digitalWrite(XSHUT_ESQ, LOW);
  digitalWrite(XSHUT_FTE, LOW);
  digitalWrite(XSHUT_DIR, LOW);
  delay(50);

  // U2 (Esquerda)
  digitalWrite(XSHUT_ESQ, HIGH);
  delay(15);
  if (loxEsq.begin(ADDR_LASER_ESQ)) {
    configLongRange(loxEsq);
    Serial.println("[LASER] U2 (Esq) inicializado em 0x30");
  }

  // U3 (Frente)
  digitalWrite(XSHUT_FTE, HIGH);
  delay(15);
  if (loxFte.begin(ADDR_LASER_FTE)) {
    configLongRange(loxFte);
    Serial.println("[LASER] U3 (Fte) inicializado em 0x31");
  }

  // U4 (Direita)
  digitalWrite(XSHUT_DIR, HIGH);
  delay(15);
  if (loxDir.begin(ADDR_LASER_DIR)) {
    configLongRange(loxDir);
    Serial.println("[LASER] U4 (Dir) inicializado em 0x32");
  }
}

static int extrairDistancia(Adafruit_VL53L0X &sensor) {
  VL53L0X_RangingMeasurementData_t m;
  sensor.rangingTest(&m, false);
  if (m.RangeStatus == 0 && m.RangeMilliMeter < 2000 && m.RangeMilliMeter > 20) {
    return m.RangeMilliMeter;
  }
  return -1;
}

void readLasers(int &distEsq, int &distFte, int &distDir) {
  distEsq = extrairDistancia(loxEsq);
  distFte = extrairDistancia(loxFte);
  distDir = extrairDistancia(loxDir);
}