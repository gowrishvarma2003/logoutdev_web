'use client';

interface ChartSkeletonProps {
  className?: string;
  type?: 'radar' | 'bar' | 'line' | 'pie';
}

export default function ChartSkeleton({
  className = '',
  type = 'radar',
}: ChartSkeletonProps) {
  const getSkeletonContent = () => {
    switch (type) {
      case 'radar':
        return (
          <svg className="w-full h-full" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
            {/* Concentric circles */}
            {[100, 67, 34].map((r, i) => (
              <circle
                key={`circle-${i}`}
                cx="150"
                cy="150"
                r={r}
                fill="none"
                stroke="currentColor"
                className="text-zinc-700/40 animate-pulse"
                strokeWidth="1"
              />
            ))}
            {/* Radar lines */}
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x2 = 150 + 100 * Math.cos(rad);
              const y2 = 150 + 100 * Math.sin(rad);
              return (
                <line
                  key={`line-${angle}`}
                  x1="150"
                  y1="150"
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  className="text-zinc-700/40 animate-pulse"
                  strokeWidth="1"
                />
              );
            })}
          </svg>
        );
      case 'bar':
        return (
          <div className="flex items-end justify-around h-full gap-2 px-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-zinc-700 rounded-t animate-pulse"
                style={{
                  height: `${30 + i * 15}%`,
                  opacity: 0.5 + (i * 0.1),
                }}
              />
            ))}
          </div>
        );
      case 'line':
        return (
          <svg className="w-full h-full" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <polyline
              points="0,100 50,70 100,90 150,40 200,60 250,30 300,50"
              fill="none"
              stroke="currentColor"
              className="text-zinc-700/50 animate-pulse"
              strokeWidth="2"
            />
            {/* Points on line */}
            {[0, 50, 100, 150, 200, 250, 300].map((x, i) => {
              const points = [100, 70, 90, 40, 60, 30, 50];
              return (
                <circle
                  key={`point-${i}`}
                  cx={x}
                  cy={points[i]}
                  r="4"
                  fill="currentColor"
                  className="text-zinc-700/60 animate-pulse"
                />
              );
            })}
          </svg>
        );
      case 'pie':
        return (
          <div className="flex items-center justify-center h-full">
            <svg className="w-40 h-40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              {/* Pie segments */}
              {[0, 90, 180, 270].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const x = 50 + 40 * Math.cos(rad);
                const y = 50 + 40 * Math.sin(rad);
                return (
                  <circle
                    key={`pie-seg-${i}`}
                    cx="50"
                    cy="50"
                    r={35}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="15"
                    strokeDasharray="55 220"
                    strokeDashoffset={-angle}
                    className="text-zinc-700 animate-pulse"
                    opacity={0.4 + (i * 0.15)}
                  />
                );
              })}
              {/* Center circle */}
              <circle cx="50" cy="50" r="15" fill="currentColor" className="text-zinc-900/80" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`w-full bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 flex items-center justify-center overflow-hidden ${className}`}
    >
      <style>{`
        @keyframes pulse-fade {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .animate-pulse {
          animation: pulse-fade 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      {getSkeletonContent()}
    </div>
  );
}
