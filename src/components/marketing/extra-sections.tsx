import Link from "next/link";
import type { ReactNode } from "react";
import { PraesentiaLogo } from "@/components/brand/praesentia-logo";
import { LEGAL_PAGES } from "@/lib/legal/constants";
import { marketingImages, mavieJourneyDates } from "@/lib/marketing/marketing-images";
import {
  MarketingCapsulePreview,
  MarketingInvitePreview,
  MarketingMuralPreview
} from "@/components/marketing/transformation-previews";

const faqs = [
  ["Quanto custa de verdade?", "Gratuito: R$0 · Cápsula: R$59 (pagamento único) · Cápsula Plus: R$197/ano (até 6 eventos)."],
  ["O link realmente não expira?", "Cápsulas pagas têm no mínimo 36 meses garantidos — você pode ampliar o tempo e o espaço com pacotes extras. O plano gratuito fica ativo só até o fim do evento."],
  ["E a privacidade das crianças?", "Eventos nascem privados. O responsável controla convidados, conteúdos, bloqueios, telão e acesso à cápsula."],
  ["Como a IA cria o convite?", "O responsável informa tipo de festa, data, local, tema e tom. A Praesentia gera texto, paleta, capa e mensagens editáveis."],
  ["Quanto espaço eu tenho na cápsula?", "Cápsula tem 5 GB. Cápsula Plus tem 20 GB compartilhados entre até 6 eventos no ano. Cada evento continua separado e privado."],
  ["O que vai para a cápsula do tempo?", "Fotos, vídeos, recados, presenças, curtidas confidenciais — a timeline do evento, tudo com controle do responsável."],
  ["Funciona offline?", "A primeira versão será web/PWA. O envio resiliente para conexões ruins entra na evolução técnica do produto."]
];

const storagePlans = [
  {
    label: "Gratuito",
    capacity: "-",
    note: "disponibilidade temporária",
    desc: "O convite e a lista de convidados continuam ativos durante o evento, sem cápsula permanente.",
    dark: false
  },
  {
    label: "Cápsula",
    capacity: "5 GB",
    note: "inclusos · mín. 36 meses (ampliável)",
    desc: "Espaço para guardar fotos do evento inteiro, vídeos curtos dos momentos especiais e recados dos convidados.",
    dark: true,
    rows: [["fotos HD", "~ 1.500", 62], ["vídeos curtos", "~ 60", 28], ["recados", "~ 200", 10]]
  },
  {
    label: "Cápsula Plus",
    capacity: "20 GB",
    note: "compartilhados · mín. 36 meses por evento",
    desc: "Capacidade para até 6 eventos por ano. O GB é compartilhado, mas as cápsulas não misturam seus conteúdos.",
    dark: false,
    rows: [["fotos HD", "~ 7.500", 62], ["vídeos curtos", "~ 300", 28], ["recados", "~ 1.000", 10]]
  }
];

const privacyItems = [
  ["Modo família", "Eventos privados por padrão, com acesso controlado pelo responsável."],
  ["Sem indexação", "Cápsulas privadas não devem aparecer em buscadores nem em páginas públicas."],
  ["Exportável", "O responsável pode baixar arquivos e metadados quando precisar."],
  ["Moderação humana", "Sem moderação prévia no envio, mas o dono arquiva, exclui e bloqueia convidados."],
  ["Quem tem acesso", "Somente convidados confirmados e com conta podem postar fotos, vídeos e recados."],
  ["Aos 18 dela", "A timeline pode ser preparada para virar acervo pessoal quando a criança crescer."]
];

const plans = [
  {
    name: "Gratuito",
    price: "R$0",
    meta: "sem cartão",
    subtitle: "Comece hoje, valide o convite e organize presenças.",
    cta: "Começar grátis",
    sections: [
      ["Convite & RSVP", ["1 convite com IA + texto + assistente de prompt", "Pacote extra R$4,90: +2 imagens e +2 ajustes", "Link do domínio Praesentia", "Lista de convidados", "Confirmação de presença"]],
      ["Durante o evento", ["Pix opcional para contribuição", "Página do evento temporária", "Sem cápsula permanente"]]
    ]
  },
  {
    name: "Cápsula",
    price: "R$59",
    meta: "pagamento único",
    subtitle: "Transforme um evento em uma memória permanente.",
    cta: "Eternizar minha memória",
    featured: true,
    sections: [
      ["Convite & RSVP", ["Tudo do Gratuito", "Subdomínio pago do evento", "IA premium para convite"]],
      ["Memórias permanentes", ["Cápsula do tempo", "Timeline do evento", "Fotos, vídeos e recados", "Exportação das memórias"]],
      ["Armazenamento", ["5 GB inclusos", "Mínimo de 36 meses (ampliável)"]]
    ]
  },
  {
    name: "Cápsula Plus",
    price: "R$197",
    meta: "por ano",
    subtitle: "Sua história organizada em uma única timeline.",
    cta: "Quero a timeline",
    sections: [
      ["Eventos", ["Tudo do Cápsula", "Até 6 eventos por ano", "Timeline conectada"]],
      ["Memórias permanentes", ["Cápsulas conectadas", "Fotos, vídeos e recados", "Exportação das memórias"]],
      ["Armazenamento", ["20 GB compartilhados", "Mínimo de 36 meses por evento (ampliável)"]]
    ]
  }
];

function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="mono section-label">{children}</div>;
}

function MarketingPhoto({ src, alt, height }: { src: string; alt: string; height?: number }) {
  return (
    <div className="marketing-photo" style={height ? { height } : undefined}>
      <img src={src} alt={alt} loading="lazy" decoding="async" />
    </div>
  );
}

function CheckList({ items, light = false }: { items: string[]; light?: boolean }) {
  return (
    <ul className="check-list">
      {items.map((item) => (
        <li key={item}>
          <span className="check-dot" />
          <span style={{ color: light ? "rgba(247,238,219,.9)" : "var(--ink)" }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function StorageSection() {
  return (
    <section id="armazenamento" className="shell landing-section">
      <SectionLabel>armazenamento - em GB</SectionLabel>
      <div className="section-head">
        <h2 className="display-i">O que <span>cabe</span> na sua cápsula.</h2>
        <p>sem cobrança por convidado - sem cota por pessoa, só espaço para preencher como quiser</p>
      </div>
      <div className="storage-grid">
        {storagePlans.map((plan) => (
          <article key={plan.label} className={`storage-card ${plan.dark ? "dark" : ""}`}>
            <div className="mono storage-kicker">plano - {plan.label.toLowerCase()}</div>
            <div className="storage-capacity">
              <strong>{plan.capacity}</strong>
              <span>{plan.note}</span>
            </div>
            <p>{plan.desc}</p>
            {plan.rows ? (
              <div className="gb-rows">
                <div className="mono gb-title">cabe, por exemplo</div>
                {plan.rows.map(([label, value, share]) => (
                  <div className="gb-row" key={label}>
                    <span>{label}</span>
                    <div><i style={{ width: `${share}%` }} /></div>
                    <b>{value}</b>
                  </div>
                ))}
              </div>
            ) : (
              <div className="storage-note">Sem cápsula permanente. Para guardar, comece em Cápsula.</div>
            )}
          </article>
        ))}
      </div>
      <div className="soft-note"><b>Expanda quando quiser.</b> Se o evento for maior que o esperado, adicione +5, +10, +25 ou +50 GB.</div>
    </section>
  );
}

export function TransformationSection() {
  const cards = [
    {
      tag: "Antes",
      title: "Convite",
      schedule: `criando em ${mavieJourneyDates.creating}`,
      color: "var(--coral)",
      bg: "#fbe3cc",
      preview: <MarketingInvitePreview />
    },
    {
      tag: "Durante",
      title: "Mural ao vivo",
      schedule: `festa em ${mavieJourneyDates.event} · 30 dias depois de criar`,
      color: "var(--gold)",
      bg: "#ffe9bd",
      preview: <MarketingMuralPreview />
    },
    {
      tag: "Depois - para sempre",
      title: "Cápsula",
      schedule: `reaberta em ${mavieJourneyDates.capsule} · 1 ano depois da festa`,
      color: "var(--violet)",
      bg: "#e5d5f2",
      preview: <MarketingCapsulePreview />
    }
  ] as const;

  return (
    <section id="diferencial" className="shell landing-section">
      <SectionLabel>o diferencial</SectionLabel>
      <h2 className="display-i feature-title">Não somos um app de <span className="strike">convite</span>.<br />Somos uma <span>cápsula do tempo</span>.</h2>
      <p className="feature-copy">
        O mesmo endereço vive três momentos: você cria o convite, os convidados alimentam o mural no dia da festa e,
        um ano depois, a família reabre a cápsula para reviver os melhores instantes daquele dia.
      </p>
      <div className="transform-strip">
        <div className="mono strip-url">praesentia.com/e/mavie-1-ano</div>
        <div className="transform-grid">
          {cards.map((card) => (
            <article key={card.title} className="phase-card" style={{ background: card.bg }}>
              <div className="phase-dot"><span style={{ background: card.color }} /><small className="mono">{card.tag}</small></div>
              <h3 className="display-i">{card.title}</h3>
              <p className="phase-schedule">{card.schedule}</p>
              {card.preview}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedCapsulesSection() {
  const items = [
    ["2024", "Casamento João e Ana", "412 fotos - 38 vídeos", "-2deg", marketingImages.featured.wedding, "Casamento João e Ana"],
    ["2025", "Formatura Eng. UFMG", "186 fotos - 22 vídeos", "3deg", marketingImages.featured.graduation, "Formatura universitária"],
    ["2026", "Mavie Fontinhas - 1 aninho", "247 fotos - 38 vídeos", "-3deg", marketingImages.featured.mavie, "Aniversário de 1 ano da Mavie Fontinhas"],
    ["2026", "Reveillon na cobertura", "94 fotos - 12 vídeos", "2deg", marketingImages.featured.reveillon, "Reveillon na cobertura"]
  ] as const;

  return (
    <section className="shell landing-section">
      <div className="inline-head">
        <h2 className="display-i">Cápsulas em destaque</h2>
        <p>memórias compartilhadas pelos próprios anfitriões</p>
      </div>
      <div className="featured-grid">
        {items.map(([year, title, stat, rotate, image, alt], index) => (
          <article key={title} className="polaroid featured-polaroid" style={{ transform: `rotate(${rotate})` }}>
            <MarketingPhoto src={image} alt={alt} height={170} />
            <div className="featured-meta"><span className="mono">{year}</span>{index === 2 && <b>destaque</b>}</div>
            <h3 className="display-i">{title}</h3>
            <p>{stat}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function LifeCapsulesSection() {
  const years = [
    ["2025", "chá da Mavie Fontinhas", "88 fotos", marketingImages.timeline.cha, "Chá de bebê da Mavie Fontinhas"],
    ["2026", "1 aninho", "247 fotos", marketingImages.timeline.mavie1, "Festa de 1 ano da Mavie Fontinhas"],
    ["2028", "3 anos", "184 fotos", marketingImages.timeline.years3, "Aniversário de 3 anos da Mavie Fontinhas"],
    ["2030", "5 anos", "203 fotos", marketingImages.timeline.years5, "Aniversário de 5 anos da Mavie Fontinhas"],
    ["2032", "7 anos", "176 fotos", marketingImages.timeline.years7, "Aniversário de 7 anos da Mavie Fontinhas"],
    ["2043", "18 anos", "aguardando", null, ""]
  ] as const;

  return (
    <section className="shell landing-section">
      <SectionLabel>a visao longa</SectionLabel>
      <h2 className="display-i feature-title">Quando a Mavie Fontinhas tiver 18,<br />ela <span>abre tudo isso</span>.</h2>
      <p className="feature-copy">
        Cada festa vira uma cápsula conectada na linha do tempo dela — aniversários, chás e celebrações em família,
        guardados ano após ano.
      </p>
      <p className="life-demo-banner">
        <strong>Exemplo fictício.</strong> A timeline abaixo ilustra como a família acompanha as cápsulas da Mavie Fontinhas ao longo dos anos — apenas para você entender o produto.
      </p>
      <div className="life-timeline">
        <div className="life-header">
          <div className="avatar-mark">M</div>
          <div><b className="display-i">Mavie Fontinhas</b><small>nascida em jan/2025 · festas guardadas desde o chá de bebê</small></div>
          <span>visualização da família - privado</span>
        </div>
        <div className="timeline-row">
          {years.map(([year, label, stat, image, alt], index) => (
            <article key={year + label}>
              <div className={`timeline-photo ${image ? "" : "empty"}`}>
                {image ? (
                  <>
                    <MarketingPhoto src={image} alt={alt} height={90} />
                    <small>{stat}</small>
                  </>
                ) : (
                  <>
                    <span>aguardando<br />nova cápsula</span>
                    <small>{stat}</small>
                  </>
                )}
              </div>
              <i className={index === 1 ? "hot" : ""} />
              <b className="display">{year}</b>
              <p>{label}</p>
            </article>
          ))}
        </div>
        <div className="life-footer">
          <em>"presença - do latim praesentia - o que está aqui, agora"</em>
          <div className="life-footer-actions">
            <span className="life-demo-note">Demonstração · perfil e números são fictícios</span>
            <Link href="/eu">ver meu perfil de presença</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PrivacySection() {
  return (
    <section id="seguranca" className="shell landing-section">
      <SectionLabel>privacidade</SectionLabel>
      <h2 className="display-i feature-title">Pensado pra Mavie Fontinhas.</h2>
      <p className="feature-copy">Mas cabe no churrasco dos amigos, no casamento, no aniversário e em qualquer evento particular.</p>
      <div className="privacy-grid">
        {privacyItems.map(([title, text], index) => (
          <article key={title} className={index === 5 ? "dark card" : "card"}>
            <span style={{ background: ["var(--coral)", "var(--violet)", "var(--green)", "var(--gold)", "var(--sky)", "var(--ink)"][index] }}>{index + 1}</span>
            <h3 className="display">{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PrintedAlbumSection() {
  return (
    <section className="shell landing-section">
      <div className="album-card">
        <div>
          <SectionLabel>complemento - papel</SectionLabel>
          <h2 className="display-i">Suas memórias,<br /><span>em papel.</span></h2>
          <p>As fotos guardadas na sua cápsula podem virar um álbum impresso personalizado: capa rígida, papel fotográfico premium e layout assinado pela Praesentia.</p>
          <CheckList items={["Você escolhe quais fotos entram", "Layout limpo, assinado pela Praesentia", "Capa dura, formato A4", "Envio para todo o Brasil"]} />
          <div className="soft-note small"><b>Valor sob medida</b> pela quantidade de fotos selecionadas.</div>
        </div>
        <div className="book-stage">
          <div className="book back" />
          <div className="book front"><small className="mono">Praesentia — álbum</small><b className="display-i">Mavie Fontinhas,<br />1 ano.</b><span>2026</span></div>
          <div className="polaroid mini">
            <MarketingPhoto src={marketingImages.timeline.favorite} alt="Foto favorita da Mavie Fontinhas no álbum impresso" height={64} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function PricingSection() {
  return (
    <section id="precos" className="pricing-stage">
      <div className="shell">
        <SectionLabel>planos</SectionLabel>
        <h2 className="display-i">Presença hoje.<br /><span>Memórias para sempre.</span></h2>
        <p>Seu evento se transforma em um endereço vivo que acompanha antes, durante e depois.</p>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article key={plan.name} className={`price-card ${plan.featured ? "featured" : ""}`}>
              {plan.featured && <span className="price-badge">mais escolhido</span>}
              <div className="mono price-tier">plano - {plan.name.toLowerCase()}</div>
              <h3 className="display-i">{plan.name}</h3>
              <p>{plan.subtitle}</p>
              <div className="price-line"><strong className="display">{plan.price}</strong><span className="mono">{plan.meta}</span></div>
              {plan.sections.map(([label, items]) => (
                <div key={label as string} className="price-section">
                  <div className="mono">{label as string}</div>
                  <CheckList items={items as string[]} light={plan.featured} />
                </div>
              ))}
              <Link className={plan.featured ? "btn price-cta" : "btn secondary price-cta"} href="/criar">{plan.cta}</Link>
            </article>
          ))}
        </div>
        <div className="storage-extra">
          <div><SectionLabel>extras - cápsula</SectionLabel><h3 className="display-i">Expanda sua cápsula.</h3></div>
          <p>Pagamento único, válido durante o período da cápsula.</p>
          {[["+5", "R$19"], ["+10", "R$29"], ["+25", "R$49"], ["+50", "R$89"]].map(([gb, price]) => (
            <button key={gb}><b className="display">{gb}</b><span className="mono">GB</span><strong>{price}</strong></button>
          ))}
        </div>
        <blockquote className="display-i">Porque os melhores momentos<br /><span>merecem ser revividos.</span></blockquote>
      </div>
    </section>
  );
}

export function FinalCTASection() {
  return (
    <section className="shell landing-section">
      <div className="final-cta">
        <span className="pill">grátis — sem cartão</span>
        <h2 className="display-i">O próximo evento que você vai amar começa agora.</h2>
        <p>Crie o convite em minutos e transforme a noite em uma cápsula do tempo que você poderá revisitar.</p>
        <div><Link className="btn" href="/criar">Criar meu evento</Link><Link className="btn secondary" href="/evento/mavie-1-ano">Ver demo da Mavie Fontinhas</Link></div>
      </div>
    </section>
  );
}

export function FAQSection() {
  return (
    <section id="faq" className="shell faq-section">
      <h2 className="display-i">Perguntas frequentes</h2>
      <div>
        {faqs.map(([question, answer]) => (
          <details key={question}>
            <summary className="display">{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <PraesentiaLogo markHeight={34} wordmarkSize={22} withTape withShadow={false} />
          <p>Eventos particulares, memórias permanentes e cápsulas do tempo com controle do responsável.</p>
          <Link className="btn" href="/criar">criar evento</Link>
        </div>
        <nav><b>Produto</b><Link href="#como-funciona">como funciona</Link><Link href="#precos">preços</Link><Link href="/eu">meu perfil</Link></nav>
        <nav><b>Conta</b><Link href="/login">entrar</Link><Link href="/dashboard">responsável</Link><Link href="/admin">admin</Link></nav>
        <nav>
          <b>Legal</b>
          {LEGAL_PAGES.map(({ href, label }) => (
            <Link key={href} href={href}>{label.toLowerCase()}</Link>
          ))}
          <Link href="#faq">perguntas frequentes</Link>
        </nav>
      </div>
      <div className="site-footer-bottom shell">
        <p>PRAESENTIA © 2026 · Todo momento começa com uma presença.</p>
      </div>
    </footer>
  );
}
