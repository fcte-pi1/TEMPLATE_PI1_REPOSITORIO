import { TelemetryCard } from "./TelemetryCard";
import RpmSvg from '../../../assets/rpm.svg'
interface MotorRPMCardProps {
  leftRpm: number;
  rightRpm: number;
}

export function MotorRPMCard({
  leftRpm,
  rightRpm,
  
}: MotorRPMCardProps) {
  return (
    <TelemetryCard title="Motores" icon={<img src={RpmSvg} />}>
      <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
        <div className="min-w-0 rounded-lg bg-[#111D30] p-3 sm:p-[14px]">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-xs text-[#6B7280] sm:text-[13px]">
              Motor esquerdo
            </span>

            <strong className="truncate text-xl text-white sm:text-2xl">
              {leftRpm}
            </strong>

            <small className="text-[#6B7280]">
              RPM
            </small>
          </div>
        </div>

        <div className="min-w-0 rounded-lg bg-[#111D30] p-3 sm:p-[14px]">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-xs text-[#6B7280] sm:text-[13px]">
              Motor direito
            </span>

            <strong className="truncate text-xl text-white sm:text-2xl">
              {rightRpm}
            </strong>

            <small className="text-[#6B7280]">
              RPM
            </small>
          </div>
        </div>
      </div>
    </TelemetryCard>
  );
}