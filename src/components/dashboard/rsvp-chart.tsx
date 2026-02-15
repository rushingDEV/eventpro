"use client";

interface RsvpChartProps {
  confirmed: number;
  pending: number;
  declined: number;
}

export function RsvpChart({ confirmed, pending, declined }: RsvpChartProps) {
  const total = confirmed + pending + declined;
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        אין מוזמנים עדיין
      </div>
    );
  }

  const radius = 60;
  const stroke = 18;
  const center = 80;
  const circumference = 2 * Math.PI * radius;

  const confirmedPct = confirmed / total;
  const pendingPct = pending / total;
  const declinedPct = declined / total;

  const confirmedLen = confirmedPct * circumference;
  const pendingLen = pendingPct * circumference;
  const declinedLen = declinedPct * circumference;

  const confirmedOffset = 0;
  const pendingOffset = -confirmedLen;
  const declinedOffset = -(confirmedLen + pendingLen);

  const items = [
    { label: "אישרו", count: confirmed, pct: confirmedPct, color: "#22c55e" },
    { label: "ממתינים", count: pending, pct: pendingPct, color: "#eab308" },
    { label: "לא מגיעים", count: declined, pct: declinedPct, color: "#ef4444" },
  ];

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0">
        <svg width={center * 2} height={center * 2} viewBox={`0 0 ${center * 2} ${center * 2}`}>
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="oklch(0.92 0.01 80)"
            strokeWidth={stroke}
          />
          {/* Confirmed (green) */}
          {confirmedLen > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#22c55e"
              strokeWidth={stroke}
              strokeDasharray={`${confirmedLen} ${circumference - confirmedLen}`}
              strokeDashoffset={confirmedOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
            />
          )}
          {/* Pending (yellow) */}
          {pendingLen > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#eab308"
              strokeWidth={stroke}
              strokeDasharray={`${pendingLen} ${circumference - pendingLen}`}
              strokeDashoffset={pendingOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
            />
          )}
          {/* Declined (red) */}
          {declinedLen > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#ef4444"
              strokeWidth={stroke}
              strokeDasharray={`${declinedLen} ${circumference - declinedLen}`}
              strokeDashoffset={declinedOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black">{total}</span>
          <span className="text-xs text-muted-foreground">מוזמנים</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            <div
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-bold mr-auto" dir="ltr">
              {item.count}
            </span>
            <span className="text-xs text-muted-foreground" dir="ltr">
              ({Math.round(item.pct * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
