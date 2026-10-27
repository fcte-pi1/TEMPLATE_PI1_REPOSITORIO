#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoOTA.h>
#include "ota_manager.h"
#include "motors.h"

static const char* ap_ssid = "Xaropinho-WiFi";
static const char* ap_password = "pi12pi34";

void initOTA() {
  WiFi.mode(WIFI_AP);
  WiFi.softAP(ap_ssid, ap_password);

  Serial.println("\n[OTA] Access Point Criado!");
  Serial.printf("[OTA] Conecte no Wi-Fi: %s\n", ap_ssid);
  Serial.print("[OTA] IP da placa: ");
  Serial.println(WiFi.softAPIP()); // Sempre 192.168.4.1

  ArduinoOTA.setHostname("xaropinho-esp32");

  ArduinoOTA.onStart([]() {
    stopMotors(); // Segurança fundamental: trava motores durante o flash
    Serial.println("[OTA] Gravando novo firmware via Wi-Fi...");
  });

  ArduinoOTA.onEnd([]() {
    Serial.println("\n[OTA] Gravacao concluida!");
  });

  ArduinoOTA.begin();
}

void handleOTA() {
  ArduinoOTA.handle();
} 