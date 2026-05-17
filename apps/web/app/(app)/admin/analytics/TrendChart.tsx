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
  const padX = 16;
  const padY = 20;
  const maxV = Math.max(1, ...data.map((d) => d.value), ...(series2 ?? []).map((d) => d.value));
  const stepX = (width - 2 * padX) / Math.max(1, data.length - 1);

  function pointsArr(pts: TrendPoint[]) {
    return pts.map((d, i) => {
      const x = padX + i * stepX;
      const y = height - padY - ((height - 2 * padY) * d.value) / maxV;
      return { x, y };
    });
  }

  // Сглаживание Catmull-Rom → cubic Bézier (мягкая кривая без зигзагов)
  function smoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return '';
    if (pts.length === 2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`;
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;
      const t = 0.18; // tension — меньше = мягче
      const cp1x = p1.x + (p2.x - p0.x) * t;
      const cp1y = p1.y + (p2.y - p0.y) * t;
      const cp2x = p2.x - (p3.x - p1.x) * t;
      const cp2y = p2.y - (p3.y - p1.y) * t;
      d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  }

  const arr1 = pointsArr(data);
  const arr2 = series2 ? pointsArr(series2) : [];
  const path1 = smoothPath(arr1);
  const path2 = arr2.length ? smoothPath(arr2) : '';
  const last = arr1[arr1.length - 1];
  const fillPath = `${path1} L${last.x.toFixed(1)},${height} L${arr1[0].x.toFixed(1)},${height} Z`;

  return (
    <div>
      {title && <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{title}</h3>}
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C4836A" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#C4836A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g stroke="#EFE8DF" strokeWidth="1">
          {[0.2, 0.45, 0.7, 0.95].map((f) => (
            <line key={f} x1={padX} y1={f * height} x2={width - padX} y2={f * height} />
          ))}
        </g>
        <path d={fillPath} fill="url(#trend-fill)" />
        <path d={path1} stroke="#C4836A" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {path2 && (
          <path d={path2} stroke="#A89E94" strokeWidth="1.5" fill="none" strokeDasharray="4 3" strokeLinecap="round" />
        )}
        <circle cx={last.x} cy={last.y} r="4" fill="#C4836A" stroke="#FAF8F5" strokeWidth="2" />
      </svg>
    </div>
  );
}
