// shared.jsx — dados do evento herói, ícones e primitivas reutilizadas

const EVENT = {
  hostFirst: 'Camila',
  hostLast: 'Andrade',
  child: 'Mavie',
  age: '1',
  fullTitle: 'Mavie · 1 ano',
  theme: 'Jardim Encantado',
  dateLong: 'sábado, 14 de março de 2026',
  dateShort: 'SAB · 14 MAR · 2026',
  weekday: 'sábado',
  day: '14',
  monthShort: 'mar',
  year: '2026',
  timeStart: '15h00',
  timeEnd: '19h00',
  venueName: 'Quintal das Acácias',
  venueAddr: 'R. das Hortênsias, 88 — Jardim Botânico',
  city: 'São Paulo',
  rsvpDeadline: '07 mar',
  countdown: { d: 18, h: 7, m: 42, s: 16 },
  url: 'praesentia.com/e/mavie-1-ano',
  confirmados: 47,
  total: 62,
};

const PALETTE_A = {
  bg: '#F7EEDB', bg2: '#EFE2C6', card: '#FFFAF0',
  ink: '#1B1209', ink2: '#5A4A36',
  coral: '#FF6B5C', sol: '#FFB23E', ceu: '#6AB7E8',
  uva: '#B69AE8', jardim: '#6FBF73', tape: '#FFE26B',
};
const PALETTE_B = {
  bg: '#EFEAD8', card: '#FFFFFF',
  ink: '#0E0B14', ink2: '#5C5366',
  magenta: '#E83E8C', azul: '#2A5BFF', mostarda: '#FFC93C',
  jade: '#00B27A', ametista: '#6B3AE8', noite: '#131022',
};

// ─── icons (single-color, line) ─────────────────────────────
const Ico = {
  pin: (p) => (<svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>),
  cal: (p) => (<svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>),
  clock: (p) => (<svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>),
  heart: (p) => (<svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill={p.fill||"none"} stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-4.6-9.3-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.3 6c-2.3 4.4-9.3 9-9.3 9z"/></svg>),
  msg: (p) => (<svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/></svg>),
  cam: (p) => (<svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="3.5"/></svg>),
  play: (p) => (<svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill="currentColor"><path d="M8 5v14l11-7z"/></svg>),
  share: (p) => (<svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14"/></svg>),
  spark: (p) => (<svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.6 4.6L18 9.2l-4.4 1.6L12 15l-1.6-4.2L6 9.2l4.4-1.6z"/><path d="M19 15l.8 2 2 .8-2 .8L19 21l-.8-2-2-.8 2-.8z"/></svg>),
  plus: (p) => (<svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill="none" stroke="currentColor" strokeWidth={p.w||2} strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>),
  check: (p) => (<svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill="none" stroke="currentColor" strokeWidth={p.w||2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg>),
  arrow: (p) => (<svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>),
  gift: (p) => (<svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18v9H3zM12 7v14M3 7h18v5H3zM7.5 7a2.5 2.5 0 0 1 0-5C10 2 12 7 12 7s-2 0-4.5 0zM16.5 7a2.5 2.5 0 0 0 0-5C14 2 12 7 12 7s2 0 4.5 0z"/></svg>),
  map: (p) => (<svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2zM9 3v16M15 5v16"/></svg>),
  dots: (p) => (<svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>),
  bell: (p) => (<svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill="none" stroke="currentColor" strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0v5l2 3H4l2-3z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>),
  send: (p) => (<svg viewBox="0 0 24 24" width={p.s||16} height={p.s||16} fill="currentColor"><path d="M3 12 21 3l-4 18-5-7-9-2z"/></svg>),
};

// ─── tiny avatar with monogram + tint ───────────────────────
function Avatar({ name = 'AA', tint = '#FF6B5C', size = 28, ink = '#fff', ring }) {
  const init = name.split(/\s+/).map(p => p[0]).slice(0,2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, background: tint, color: ink,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700,
      fontSize: Math.round(size * 0.38), letterSpacing: 0.5,
      boxShadow: ring ? `0 0 0 2px ${ring}` : 'none', flexShrink: 0,
    }}>{init}</div>
  );
}

function AvatarStack({ people, size = 22, ring = '#fff' }) {
  return (
    <div style={{ display: 'inline-flex' }}>
      {people.map((p, i) => (
        <div key={i} style={{ marginLeft: i ? -8 : 0 }}>
          <Avatar name={p.name} tint={p.tint} size={size} ring={ring} />
        </div>
      ))}
    </div>
  );
}

// SVG striped placeholder (per default aesthetic rule)
function Placeholder({ w = '100%', h = 120, label = 'photo', bg = '#E7DCC4', stripe = 'rgba(0,0,0,0.07)', radius = 8, dark = false, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius, position: 'relative',
      background: bg, overflow: 'hidden',
      backgroundImage: `repeating-linear-gradient(135deg, ${stripe} 0 6px, transparent 6px 12px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
    }}>
      <span style={{
        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
        fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase',
        color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
      }}>{label}</span>
    </div>
  );
}

// Confetti SVG decoration (Direction A)
function ConfettiBurst({ style = {}, scale = 1, palette = PALETTE_A }) {
  const dots = [
    { x: 12, y: 30, r: 4, c: palette.coral, rot: 0 },
    { x: 36, y: 12, r: 3, c: palette.sol, rot: 0, type: 'tri' },
    { x: 60, y: 26, r: 5, c: palette.uva, rot: 0 },
    { x: 84, y: 8, r: 3.5, c: palette.ceu, rot: 0 },
    { x: 102, y: 30, r: 4, c: palette.jardim, rot: 0, type: 'tri' },
    { x: 22, y: 60, r: 3, c: palette.sol, rot: 0 },
    { x: 50, y: 70, r: 4.5, c: palette.coral, rot: 0 },
    { x: 78, y: 60, r: 3.5, c: palette.uva, rot: 0 },
    { x: 100, y: 72, r: 4, c: palette.ceu, rot: 0 },
  ];
  return (
    <svg width={120 * scale} height={86 * scale} viewBox="0 0 120 86" style={style}>
      {dots.map((d, i) => d.type === 'tri'
        ? <polygon key={i} points={`${d.x},${d.y - d.r} ${d.x + d.r},${d.y + d.r} ${d.x - d.r},${d.y + d.r}`} fill={d.c}/>
        : <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.c}/>
      )}
    </svg>
  );
}

// Concentric rings (Direction B — cápsula metáfora)
function RingMark({ size = 80, color = '#0E0B14', count = 4, dot, style = {} }) {
  const rings = Array.from({ length: count });
  return (
    <div style={{ position: 'relative', width: size, height: size, ...style }}>
      {rings.map((_, i) => (
        <div key={i} style={{
          position: 'absolute', inset: (size / 2 / count) * i,
          borderRadius: 999, border: `1.5px solid ${color}`,
        }}/>
      ))}
      {dot && <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%,-50%)',
        width: size * 0.18, height: size * 0.18, borderRadius: 999, background: dot,
      }}/>}
    </div>
  );
}

// Browser-window-ish minimal frame for desktop artboards (we draw our own to control palette)
function Desktop({ url = EVENT.url, palette = 'a', w = 1280, h = 800, children, dark = false }) {
  const isDark = dark;
  const chrome = isDark ? '#1A1830' : '#E5DECE';
  const bar = isDark ? '#0F0E1A' : '#FAF3E2';
  const ink = isDark ? '#EEEAE0' : '#1B1209';
  const muted = isDark ? '#8A839A' : '#7A6B52';
  return (
    <div style={{
      width: w, height: h, background: chrome,
      borderRadius: 14, overflow: 'hidden', position: 'relative',
      boxShadow: '0 30px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* chrome top */}
      <div style={{
        height: 44, background: bar, display: 'flex', alignItems: 'center',
        padding: '0 14px', gap: 12, borderBottom: `1px solid ${isDark ? '#2A2640' : '#E5DECE'}`,
      }}>
        <div style={{ display: 'flex', gap: 7 }}>
          <span style={{ width: 12, height: 12, borderRadius: 999, background: '#FF5F57' }}/>
          <span style={{ width: 12, height: 12, borderRadius: 999, background: '#FEBC2E' }}/>
          <span style={{ width: 12, height: 12, borderRadius: 999, background: '#28C840' }}/>
        </div>
        <div style={{
          flex: 1, height: 28, background: isDark ? '#231F38' : '#FFF7E6',
          borderRadius: 8, display: 'flex', alignItems: 'center',
          padding: '0 12px', gap: 8, color: muted,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
          border: `1px solid ${isDark ? '#2A2640' : '#E5DECE'}`,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2.5" strokeLinecap="round">
            <rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/>
          </svg>
          <span style={{ color: ink, opacity: 0.85 }}>{url}</span>
        </div>
        <div style={{ display: 'flex', gap: 14, color: muted }}>
          <span style={{ width: 16, height: 2, background: muted, marginTop: 6 }}/>
          <div style={{ width: 16, height: 12, border: `1.5px solid ${muted}`, borderRadius: 2 }}/>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

// Mobile frame wrapper — uses starter IOSDevice
function Phone({ children, dark = false, w = 390, h = 844, statusTime = '15:24' }) {
  return (
    <IOSDevice width={w} height={h} dark={dark}>
      <div style={{ height: '100%', overflow: 'hidden' }}>{children}</div>
    </IOSDevice>
  );
}

Object.assign(window, {
  EVENT, PALETTE_A, PALETTE_B, Ico, Avatar, AvatarStack,
  Placeholder, ConfettiBurst, RingMark, Desktop, Phone,
});
