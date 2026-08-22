import { useEffect, useState } from 'react';
import type { BudgetLineItem } from '@/types/budget';

interface BudgetChartProps {
  lineItems: BudgetLineItem[];
  size?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Transport: '#1F8A83',
  Accommodation: '#16233A',
  Activities: '#D8A93E',
  Meals: '#F0664B',
  Misc: '#56719E',
};

export function BudgetChart({ lineItems, size = 200 }: BudgetChartProps) {
  const [animated, setAnimated] = useState(false);
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;
  const strokeWidth = 28;
  const innerRadius = radius - strokeWidth;

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setAnimated(true);
      return;
    }
    const t = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(t);
  }, []);

  const total = lineItems.reduce((sum, item) => sum + item.percentage, 0) || 1;
  let cumulativeAngle = -90;

  const segments = lineItems.map((item) => {
    const angle = (item.percentage / total) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    return {
      ...item,
      path: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${centerX} ${centerY} Z`,
      color: CATEGORY_COLORS[item.category] ?? '#56719E',
      startAngle,
      endAngle,
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {segments.map((seg, i) => {
          const midAngle = (seg.startAngle + seg.endAngle) / 2;
          const midRad = (midAngle * Math.PI) / 180;
          const scale = animated ? 1 : 0;
          const tx = centerX + (1 - scale) * 10 * Math.cos(midRad);
          const ty = centerY + (1 - scale) * 10 * Math.sin(midRad);

          return (
            <g
              key={seg.category}
              style={{
                transform: `translate(${tx - centerX}px, ${ty - centerY}px) scale(${scale})`,
                transformOrigin: `${centerX}px ${centerY}px`,
                opacity: animated ? 1 : 0,
                transition: `transform 0.6s ease-out ${i * 0.12}s, opacity 0.4s ease-out ${i * 0.12}s`,
              }}
            >
              <path d={seg.path} fill={seg.color} stroke="#FAF3E7" strokeWidth={2} />
            </g>
          );
        })}
        <circle cx={centerX} cy={centerY} r={innerRadius} fill="#FAF3E7" />
      </svg>

      <div className="flex-1 space-y-2 w-full">
        {segments.map((seg) => (
          <div key={seg.category} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="font-sans text-sm text-midnight truncate">{seg.category}</span>
            </div>
            <span className="ticket-mono text-sm text-ink/60 shrink-0">{seg.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
