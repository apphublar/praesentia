// site-event.jsx — página do evento /e/mavie-1-ano com seletor de fase

function SiteEvent({ goto, phase: phaseProp }) {
  const p = PALETTE_A;
  const [phase, setPhase] = React.useState(phaseProp || 'antes');

  return (
    <div style={{ background: p.bg, color: p.ink, position: 'relative', minHeight: '100vh' }}>
      <Paper/>

      {/* phase chip + breadcrumb */}
      <div style={{
        position: 'sticky', top: 60, zIndex: 10,
        background: 'rgba(247,238,219,0.92)',
        backdropFilter: 'blur(8px)',
        padding: '10px 6vw',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        borderBottom: `1px solid rgba(27,18,9,0.10)`,
      }}>
        <span className="font-a-body" onClick={() => goto('/')} style={{
          fontSize: 12.5, color: p.ink2, cursor: 'pointer',
        }}>← memories</span>
        <span style={{ color: p.ink2 }}>/</span>
        <span className="font-mono" style={{ fontSize: 11.5, color: p.ink, letterSpacing: 0.3 }}>{EVENT.url}</span>
        <span style={{
          padding: '4px 10px', borderRadius: 999,
          background: phase === 'antes' ? p.coral : phase === 'durante' ? p.sol : p.uva,
          color: phase === 'durante' ? p.ink : '#fff',
          fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
          fontFamily: 'Plus Jakarta Sans',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          {phase === 'durante' && <span style={{ width: 6, height: 6, borderRadius: 999, background: p.ink }} className="live-dot"/>}
          fase · {phase}
        </span>
      </div>

      {/* content per phase */}
      {phase === 'antes' && <EventInvite goto={goto}/>}
      {phase === 'durante' && <EventLive/>}
      {phase === 'depois' && <EventMemory/>}

      {/* floating phase switcher */}
      <PhaseSwitcher phase={phase} onChange={setPhase}/>
    </div>
  );
}

function PhaseSwitcher({ phase, onChange }) {
  const p = PALETTE_A;
  const opts = [
    { v: 'antes', l: 'Antes · convite', c: p.coral },
    { v: 'durante', l: 'Durante · ao vivo', c: p.sol },
    { v: 'depois', l: 'Depois · memória', c: p.uva },
  ];
  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      background: p.ink, borderRadius: 999, padding: 4, zIndex: 100,
      display: 'flex', gap: 2,
      boxShadow: '0 12px 30px rgba(0,0,0,0.22)',
      border: `1px solid rgba(247,238,219,0.18)`,
    }}>
      <span className="font-mono" style={{
        padding: '8px 12px', color: p.sol, fontSize: 9, letterSpacing: 0.6,
        textTransform: 'uppercase', alignSelf: 'center', opacity: 0.8,
      }}>demo</span>
      {opts.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} className="font-a-body" style={{
          background: phase === o.v ? o.c : 'transparent',
          color: phase === o.v ? (o.v === 'durante' ? p.ink : '#fff') : p.bg,
          padding: '8px 14px', borderRadius: 999, border: 0, cursor: 'pointer',
          fontSize: 12, fontWeight: phase === o.v ? 700 : 500,
          transition: 'all 0.2s ease',
        }}>{o.l}</button>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// FASE 1 — Convite (responsivo, web)
// ────────────────────────────────────────────────────────────
function EventInvite({ goto }) {
  const p = PALETTE_A;
  return (
    <div style={{ padding: '40px 6vw 120px', maxWidth: 1240, margin: '0 auto', position: 'relative' }}>
      {/* hero */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,0.95fr)',
        gap: 36, alignItems: 'center',
      }} className="grid-collapse">
        <div style={{ position: 'relative' }}>
          <ConfettiBurst style={{ position: 'absolute', top: -22, left: -12 }} scale={1.1}/>
          <div className="font-a-body" style={{ fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', color: p.ink2, fontWeight: 700 }}>
            um convite especial pra você
          </div>
          <h1 className="font-a-display-i" style={{
            margin: '14px 0 0', fontSize: 'clamp(72px, 12vw, 168px)',
            lineHeight: 0.86, letterSpacing: -0.02,
          }}>{EVENT.child},</h1>
          <h2 className="font-a-display" style={{
            margin: '6px 0 0', fontSize: 'clamp(34px, 4.5vw, 64px)', lineHeight: 0.95, color: p.coral,
          }}>1 ano de <span className="hand-underline">jardim</span></h2>
          <p className="font-a-display-i" style={{
            fontSize: 'clamp(18px, 1.6vw, 24px)', lineHeight: 1.4, color: p.ink,
            maxWidth: 540, marginTop: 26,
          }}>
            Sob a sombra das acácias, no quintal favorito da vovó, vamos celebrar
            o primeiro giro em volta do sol da nossa pequena.
          </p>
          <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn font-a-body" onClick={() => goto('/e/mavie-1-ano/rsvp')} style={{
              background: p.ink, color: p.bg, padding: '15px 22px', borderRadius: 12,
              fontSize: 15, fontWeight: 700, boxShadow: `4px 5px 0 ${p.sol}`,
            }}>
              <Ico.check s={16}/> Confirmar presença
            </button>
            <button className="btn font-a-body" style={{
              background: 'transparent', color: p.ink, padding: '15px 18px', borderRadius: 12,
              fontSize: 14, fontWeight: 600, border: `1.5px solid ${p.ink}`,
            }}>
              <Ico.share s={15}/> Enviar pelo WhatsApp
            </button>
          </div>
          <div className="dotted" style={{ color: p.ink, marginTop: 36, opacity: 0.4 }}/>
          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Row label="quando" value={EVENT.dateLong} sub={`${EVENT.timeStart} — ${EVENT.timeEnd}`} icon={<Ico.cal s={16}/>} accent={p.coral}/>
            <Row label="onde" value={EVENT.venueName} sub={EVENT.venueAddr} icon={<Ico.pin s={16}/>} accent={p.ceu}/>
          </div>
        </div>

        <div style={{ position: 'relative', minHeight: 480 }}>
          <div className="polaroid float" style={{
            position: 'absolute', top: 8, left: '6%', transform: 'rotate(-7deg)', width: 240,
          }}>
            <Placeholder w={220} h={240} label="mavie · 11 meses" bg={p.bg2}/>
            <div className="font-a-display-i" style={{ fontSize: 13, color: p.ink, marginTop: 8, textAlign: 'center' }}>nossa pequena · 11 meses</div>
          </div>
          <div className="polaroid float" style={{
            position: 'absolute', top: 50, right: '0%', transform: 'rotate(6deg)', width: 260,
            animationDelay: '0.5s', zIndex: 2,
          }}>
            <Placeholder w={240} h={270} label="quintal das acácias" bg="#D9E8DC"/>
            <div className="font-a-display-i" style={{ fontSize: 13, color: p.ink, marginTop: 8, textAlign: 'center' }}>onde a festa será</div>
          </div>
          <div className="tape" style={{ top: 0, left: '34%', transform: 'rotate(-4deg)' }}/>
          <div className="tape" style={{ top: 42, right: '34%', transform: 'rotate(8deg)', background: 'rgba(255,107,92,0.7)' }}/>
        </div>
      </div>

      {/* countdown + confirmados */}
      <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }} className="grid-collapse">
        <div style={{
          background: p.uva, color: '#FFF7EE',
          borderRadius: 18, border: `1.5px solid ${p.ink}`,
          padding: '22px 26px', display: 'flex', alignItems: 'center', gap: 22,
          boxShadow: `5px 6px 0 ${p.ink}`, flexWrap: 'wrap',
        }}>
          <div>
            <div className="font-a-body" style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.85, fontWeight: 700 }}>contagem regressiva</div>
            <div className="font-a-display-i" style={{ fontSize: 32, lineHeight: 1, marginTop: 4 }}>faltam</div>
          </div>
          <div style={{ display: 'flex', gap: 18, marginLeft: 'auto' }}>
            {[{n: EVENT.countdown.d, l: 'dias'},{n: EVENT.countdown.h, l: 'horas'},{n: EVENT.countdown.m, l: 'min'},{n: EVENT.countdown.s, l: 'seg'}].map((x,i)=>(
              <div key={i} style={{ textAlign: 'center' }}>
                <div className="font-a-display" style={{ fontSize: 'clamp(36px, 4vw, 52px)', lineHeight: 1 }}>{String(x.n).padStart(2,'0')}</div>
                <div className="font-a-body" style={{ fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.85, fontWeight: 600 }}>{x.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{
          padding: '18px 22px', background: p.card, borderRadius: 18,
          border: `1.5px solid ${p.ink}`, display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <AvatarStack people={[
            { name: 'Ana B', tint: p.coral },{ name: 'Pedro L', tint: p.ceu },
            { name: 'Lu M', tint: p.sol },{ name: 'Caio R', tint: p.jardim },
          ]} size={32}/>
          <div style={{ flex: 1 }}>
            <div className="font-a-display" style={{ fontSize: 18, color: p.ink, lineHeight: 1.1 }}>
              <b>{EVENT.confirmados}</b> de {EVENT.total} confirmaram
            </div>
            <div className="font-a-body" style={{ fontSize: 12, color: p.ink2, marginTop: 2 }}>
              vovó Maria, tio Caio e mais 45 famílias
            </div>
          </div>
        </div>
      </div>

      {/* recado do anfitrião */}
      <div style={{ marginTop: 32 }}>
        <div className="font-a-body" style={{ fontSize: 11, color: p.ink2, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>recado da Camila & Diego</div>
        <p className="font-a-display-i" style={{ fontSize: 'clamp(22px, 2.4vw, 32px)', lineHeight: 1.32, color: p.ink, margin: '8px 0 0', maxWidth: 880 }}>
          "A nossa Mavie chegou no comecinho de 2025 e mudou tudo. Queremos celebrar com você esse primeiro giro em volta do sol — vem com a gente. Use tons de jardim no look se puder!"
        </p>
      </div>

      {/* tabs: presentes / FAQ / local */}
      <EventTabs/>
    </div>
  );
}

function EventTabs() {
  const p = PALETTE_A;
  const [tab, setTab] = React.useState('presentes');
  return (
    <div style={{ marginTop: 40 }}>
      <div style={{
        display: 'flex', gap: 8, borderBottom: `1px solid rgba(27,18,9,0.18)`,
      }}>
        {['presentes','perguntas','local'].map(t => (
          <button key={t} onClick={() => setTab(t)} className="font-a-body" style={{
            background: 'transparent', border: 0, cursor: 'pointer',
            padding: '14px 8px', fontSize: 14, fontWeight: tab === t ? 700 : 500,
            color: tab === t ? p.ink : p.ink2,
            borderBottom: tab === t ? `2.5px solid ${p.coral}` : '2.5px solid transparent',
            marginBottom: -1,
          }}>{t}</button>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        {tab === 'presentes' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="grid-collapse-3">
            {[
              { item: 'Livrinho de pano', loja: 'A Pequena Biblioteca', price: 'R$ 78', c: p.coral, taken: false },
              { item: 'Tapete sensorial', loja: 'Brincar & Crescer', price: 'R$ 220', c: p.jardim, taken: true },
              { item: 'Bichinho de crochê', loja: 'Atelier da Lila', price: 'R$ 135', c: p.sol, taken: false },
              { item: 'Kit de empilhar', loja: 'Brincar & Crescer', price: 'R$ 89', c: p.ceu, taken: false },
              { item: 'Quadro pra quarto', loja: 'Estúdio Plumas', price: 'R$ 180', c: p.uva, taken: false },
              { item: 'Cota vaquinha · livre', loja: 'pix', price: 'qualquer valor', c: p.coral, taken: false, pix: true },
            ].map((g,i)=>(
              <div key={i} style={{
                background: p.card, padding: '14px 16px',
                border: `1.5px solid ${p.ink}`, borderRadius: 14,
                display: 'flex', alignItems: 'flex-start', gap: 12,
                opacity: g.taken ? 0.55 : 1,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: g.c, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}><Ico.gift s={18}/></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-a-display" style={{ fontSize: 17, color: p.ink, lineHeight: 1.15 }}>{g.item}</div>
                  <div className="font-a-body" style={{ fontSize: 12, color: p.ink2, marginTop: 2 }}>{g.loja}</div>
                  <div style={{
                    marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span className="font-mono" style={{ fontSize: 11.5, color: p.ink, letterSpacing: 0.3 }}>{g.price}</span>
                    {g.taken
                      ? <span className="pill" style={{ background: p.bg2, color: p.ink2, fontSize: 9.5 }}>tomado</span>
                      : <span className="pill" style={{ background: p.ink, color: p.bg, fontSize: 9.5 }}>escolher</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'perguntas' && (
          <div style={{ maxWidth: 760 }}>
            {[
              { q: 'Posso levar criança?', a: 'Sim! A festa é pra família toda — tem espaço pra brincar e a equipe terá uma monitora a partir das 15h.' },
              { q: 'Tem estacionamento?', a: 'Sim, 30 vagas no próprio Quintal. Se lotar tem zona azul na rua das Hortênsias.' },
              { q: 'Comida e bebida?', a: 'Buffet leve, bolo, sucos naturais e bebidas pra adultos. Avisa a Camila se tem alguma restrição.' },
              { q: 'Posso chegar atrasado?', a: 'Tudo bem. Os parabéns serão por volta das 17h, mas a festa continua até as 19h.' },
            ].map((f,i)=>(
              <FAQRow key={i} q={f.q} a={f.a}/>
            ))}
          </div>
        )}
        {tab === 'local' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18, alignItems: 'stretch' }} className="grid-collapse">
            <div style={{ background: '#D9E8DC', borderRadius: 16, position: 'relative', border: `1.5px solid ${p.ink}`, minHeight: 320, overflow: 'hidden' }}>
              {/* fake map */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `linear-gradient(rgba(27,18,9,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(27,18,9,0.06) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              }}/>
              <svg viewBox="0 0 400 320" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <path d="M-10 80 Q 100 60, 200 140 T 410 100" fill="none" stroke="#FFB23E" strokeWidth="6" strokeLinecap="round" opacity="0.7"/>
                <path d="M40 -10 Q 90 130, 180 200 T 240 330" fill="none" stroke="#fff" strokeWidth="20" strokeLinecap="round" opacity="0.7"/>
                <path d="M40 -10 Q 90 130, 180 200 T 240 330" fill="none" stroke={p.ink} strokeWidth="1.5" strokeDasharray="6 4" opacity="0.3"/>
              </svg>
              <div style={{ position: 'absolute', left: '46%', top: '50%', transform: 'translate(-50%, -100%)' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50% 50% 50% 0', background: p.coral,
                  transform: 'rotate(-45deg)', boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ transform: 'rotate(45deg)', color: '#fff' }}><Ico.heart s={16} fill="#fff"/></span>
                </div>
              </div>
            </div>
            <div style={{ background: p.card, border: `1.5px solid ${p.ink}`, borderRadius: 16, padding: '18px 20px' }}>
              <div className="font-a-display" style={{ fontSize: 22, color: p.ink }}>{EVENT.venueName}</div>
              <div className="font-a-body" style={{ fontSize: 13, color: p.ink2, marginTop: 4 }}>{EVENT.venueAddr} · {EVENT.city}</div>
              <div className="dotted" style={{ color: p.ink, marginTop: 14, opacity: 0.5 }}/>
              <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                <button className="btn font-a-body" style={{ background: p.ceu, color: '#fff', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
                  <Ico.map s={14}/> Abrir no Google Maps
                </button>
                <button className="btn font-a-body" style={{ background: 'transparent', color: p.ink, padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: `1.5px solid ${p.ink}` }}>
                  <Ico.share s={14}/> Copiar endereço
                </button>
              </div>
              <div style={{ marginTop: 14, background: p.bg2, padding: '10px 12px', borderRadius: 10 }}>
                <div className="font-a-body" style={{ fontSize: 11, color: p.ink2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>chegando</div>
                <div className="font-a-body" style={{ fontSize: 12.5, color: p.ink, marginTop: 4, lineHeight: 1.5 }}>
                  Pelo Uber, peça pra "Quintal das Acácias — portão dos fundos". O portão da frente fica trancado depois das 14h.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// FASE 2 — Ao vivo / Mural
// ────────────────────────────────────────────────────────────
function EventLive() {
  const p = PALETTE_A;
  const [tab, setTab] = React.useState('feed');
  return (
    <div style={{ padding: '32px 6vw 120px', maxWidth: 1240, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div className="font-a-body" style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: p.coral, fontWeight: 700 }}>● ao vivo · sáb 14 mar</div>
        <span className="font-a-body" style={{ marginLeft: 'auto', fontSize: 13, color: p.ink2 }}>
          47 pessoas estão aqui · 156 momentos
        </span>
      </div>
      <h1 className="font-a-display-i" style={{ fontSize: 'clamp(48px, 7vw, 88px)', margin: '10px 0 0', lineHeight: 1.05 }}>
        {EVENT.child} · <span style={{ color: p.coral }}>1 ano</span>
      </h1>

      {/* hero composer + sidebar */}
      <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 22 }} className="grid-collapse">
        {/* main feed */}
        <div>
          {/* tabs */}
          <div style={{
            display: 'flex', gap: 4, padding: 4, background: p.card,
            borderRadius: 12, border: `1.5px solid ${p.ink}`, width: 'fit-content',
          }}>
            {[
              { v: 'feed', l: 'tudo · 156' },
              { v: 'fotos', l: 'fotos · 98' },
              { v: 'videos', l: 'vídeos · 22' },
              { v: 'msgs', l: 'recados · 36' },
            ].map(t => (
              <button key={t.v} onClick={() => setTab(t.v)} className="font-a-body" style={{
                background: tab === t.v ? p.coral : 'transparent',
                color: tab === t.v ? '#fff' : p.ink, border: 0, cursor: 'pointer',
                padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              }}>{t.l}</button>
            ))}
          </div>

          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="grid-collapse-2">
            {[
              { who: 'Ana B', tint: p.coral, time: 'agora', kind: 'photo', h: 220, c: p.bg2, l: 'bolo · 17h12', likes: 12, caption: 'que tarde linda 🌿' },
              { who: 'Pedro L', tint: p.ceu, time: '2 min', kind: 'video', h: 240, c: '#D9E8F4', l: 'vídeo · 00:42', likes: 8 },
              { who: 'tio Caio', tint: p.jardim, time: '4 min', kind: 'message', msg: 'Mavie, que sua vida seja tão linda quanto essa tarde. Tio te ama.', tintM: p.sol },
              { who: 'tia Lila', tint: p.uva, time: '8 min', kind: 'photo', h: 240, c: '#FBE3CC', l: 'coroa de flores', likes: 21 },
              { who: 'Camila', tint: p.coral, time: '12 min', kind: 'photo', h: 200, c: '#D9E8DC', l: 'mavie + jardim', likes: 19 },
              { who: 'vovó Maria', tint: p.uva, time: '15 min', kind: 'message', msg: 'A vovó tá tão feliz que veio pra essa tarde. Te amo, neta.', tintM: p.coral },
              { who: 'Lu M', tint: p.sol, time: '18 min', kind: 'photo', h: 220, c: '#F1D8C9', l: 'os 3 primos', likes: 14 },
              { who: 'Caio R', tint: p.jardim, time: '22 min', kind: 'video', h: 240, c: '#E5D5F2', l: 'vídeo · 01:08', likes: 6 },
            ].map((it, i) => <FeedCard key={i} it={it} p={p}/>)}
          </div>
        </div>

        {/* right side — composer + leaderboard */}
        <div>
          <div style={{
            position: 'sticky', top: 130,
          }}>
            {/* composer */}
            <div style={{
              background: p.card, border: `1.5px solid ${p.ink}`, borderRadius: 16,
              padding: 18, boxShadow: '5px 6px 0 rgba(27,18,9,0.10)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Avatar name="Maria S" tint={p.uva} size={32}/>
                <div>
                  <div className="font-a-display" style={{ fontSize: 14, color: p.ink, lineHeight: 1 }}>seu espaço, Maria</div>
                  <div className="font-a-body" style={{ fontSize: 11, color: p.ink2 }}>1/2 fotos · 0/1 vídeo · 0/1 recado</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { ico: <Ico.cam s={18}/>, l: '+ foto', c: p.coral, used: 1, max: 2 },
                  { ico: <Ico.play s={16}/>, l: '+ vídeo', c: p.ceu, used: 0, max: 1 },
                  { ico: <Ico.msg s={16}/>, l: '+ recado', c: p.uva, used: 0, max: 1 },
                ].map((b,i)=>(
                  <button key={i} className="btn font-a-body" style={{
                    background: 'transparent', border: `1.5px solid ${p.ink}`,
                    padding: '12px 8px', borderRadius: 12,
                    flexDirection: 'column', gap: 4, color: p.ink, cursor: 'pointer',
                  }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: b.c, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{b.ico}</div>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{b.l}</span>
                    <span style={{ fontSize: 9.5, color: p.ink2, fontFamily: 'JetBrains Mono' }}>{b.used}/{b.max}</span>
                  </button>
                ))}
              </div>
              <div className="font-a-body" style={{
                marginTop: 12, padding: '10px 12px', background: p.bg2, borderRadius: 10,
                fontSize: 11.5, color: p.ink2, lineHeight: 1.5,
              }}>
                <Ico.spark s={12}/> &nbsp;Aqui é qualidade. Cada cota fica guardada na cápsula <b>para sempre</b>.
              </div>
            </div>

            {/* presentes mais ativos */}
            <div style={{
              marginTop: 14, background: p.ink, color: p.bg, borderRadius: 16, padding: '16px 18px',
            }}>
              <div className="font-a-body" style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 700, color: p.sol }}>mais publicados agora</div>
              {[
                { who: 'Ana B', tint: p.coral, n: 2 },
                { who: 'tia Lila', tint: p.uva, n: 2 },
                { who: 'Caio R', tint: p.jardim, n: 1 },
              ].map((g,i)=>(
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  <Avatar name={g.who} tint={g.tint} size={26}/>
                  <span className="font-a-body" style={{ fontSize: 13, color: p.bg, flex: 1 }}>{g.who}</span>
                  <span className="font-mono" style={{ fontSize: 11, color: 'rgba(247,238,219,0.7)' }}>{g.n} item · cota cheia</span>
                </div>
              ))}
            </div>

            {/* mini timeline */}
            <div style={{
              marginTop: 14, background: p.card, border: `1.5px solid ${p.ink}`, borderRadius: 16,
              padding: '16px 18px',
            }}>
              <div className="font-a-body" style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 700, color: p.ink2 }}>linha do tempo · hoje</div>
              {[
                { t: '15h00', l: 'começou a festa', c: p.coral, done: true },
                { t: '15h44', l: 'primeira foto · Pedro L', c: p.ceu, done: true },
                { t: '17h12', l: 'parabéns · bolo', c: p.sol, done: true },
                { t: '19h00', l: 'fim · cápsula em 48h', c: p.uva, done: false },
              ].map((e,i)=>(
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, opacity: e.done ? 1 : 0.6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: e.c, border: `1.5px solid ${p.ink}` }}/>
                  <span className="font-mono" style={{ fontSize: 11, color: p.ink2 }}>{e.t}</span>
                  <span className="font-a-body" style={{ fontSize: 13, color: p.ink }}>{e.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedCard({ it, p }) {
  return (
    <div style={{
      background: p.card, border: `1.5px solid ${p.ink}`, borderRadius: 14, padding: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name={it.who} tint={it.tint} size={26}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="font-a-body" style={{ fontSize: 13, fontWeight: 700, color: p.ink }}>{it.who}</div>
          <div className="font-a-body" style={{ fontSize: 10.5, color: p.ink2 }}>{it.time} {it.kind === 'video' && '· vídeo'}</div>
        </div>
        <Ico.dots s={14}/>
      </div>
      {it.kind === 'message' ? (
        <div style={{ marginTop: 10, padding: '16px 18px', background: it.tintM, borderRadius: 10 }}>
          <p className="font-a-display-i" style={{ margin: 0, fontSize: 17, lineHeight: 1.4, color: p.ink }}>"{it.msg}"</p>
        </div>
      ) : (
        <div style={{ marginTop: 10, borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
          <Placeholder w={'100%'} h={it.h} label={it.l} bg={it.c}/>
          {it.kind === 'video' && (
            <span style={{
              position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
              width: 46, height: 46, borderRadius: 999, background: 'rgba(255,255,255,0.95)',
              color: p.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Ico.play s={18}/></span>
          )}
          {it.caption && (
            <div style={{
              position: 'absolute', left: 10, bottom: 10, right: 10,
              background: 'rgba(255,255,255,0.95)', borderRadius: 8,
              padding: '6px 10px', fontFamily: 'Plus Jakarta Sans', fontSize: 12, color: p.ink,
            }}>{it.caption}</div>
          )}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: p.coral }}>
          <Ico.heart s={16} fill={p.coral}/>
          <span className="font-a-body" style={{ fontSize: 12, color: p.ink, fontWeight: 600 }}>{it.likes || 4}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: p.ink2 }}>
          <Ico.msg s={16}/>
          <span className="font-a-body" style={{ fontSize: 12, color: p.ink, fontWeight: 600 }}>0</span>
        </span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// FASE 3 — Memória permanente
// ────────────────────────────────────────────────────────────
function EventMemory() {
  const p = PALETTE_A;
  return (
    <div style={{ padding: '32px 6vw 120px', maxWidth: 1240, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span className="pill" style={{ background: p.jardim, color: '#fff' }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: '#fff' }}/> cápsula permanente
        </span>
        <span className="font-mono" style={{ fontSize: 11, color: p.ink2 }}>aberta em 15 mar 2026 · arquivado para sempre</span>
      </div>
      <h1 className="font-a-display-i" style={{ fontSize: 'clamp(64px, 10vw, 144px)', margin: '14px 0 0', lineHeight: 0.86 }}>
        {EVENT.child}, 1.
      </h1>
      <div className="font-a-display" style={{ fontSize: 'clamp(24px, 3vw, 36px)', color: p.coral, marginTop: 6 }}>
        <span className="hand-underline">jardim encantado</span> · 14 mar 2026
      </div>
      <p className="font-a-display-i" style={{ fontSize: 'clamp(18px, 1.8vw, 26px)', lineHeight: 1.4, color: p.ink, maxWidth: 640, marginTop: 18 }}>
        Foi um sábado de céu limpo. A Mavie usou a coroa de flores que a tia Lila fez. O bolo era de cenoura. Toda essa tarde mora aqui.
      </p>

      {/* stats */}
      <div style={{ marginTop: 26, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="grid-collapse-4">
        {[
          { n: 247, l: 'fotos', c: p.coral },
          { n: 38, l: 'vídeos', c: p.ceu },
          { n: 86, l: 'recados', c: p.uva },
          { n: 47, l: 'pessoas', c: p.jardim },
        ].map((s,i)=>(
          <div key={i} style={{
            background: p.card, padding: '18px 20px', borderRadius: 14,
            border: `1.5px solid ${p.ink}`,
          }}>
            <div className="font-a-display" style={{ fontSize: 'clamp(40px, 4vw, 56px)', color: s.c, lineHeight: 1 }}>{s.n}</div>
            <div className="font-a-body" style={{ fontSize: 11, color: p.ink2, marginTop: 6, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 700 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* highlight */}
      <div style={{ marginTop: 32 }}>
        <div className="font-a-body" style={{ fontSize: 11, color: p.ink2, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>momento destaque</div>
        <div className="polaroid" style={{ marginTop: 12, transform: 'rotate(-1.5deg)', maxWidth: 720 }}>
          <Placeholder w={'100%'} h={360} label="parabéns da vovó · 17h12" bg="#F1D8C9"/>
          <div className="font-a-display-i" style={{ fontSize: 16, color: p.ink, marginTop: 8, textAlign: 'center' }}>
            ♥ parabéns da vovó — escolhido por Camila
          </div>
        </div>
      </div>

      {/* mural masonry */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <h2 className="font-a-display-i" style={{ fontSize: 'clamp(28px, 3vw, 40px)', margin: 0 }}>mural · 371 momentos</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className="pill" style={{ background: p.coral, color: '#fff' }}>tudo</span>
            <span className="pill" style={{ background: p.bg2, color: p.ink2 }}>fotos</span>
            <span className="pill" style={{ background: p.bg2, color: p.ink2 }}>vídeos</span>
            <span className="pill" style={{ background: p.bg2, color: p.ink2 }}>recados</span>
          </div>
        </div>
        <div style={{
          marginTop: 20, columnCount: 4, columnGap: 14,
        }} className="mural-cols">
          {[
            { h: 230, l: 'bolo · 17h12', c: p.bg2, who: 'vovó Maria' },
            { h: 180, l: 'mavie + papai', c: '#F1D8C9', who: 'Ana B' },
            { h: 260, l: 'jardim · 15h44', c: '#D9E8DC', who: 'tio Caio' },
            { h: 200, l: 'vídeo · 00:42', c: '#D9E8F4', isVideo: true, who: 'Lu M' },
            { h: 220, l: '', isText: true, msg: 'Mavie, que sua vida seja sempre cheia de flores e gente boa.', tint: p.sol, who: 'Ana B' },
            { h: 240, l: 'os 3 primos', c: '#FBE3CC', who: 'tia Lila' },
            { h: 160, l: 'coroa · close', c: '#F1D8C9', who: 'Pedro L' },
            { h: 200, l: 'bolo · corte', c: p.bg2, who: 'vovó Maria' },
            { h: 220, l: 'vídeo · 01:08', c: '#D9E8F4', isVideo: true, who: 'Caio R' },
            { h: 180, l: 'mãe e filha', c: '#F1D8C9', who: 'Camila' },
            { h: 220, l: '', isText: true, msg: 'Que bom virar uma família com você por perto, mavie.', tint: p.uva, tintInk: '#fff', who: 'vovô João' },
            { h: 200, l: 'flores no chão', c: '#D9E8DC', who: 'tia Lila' },
          ].map((it,i)=>(
            <div key={i} className="polaroid" style={{
              breakInside: 'avoid', marginBottom: 14,
              transform: `rotate(${(i%3 - 1) * 1.2}deg)`,
            }}>
              {it.isText ? (
                <div style={{
                  minHeight: it.h - 60, background: it.tint, color: it.tintInk || PALETTE_A.ink,
                  borderRadius: 4, padding: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <p className="font-a-display-i" style={{ margin: 0, fontSize: 17, lineHeight: 1.35, textAlign: 'center' }}>"{it.msg}"</p>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <Placeholder w={'100%'} h={it.h - 60} label={it.l} bg={it.c} radius={3}/>
                  {it.isVideo && (
                    <span style={{
                      position: 'absolute', top: 10, right: 10,
                      width: 26, height: 26, borderRadius: 999, background: 'rgba(0,0,0,0.7)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}><Ico.play s={11}/></span>
                  )}
                </div>
              )}
              <div style={{
                marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontFamily: 'Plus Jakarta Sans', fontSize: 11, color: PALETTE_A.ink2,
              }}>
                <span>por {it.who}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Ico.heart s={11} fill={PALETTE_A.coral}/>{12 + (i*3)%19}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* photobook upsell */}
      <PhotobookUpsell/>

      {/* presença em outras cápsulas */}
      <PresencaConectada/>
    </div>
  );
}

function PhotobookUpsell() {
  const p = PALETTE_A;
  return (
    <div style={{ marginTop: 50 }}>
      <div className="font-a-body" style={{ fontSize: 11, color: p.ink2, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>levar pro mundo físico</div>
      <div style={{
        marginTop: 14, background: p.card, border: `1.5px solid ${p.ink}`, borderRadius: 22,
        padding: '0', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr',
        boxShadow: '6px 8px 0 rgba(27,18,9,0.10)',
      }} className="grid-collapse">
        {/* book mockup */}
        <div style={{ background: '#F1D8C9', padding: '36px 36px', position: 'relative', minHeight: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.5, backgroundImage: 'radial-gradient(rgba(0,0,0,0.05) 0.7px, transparent 0.8px)', backgroundSize: '8px 8px' }}/>
          <div style={{
            width: 200, height: 270, background: '#FFFAF0', position: 'relative',
            boxShadow: '0 20px 40px rgba(0,0,0,0.18), 0 4px 6px rgba(0,0,0,0.08)',
            border: `1.5px solid ${p.ink}`, transform: 'rotate(-3deg)',
            padding: '14px 14px 18px', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 6,
              background: p.coral, boxShadow: 'inset -1px 0 0 rgba(0,0,0,0.15)',
            }}/>
            <div style={{ marginLeft: 8 }}>
              <div className="font-mono" style={{ fontSize: 9, color: p.ink2, letterSpacing: 0.5 }}>PRAESENTIA · LIVRO</div>
              <div className="font-a-display-i" style={{ fontSize: 26, color: p.ink, lineHeight: 0.95, marginTop: 6 }}>Mavie, 1.</div>
              <div className="font-a-display" style={{ fontSize: 13, color: p.coral, marginTop: 2 }}>jardim encantado</div>
              <div className="font-a-body" style={{ fontSize: 9.5, color: p.ink2, marginTop: 6, fontFamily: 'JetBrains Mono', letterSpacing: 0.4 }}>14 MAR 2026</div>
            </div>
            <div style={{ marginTop: 12, marginLeft: 8, marginRight: 8, flex: 1 }}>
              <Placeholder w={'100%'} h={140} label="capa · botânico" bg="#D7EDD9"/>
            </div>
            <div className="font-mono" style={{
              marginTop: 8, marginLeft: 8, fontSize: 8.5, color: p.ink2, letterSpacing: 0.4,
            }}>fotos escolhidas por você</div>
          </div>
          <div className="tape" style={{ top: 32, right: 60, transform: 'rotate(-8deg)', background: 'rgba(255,178,62,0.85)' }}/>
        </div>

        {/* copy + CTA */}
        <div style={{ padding: '32px 36px 30px' }}>
          <span className="pill" style={{ background: p.sol, color: p.ink }}>complemento · álbum impresso</span>
          <h3 className="font-a-display-i" style={{ fontSize: 'clamp(28px, 2.6vw, 38px)', margin: '12px 0 0', lineHeight: 1.05 }}>
            Um livro físico da tarde<br/>que você não quer esquecer.
          </h3>
          <p className="font-a-body" style={{ fontSize: 14, color: p.ink2, lineHeight: 1.6, marginTop: 12, maxWidth: 460 }}>
            Transforme as fotos da sua cápsula em um <b style={{ color: p.ink }}>álbum A4 de capa dura</b>,
            com papel fotográfico premium. Você escolhe quais fotos entram, na ordem que quiser.
          </p>

          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { ico: <Ico.check s={14}/>, l: 'você escolhe as fotos' },
              { ico: <Ico.cam s={13}/>, l: 'capa dura · formato A4' },
              { ico: <Ico.heart s={14}/>, l: 'papel fotográfico premium' },
              { ico: <Ico.share s={14}/>, l: 'envio para todo o Brasil' },
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: p.bg2, color: p.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{b.ico}</div>
                <span className="font-a-body" style={{ fontSize: 12.5, color: p.ink, fontWeight: 600 }}>{b.l}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{
              padding: '10px 14px', background: p.bg2, borderRadius: 10,
              border: `1px dashed rgba(27,18,9,0.18)`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: p.coral, flexShrink: 0 }}/>
              <div>
                <div className="font-mono" style={{ fontSize: 10, color: p.ink2, letterSpacing: 0.4, textTransform: 'uppercase' }}>valor sob medida</div>
                <div className="font-a-body" style={{ fontSize: 12.5, color: p.ink, lineHeight: 1.35 }}>
                  pela <b>quantidade de fotos</b> selecionadas
                </div>
              </div>
            </div>
            <button className="btn font-a-body" style={{
              background: p.ink, color: p.bg, padding: '14px 18px', borderRadius: 12,
              fontSize: 14, fontWeight: 700, marginLeft: 'auto',
              boxShadow: `4px 5px 0 ${p.coral}`, cursor: 'pointer', border: 0,
            }}>montar meu álbum →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PresencaConectada() {
  const p = PALETTE_A;
  return (
    <div style={{
      marginTop: 50, padding: '24px 28px', borderRadius: 18,
      background: p.bg2, border: `1.5px solid ${p.ink}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 999, background: p.coral, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Ico.spark s={20}/></div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div className="font-a-display-i" style={{ fontSize: 22, color: p.ink, lineHeight: 1.15 }}>essa cápsula faz parte da vida em cápsulas da Mavie</div>
          <div className="font-a-body" style={{ fontSize: 12.5, color: p.ink2, marginTop: 4, lineHeight: 1.5 }}>
            quando a Mavie completar 18 anos, ela vai abrir todas as cápsulas que envolvem ela — incluindo essa.
          </div>
        </div>
        <button className="btn font-a-body" style={{
          background: p.ink, color: p.bg, padding: '11px 16px', borderRadius: 10,
          fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 0,
        }}>ver a vida da Mavie →</button>
      </div>
    </div>
  );
}

Object.assign(window, { SiteEvent, EventInvite, EventLive, EventMemory, PhotobookUpsell, PresencaConectada });
