#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include "imu.h"
#include "imu_logic.h"
#include "config.h"

static Adafruit_MPU6050 mpu;
static float yawAngle = 0.0f;
static float yawRate = 0.0f;
static float biasZ = 0.0f;
static bool calibrada = false;

static float gyroX = 0.0f;
static float gyroY = 0.0f;
static float gyroZ = 0.0f;

static bool lerTaxaZ(float &taxa) {
  sensors_event_t a, g, temp;
  if (!mpu.getEvent(&a, &g, &temp)) return false;
  taxa = g.gyro.z * 57.2957795f;
  return true;
}

static EstatisticaGiro amostrarGiro() {
  EstatisticaGiro e;
  for (int i = 0; i < IMU_AMOSTRAS_CALIBRACAO; i++) {
    float taxa;
    if (lerTaxaZ(taxa)) e.adicionar(taxa);
    delay(IMU_INTERVALO_AMOSTRA_MS);
  }
  return e;
}

static void calibrarGiro() {
  Serial.println("[IMU] Calibrando giroscópio (mantenha o robô imóvel)...");
  const uint32_t minAmostras = IMU_AMOSTRAS_CALIBRACAO / 2;

  EstatisticaGiro e;
  for (int tentativa = 1; tentativa <= IMU_TENTATIVAS_CALIBRACAO; tentativa++) {
    e = amostrarGiro();
    if (calibracaoValida(e, IMU_LIMITE_MOVIMENTO_DPS, minAmostras)) {
      calibrada = true;
      break;
    }
    if (e.amostras() < minAmostras) {
      Serial.printf("[IMU] Poucas leituras validas (%lu)\n", (unsigned long)e.amostras());
    } else {
      Serial.printf("[IMU] Movimento detectado na calibracao (desvio %.3f deg/s)\n", e.desvio());
    }
    if (tentativa < IMU_TENTATIVAS_CALIBRACAO) Serial.println("[IMU] Repetindo...");
  }

  biasZ = e.media();
  if (calibrada) {
    Serial.printf("[IMU] Pronto! Bias Z: %.3f deg/s | Desvio: %.3f | Amostras: %lu\n",
                  biasZ, e.desvio(), (unsigned long)e.amostras());
  } else {
    Serial.printf("[IMU] AVISO: calibracao nao confiavel, Bias Z: %.3f deg/s\n", biasZ);
  }
}

bool initIMU() {
  if (!mpu.begin(ADDR_IMU)) {
    Serial.println("[IMU] Falha ao iniciar MPU-6050!");
    return false;
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_4_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  calibrarGiro();
  return true;
}

void updateIMU(float dt) {
  sensors_event_t a, g, temp;
  if (mpu.getEvent(&a, &g, &temp)) {
    gyroX = g.gyro.x * 57.2957795f;
    gyroY = g.gyro.y * 57.2957795f;
    gyroZ = (g.gyro.z * 57.2957795f) - biasZ;
    yawRate = aplicarZonaMorta(gyroZ, IMU_ZONA_MORTA_DPS);
  }
  yawAngle += yawRate * dt;
}

float getYawAngle() { return yawAngle; }
float getYawRate() { return yawRate; }
void getGyroRates(float &gx, float &gy, float &gz) {
  gx = gyroX;
  gy = gyroY;
  gz = gyroZ;
}
void resetYawAngle() { yawAngle = 0.0f; }
bool imuCalibrada() { return calibrada; }