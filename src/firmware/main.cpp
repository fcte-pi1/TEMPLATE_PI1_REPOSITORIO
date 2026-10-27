#include <Arduino.h>
#include <Wire.h>
#include <WebServer.h> // Adicionado para controlo via rede
#include "config.h"
#include "motors.h"
#include "imu.h"
#include "lasers.h"
#include "power.h"
#include "i2c_check.h"
#include "ota_manager.h"
#include "telemetry.h"

unsigned long tempoAnterior = 0;
const unsigned long INTERVALO_MS = 100;

WebServer server(80); // Servidor HTTP na porta padrão 80

static void girar(bool paraDireita) {
  girar90Graus(paraDireita);
  tempoAnterior = millis();
}

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  Wire.setClock(400000);

  initMotors();
  initIMU();
  initLasers();
  initPower();
  verificarI2C();
  initOTA();
  initTelemetry();

  // Configuração dos endpoints de comando via Wi-Fi
  server.on("/direita", []() {
    server.send(200, "text/plain", "Girando 90 graus a DIREITA");
    girar(true);
  });

  server.on("/esquerda", []() {
    server.send(200, "text/plain", "Girando 90 graus a ESQUERDA");
    girar(false);
  });

  server.on("/parar", []() {
    stopMotors();
    server.send(200, "text/plain", "Motores parados");
  });

  server.begin();
  Serial.println("[HTTP] Servidor Web ativo em http://192.168.4.1");

  Serial.println("\n--- Robô Inicializado com Sucesso ---");
  tempoAnterior = millis();
}

void loop() {
  handleOTA(); // Escuta requisições de gravação sem fio
  server.handleClient(); // Processa pedidos recebidos por Wi-Fi

  // Mantém a escuta por cabo USB ativa em paralelo
  if (Serial.available() > 0) {
    char comando = Serial.read();
    if (comando == 'd' || comando == 'D') girar(true);
    if (comando == 'e' || comando == 'E') girar(false);
    if (comando == 's' || comando == 'S') stopMotors();
  }

  unsigned long agora = millis();
  unsigned long delta = agora - tempoAnterior;

  if (delta >= INTERVALO_MS) {
    float dt = delta / 1000.0f;
    tempoAnterior = agora;

    // Atualiza odometria e sensores
    updateIMU(dt);

    float rpsA = 0, rpsB = 0;
    getEncoderSpeeds(dt, rpsA, rpsB);

    int dEsq = -1, dFte = -1, dDir = -1;
    readLasers(dEsq, dFte, dDir);

    updatePower();
    if (bateriaCritica()) stopMotors(); // Protege a LiPo contra descarga profunda
    updateTelemetryBattery(obter_tensao_bateria(), obter_corrente_mA(), obter_bateria_pct());

    float gx = 0.0f, gy = 0.0f, gz = 0.0f;
    getGyroRates(gx, gy, gz);

    // Alimenta o subsistema de telemetria
    updateTelemetryData(
        rpsA, rpsB,
        getYawAngle(), getYawRate(), gx, gy, gz,
        dEsq, dFte, dDir
    );

    // Telemetria no Serial para depuração local
    Serial.printf("[MOTORES]     A: %5.2f RPS | B: %5.2f RPS\n", rpsA, rpsB);
    Serial.printf("[IMU]         Yaw: %6.1f deg | Taxa: %5.2f deg/s\n", getYawAngle(), getYawRate());
    Serial.printf("[LASER]       Esq: %4d mm | Frente: %4d mm | Dir: %4d mm\n", dEsq, dFte, dDir);
    Serial.printf("[ENERGIA]     %5.2f V | %7.1f mA | %7.1f mW | %5.1f %%\n", obter_tensao_bateria(), obter_corrente_mA(), obter_potencia_mW(), obter_bateria_pct());
    Serial.printf("[TELEMETRIA]  RTT: %3u ms | Enviados: %4u | Falhas: %2u | Conectado: %s\n",
                  getTelemetryLatency(), getTelemetryPacketsSent(), getTelemetryPacketsLost(),
                  isTelemetryConnected() ? "SIM" : "NAO");
    Serial.println("--------------------------------------------------");
  }
}