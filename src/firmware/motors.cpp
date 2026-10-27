#include <Arduino.h>
#include "config.h"
#include "motors.h"
#include "imu.h"
#include "power.h"

static volatile long countA = 0;
static volatile long countB = 0;

static void IRAM_ATTR isrA() {
  if (digitalRead(ENC_A_C2) == HIGH) countA++;
  else countA--;
}

static void IRAM_ATTR isrB() {
  if (digitalRead(ENC_B_C2) == HIGH) countB++;
  else countB--;
}

void initMotors() {
  pinMode(PIN_STBY, OUTPUT);
  pinMode(PIN_AIN1, OUTPUT);
  pinMode(PIN_AIN2, OUTPUT);
  pinMode(PIN_BIN1, OUTPUT);
  pinMode(PIN_BIN2, OUTPUT);

  // API do core 3 (plataforma pioarduino no platformio.ini). No core 2 seria ledcSetup + ledcAttachPin
  ledcAttach(PIN_PWMA, 10000, 8);
  ledcAttach(PIN_PWMB, 10000, 8);
  digitalWrite(PIN_STBY, HIGH);

  pinMode(ENC_A_C1, INPUT_PULLUP);
  pinMode(ENC_A_C2, INPUT_PULLUP);
  pinMode(ENC_B_C1, INPUT_PULLUP);
  pinMode(ENC_B_C2, INPUT_PULLUP);

  attachInterrupt(digitalPinToInterrupt(ENC_A_C1), isrA, RISING);
  attachInterrupt(digitalPinToInterrupt(ENC_B_C1), isrB, RISING);
}

void stopMotors() {
  ledcWrite(PIN_PWMA, 0);
  ledcWrite(PIN_PWMB, 0);
}

void setMotorSpeed(int pwmA, int pwmB) {
  // Motor A
  if (pwmA >= 0) {
    digitalWrite(PIN_AIN1, HIGH);
    digitalWrite(PIN_AIN2, LOW);
  } else {
    digitalWrite(PIN_AIN1, LOW);
    digitalWrite(PIN_AIN2, HIGH);
  }
  ledcWrite(PIN_PWMA, constrain(abs(pwmA), 0, 255));

  // Motor B
  if (pwmB >= 0) {
    digitalWrite(PIN_BIN1, HIGH);
    digitalWrite(PIN_BIN2, LOW);
  } else {
    digitalWrite(PIN_BIN1, LOW);
    digitalWrite(PIN_BIN2, HIGH);
  }
  ledcWrite(PIN_PWMB, constrain(abs(pwmB), 0, 255));
}

void setTurnEffort(int esforco) {
  esforco = constrain(esforco, -255, 255);
  int pwm = abs(esforco);
  if (pwm > 0 && pwm < 45) pwm = 45; // Vence atrito estático

  if (esforco > 0) {
    // Giro anti-horário (A recua, B avança)
    setMotorSpeed(-pwm, pwm);
  } else if (esforco < 0) {
    // Giro horário (A avança, B recua)
    setMotorSpeed(pwm, -pwm);
  } else {
    stopMotors();
  }
}

void getEncoderSpeeds(float dt, float &rpsA, float &rpsB) {
  if (dt <= 0.0f) return;
  noInterrupts();
  long pA = countA;
  long pB = countB;
  countA = 0;
  countB = 0;
  interrupts();

  rpsA = (pA / PULSOS_POR_VOLTA) / dt;
  rpsB = (pB / PULSOS_POR_VOLTA) / dt;
}

void girar90Graus(bool paraDireita) {
    // 1. Zera acumuladores de pulsos existentes no ficheiro
    countA = 0;
    countB = 0;

    const float targetTicks = PULSOS_90_GRAUS;
    const int pwmBase = 90;      // Potência suficiente para vencer o atrito estático
    const int pwmMin = 45;       // Limite inferior para não travar o motor
    const float kP = 0.4f;       // Ganho proporcional para desaceleração suave

    bool concluido = false;
    unsigned long timeout = millis() + 2000; // Timeout de segurança (2 segundos)
    unsigned long ultimaLeitura = millis();

    while (!concluido && millis() < timeout) {
        // O giro bloqueia o loop principal, então a IMU e a bateria são lidas aqui
        unsigned long agora = millis();
        updateIMU((agora - ultimaLeitura) / 1000.0f);
        ultimaLeitura = agora;

        updatePower();
        if (bateriaCritica()) break;

        // Média dos pulsos absolutos percorridos pelas rodas
        long pulsoEsq = abs(countA);
        long pulsoDir = abs(countB);
        float mediaPulsos = (pulsoEsq + pulsoDir) / 2.0f;

        float erro = targetTicks - mediaPulsos;

        if (erro <= 2.0f) { // Tolerância de paragem (2 pulsos)
            concluido = true;
            break;
        }

        // Calcula velocidade decrescente suave
        int esforco = (int)(erro * kP);
        if (esforco > pwmBase) esforco = pwmBase;
        if (esforco < pwmMin)  esforco = pwmMin;

        // Sentido de rotação no próprio eixo:
        if (paraDireita) {
            setMotorSpeed(esforco, -esforco);
        } else {
            setMotorSpeed(-esforco, esforco);
        }

        delay(5); // Ciclo de amostragem (200 Hz)
    }

    // Trava ativa das rodas para travar a inércia
    stopMotors();
    unsigned long inicioFreio = millis();
    while (millis() - inicioFreio < 100) { // Continua integrando a IMU enquanto o robô para
        unsigned long agora = millis();
        updateIMU((agora - ultimaLeitura) / 1000.0f);
        ultimaLeitura = agora;
        delay(5);
    }

    float anguloMedidoIMU = getYawAngle();
    Serial.printf("[GIRO 90] Concluido! Pulsos A: %ld | B: %ld | Angulo IMU: %.2f deg\n", 
                  countA, countB, anguloMedidoIMU);
}