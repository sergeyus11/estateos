export type TrendPoint = { label: string; value: number };

export function TrendChart({
  data,
  height = 80,
  title,
}: {
  data: TrendPoint[];
  height?: number;
  title: string;
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg bg-white p-4">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-2 text-xs text-neutral-500">нет данных</p>
      </div>
    );
  }
  const width = 320;
  const padX = 16;
  const padY = 12;
  const maxV = Math.max(1, ...data.map((d) => d.value));
  const stepX = (width - 2 * padX) / Math.max(1, data.length - 1);
  const points = data
    .map((d, i) => {
      const x = padX + i * stepX;
      const y = height - padY - ((height - 2 * padY) * d.value) / maxV;
      return `${x},${y}`;
    })
    .join(' ');
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="rounded-lg bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="text-xs text-neutral-500">всего {total}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 w-full">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-brand-500"
          points={points}
        />
        {data.map((d, i) => {
          const x = padX + i * stepX;
          const y = height - padY - ((height - 2 * padY) * d.value) / maxV;
          return <circle key={i} cx={x} cy={y} r="3" className="fill-brand-500" />;
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-neutral-400">
        <span>{data[0].label}</span>
        {data.length > 2 && <span>{data[Math.floor(data.length / 2)].label}</span>}
        <span>{data[data.length - 1].label}</span>
      </div>
    </div>
  );
}
