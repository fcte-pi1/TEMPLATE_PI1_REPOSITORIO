import { useEffect, useState } from "react";
import type { TelemetryData } from "../types/telemetry";

const initialTelemetry: TelemetryData = {
  connected: true,

  battery: {
    percentage: 100,
    voltage: 8.4,
    current: 0.35,
    estimatedRechargeMinutes: 0,
  },

  averageSpeed: 0,

  motors: {
    leftRpm: 0,
    rightRpm: 0,
  },

  gyro: {
    x: 0,
    y: 0,
    z: 0,
  },
};

export function useTelemetry(): TelemetryData {
  const [telemetry, setTelemetry] =
    useState<TelemetryData>(initialTelemetry);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTelemetry((previous) => {
        if (!previous.connected) {
          return previous;
        }

        const newBatteryPercentage = Math.max(
          0,
          previous.battery.percentage - 0.1
        );

        return {
          ...previous,

          battery: {
            percentage: newBatteryPercentage,

            voltage:
              7.2 + Math.random() * 1.2,

            current:
              0.3 + Math.random() * 0.5,

            estimatedRechargeMinutes: Math.round(
              (100 - newBatteryPercentage) * 0.8
            ),
          },

          averageSpeed:
            0.4 + Math.random() * 0.6,

          motors: {
            leftRpm: Math.round(
              1000 + Math.random() * 600
            ),

            rightRpm: Math.round(
              1000 + Math.random() * 600
            ),
          },

          gyro: {
            x:
              -5 + Math.random() * 10,

            y:
              -5 + Math.random() * 10,

            z:
              -180 + Math.random() * 360,
          },
        };
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return telemetry;
}