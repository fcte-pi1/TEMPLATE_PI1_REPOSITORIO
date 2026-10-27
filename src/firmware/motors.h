#pragma once

void initMotors();
void stopMotors();
void setMotorSpeed(int pwmA, int pwmB);
void setTurnEffort(int esforco);
void getEncoderSpeeds(float dt, float &rpsA, float &rpsB);
void girar90Graus(bool paraDireita);