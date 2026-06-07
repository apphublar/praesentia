export function Confetti({
  style,
  scale = 1
}: {
  style?: React.CSSProperties;
  scale?: number;
}) {
  const dots = [
    { x: 12, y: 30, r: 4, c: "#ff6b5c" },
    { x: 36, y: 12, r: 3, c: "#ffb23e", tri: true },
    { x: 60, y: 26, r: 5, c: "#b69ae8" },
    { x: 84, y: 8, r: 3.5, c: "#6ab7e8" },
    { x: 102, y: 30, r: 4, c: "#6fbf73", tri: true },
    { x: 22, y: 60, r: 3, c: "#ffb23e" },
    { x: 50, y: 70, r: 4.5, c: "#ff6b5c" },
    { x: 78, y: 60, r: 3.5, c: "#b69ae8" },
    { x: 100, y: 72, r: 4, c: "#6ab7e8" }
  ];

  return (
    <svg width={120 * scale} height={86 * scale} viewBox="0 0 120 86" style={style} aria-hidden="true">
      {dots.map((dot, index) =>
        dot.tri ? (
          <polygon
            key={index}
            points={`${dot.x},${dot.y - dot.r} ${dot.x + dot.r},${dot.y + dot.r} ${dot.x - dot.r},${dot.y + dot.r}`}
            fill={dot.c}
          />
        ) : (
          <circle key={index} cx={dot.x} cy={dot.y} r={dot.r} fill={dot.c} />
        )
      )}
    </svg>
  );
}
