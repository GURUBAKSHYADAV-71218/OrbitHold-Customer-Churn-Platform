import type { RiskLevel } from "@/lib/types";

const COLORS: Record<RiskLevel, string> = {
  LOW: "#557C78",
  MEDIUM: "#C49A45",
  HIGH: "#9B4D3A",
};

export default function RiskGauge({
  score,
  level,
}: {
  score: number; // 0-100
  level: RiskLevel;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const angle = (clamped / 100) * 180; // 0..180 degrees across the semicircle
  const radius = 80;
  const cx = 100;
  const cy = 100;

  const polarToCartesian = (deg: number) => {
    const rad = ((180 - deg) * Math.PI) / 180;
    return { x: cx - radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  };

  const start = polarToCartesian(0);
  const end = polarToCartesian(angle);
  const largeArc = angle > 180 ? 1 : 0;

  return (
    <div className="flex flex-col items-center" role="img" aria-label={`Churn risk score ${clamped} out of 100, ${level} risk`}>
      <svg viewBox="0 0 200 115" className="w-56">
        {/* track */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(42,33,27,0.1)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* value arc */}
        <path
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`}
          fill="none"
          stroke={COLORS[level]}
          strokeWidth="14"
          strokeLinecap="round"
        />
      </svg>
      <div className="-mt-8 text-center">
        <div className="font-display text-4xl text-espresso">{clamped}</div>
        <div className="text-xs uppercase tracking-wide text-espresso/50">Risk Score / 100</div>
      </div>
    </div>
  );
}
