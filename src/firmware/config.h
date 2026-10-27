#pragma once

// Driver TB6612FNG
#define PIN_PWMA  15
#define PIN_AIN1  2
#define PIN_AIN2  4
#define PIN_PWMB  25
#define PIN_BIN1  26
#define PIN_BIN2  27
#define PIN_STBY  5

// Encoders N20
#define ENC_A_C1  32
#define ENC_A_C2  33
#define ENC_B_C1  14
#define ENC_B_C2  13

// Sensores VL53L0X (Pinos XSHUT)
#define XSHUT_ESQ 23  // U2
#define XSHUT_FTE 18  // U3
#define XSHUT_DIR 19  // U4

// Endereços I2C dos lasers
#define ADDR_LASER_ESQ 0x30
#define ADDR_LASER_FTE 0x31
#define ADDR_LASER_DIR 0x32

// Endereço I2C da IMU MPU-6050
#define ADDR_IMU 0x68

// Calibração do giroscópio
#define IMU_AMOSTRAS_CALIBRACAO   800
#define IMU_INTERVALO_AMOSTRA_MS  3
#define IMU_TENTATIVAS_CALIBRACAO 3
#define IMU_LIMITE_MOVIMENTO_DPS  0.5f  // Desvio acima disso indica robô em movimento
#define IMU_ZONA_MORTA_DPS        0.25f

// Sensor de energia INA219 (U12)
#define INA219_ADDR 0x40

// Limites da bateria LiPo 2S
#define BAT_CELULAS              2
#define BAT_V_ALERTA             7.0f
#define BAT_V_CORTE              6.6f
#define BAT_TEMPO_CONFIRMACAO_MS 2000
#define I_SOBRECORRENTE_MA       2000.0f
#define I_SOBRECORRENTE_TEMPO_MS 500

// Constantes mecânicas
#define PULSOS_POR_VOLTA 210.0f  // Pulsos totais por rotação completa da roda (com caixa de redução)
#define DIAMETRO_RODA_CM 3.4f    // Diâmetro da roda com pneu
#define BITOLA_CM        10.0f   // Distância entre o centro das duas rodas

// Constante calculada de pulsos para exatamente 90 graus
#define PULSOS_90_GRAUS ((BITOLA_CM * PULSOS_POR_VOLTA) / (4.0f * DIAMETRO_RODA_CM))

// Configurações de Telemetria e Rede
#define TELEMETRY_INTERVAL_MS   100   // Taxa de 10 Hz (intervalo <= 1s, atende RNF-SW01)
#define TELEMETRY_SERVER_HOST   "192.168.4.2" // IP padrão da estação base conectada ao SoftAP do robô
#define TELEMETRY_SERVER_PORT   8000
#define TELEMETRY_ENDPOINT      "/api/telemetry"
#define TELEMETRY_TIMEOUT_MS    80    // Timeout de envio HTTP para não sobrecarregar conexão
#define TELEMETRY_MAX_RETRIES   3     // Tentativas antes de marcar desconectado

// Opcional: Wi-Fi em modo Station (conectar a uma rede externa ou roteador)
#define WIFI_STA_SSID           ""
#define WIFI_STA_PASSWORD       ""