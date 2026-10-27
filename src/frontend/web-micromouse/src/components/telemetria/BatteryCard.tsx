import { TelemetryCard } from "./TelemetryCard";
import batterySvg from '../../../assets/battery.svg'
interface BatteryCardProps {
  battery: number;
}

export function BatteryCard({
  battery,
}: BatteryCardProps) {
  return (
    <TelemetryCard title="Bateria" icon={<img src={batterySvg}/>}>
      <div className="flex min-w-0 items-center justify-between">
        <strong className="truncate text-2xl font-bold text-white sm:text-3xl md:text-[34px]">
          {battery}%
        </strong>
      </div>

      <div className="my-3 h-2 w-full overflow-hidden rounded-full bg-[#1D293D] sm:my-[14px] sm:mb-[18px]">
        <div
          className="
            h-full rounded-full
            bg-[#22c55e]
            transition-[width]
            duration-300
            ease-in-out
          "
          style={{
            width: `${battery}%`,
          }}
        />
      </div>

      <div className="flex justify-between gap-4 text-sm text-[#6B7280]">
        <span>Estado</span>

        <strong className="text-[#DCE1E9]">
          {battery > 20 ? "Normal" : "Baixa"}
        </strong>
      </div>
    </TelemetryCard>
  );
}