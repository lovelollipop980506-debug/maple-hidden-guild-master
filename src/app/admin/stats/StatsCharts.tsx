"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#5865F2", "#57F287", "#FEE75C", "#ED4245", "#EB459E"];

export function TopPointsChart({ data }: { data: { name: string; points: number }[] }) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <XAxis type="number" stroke="#a1a1aa" fontSize={12} />
        <YAxis type="category" dataKey="name" stroke="#a1a1aa" fontSize={12} width={100} />
        <Tooltip
          contentStyle={{ background: "#1e1f22", border: "1px solid #3f3f46", borderRadius: 8 }}
        />
        <Bar dataKey="points" fill="#5865F2" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusPieChart({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#1e1f22", border: "1px solid #3f3f46", borderRadius: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function Empty() {
  return <div className="flex h-[260px] items-center justify-center text-sm text-zinc-500">데이터 없음</div>;
}
