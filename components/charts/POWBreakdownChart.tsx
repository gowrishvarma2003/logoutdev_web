'use client';

import { useMemo, memo, CSSProperties } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Zap } from 'lucide-react';

export interface POWBreakdownChartProps {
  breakdown: {
    commits: number;
    projects: number;
    community: number;
    consistency: number;
    quality: number;
  };
  totalScore: number;
  className?: string;
}

// Color scheme for POW categories - consistent with brand palette
const COLORS = {
  commits: '#10b981', // emerald
  projects: '#0ea5e9', // sky
  community: '#8b5cf6', // violet
  consistency: '#f59e0b', // amber
  quality: '#f43f5e', // rose
};

const CATEGORY_LABELS: Record<string, string> = {
  commits: 'Commits',
  projects: 'Projects',
  community: 'Community',
  consistency: 'Consistency',
  quality: 'Quality',
};

/**
 * Custom tooltip for POW breakdown chart
 * Shows category, points, and percentage contribution
 */
interface CustomTooltipProps { 
  active?: boolean; 
  payload?: Array<{ payload: { name: string; value: number; total: number } }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = ((data.value / data.total) * 100).toFixed(1);

    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-lg">
        <p className="text-zinc-100 font-semibold text-sm">{data.name}</p>
        <p className="text-zinc-300 text-sm mt-1">
          Points: <span className="font-bold text-blue-400">{data.value}</span>
        </p>
        <p className="text-zinc-300 text-sm">
          Contribution:{' '}
          <span className="font-bold text-amber-400">{percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

/**
 * Custom label renderer for pie chart
 * Displays percentage inside the pie segments
 */
interface LabelEntry { 
  name?: string; 
  value?: number; 
  total?: number; 
  percent?: number; 
}

const renderCustomLabel = (entry: LabelEntry) => {
  if (entry.percent !== undefined) {
    return `${(entry.percent * 100).toFixed(0)}%`;
  }
  if (!entry.value) return '0%';
  const total = entry.total || 100;
  const percentage = ((entry.value / total) * 100).toFixed(0);
  return `${percentage}%`;
};

function POWBreakdownChartComponent({
  breakdown,
  totalScore,
  className = '',
}: POWBreakdownChartProps) {
  // Transform breakdown data into chart format
  const chartData = useMemo(() => {
    const data = [
      { key: 'commits', name: 'Commits', value: breakdown.commits },
      { key: 'projects', name: 'Projects', value: breakdown.projects },
      { key: 'community', name: 'Community', value: breakdown.community },
      {
        key: 'consistency',
        name: 'Consistency',
        value: breakdown.consistency,
      },
      { key: 'quality', name: 'Quality', value: breakdown.quality },
    ]
      .filter((item) => item.value > 0) // Only show categories with points
      .map((item) => ({
        ...item,
        total: totalScore,
      }));

    return data;
  }, [breakdown, totalScore]);

  // Get colors for the data
  const segmentColors = useMemo(
    () =>
      chartData.map((item) => COLORS[item.key as keyof typeof COLORS] || '#999'),
    [chartData]
  );

  // Memoize container style
  const containerStyle: CSSProperties = useMemo(
    () => ({
      width: '100%',
      height: '320px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    []
  );

  if (chartData.length === 0 || totalScore === 0) {
    return (
      <div
        className={`flex items-center justify-center h-96 bg-zinc-900/50 rounded-lg border border-zinc-800 ${className}`}
      >
        <div className="text-center">
          <Zap className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-400">No POW breakdown data available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full bg-zinc-900/50 rounded-lg border border-zinc-800 p-6 ${className}`}
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          POW Score Breakdown
        </h3>
        <p className="text-sm text-zinc-400 mt-1">
          Category contribution to your total score
        </p>
      </div>

      {/* Chart and Legend Container */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Pie Chart */}
        <div style={containerStyle} className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
                label={(entry) => renderCustomLabel(entry)}
                labelLine={false}
              >
                {/* Render colored segments */}
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={segmentColors[index]} />
                ))}
              </Pie>

              {/* Center text showing total score */}
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="central"
              >
                <tspan
                  x="50%"
                  dy="-8px"
                  fontSize="14"
                  fill="#a1a1aa"
                  fontWeight="500"
                >
                  Total Score
                </tspan>
                <tspan
                  x="50%"
                  dy="20px"
                  fontSize="24"
                  fill="#fbbf24"
                  fontWeight="bold"
                >
                  {totalScore}
                </tspan>
              </text>

              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend with Details */}
        <div className="flex-1 lg:min-w-xs">
          <div className="space-y-3">
            {chartData.map((item, index) => {
              const percentage = (
                (item.value / totalScore) *
                100
              ).toFixed(1);
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Color indicator */}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: segmentColors[index] }}
                    />
                    {/* Category name and percentage */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-100">
                        {item.name}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {percentage}% of total
                      </p>
                    </div>
                  </div>
                  {/* Points */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-blue-400">
                      {item.value}
                    </p>
                    <p className="text-xs text-zinc-500">pts</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-6 border-t border-zinc-700">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-400">Categories</span>
                <span className="text-sm font-semibold text-zinc-100">
                  {chartData.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-400">Average per Category</span>
                <span className="text-sm font-semibold text-zinc-100">
                  {Math.round(totalScore / chartData.length)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-400">Highest Category</span>
                <span className="text-sm font-semibold text-zinc-100">
                  {chartData.reduce((max, item) =>
                    item.value > max.value ? item : max
                  ).name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap with memo for performance optimization
// Only re-renders when breakdown or totalScore actually changes
export default memo(
  POWBreakdownChartComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.className === nextProps.className &&
      prevProps.totalScore === nextProps.totalScore &&
      prevProps.breakdown.commits === nextProps.breakdown.commits &&
      prevProps.breakdown.projects === nextProps.breakdown.projects &&
      prevProps.breakdown.community === nextProps.breakdown.community &&
      prevProps.breakdown.consistency === nextProps.breakdown.consistency &&
      prevProps.breakdown.quality === nextProps.breakdown.quality
    );
  }
);
