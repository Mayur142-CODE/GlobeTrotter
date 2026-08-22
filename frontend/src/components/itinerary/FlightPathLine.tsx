import { useEffect, useRef, useState } from 'react';
import { Plane, MapPin } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export interface FlightPathStop {
  id: string;
  label: string;
  sublabel?: string;
}

interface FlightPathLineProps {
  stops: FlightPathStop[];
  className?: string;
  variant?: 'light' | 'dark';
}

export function FlightPathLine({ stops, className, variant = 'light' }: FlightPathLineProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setAnimated(true);
      return;
    }
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (stops.length === 0) return null;
  if (stops.length === 1) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <MapPin className={variant === 'dark' ? 'w-5 h-5 text-gold' : 'w-5 h-5 text-teal'} />
        <span className={cn('font-serif text-lg', variant === 'dark' ? 'text-parchment-50' : 'text-midnight')}>
          {stops[0].label}
        </span>
      </div>
    );
  }

  const lineColor = variant === 'dark' ? '#D8A93E' : '#1F8A83';
  const textColor = variant === 'dark' ? 'text-parchment-50' : 'text-midnight';
  const subTextColor = variant === 'dark' ? 'text-parchment-200' : 'text-ink/60';

  if (isMobile) {
    return (
      <div ref={containerRef} className={cn('flex flex-col items-center gap-0', className)}>
        {stops.map((stop, i) => (
          <div key={stop.id} className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <div className={cn('w-3 h-3 rounded-full border-2', variant === 'dark' ? 'bg-gold border-gold' : 'bg-teal border-teal')} />
              <div className="text-center">
                <p className={cn('font-serif text-base font-semibold', textColor)}>{stop.label}</p>
                {stop.sublabel && <p className={cn('font-mono text-xs', subTextColor)}>{stop.sublabel}</p>}
              </div>
            </div>
            {i < stops.length - 1 && (
              <svg width="2" height="48" className="overflow-visible">
                <line
                  x1="1"
                  y1="0"
                  x2="1"
                  y2="48"
                  stroke={lineColor}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  style={{
                    strokeDashoffset: animated ? 0 : 52,
                    transition: 'stroke-dashoffset 0.8s ease-out',
                  }}
                />
                <g
                  style={{
                    transform: animated ? 'translate(1px, 24px) rotate(90deg)' : 'translate(1px, 0) rotate(90deg)',
                    opacity: animated ? 1 : 0,
                    transition: 'transform 0.6s ease-out 0.3s, opacity 0.4s ease-out 0.3s',
                  }}
                >
                  <Plane className="w-4 h-4" style={{ color: lineColor, transform: 'translate(-50%, -50%)' }} fill={lineColor} />
                </g>
              </svg>
            )}
          </div>
        ))}
      </div>
    );
  }

  const segmentWidth = 140;

  return (
    <div ref={containerRef} className={cn('flex items-center justify-center overflow-x-auto scrollbar-thin', className)}>
      {stops.map((stop, i) => (
        <div key={stop.id} className="flex items-center shrink-0">
          <div className="flex flex-col items-center text-center min-w-[80px]">
            <div className={cn('w-3 h-3 rounded-full border-2 mb-1.5', variant === 'dark' ? 'bg-gold border-gold' : 'bg-teal border-teal')} />
            <p className={cn('font-serif text-sm font-semibold whitespace-nowrap', textColor)}>{stop.label}</p>
            {stop.sublabel && <p className={cn('font-mono text-xs whitespace-nowrap', subTextColor)}>{stop.sublabel}</p>}
          </div>
          {i < stops.length - 1 && (
            <svg width={segmentWidth} height="24" className="overflow-visible mx-1">
              <line
                x1="0"
                y1="12"
                x2={segmentWidth}
                y2="12"
                stroke={lineColor}
                strokeWidth="2"
                strokeDasharray="5 5"
                style={{
                  strokeDashoffset: animated ? 0 : segmentWidth,
                  transition: 'stroke-dashoffset 0.8s ease-out',
                }}
              />
              <g
                style={{
                  transform: animated ? `translate(${segmentWidth / 2}px, 12px)` : `translate(0, 12px)`,
                  opacity: animated ? 1 : 0,
                  transition: 'transform 0.6s ease-out 0.3s, opacity 0.4s ease-out 0.3s',
                }}
              >
                <Plane className="w-4 h-4" style={{ color: lineColor, transform: 'translate(-50%, -50%)' }} fill={lineColor} />
              </g>
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}
