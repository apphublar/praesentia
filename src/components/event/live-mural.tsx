import type { MediaItem } from "@/types/domain";
import { MediaCard } from "@/components/event/media-card";

export function LiveMural({ items }: { items: MediaItem[] }) {
  const [latest, ...rest] = items;
  const top3 = [...items].sort((a, b) => b.likesCount - a.likesCount).slice(0, 3);

  return (
    <section className="grid" style={{ gridTemplateColumns: "minmax(0, 1.5fr) minmax(280px, 0.8fr)" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <span className="pill">mural ao vivo</span>
          <span style={{ marginLeft: "auto", color: "var(--ink-soft)", fontSize: 13 }}>
            Atualiza em tempo real no telão
          </span>
        </div>
        {latest && <MediaCard item={latest} featured />}
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 16 }}>
          {rest.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </div>
      </div>
      <aside>
        <div className="card" style={{ padding: 18 }}>
          <h2 style={{ margin: 0 }}>Favoritos do momento</h2>
          <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>
            Curtidas são confidenciais: aparece apenas a quantidade total.
          </p>
          <div className="grid">
            {top3.map((item) => (
              <MediaCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
