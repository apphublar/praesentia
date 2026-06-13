export function Spinner({ size = 30 }: { size?: number }) {
  return (
    <div
      className="spin"
      style={{
        width: size,
        height: size,
        borderRadius: 99,
        border: "3px solid rgba(0,0,0,.12)",
        borderTopColor: "var(--coral)"
      }}
    />
  );
}
