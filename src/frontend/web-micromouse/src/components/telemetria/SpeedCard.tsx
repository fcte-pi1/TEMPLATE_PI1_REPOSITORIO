import { TelemetryCard } from "./TelemetryCard";
import Arrowleft from '../../../assets/arrowleft.svg'
interface SpeedCardProps {
  speed: number;
}

export function SpeedCard({
  speed,
}: SpeedCardProps) {
  return (
    <TelemetryCard title="Velocidade média" icon={<img src={Arrowleft}/>}>
      <div className="flex min-w-0 items-baseline overflow-hidden">
        <strong className="truncate text-2xl font-bold text-white sm:text-3xl md:text-[34px]">
          {speed.toFixed(3)}
        </strong>

        <span className="ml-1.5 shrink-0 text-sm text-[#9CA3AF]">
          m/s
        </span>

        
      </div>
    </TelemetryCard>
  );
}