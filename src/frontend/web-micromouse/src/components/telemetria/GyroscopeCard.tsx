import { TelemetryCard } from "./TelemetryCard";
import GiroSvg from '../../../assets/giro.svg'

interface GyroscopeCardProps {
  x: number;
  y: number;
  z: number;
}

export function GyroscopeCard({
  x,
  y,
  z,
}: GyroscopeCardProps) {
  return (
    <TelemetryCard title="Giroscópio" icon={
      <img src={GiroSvg }/>
    }>
      <div className="grid w-full grid-cols-3 gap-2 sm:gap-2.5">
        <div className="min-w-0 rounded-lg bg-[#111D30] px-2 py-2.5 sm:py-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs text-[#6B7280] sm:text-[13px]">
              X
            </span>

            <strong className="truncate text-base text-white sm:text-lg">
              {x.toFixed(3)}
            </strong>
          </div>
        </div>

        <div className="min-w-0 rounded-lg bg-[#111D30] px-2 py-2.5 sm:py-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs text-[#6B7280] sm:text-[13px]">
              Y
            </span>

            <strong className="truncate text-base text-white sm:text-lg">
              {y.toFixed(3)}
            </strong>
          </div>
        </div>

        <div className="min-w-0 rounded-lg bg-[#111D30] px-2 py-2.5 sm:py-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs text-[#6B7280] sm:text-[13px]">
              Z
            </span>

            <strong className="truncate text-base text-white sm:text-lg">
              {z.toFixed(3)}
            </strong>
          </div>
        </div>

      </div>

    </TelemetryCard>
  );
}