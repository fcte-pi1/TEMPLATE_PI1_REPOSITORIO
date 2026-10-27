#pragma once

bool initIMU();
void updateIMU(float dt);
float getYawAngle();
float getYawRate();
void getGyroRates(float &gx, float &gy, float &gz);
void resetYawAngle();
bool imuCalibrada();