export function Sparkline({ values, tone = "accent", label }) {
  const width = 240;
  const height = 72;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      className={`sparkline sparkline--${tone}`}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      <polyline points={points} fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function MiniBars({ values, labels }) {
  const max = Math.max(...values, 1);

  return (
    <div className="mini-bars" role="img" aria-label="динамика по дням">
      {values.map((value, index) => (
        <div className="mini-bars__item" key={`${labels[index]}-${value}`}>
          <div className="mini-bars__rail">
            <span style={{ height: `${Math.max((value / max) * 100, 4)}%` }} />
          </div>
          <span>{labels[index]}</span>
        </div>
      ))}
    </div>
  );
}
