export type TrendPoint = { label: string; value: number };

export function TrendChart({
  data,
  height = 200,
  title,
  series2,
}: {
  data: TrendPoint[];
  height?: number;
  title?: string;
  series2?: TrendPoint[];
}) {
  if (data.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
        нет данных
      </div>
    );
  }

  const width = 600;
  const padX = 0;
  const padY = 10;
  const maxV = Math.max(1, ...data.map((d) => d.value), ...(series2 ?? []).map((d) => d.value));
  const stepX = (width - 2 * padX) / Math.max(1, data.length - 1);
  const toPoints = (pts: TrendPoint[]) =>
    pts
      .map((d, i) => {
        const x = padX + i * stepX;
        const y = height - padY - ((height - 2 * padY) * d.value) / maxV;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  const points1 = toPoints(data);
  const points2 = series2 ? toPoints(series2) : '';
  const last = data[data.length - 1];
  const lastX = padX + (data.length - 1) * stepX;
  const lastY = height - padY - ((height - 2 * padY) * last.value) / maxV;
  const fillPath = `M0,${height} L${points1.replace(/ /g, ' L')} L${width},${height} Z`;

  return (
    <div>
      {title && <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{title}</h3>}
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C4836A" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#C4836A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g stroke="#EFE8DF" strokeWidth="1">
          {[0.2, 0.45, 0.7, 0.95].map((f) => (
            <line key={f} x1="0" y1={f * height} x2={width} y2={f * height} />
          ))}
        </g>
        <path d={fillPath} fill="url(#trend-fill)" />
        <polyline points={points1} stroke="#C4836A" strokeWidth="2" fill="none" />
        {series2 && (
          <polyline points={points2} stroke="#A89E94" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
        )}
        <circle cx={lastX} cy={lastY} r="4" fill="#C4836A" stroke="#FAF8F5" strokeWidth="2" />
      </svg>
    </div>
  );
}
