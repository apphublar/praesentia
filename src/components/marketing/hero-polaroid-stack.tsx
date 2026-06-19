const heroPolaroids = [
  {
    id: "birthday",
    src: "/marketing/hero/birthday.jpg",
    alt: "Família celebrando aniversário infantil com bolo",
    caption: "1 ano da Sofia",
    width: 220,
    photoHeight: 220,
    style: { top: 6, left: "6%", transform: "rotate(-7deg)" },
    animationDelay: "0s"
  },
  {
    id: "wedding",
    src: "/marketing/hero/wedding-dance.jpg",
    alt: "Casal dançando em festa de casamento",
    caption: "primeiro vals",
    width: 236,
    photoHeight: 248,
    style: { top: 54, right: "2%", zIndex: 2, transform: "rotate(6deg)" },
    animationDelay: ".4s"
  },
  {
    id: "dinner",
    src: "/marketing/hero/dinner.jpg",
    alt: "Amigos reunidos em jantar de celebração",
    caption: "mesa da família",
    width: 204,
    photoHeight: 168,
    style: { bottom: 34, left: "22%", transform: "rotate(-3deg)" },
    animationDelay: ".9s"
  }
] as const;

export function HeroPolaroidStack() {
  return (
    <div className="home-hero-visual">
      {heroPolaroids.map((item, index) => (
        <article
          key={item.id}
          className="polaroid float home-hero-polaroid"
          style={{
            position: "absolute",
            width: item.width,
            animationDelay: item.animationDelay,
            ...item.style
          }}
        >
          <div className="polaroid-photo" style={{ height: item.photoHeight }}>
            <img
              src={item.src}
              alt={item.alt}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              decoding="async"
            />
          </div>
          <div className="display-i home-hero-polaroid-caption">{item.caption}</div>
        </article>
      ))}
      <span className="tape" style={{ top: 2, left: "30%", transform: "rotate(-4deg)" }} />
      <span className="tape" style={{ top: 42, right: "30%", transform: "rotate(7deg)", background: "rgba(255,107,92,.7)" }} />
    </div>
  );
}
