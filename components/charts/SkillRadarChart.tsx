'use client';

import { useMemo, memo, CSSProperties } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

interface SkillRadarChartProps {
  skills: Array<{
    name: string;
    proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  }>;
  className?: string;
}

const PROFICIENCY_MAP: Record<string, number> = {
  Beginner: 25,
  Intermediate: 50,
  Advanced: 75,
  Expert: 100,
};

function SkillRadarChart({
  skills,
  className = '',
}: SkillRadarChartProps) {
  const chartData = useMemo(() => {
    // Sort by proficiency level (descending) and take top 6-8 skills
    const sorted = [...skills]
      .sort((a, b) => {
        const profA = PROFICIENCY_MAP[a.proficiency] || 0;
        const profB = PROFICIENCY_MAP[b.proficiency] || 0;
        return profB - profA;
      })
      .slice(0, 8);

    return sorted.map((skill) => ({
      skill: skill.name,
      proficiency: PROFICIENCY_MAP[skill.proficiency] || 0,
      fullMark: 100,
    }));
  }, [skills]);

  // Memoize container style to avoid style object recreation
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

  if (chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <p className="text-zinc-400">No skills to display</p>
      </div>
    );
  }

  return (
    <div
      style={containerStyle}
      className={`bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 ${className}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          data={chartData}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <PolarGrid
            stroke="#3f3f46"
            strokeDasharray="3 3"
            className="opacity-50"
          />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: '#a1a1aa', fontSize: 12 }}
            angle={90}
            type="number"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#71717a', fontSize: 10 }}
          />
          <Radar
            name="Proficiency"
            dataKey="proficiency"
            stroke="#a855f7"
            fill="#a855f7"
            fillOpacity={0.5}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Wrap component with React.memo to prevent unnecessary re-renders
// Only re-renders when 'skills' array actually changes
export default memo(SkillRadarChart, (prevProps, nextProps) => {
  // Return true if props are equal (don't re-render), false otherwise
  return (
    prevProps.className === nextProps.className &&
    prevProps.skills.length === nextProps.skills.length &&
    prevProps.skills.every(
      (skill, index) =>
        skill.name === nextProps.skills[index].name &&
        skill.proficiency === nextProps.skills[index].proficiency
    )
  );
});
