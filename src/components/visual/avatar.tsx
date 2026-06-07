export function Avatar({ name, tint = "#ff6b5c", size = 28 }: { name: string; tint?: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: tint,
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.36),
        fontWeight: 800,
        boxShadow: "0 0 0 2px #fff"
      }}
    >
      {initials}
    </span>
  );
}

export function AvatarStack({ people }: { people: Array<{ name: string; tint: string }> }) {
  return (
    <span style={{ display: "inline-flex" }}>
      {people.map((person, index) => (
        <span key={person.name} style={{ marginLeft: index ? -8 : 0 }}>
          <Avatar name={person.name} tint={person.tint} size={28} />
        </span>
      ))}
    </span>
  );
}
