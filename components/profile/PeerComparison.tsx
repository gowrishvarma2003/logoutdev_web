'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { UsersIcon } from '@/components/ui/Icons';

interface PeerComparisonProps {
  userStats: { commits: number; projects: number; engagement: number };
  averageStats: { commits: number; projects: number; engagement: number };
}

const calculatePercentage = (userValue: number, averageValue: number): number => {
  if (averageValue === 0) return 0;
  return Math.round(((userValue - averageValue) / averageValue) * 100);
};

const calculatePercentileBeat = (
  userValue: number,
  averageValue: number
): number => {
  // Estimate: if user is X% higher than average, they beat roughly (50 + X/2)% of developers
  const percentDiff = calculatePercentage(userValue, averageValue);
  const baseBeat = 50; // Average is 50th percentile
  return Math.max(1, Math.min(99, baseBeat + Math.round(percentDiff / 2)));
};

export default function PeerComparison({
  userStats,
  averageStats,
}: PeerComparisonProps) {
  const chartData = useMemo(() => {
    return [
      {
        metric: 'Commits',
        user: userStats.commits,
        average: averageStats.commits,
        fill: 'url(#userGradient)',
        avgFill: 'url(#avgGradient)',
      },
      {
        metric: 'Projects',
        user: userStats.projects,
        average: averageStats.projects,
        fill: 'url(#userGradient)',
        avgFill: 'url(#avgGradient)',
      },
      {
        metric: 'Engagement',
        user: userStats.engagement,
        average: averageStats.engagement,
        fill: 'url(#userGradient)',
        avgFill: 'url(#avgGradient)',
      },
    ];
  }, [userStats, averageStats]);

  const commitsPercentile = useMemo(() => {
    const diff = calculatePercentage(userStats.commits, averageStats.commits);
    return calculatePercentileBeat(userStats.commits, averageStats.commits);
  }, [userStats, averageStats]);

  const projectsPercentile = useMemo(() => {
    return calculatePercentileBeat(userStats.projects, averageStats.projects);
  }, [userStats, averageStats]);

  const engagementPercentile = useMemo(() => {
    return calculatePercentileBeat(userStats.engagement, averageStats.engagement);
  }, [userStats, averageStats]);

  const overallPercentile = Math.round(
    (commitsPercentile + projectsPercentile + engagementPercentile) / 3
  );

  const commitsPercentDiff = calculatePercentage(
    userStats.commits,
    averageStats.commits
  );
  const projectsPercentDiff = calculatePercentage(
    userStats.projects,
    averageStats.projects
  );
  const engagementPercentDiff = calculatePercentage(
    userStats.engagement,
    averageStats.engagement
  );

  return (
    <div className="w-full space-y-6">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <UsersIcon className="w-4 h-4 text-emerald-400" />
          <h2 className="text-lg font-bold text-zinc-100">
            Peer Comparison
          </h2>
        </div>
        <p className="text-sm text-zinc-500">
          How your profile compares with similar developers
        </p>
      </div>

      {/* ── Overall Percentile Highlight ── */}
      <div className="bg-gradient-to-r from-emerald-900/30 to-violet-900/30 rounded-lg border border-emerald-500/30 p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-zinc-500 font-medium mb-1">
              OVERALL PEER PERFORMANCE
            </p>
            <p className="text-sm text-zinc-300">
              YouYou&rsquo;re beatingrsquo;re beating more developers than average
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-1 justify-end mb-1">
              <span className="text-3xl font-bold text-emerald-400">
                {overallPercentile}
              </span>
              <span className="text-zinc-500 text-sm">%ile</span>
            </div>
            <p className="text-xs text-zinc-600">
              Better than {overallPercentile}% of developers
            </p>
          </div>
        </div>
      </div>

      {/* ── Detailed Comparison Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Commits */}
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-700/50 p-4">
          <p className="text-xs text-zinc-500 font-medium mb-3 uppercase tracking-wide">
            Commits
          </p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-zinc-400">You</span>
                <span className="text-sm font-bold text-emerald-400">
                  {userStats.commits}
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-violet-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (userStats.commits /
                        Math.max(userStats.commits, averageStats.commits)) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-zinc-400">Average</span>
                <span className="text-sm font-medium text-zinc-400">
                  {averageStats.commits}
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-zinc-600 to-slate-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (averageStats.commits /
                        Math.max(userStats.commits, averageStats.commits)) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-700/50">
            <p className={`text-xs font-medium ${
              commitsPercentDiff >= 0 ? 'text-emerald-400' : 'text-orange-400'
            }`}>
              {commitsPercentDiff >= 0 ? '+' : ''}{commitsPercentDiff}% vs average
            </p>
            <p className="text-xs text-zinc-600">
              {commitsPercentile}%ile ranking
            </p>
          </div>
        </div>

        {/* Projects */}
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-700/50 p-4">
          <p className="text-xs text-zinc-500 font-medium mb-3 uppercase tracking-wide">
            Projects
          </p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-zinc-400">You</span>
                <span className="text-sm font-bold text-emerald-400">
                  {userStats.projects}
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-violet-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (userStats.projects /
                        Math.max(userStats.projects, averageStats.projects)) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-zinc-400">Average</span>
                <span className="text-sm font-medium text-zinc-400">
                  {averageStats.projects}
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-zinc-600 to-slate-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (averageStats.projects /
                        Math.max(userStats.projects, averageStats.projects)) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-700/50">
            <p className={`text-xs font-medium ${
              projectsPercentDiff >= 0 ? 'text-emerald-400' : 'text-orange-400'
            }`}>
              {projectsPercentDiff >= 0 ? '+' : ''}{projectsPercentDiff}% vs average
            </p>
            <p className="text-xs text-zinc-600">
              {projectsPercentile}%ile ranking
            </p>
          </div>
        </div>

        {/* Engagement */}
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-700/50 p-4">
          <p className="text-xs text-zinc-500 font-medium mb-3 uppercase tracking-wide">
            Engagement
          </p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-zinc-400">You</span>
                <span className="text-sm font-bold text-emerald-400">
                  {userStats.engagement}
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-violet-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (userStats.engagement /
                        Math.max(userStats.engagement, averageStats.engagement)) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-zinc-400">Average</span>
                <span className="text-sm font-medium text-zinc-400">
                  {averageStats.engagement}
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-zinc-600 to-slate-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (averageStats.engagement /
                        Math.max(userStats.engagement, averageStats.engagement)) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-700/50">
            <p className={`text-xs font-medium ${
              engagementPercentDiff >= 0 ? 'text-emerald-400' : 'text-orange-400'
            }`}>
              {engagementPercentDiff >= 0 ? '+' : ''}{engagementPercentDiff}% vs average
            </p>
            <p className="text-xs text-zinc-600">
              {engagementPercentile}%ile ranking
            </p>
          </div>
        </div>
      </div>

      {/* ── Bar Chart Comparison ── */}
      <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-6">
        <h3 className="text-sm font-semibold text-zinc-100 mb-4">
          Visual Comparison
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <defs>
              <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#71717a" />
                <stop offset="100%" stopColor="#52525b" />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#3f3f46"
              vertical={false}
            />
            <XAxis dataKey="metric" stroke="#71717a" style={{ fontSize: '12px' }} />
            <YAxis stroke="#71717a" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#a1a1aa' }}
              cursor={{ fill: 'rgba(10, 185, 129, 0.05)' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="square"
              formatter={(value) => (
                <span style={{ color: '#a1a1aa', fontSize: '12px' }}>
                  {value === 'user' ? 'Your Stats' : 'Average Stats'}
                </span>
              )}
            />
            <Bar dataKey="user" fill="url(#userGradient)" name="user" radius={[8, 8, 0, 0]} />
            <Bar
              dataKey="average"
              fill="url(#avgGradient)"
              name="average"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Key Insights ── */}
      <div className="bg-gradient-to-r from-emerald-500/5 to-violet-500/5 rounded-lg border border-emerald-500/20 p-5">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
          Performance Insights
        </p>
        <ul className="space-y-2.5">
          {commitsPercentDiff >= 0 ? (
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 font-bold mt-0.5">✓</span>
              <span className="text-sm text-zinc-300">
                You have{' '}
                <span className="text-emerald-400 font-medium">{commitsPercentDiff}% more commits</span> than the average
                developer in your cohort
              </span>
            </li>
          ) : (
            <li className="flex items-start gap-3">
              <span className="text-orange-400 font-bold mt-0.5">→</span>
              <span className="text-sm text-zinc-300">
                Consider increasing commits{' '}
                <span className="text-orange-400 font-medium">
                  (currently {Math.abs(commitsPercentDiff)}% below average)
                </span>
              </span>
            </li>
          )}

          {projectsPercentDiff >= 0 ? (
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 font-bold mt-0.5">✓</span>
              <span className="text-sm text-zinc-300">
                You have{' '}
                <span className="text-emerald-400 font-medium">{projectsPercentDiff}% more projects</span> compared to peers
              </span>
            </li>
          ) : (
            <li className="flex items-start gap-3">
              <span className="text-orange-400 font-bold mt-0.5">→</span>
              <span className="text-sm text-zinc-300">
                Growing your project portfolio can help you stand out{' '}
                <span className="text-orange-400 font-medium">
                  (currently {Math.abs(projectsPercentDiff)}% below average)
                </span>
              </span>
            </li>
          )}

          {engagementPercentDiff >= 0 ? (
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 font-bold mt-0.5">✓</span>
              <span className="text-sm text-zinc-300">
                Your engagement is{' '}
                <span className="text-emerald-400 font-medium">{engagementPercentDiff}% higher</span> than the average
              </span>
            </li>
          ) : (
            <li className="flex items-start gap-3">
              <span className="text-orange-400 font-bold mt-0.5">→</span>
              <span className="text-sm text-zinc-300">
                Increase community engagement through reviews and collaboration{' '}
                <span className="text-orange-400 font-medium">
                  (currently {Math.abs(engagementPercentDiff)}% below average)
                </span>
              </span>
            </li>
          )}
        </ul>
      </div>

      {/* ── Comparison Base Info ── */}
      <div className="bg-zinc-900/50 rounded-lg border border-zinc-700/50 p-4">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
          About This Comparison
        </p>
        <p className="text-xs text-zinc-600 leading-relaxed">
          Your stats are compared against developers with similar experience levels and
          profile completion. Metrics include commits in the last 30 days, active
          projects, and community engagement activities (reviews, collaborations, posts).
        </p>
      </div>
    </div>
  );
}
