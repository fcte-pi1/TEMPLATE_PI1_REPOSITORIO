export interface BatteryData {
  percentage: number;
  voltage: number;
  current: number;
  estimatedRechargeMinutes: number;
}

export interface MotorData {
  leftRpm: number;
  rightRpm: number;
}

export interface GyroscopeData {
  x: number;
  y: number;
  z: number;
}

export interface TelemetryData {
  connected: boolean;
  battery: BatteryData;
  averageSpeed: number;
  motors: MotorData;
  gyro: GyroscopeData;
}