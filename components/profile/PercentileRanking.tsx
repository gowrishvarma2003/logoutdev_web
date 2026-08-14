'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUpIcon } from '@/components/ui/Icons';

interface PercentileRankingProps {
  percentile: number;
  totalUsers: number;
  rank: number;
}

const getRankBadge = (
  percentile: number
): {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
} => {
  if (percentile >= 99)
    return {
      label: 'Top 1%',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-400',
    };
  if (percentile >= 95)
    return {
      label: 'Top 5%',
      color: 'from-emerald-500 to-cyan-500',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-400',
    };
  if (percentile >= 90)
    return {
      label: 'Top 10%',
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-500/10',
      textColor: 'text-violet-400',
    };
  if (percentile >= 75)
    return {
      label: 'Top 25%',
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-500/10',
      textColor: 'text-cyan-400',
    };
  if (percentile >= 50)
    return {
      label: 'Above Average',
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-400',
    };
  return {
    label: 'Average',
    color: 'from-zinc-500 to-slate-500',
    bgColor: 'bg-zinc-500/10',
    textColor: 'text-zinc-400',
  };
};

const generateBellCurveData = (
  userPercentile: number,
  points: number = 60
) => {
  const data = [];
  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * 100;
    // Standard normal distribution (bell curve)
    const mean = 50;
    const stdDev = 20;
    const z = (x - mean) / stdDev;
    const y = Math.exp((-z * z) / 2) * 100;

    data.push({
      x,
      y,
      isUser: Math.abs(x - userPercentile) < 1.5,
    });
  }
  return data;
};

export default function PercentileRanking({
  percentile,
  totalUsers,
  rank,
}: PercentileRankingProps) {
  const badge = getRankBadge(percentile);
  const bellCurveData = useMemo(
    () => generateBellCurveData(percentile),
    [percentile]
  );

  const percentageAbove = Math.round((100 - percentile) * 100) / 100;
  const rankDisplay = Math.max(
    1,
    Math.round((percentile / 100) * totalUsers)
  );

  return (
    <div className="w-full space-y-6">
      {/* ── Header with Rank Badge ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 mb-1">
            Your Percentile Rank
          </h2>
          <p className="text-sm text-zinc-500">
            Compared to {totalUsers.toLocaleString()} developers on the platform
          </p>
        </div>
        <div
          className={`px-4 py-2 rounded-lg border border-current/30 ${badge.bgColor}`}
        >
          <p className={`text-sm font-bold ${badge.textColor}`}>
            {badge.label}
          </p>
        </div>
      </div>

      {/* ── Main Percentile Display ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Percentile Score */}
        <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 rounded-xl border border-zinc-700/50 p-6">
          <p className="text-xs text-zinc-500 font-medium mb-2">PERCENTILE</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-violet-400 bg-clip-text text-transparent">
              {percentile.toFixed(1)}
            </span>
            <span className="text-zinc-400 text-sm">%</span>
          </div>
          <p className="text-xs text-zinc-600 mt-3">
            Better than {percentageAbove.toFixed(1)}% of developers
          </p>
        </div>

        {/* Ranking Info */}
        <div className="bg-gradient-to-br from-violet-900/20 to-emerald-900/20 rounded-xl border border-emerald-500/20 p-6">
          <p className="text-xs text-zinc-500 font-medium mb-2">RANK</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-emerald-400">
              #{rankDisplay}
            </span>
          </div>
          <p className="text-xs text-zinc-600 mt-3">
            Out of {totalUsers.toLocaleString()} developers
          </p>
        </div>
      </div>

      {/* ── Bell Curve Visualization ── */}
      <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUpIcon className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-zinc-100">
            Distribution Curve
          </h3>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={bellCurveData}>
            <defs>
              <linearGradient id="bellGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient
                id="userGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#3f3f46"
              vertical={false}
            />
            <XAxis
              dataKey="x"
              stroke="#71717a"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
              label={{ value: 'Percentile', position: 'insideBottomRight', offset: -5 }}
            />
            <YAxis
              stroke="#71717a"
              style={{ fontSize: '12px' }}
              hide={true}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '8px',
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              labelStyle={{ color: '#a1a1aa' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => typeof value === 'number' ? `${value.toFixed(1)}` : '0'}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              labelFormatter={(label: unknown) => `${typeof label === 'number' ? label.toFixed(1) : '0'}%`}
            />
            <Area
              type="monotone"
              dataKey="y"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#bellGradient)"
              isAnimationActive={true}
              animationDuration={800}
            />
            {/* User position indicator */}
            <Area
              type="monotone"
              dataKey={(entry) => (entry.isUser ? entry.y : null)}
              stroke="#a855f7"
              strokeWidth={3}
              fill="url(#userGradient)"
              isAnimationActive={true}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-700/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"></div>
            <span className="text-xs text-zinc-400">Developer Distribution</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-400 to-violet-500"></div>
            <span className="text-xs text-zinc-400">Your Position</span>
          </div>
        </div>
      </div>

      {/* ── Comparison with Average ── */}
      <div className="bg-gradient-to-r from-emerald-500/5 to-violet-500/5 rounded-lg border border-emerald-500/20 p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Average Developer</span>
            <span className="text-sm font-semibold text-zinc-300">50th %ile</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-gradient-to-r from-zinc-600 to-zinc-500"></div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-emerald-400 font-medium">You</span>
            <span className="text-sm font-semibold text-emerald-400">
              {percentile.toFixed(1)}th %ile
            </span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-violet-500"
              style={{ width: `${percentile}%` }}
            ></div>
          </div>
        </div>
        <p className="text-xs text-zinc-600 mt-4">
          You&rsquo;re{' '}
          <span className="text-emerald-400 font-medium">
            {Math.round(percentile - 50)} percentile points
          </span>{' '}
          {percentile > 50 ? 'ahead' : 'behind'} the average developer.
        </p>
      </div>

      {/* ── Insights ── */}
      <div className="bg-zinc-900/50 rounded-lg border border-zinc-700/50 p-4 space-y-2">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
          Key Insights
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-1">•</span>
            <span className="text-xs text-zinc-400">
              Your profile ranks higher than{' '}
              <span className="text-emerald-400 font-medium">{percentageAbove.toFixed(1)}%</span> of the
              developer community
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-400 mt-1">•</span>
            <span className="text-xs text-zinc-400">
              Based on proof-of-work score, activity level, and engagement metrics
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-1">•</span>
            <span className="text-xs text-zinc-400">
              Rankings update weekly based on recent contributions
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
