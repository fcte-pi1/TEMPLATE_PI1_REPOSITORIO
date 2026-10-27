#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#include "telemetry.h"
#include "config.h"

static portMUX_TYPE telemetryMux = portMUX_INITIALIZER_UNLOCKED;
static TelemetryData currentTelemetry;
static TaskHandle_t telemetryTaskHandle = NULL;
static unsigned long tempoInicioMissao = 0;
static uint8_t falhasConsecutivas = 0;

static char jsonBuffer[1024];

void initTelemetry() {
  tempoInicioMissao = millis();

  // Inicializa estrutura de dados com valores padrão seguros
  portENTER_CRITICAL(&telemetryMux);
  currentTelemetry.execucao_id = 1;
  currentTelemetry.tempo_relativo_ms = 0;
  currentTelemetry.timestamp_envio_ms = 0;

  currentTelemetry.bateria_nivel_pct = 0.0f;
  currentTelemetry.bateria_tensao_v = 0.0f;
  currentTelemetry.bateria_consumo_ma = 0.0f;

  currentTelemetry.rps_esq = 0.0f;
  currentTelemetry.rps_dir = 0.0f;
  currentTelemetry.rpm_esq = 0;
  currentTelemetry.rpm_dir = 0;
  currentTelemetry.velocidade_cm_s = 0.0f;

  currentTelemetry.yaw_deg = 0.0f;
  currentTelemetry.taxa_deg_s = 0.0f;
  currentTelemetry.giro_x = 0.0f;
  currentTelemetry.giro_y = 0.0f;
  currentTelemetry.giro_z = 0.0f;

  currentTelemetry.dist_esq_mm = -1;
  currentTelemetry.dist_fte_mm = -1;
  currentTelemetry.dist_dir_mm = -1;

  currentTelemetry.pos_x = 0;
  currentTelemetry.pos_y = 0;
  currentTelemetry.direcao = 'N';
  currentTelemetry.status_missao = "em_execucao";

  currentTelemetry.latencia_rtt_ms = 0;
  currentTelemetry.pacotes_enviados = 0;
  currentTelemetry.pacotes_falhos = 0;
  currentTelemetry.conectado = false;
  portEXIT_CRITICAL(&telemetryMux);

  // Se houver rede Station configurada em config.h, conecta em modo misto (AP + STA)
  if (strlen(WIFI_STA_SSID) > 0) {
    WiFi.mode(WIFI_AP_STA);
    WiFi.begin(WIFI_STA_SSID, WIFI_STA_PASSWORD);
    Serial.printf("[TELEMETRIA] Conectando ao Wi-Fi Station: %s...\n", WIFI_STA_SSID);
  }

  // Cria a Task FreeRTOS dedicada no Core 0 (o controle do robô roda no Core 1)
  xTaskCreatePinnedToCore(
      [](void* param) {
        TickType_t xLastWakeTime = xTaskGetTickCount();
        const TickType_t xFrequency = pdMS_TO_TICKS(TELEMETRY_INTERVAL_MS);

        HTTPClient http;
        http.setReuse(true); // Reutiliza socket TCP (Keep-Alive) para minimizar latência

        String url = String("http://") + TELEMETRY_SERVER_HOST + ":" + TELEMETRY_SERVER_PORT + TELEMETRY_ENDPOINT;

        while (true) {
          vTaskDelayUntil(&xLastWakeTime, xFrequency);

          // Verifica se há enlace de rede disponível
          bool redeDisponivel = (WiFi.status() == WL_CONNECTED) || (WiFi.softAPgetStationNum() > 0);
          if (!redeDisponivel) {
            portENTER_CRITICAL(&telemetryMux);
            currentTelemetry.conectado = false;
            portEXIT_CRITICAL(&telemetryMux);
            continue;
          }

          // Serializa o snapshot atual
          size_t len = serializeTelemetryJSON(jsonBuffer, sizeof(jsonBuffer));
          if (len == 0) continue;

          unsigned long tInicioEnvio = millis();

          http.begin(url);
          http.setTimeout(TELEMETRY_TIMEOUT_MS);
          http.addHeader("Content-Type", "application/json");

          int httpResponseCode = http.POST((uint8_t*)jsonBuffer, len);
          unsigned long rtt = millis() - tInicioEnvio;

          portENTER_CRITICAL(&telemetryMux);
          if (httpResponseCode > 0) {
            currentTelemetry.latencia_rtt_ms = rtt;
            currentTelemetry.pacotes_enviados++;
            currentTelemetry.conectado = true;
            falhasConsecutivas = 0;
          } else {
            currentTelemetry.pacotes_falhos++;
            falhasConsecutivas++;
            if (falhasConsecutivas >= TELEMETRY_MAX_RETRIES) {
              currentTelemetry.conectado = false;
            }
          }
          portEXIT_CRITICAL(&telemetryMux);

          http.end();
        }
      },
      "TelemetryTask",
      4096,
      NULL,
      1,
      &telemetryTaskHandle,
      0 // Core 0
  );

  Serial.println("[TELEMETRIA] Subsistema de telemetria inicializado no Core 0.");
}

void updateTelemetryData(
    float rpsA, float rpsB,
    float yaw, float yawRate, float gx, float gy, float gz,
    int dEsq, int dFte, int dDir,
    int posX, int posY, char dir,
    const char* status
) {
  // Cálculo de velocidade e odometria
  float rpsMedio = (rpsA + rpsB) / 2.0f;
  float circRoda = 3.14159265f * DIAMETRO_RODA_CM;
  float velCmS = rpsMedio * circRoda;

  portENTER_CRITICAL(&telemetryMux);
  currentTelemetry.tempo_relativo_ms = millis() - tempoInicioMissao;
  currentTelemetry.timestamp_envio_ms = millis();

  currentTelemetry.rps_esq = rpsA;
  currentTelemetry.rps_dir = rpsB;
  currentTelemetry.rpm_esq = (int)(rpsA * 60.0f);
  currentTelemetry.rpm_dir = (int)(rpsB * 60.0f);
  currentTelemetry.velocidade_cm_s = velCmS;

  currentTelemetry.yaw_deg = yaw;
  currentTelemetry.taxa_deg_s = yawRate;
  currentTelemetry.giro_x = gx;
  currentTelemetry.giro_y = gy;
  currentTelemetry.giro_z = gz;

  currentTelemetry.dist_esq_mm = dEsq;
  currentTelemetry.dist_fte_mm = dFte;
  currentTelemetry.dist_dir_mm = dDir;

  currentTelemetry.pos_x = posX;
  currentTelemetry.pos_y = posY;
  currentTelemetry.direcao = dir;
  currentTelemetry.status_missao = status;
  portEXIT_CRITICAL(&telemetryMux);
}

void updateTelemetryBattery(float tensao_v, float consumo_ma, float nivel_pct) {
  portENTER_CRITICAL(&telemetryMux);
  currentTelemetry.bateria_tensao_v = tensao_v;
  currentTelemetry.bateria_consumo_ma = consumo_ma;
  currentTelemetry.bateria_nivel_pct = nivel_pct;
  portEXIT_CRITICAL(&telemetryMux);
}

size_t serializeTelemetryJSON(char* buffer, size_t bufferSize) {
  TelemetryData snap;
  portENTER_CRITICAL(&telemetryMux);
  snap = currentTelemetry;
  portEXIT_CRITICAL(&telemetryMux);

  JsonDocument doc;

  doc["execucao_id"] = snap.execucao_id;
  doc["tempo_relativo_ms"] = snap.tempo_relativo_ms;
  doc["timestamp_envio_ms"] = snap.timestamp_envio_ms;

  // Campos lidos pelo backend em POST /api/telemetry (EspTelemetryInput).
  // O backend recusa valores negativos: o percentual vai 0 enquanto o INA219
  // nao tem leitura (-1) e velocidade/rpm vao em modulo.
  float nivelPct = snap.bateria_nivel_pct < 0.0f ? 0.0f : snap.bateria_nivel_pct;
  doc["bateria"] = round(nivelPct * 10.0f) / 10.0f;
  doc["velocidade"] = round(fabsf(snap.velocidade_cm_s) * 10.0f) / 10.0f;
  doc["rpm_motor"] = (abs(snap.rpm_esq) + abs(snap.rpm_dir)) / 2;

  JsonObject energia = doc["energia"].to<JsonObject>();
  energia["tensao_v"] = round(snap.bateria_tensao_v * 100.0f) / 100.0f;
  energia["consumo_ma"] = round(snap.bateria_consumo_ma * 10.0f) / 10.0f;

  JsonObject mot = doc["motores"].to<JsonObject>();
  mot["rpm_esq"] = snap.rpm_esq;
  mot["rpm_dir"] = snap.rpm_dir;
  mot["velocidade_cm_s"] = round(snap.velocidade_cm_s * 10.0f) / 10.0f;

  JsonObject imu = doc["imu"].to<JsonObject>();
  imu["yaw_deg"] = round(snap.yaw_deg * 10.0f) / 10.0f;
  imu["taxa_deg_s"] = round(snap.taxa_deg_s * 10.0f) / 10.0f;
  imu["giro_x"] = round(snap.giro_x * 10.0f) / 10.0f;
  imu["giro_y"] = round(snap.giro_y * 10.0f) / 10.0f;
  imu["giro_z"] = round(snap.giro_z * 10.0f) / 10.0f;

  JsonObject dist = doc["sensores_distancia_mm"].to<JsonObject>();
  dist["esq"] = snap.dist_esq_mm;
  dist["frente"] = snap.dist_fte_mm;
  dist["dir"] = snap.dist_dir_mm;

  JsonObject pos = doc["posicao_estimada"].to<JsonObject>();
  pos["x"] = snap.pos_x;
  pos["y"] = snap.pos_y;
  char dirStr[2] = {snap.direcao, '\0'};
  pos["direcao"] = dirStr;

  doc["status_missao"] = snap.status_missao;

  JsonObject diag = doc["diagnostico"].to<JsonObject>();
  diag["latencia_ms"] = snap.latencia_rtt_ms;
  diag["pacotes_enviados"] = snap.pacotes_enviados;
  diag["pacotes_falhos"] = snap.pacotes_falhos;
  diag["conectado"] = snap.conectado;

  return serializeJson(doc, buffer, bufferSize);
}

uint32_t getTelemetryLatency() {
  portENTER_CRITICAL(&telemetryMux);
  uint32_t lat = currentTelemetry.latencia_rtt_ms;
  portEXIT_CRITICAL(&telemetryMux);
  return lat;
}

uint32_t getTelemetryPacketsSent() {
  portENTER_CRITICAL(&telemetryMux);
  uint32_t qtd = currentTelemetry.pacotes_enviados;
  portEXIT_CRITICAL(&telemetryMux);
  return qtd;
}

uint32_t getTelemetryPacketsLost() {
  portENTER_CRITICAL(&telemetryMux);
  uint32_t qtd = currentTelemetry.pacotes_falhos;
  portEXIT_CRITICAL(&telemetryMux);
  return qtd;
}

bool isTelemetryConnected() {
  portENTER_CRITICAL(&telemetryMux);
  bool c = currentTelemetry.conectado;
  portEXIT_CRITICAL(&telemetryMux);
  return c;
}
