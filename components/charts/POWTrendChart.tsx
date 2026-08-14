'use client';

import { useMemo, useState } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
  ComposedChart,
  Line,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export interface POWTrendChartProps {
  history: Array<{
    date: string;
    score: number;
    milestone?: string;
  }>;
  className?: string;
}

type TimePeriod = '30d' | '60d' | '90d' | 'all';

const TIME_PERIODS: Record<TimePeriod, { label: string; days: number }> = {
  '30d': { label: '30 Days', days: 30 },
  '60d': { label: '60 Days', days: 60 },
  '90d': { label: '90 Days', days: 90 },
  all: { label: 'All Time', days: Infinity },
};

/**
 * Generate mock POW history data for testing/demo purposes
 * Creates realistic score progression with milestones over 90 days
 */
export function generateMockPOWHistory(days: number = 90) {
  const history: Array<{
    date: string;
    score: number;
    milestone?: string;
  }> = [];

  let currentScore = 450;
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Simulate realistic POW progression with daily variations
    const dailyChange = (Math.random() - 0.4) * 50; // Slight upward bias
    currentScore = Math.max(100, currentScore + dailyChange);

    let milestone: string | undefined;

    // Add milestones at realistic points
    if (i === 85) milestone = 'Bronze Badge 🥉';
    if (i === 60) {
      currentScore += 100;
      milestone = 'Rank: Contributor 📈';
    }
    if (i === 30) {
      currentScore += 150;
      milestone = 'Silver Badge 🥈';
    }
    if (i === 5) {
      currentScore += 200;
      milestone = 'Gold Badge 🥇';
    }

    history.push({
      date: dateStr,
      score: Math.round(currentScore),
      milestone,
    });
  }

  return history;
}

/**
 * Custom tooltip to show score, date, and milestone information
 */
interface TrendDataPoint { 
  date: string; 
  score: number; 
  milestone?: string;
}

interface TrendTooltipProps { 
  active?: boolean; 
  payload?: Array<{ payload: TrendDataPoint }>;
  label?: string; 
}

const CustomTooltip = ({ active, payload }: TrendTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-lg">
        <p className="text-zinc-300 text-sm">
          {new Date(data.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        <p className="text-purple-400 font-semibold text-sm">
          POW Score: {data.score}
        </p>
        {data.milestone && (
          <p className="text-amber-400 text-sm mt-1">{data.milestone}</p>
        )}
      </div>
    );
  }
  return null;
};

/**
 * Custom dot renderer to highlight milestones
 */
interface MilestoneDotProps { cx?: number; cy?: number; fill?: string; [key: string]: unknown; }

const MilestoneDot = (props: MilestoneDotProps) => {
  const { cx, cy, payload } = props;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any
  if (!payload || typeof payload !== 'object' || !('milestone' in payload) || !(payload as any).milestone) {
    return null; // Don't render dots for non-milestone points
  }

  return (
    <g>
      {/* Outer glow ring */}
      <circle cx={cx} cy={cy} r={6} fill="none" stroke="#facc15" strokeWidth={2} opacity={0.6} />
      {/* Main dot */}
      <circle cx={cx} cy={cy} r={4} fill="#facc15" stroke="#fbbf24" strokeWidth={1} />
    </g>
  );
};

function POWTrendChartComponent({
  history,
  className = '',
}: POWTrendChartProps) {
  const [period, setPeriod] = useState<TimePeriod>('90d');

  // Filter history based on selected period
  const filteredData = useMemo(() => {
    if (period === 'all') return history;

    const days = TIME_PERIODS[period].days;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return history.filter((item) => new Date(item.date) >= cutoffDate);
  }, [history, period]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredData.length === 0)
      return { min: 0, max: 0, avg: 0, current: 0, change: 0 };

    const scores = filteredData.map((d) => d.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const current = scores[scores.length - 1];
    const previous = scores[0];
    const change = current - previous;

    return { min, max, avg, current, change };
  }, [filteredData]);

  if (history.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <TrendingUp className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-400">No POW history data available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full bg-zinc-900/50 rounded-lg border border-zinc-800 p-6 ${className}`}
    >
      {/* Header with title and period selector */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            POW Score Trend
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            Your productivity score progression over time
          </p>
        </div>

        {/* Time period buttons */}
        <div className="flex gap-2">
          {(Object.entries(TIME_PERIODS) as Array<
            [TimePeriod, { label: string; days: number }]
          >).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                period === key
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-800/50 rounded p-3">
          <p className="text-xs text-zinc-400 uppercase tracking-wide">Current</p>
          <p className="text-xl font-bold text-purple-400 mt-1">
            {stats.current}
          </p>
        </div>
        <div className="bg-zinc-800/50 rounded p-3">
          <p className="text-xs text-zinc-400 uppercase tracking-wide">Average</p>
          <p className="text-xl font-bold text-blue-400 mt-1">{stats.avg}</p>
        </div>
        <div className="bg-zinc-800/50 rounded p-3">
          <p className="text-xs text-zinc-400 uppercase tracking-wide">Peak</p>
          <p className="text-xl font-bold text-amber-400 mt-1">{stats.max}</p>
        </div>
        <div className="bg-zinc-800/50 rounded p-3">
          <p className="text-xs text-zinc-400 uppercase tracking-wide">Change</p>
          <p
            className={`text-xl font-bold mt-1 ${
              stats.change >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {stats.change >= 0 ? '+' : ''}{stats.change}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: '320px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={filteredData}
            margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
          >
            <defs>
              <linearGradient id="gradientPOW" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#3f3f46"
              className="opacity-50"
            />

            <XAxis
              dataKey="date"
              tick={{ fill: '#a1a1aa', fontSize: 12 }}
              tickFormatter={(date: string) => {
                const d = new Date(date);
                return d.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
              interval={
                filteredData.length > 30
                  ? Math.floor(filteredData.length / 6)
                  : 0
              }
              stroke="#52525b"
            />

            <YAxis
              tick={{ fill: '#a1a1aa', fontSize: 12 }}
              stroke="#52525b"
              domain={['dataMin - 20', 'dataMax + 20']}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              wrapperStyle={{ paddingTop: '20px', color: '#a1a1aa' }}
            />

            {/* POW score line with gradient */}
            <Line
              type="monotone"
              dataKey="score"
              stroke="#a855f7"
              strokeWidth={3}
              fill="url(#gradientPOW)"
              dot={false}
              isAnimationActive={true}
              animationDuration={600}
              animationEasing="ease-out"
              name="POW Score"
            />

            {/* Milestone markers */}
            {filteredData.map((point, idx) => {
              if (!point.milestone) return null;
              return (
                <ReferenceDot
                  key={`milestone-${idx}`}
                  x={point.date}
                  y={point.score}
                  r={6}
                  fill="#facc15"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  shape={<MilestoneDot />}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Milestones legend */}
      {filteredData.some((d) => d.milestone) && (
        <div className="mt-6 pt-6 border-t border-zinc-800">
          <p className="text-sm font-semibold text-zinc-300 mb-3">Milestones</p>
          <div className="grid grid-cols-2 gap-3">
            {filteredData
              .filter((d) => d.milestone)
              .map((d, idx) => (
              <div
                key={`legend-${idx}`}
                className="flex items-center gap-2 text-sm"
              >
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-zinc-300">{d.milestone}</span>
                <span className="text-zinc-500 ml-auto">
                  {new Date(d.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap component with React.memo for performance optimization
// Only re-renders when history prop actually changes
export default POWTrendChartComponent;
