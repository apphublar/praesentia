"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GuestContributionPanel } from "@/components/event/guest-contribution-panel";
import { LikeButton } from "@/components/event/like-button";
import { PixBox } from "@/components/event/pix-box";
import { Avatar, AvatarStack } from "@/components/visual/avatar";
import { Confetti } from "@/components/visual/confetti";
import type { Event, MediaItem } from "@/types/domain";

type Phase = "before" | "live" | "memory";

export function EventExperience({
  event,
  media,
  currentUserId,
  canUploadVideo = false
}: {
  event: Event;
  media: MediaItem[];
  currentUserId?: string;
  canUploadVideo?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("before");
  const [liveMedia, setLiveMedia] = useState(media);

  useEffect(() => {
    const source = new EventSource(`/api/events/${event.id}/stream`);
    function refreshSnapshot() {
      fetch(`/api/events/${event.id}`, { cache: "no-store" })
        .then((response) => response.json() as Promise<{ media?: MediaItem[] }>)
        .then((snapshot) => {
          if (snapshot.media) setLiveMedia(snapshot.media);
        })
        .catch(() => undefined);
    }

    source.addEventListener("media.created", (message) => {
      const payload = JSON.parse((message as MessageEvent).data) as { item: MediaItem };
      setLiveMedia((current) => [payload.item, ...current.filter((item) => item.id !== payload.item.id)]);
    });

    source.addEventListener("media.updated", (message) => {
      const payload = JSON.parse((message as MessageEvent).data) as { item: MediaItem };
      setLiveMedia((current) => current
        .map((item) => (item.id === payload.item.id ? payload.item : item))
        .filter((item) => item.status === "published"));
    });

    source.addEventListener("like.changed", (message) => {
      const payload = JSON.parse((message as MessageEvent).data) as { mediaId: string; likesCount: number };
      setLiveMedia((current) => current.map((item) => (item.id === payload.mediaId ? { ...item, likesCount: payload.likesCount } : item)));
    });

    source.addEventListener("screen.changed", refreshSnapshot);

    return () => source.close();
  }, [event.id]);

  function addLocalMedia(item: MediaItem) {
    setLiveMedia((current) => [item, ...current.filter((row) => row.id !== item.id)]);
    setPhase("live");
  }

  function removeLocalMedia(mediaId: string) {
    setLiveMedia((current) => current.filter((item) => item.id !== mediaId));
  }

  return (
    <main className="paper">
      <div
        style={{
          position: "sticky",
          top: 64,
          zIndex: 10,
          background: "rgba(247,238,219,.92)",
          borderBottom: "1px solid var(--line)",
          backdropFilter: "blur(10px)"
        }}
      >
        <div className="shell" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "var(--ink-soft)", fontSize: 13 }}>
            voltar
          </Link>
          <span className="mono" style={{ color: "var(--ink-soft)", fontSize: 12 }}>
            / praesentia.com.br/evento/{event.slug}
          </span>
          <span className="pill" style={{ background: phaseColor(phase), color: phase === "live" ? "var(--ink)" : "#fff" }}>
            {phase === "live" && <span className="live-dot" style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ink)" }} />}
            fase - {phaseLabel(phase)}
          </span>
        </div>
      </div>

      {phase === "before" && <BeforeEvent event={event} />}
      {phase === "live" && (
        <LiveEvent
          event={event}
          media={liveMedia}
          currentUserId={currentUserId}
          canUploadVideo={canUploadVideo}
          onCreated={addLocalMedia}
          onDeleted={removeLocalMedia}
        />
      )}
      {phase === "memory" && <MemoryEvent event={event} media={liveMedia} />}

      <PhaseSwitcher phase={phase} onChange={setPhase} />
    </main>
  );
}

function BeforeEvent({ event }: { event: Event }) {
  return (
    <section className="shell grid-collapse" style={{ padding: "42px 0 130px", display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,.95fr)", gap: 36, alignItems: "center" }}>
      <div style={{ position: "relative" }}>
        <Confetti style={{ position: "absolute", left: -16, top: -22 }} />
        <div className="mono" style={{ color: "var(--ink-soft)", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
          um convite especial para você
        </div>
        <h1 className="display-i" style={{ fontSize: "clamp(76px, 12vw, 168px)", lineHeight: 0.86, margin: "14px 0 0" }}>
          {event.title.split("-")[0].trim()},
        </h1>
        <h2 className="display" style={{ color: "var(--coral)", fontSize: "clamp(36px, 4.5vw, 64px)", lineHeight: 0.95, margin: "6px 0 0" }}>
          1 ano de <span className="hand-underline">jardim</span>
        </h2>
        <p className="display-i" style={{ fontSize: "clamp(20px, 1.8vw, 26px)", lineHeight: 1.4, maxWidth: 560 }}>
          Sob a sombra das acácias, no quintal favorito da família, vamos celebrar o primeiro giro em volta do sol.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
          <button className="btn">Confirmar presença</button>
          <button className="btn secondary">Enviar pelo WhatsApp</button>
        </div>
        <div className="dotted" style={{ color: "var(--ink)", opacity: 0.4, marginTop: 34 }} />
        <div className="grid-collapse-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 18 }}>
          <Info label="quando" value={`${event.date} - ${event.startsAt} às ${event.endsAt}`} color="var(--coral)" />
          <Info label="onde" value={`${event.venueName} - ${event.city}`} color="var(--sky)" />
        </div>
      </div>

      <div style={{ position: "relative", minHeight: 480 }}>
        <div className="polaroid float" style={{ position: "absolute", top: 8, left: "6%", width: 240, transform: "rotate(-7deg)" }}>
          <div className="placeholder" style={{ height: 240, backgroundColor: "var(--bg-soft)" }}>
            mavie - 11 meses
          </div>
          <div className="display-i" style={{ fontSize: 14, textAlign: "center", marginTop: 8 }}>
            nossa pequena
          </div>
        </div>
        <div className="polaroid float" style={{ position: "absolute", top: 50, right: 0, width: 260, transform: "rotate(6deg)", zIndex: 2 }}>
          <div className="placeholder" style={{ height: 270, backgroundColor: "#d9e8dc" }}>
            quintal das acácias
          </div>
          <div className="display-i" style={{ fontSize: 14, textAlign: "center", marginTop: 8 }}>
            onde a festa será
          </div>
        </div>
        <span className="tape" style={{ top: 0, left: "34%", transform: "rotate(-4deg)" }} />
        <span className="tape" style={{ top: 42, right: "34%", transform: "rotate(8deg)", background: "rgba(255,107,92,.7)" }} />
      </div>

      <div className="grid-collapse" style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, marginTop: 8 }}>
        <div className="card event-countdown-card" style={{ background: "var(--violet)", color: "#fff7ee", padding: "22px 26px", boxShadow: "5px 6px 0 var(--ink)" }}>
          <div className="mono" style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>contagem regressiva</div>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginTop: 12 }}>
            {[
              ["18", "dias"],
              ["07", "horas"],
              ["42", "min"],
              ["16", "seg"]
            ].map(([n, label]) => (
              <div key={label}>
                <div className="display" style={{ fontSize: 54, lineHeight: 1 }}>{n}</div>
                <div className="mono" style={{ fontSize: 11, textTransform: "uppercase" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        <PixBox pix={event.pix} />
      </div>

      <section style={{ gridColumn: "1 / -1", marginTop: 32 }}>
        <div className="mono" style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase" }}>
          recado da Camila & Diego
        </div>
        <p className="display-i" style={{ fontSize: "clamp(22px,2.4vw,32px)", lineHeight: 1.32, maxWidth: 900, margin: "8px 0 0" }}>
          "A nossa Mavie Fontinhas chegou no começo de 2025 e mudou tudo. Queremos celebrar com você esse primeiro giro em volta do sol. Use tons de jardim no look se puder!"
        </p>
      </section>

      <section className="card event-safe-share-card" style={{ gridColumn: "1 / -1", padding: 22, marginTop: 18 }}>
        <span className="pill">participação segura</span>
        <h3 className="display" style={{ fontSize: 28, margin: "12px 0 8px" }}>Para compartilhar memórias</h3>
        <div className="grid-collapse-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {[
            ["1", "Confirmar presença"],
            ["2", "Criar ou entrar na conta"],
            ["3", "Enviar fotos e recados enquanto houver espaço na cápsula"],
            ["4", "Curtir favoritos sem expor quem curtiu"]
          ].map(([n, text]) => (
            <div key={n} style={{ background: "var(--bg-soft)", borderRadius: 12, padding: 14 }}>
              <strong style={{ color: "var(--coral)" }}>{n}.</strong> {text}
            </div>
          ))}
        </div>
      </section>

      <EventTabs event={event} />
    </section>
  );
}

function EventTabs({ event }: { event: Event }) {
  const [tab, setTab] = useState<"contribuição" | "perguntas" | "local">("contribuição");
  const tabs: Array<["contribuição" | "perguntas" | "local", string]> = [
    ["contribuição", "contribuição"],
    ["perguntas", "perguntas"],
    ["local", "local"]
  ];

  return (
    <section style={{ gridColumn: "1 / -1", marginTop: 34 }}>
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
        {tabs.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            style={{
              border: 0,
              borderBottom: tab === value ? "2.5px solid var(--coral)" : "2.5px solid transparent",
              background: "transparent",
              color: tab === value ? "var(--ink)" : "var(--ink-soft)",
              padding: "14px 8px",
              marginBottom: -1,
              cursor: "pointer",
              fontWeight: tab === value ? 800 : 600
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        {tab === "contribuição" && (
          <div className="grid-collapse" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div className="card event-tab-card" style={{ padding: 20 }}>
              <span className="pill">pix opcional</span>
              <h3 className="display" style={{ fontSize: 28, margin: "12px 0 8px" }}>
                Para churrasco, festa entre amigos ou vaquinha.
              </h3>
              <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
                O responsável informa uma chave Pix, nome do recebedor, valor sugerido e mensagem. A Praesentia apenas facilita copiar a chave nesta primeira versão.
              </p>
              <PixBox pix={event.pix} />
            </div>
            <div className="card event-tab-card" style={{ padding: 20, background: "var(--bg-soft)" }}>
              <h3 className="display" style={{ fontSize: 26, margin: 0 }}>Sem lista de presentes no MVP.</h3>
              <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
                A estrutura fica pronta para qualquer evento particular: aniversário, casamento, chá, formatura, churrasco ou encontro de família. Presente físico pode entrar depois, mas agora o foco é convite, presença, Pix e cápsula.
              </p>
            </div>
          </div>
        )}
        {tab === "perguntas" && (
          <div style={{ maxWidth: 760 }}>
            {[
              ["Posso levar criança?", "Sim. A festa é para a família toda, com espaço para brincar."],
              ["Tem estacionamento?", "Sim, há vagas no local e zona azul nas ruas próximas."],
              ["Comida e bebida?", "Buffet leve, bolo, sucos naturais e bebidas para adultos."],
              ["Quem pode postar na cápsula?", "Somente convidados confirmados, com conta criada e acesso ativo."]
            ].map(([q, a]) => (
              <details key={q} style={{ borderBottom: "1px solid var(--line)", padding: "14px 0" }}>
                <summary className="display" style={{ cursor: "pointer", fontSize: 21 }}>{q}</summary>
                <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>{a}</p>
              </details>
            ))}
          </div>
        )}
        {tab === "local" && (
          <div className="grid-collapse" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18 }}>
            <div style={{ minHeight: 320, borderRadius: 16, border: "1.5px solid var(--ink)", background: "#d9e8dc", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(27,18,9,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(27,18,9,.06) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
              <span style={{ position: "absolute", left: "48%", top: "48%", width: 40, height: 40, borderRadius: "50% 50% 50% 0", background: "var(--coral)", transform: "rotate(-45deg)", boxShadow: "0 4px 10px rgba(0,0,0,.2)" }} />
            </div>
            <div className="card event-tab-card" style={{ padding: 20 }}>
              <h3 className="display" style={{ fontSize: 26, margin: 0 }}>{event.venueName}</h3>
              <p style={{ color: "var(--ink-soft)", lineHeight: 1.55 }}>{event.venueAddress} - {event.city}</p>
              <button className="btn" style={{ width: "100%", boxShadow: "none", background: "var(--sky)" }}>Abrir no Google Maps</button>
              <button className="btn secondary" style={{ width: "100%", marginTop: 10 }}>Copiar endereço</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function LiveEvent({
  event,
  media,
  currentUserId,
  canUploadVideo,
  onCreated,
  onDeleted
}: {
  event: Event;
  media: MediaItem[];
  currentUserId?: string;
  canUploadVideo: boolean;
  onCreated: (item: MediaItem) => void;
  onDeleted: (mediaId: string) => void;
}) {
  const [latest, ...rest] = media;
  const top3 = useMemo(() => [...media].sort((a, b) => b.likesCount - a.likesCount).slice(0, 3), [media]);
  const guestItems = useMemo(
    () => (currentUserId ? media.filter((item) => item.userId === currentUserId) : []),
    [currentUserId, media]
  );
  const guestUsage = useMemo(() => ({
    photos: guestItems.filter((item) => item.type === "photo").length,
    videos: guestItems.filter((item) => item.type === "video").length,
    messages: guestItems.filter((item) => item.type === "message").length
  }), [guestItems]);

  return (
    <section className="shell" style={{ padding: "34px 0 130px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span className="pill" style={{ background: "var(--gold)", color: "var(--ink)" }}>
          <span className="live-dot" style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ink)" }} />
          ao vivo agora
        </span>
        <span className="mono" style={{ color: "var(--ink-soft)", fontSize: 12 }}>47 pessoas presentes - 156 memórias</span>
        <Link className="btn secondary" href={`/evento/${event.slug}/telao`} style={{ marginLeft: "auto" }}>
          Abrir telão
        </Link>
      </div>
      <h1 className="display-i" style={{ fontSize: "clamp(58px, 8vw, 112px)", lineHeight: 0.9, margin: "18px 0 22px" }}>
        Mural vivo da festa.
      </h1>

      <div className="grid-collapse" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.45fr) minmax(320px,.75fr)", gap: 22 }}>
        <div>
          {latest && <FeaturedMedia item={latest} />}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14, marginTop: 16 }}>
            {rest.map((item, index) => (
              <FeedItem key={item.id} item={item} rotate={(index % 3) - 1} />
            ))}
          </div>
        </div>
        <aside style={{ display: "grid", gap: 14, alignContent: "start" }}>
          <GuestContributionPanel
            eventId={event.id}
            items={guestItems}
            currentUserId={currentUserId}
            canUploadVideo={canUploadVideo}
            onCreated={onCreated}
            onDeleted={onDeleted}
          />
          <div className="card event-side-card event-side-card-accent" style={{ padding: 18, background: "var(--violet)", color: "#fff" }}>
            <div className="mono" style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>
              {canUploadVideo ? "suas publicações" : "espaço da cápsula"}
            </div>
            {canUploadVideo ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginTop: 12 }}>
                {[
                  [`${guestUsage.photos}`, "fotos enviadas"],
                  [`${guestUsage.videos}`, "vídeos enviados"]
                ].map(([value, label]) => (
                  <div key={label} style={{ background: "rgba(255,255,255,.12)", borderRadius: 10, padding: 10, textAlign: "center" }}>
                    <div className="display" style={{ fontSize: 28, lineHeight: 1 }}>{value}</div>
                    <div className="mono" style={{ fontSize: 10, textTransform: "uppercase" }}>{label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ lineHeight: 1.55, fontSize: 14, marginTop: 12, opacity: 0.95 }}>
                Você já enviou <strong>{guestUsage.photos}</strong> foto{guestUsage.photos !== 1 ? "s" : ""}
                {guestUsage.messages > 0 ? " e 1 recado" : ""}. O espaço é compartilhado — enquanto a cápsula tiver GB disponível, você pode continuar enviando fotos.
              </p>
            )}
            <p style={{ lineHeight: 1.5, fontSize: 13, opacity: .9, marginTop: 12 }}>
              {canUploadVideo ? "Como responsável, você também pode enviar vídeos." : "Aqui é qualidade, não quantidade. Cada convidado escolhe o que realmente importa."}
            </p>
          </div>
          <div className="card event-side-card" style={{ padding: 18 }}>
            <div className="display" style={{ fontSize: 22 }}>Controle do responsável</div>
            <p style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.55 }}>
              Sem moderação prévia. O responsável pode ocultar do telão, arquivar, excluir ou bloquear um convidado.
            </p>
          </div>
          <div className="card event-side-card event-side-card-dark" style={{ padding: 18, background: "var(--ink)", color: "var(--bg)" }}>
            <div className="mono" style={{ color: "var(--gold)", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>
              mais curtidos agora
            </div>
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              {top3.map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={item.authorName} tint="var(--coral)" />
                  <span style={{ flex: 1, fontSize: 13 }}>{item.authorName}</span>
                  <span className="mono" style={{ color: "rgba(247,238,219,.7)", fontSize: 11 }}>{item.likesCount} curtidas</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card event-side-card" style={{ padding: 18 }}>
            <div className="mono" style={{ color: "var(--ink-soft)", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>
              linha do tempo - hoje
            </div>
            {[
              ["15h00", "comecou a festa", "var(--coral)", true],
              ["15h44", "primeira foto - Pedro L", "var(--sky)", true],
              ["17h12", "parabéns — bolo", "var(--gold)", true],
              ["19h00", "fim - cápsula em 48h", "var(--violet)", false]
            ].map(([time, label, color, done]) => (
              <div key={String(time)} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, opacity: done ? 1 : .58 }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: String(color), border: "1.5px solid var(--ink)" }} />
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-soft)" }}>{time}</span>
                <span style={{ fontSize: 13 }}>{label}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function MemoryEvent({ event, media }: { event: Event; media: MediaItem[] }) {
  return (
    <section className="shell" style={{ padding: "34px 0 130px" }}>
      <span className="pill" style={{ background: "var(--green)", color: "#fff" }}>cápsula permanente</span>
      <h1 className="display-i" style={{ fontSize: "clamp(68px, 10vw, 144px)", lineHeight: 0.86, margin: "18px 0 0" }}>
        {event.title.split("-")[0].trim()}, 1.
      </h1>
      <div className="display" style={{ color: "var(--coral)", fontSize: "clamp(26px, 3vw, 38px)", marginTop: 6 }}>
        <span className="hand-underline">{event.theme.toLowerCase()}</span> - {event.date}
      </div>
      <p className="display-i" style={{ fontSize: "clamp(19px, 1.8vw, 27px)", lineHeight: 1.4, maxWidth: 700 }}>
        Foi um sábado de céu limpo. O bolo era de cenoura. Toda essa tarde mora aqui.
      </p>
      <div className="grid-collapse-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 26 }}>
        {[
          [media.filter((item) => item.type === "photo").length || 247, "fotos", "var(--coral)"],
          [media.filter((item) => item.type === "video").length || 38, "vídeos", "var(--sky)"],
          [media.filter((item) => item.type === "message").length || 86, "recados", "var(--violet)"],
          [47, "pessoas", "var(--green)"]
        ].map(([number, label, color]) => (
          <div key={label} className="card" style={{ padding: "18px 20px" }}>
            <div className="display" style={{ fontSize: 52, lineHeight: 1, color: String(color) }}>{number}</div>
            <div className="mono" style={{ color: "var(--ink-soft)", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 32, columns: "260px", columnGap: 14 }}>
        {media.concat(media).slice(0, 12).map((item, index) => (
          <div key={`${item.id}-${index}`} className="polaroid" style={{ breakInside: "avoid", marginBottom: 14, transform: `rotate(${(index % 3 - 1) * 1.2}deg)` }}>
            <MediaVisual item={item} height={index % 4 === 0 ? 220 : 170} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, color: "var(--ink-soft)", fontSize: 12 }}>
              <span>por {item.authorName}</span>
              <span>{item.likesCount} curtidas</span>
            </div>
          </div>
        ))}
      </div>

      <section className="grid-collapse" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 42 }}>
        <div className="card event-memory-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ background: "#f1d8c9", minHeight: 310, display: "grid", placeItems: "center", position: "relative" }}>
            <div className="polaroid" style={{ width: 210, transform: "rotate(-3deg)" }}>
              <div className="placeholder" style={{ height: 190, backgroundColor: "#d7edd9" }}>capa botanica</div>
              <div className="display-i" style={{ marginTop: 8, textAlign: "center" }}>Mavie Fontinhas, 1.</div>
            </div>
            <span className="tape" style={{ top: 28, right: 70, transform: "rotate(-8deg)" }} />
          </div>
          <div style={{ padding: 24 }}>
            <span className="pill">álbum impresso</span>
            <h2 className="display-i" style={{ fontSize: 34, lineHeight: 1, margin: "12px 0" }}>Um livro físico da tarde que você não quer esquecer.</h2>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>Escolha fotos da cápsula, organize a ordem e gere um álbum A4 de capa dura como complemento.</p>
            <button className="btn">Montar álbum</button>
          </div>
        </div>
        <div className="card event-memory-card" style={{ padding: 24, background: "var(--bg-soft)" }}>
          <span className="pill">exportação</span>
          <h2 className="display-i" style={{ fontSize: 34, lineHeight: 1, margin: "12px 0" }}>A memória também precisa sair daqui.</h2>
          <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>O responsável deve poder exportar um arquivo com fotos, vídeos, recados e metadados. Essa rotina será essencial antes de produção.</p>
          <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
            {["ZIP com arquivos originais", "JSON com autores, datas e curtidas", "Relatorio de convidados e permissoes"].map((item) => (
              <div key={item} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ width: 18, height: 18, borderRadius: 999, background: "var(--gold)" }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card event-memory-cta" style={{ padding: 24, marginTop: 24, background: "var(--ink)", color: "var(--bg)" }}>
        <h2 className="display-i" style={{ fontSize: 34, marginTop: 0 }}>Essa cápsula faz parte da vida da Mavie Fontinhas.</h2>
        <p style={{ color: "rgba(247,238,219,.72)", lineHeight: 1.65 }}>
          Quando ela crescer, a família poderá abrir esta e outras cápsulas conectadas. O valor do produto está na permanência, não só no convite.
        </p>
        <Link className="btn" href="/eu" style={{ background: "var(--gold)", color: "var(--ink)", boxShadow: "4px 5px 0 var(--coral)" }}>Ver vida em cápsulas</Link>
      </section>
    </section>
  );
}

function FeaturedMedia({ item }: { item: MediaItem }) {
  return (
    <article className="card" style={{ padding: 14 }}>
      <MediaVisual item={item} height={420} featured />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
        <Avatar name={item.authorName} tint="var(--coral)" />
        <div>
          <strong>{item.authorName}</strong>
          <div style={{ color: "var(--ink-soft)", fontSize: 12 }}>última memória compartilhada</div>
        </div>
        <span style={{ marginLeft: "auto" }}>
          <LikeButton eventId={item.eventId} mediaId={item.id} initialCount={item.likesCount} />
        </span>
      </div>
    </article>
  );
}

function FeedItem({ item, rotate }: { item: MediaItem; rotate: number }) {
  return (
    <article className="polaroid" style={{ transform: `rotate(${rotate}deg)` }}>
      <MediaVisual item={item} height={item.type === "message" ? 180 : 210} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
        <Avatar name={item.authorName} tint="var(--sky)" size={24} />
        <strong style={{ fontSize: 13 }}>{item.authorName}</strong>
        <span style={{ marginLeft: "auto" }}>
          <LikeButton eventId={item.eventId} mediaId={item.id} initialCount={item.likesCount} />
        </span>
      </div>
    </article>
  );
}

function MediaVisual({ item, height, featured = false }: { item: MediaItem; height: number; featured?: boolean }) {
  if (item.type === "message") {
    return (
      <div style={{ minHeight: height, borderRadius: 8, background: featured ? "var(--gold)" : "var(--violet)", color: featured ? "var(--ink)" : "#fff", display: "grid", placeItems: "center", padding: 22, textAlign: "center" }}>
        <p className="display-i" style={{ fontSize: featured ? 32 : 21, lineHeight: 1.25, margin: 0 }}>"{item.text}"</p>
      </div>
    );
  }
  return (
    <div className="placeholder" style={{ height, backgroundColor: item.type === "video" ? "#d9e8f4" : "#f1d8c9" }}>
      {item.type === "video" ? "vídeo do evento" : "foto do evento"}
    </div>
  );
}

function Info({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: color, marginTop: 7 }} />
      <div>
        <div className="mono" style={{ color: "var(--ink-soft)", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>{label}</div>
        <div className="display" style={{ fontSize: 19 }}>{value}</div>
      </div>
    </div>
  );
}

function PhaseSwitcher({ phase, onChange }: { phase: Phase; onChange: (phase: Phase) => void }) {
  const options: Array<[Phase, string]> = [
    ["before", "Antes - convite"],
    ["live", "Durante - ao vivo"],
    ["memory", "Depois - memória"]
  ];

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 20,
        transform: "translateX(-50%)",
        zIndex: 100,
        display: "flex",
        gap: 4,
        background: "var(--ink)",
        borderRadius: 999,
        padding: 4,
        boxShadow: "0 12px 30px rgba(0,0,0,.22)"
      }}
    >
      <span className="mono" style={{ color: "var(--gold)", fontSize: 9, alignSelf: "center", padding: "0 10px", textTransform: "uppercase" }}>
        demo
      </span>
      {options.map(([value, label]) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          style={{
            border: 0,
            borderRadius: 999,
            padding: "9px 14px",
            cursor: "pointer",
            background: phase === value ? phaseColor(value) : "transparent",
            color: phase === value ? (value === "live" ? "var(--ink)" : "#fff") : "var(--bg)",
            fontWeight: phase === value ? 800 : 600,
            fontSize: 12
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function phaseLabel(phase: Phase) {
  return phase === "before" ? "antes" : phase === "live" ? "durante" : "depois";
}

function phaseColor(phase: Phase) {
  return phase === "before" ? "var(--coral)" : phase === "live" ? "var(--gold)" : "var(--violet)";
}
