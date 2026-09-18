import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

function StatCard({ def, stat, pillSuffix }) {
  const percent = Math.max(0, Math.min(100, Number(stat?.ring) || 0));
  const ringData = [
    { value: percent },
    { value: 100 - percent },
  ];

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-5 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-brand-muted truncate">{def.label}</p>
        <p className="mt-2 text-3xl font-bold text-brand-text">{stat?.value ?? 0}</p>
        <p className={`mt-2 text-xs font-medium ${def.color}`}>
          {stat?.change ?? 0} new {pillSuffix}
        </p>
      </div>
      <div className="relative w-14 h-14 shrink-0" aria-label={`${percent}% progress`}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={ringData}
              innerRadius={18}
              outerRadius={26}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={def.ring} />
              <Cell fill="#f1f5f9" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-brand-text">
          {percent}%
        </span>
      </div>
    </div>
  );
}

export default StatCard;
