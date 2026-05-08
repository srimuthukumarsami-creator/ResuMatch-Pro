import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

export default function RadarScoreChart({ data }) {
  if (!data || !data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="var(--color-border)" strokeDasharray="3 3" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--color-text-secondary)' }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
          tickCount={5}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#2D6A4F"
          fill="#2D6A4F"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
