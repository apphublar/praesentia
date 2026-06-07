// direction-b.jsx — "Cápsula" pop editorial
// Convite mobile + desktop (mesmo evento Mavie, visual radicalmente diferente)

function ConviteMobileB() {
  const p = PALETTE_B;
  return (
    <div style={{ background: p.bg, height: '100%', overflow: 'auto', position: 'relative' }} className="no-scrollbar">
      <div style={{ height: 54 }}/>

      {/* top strip */}
      <div style={{ padding: '6px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RingMark size={22} color={p.ink} count={3} dot={p.magenta}/>
          <span className="font-b-sans" style={{ fontSize: 11, letterSpacing: 0.5, fontWeight: 700, color: p.ink, textTransform: 'uppercase' }}>capsule · #001</span>
        </div>
        <span className="font-mono" style={{ fontSize: 11, color: p.ink2 }}>memories.com/e</span>
      </div>

      {/* magenta band */}
      <div style={{
        margin: '14px 14px 0', borderRadius: 22, overflow: 'hidden',
        background: p.magenta, color: '#FFF8E8', position: 'relative',
        padding: '20px 20px 22px',
      }}>
        <div className="font-b-sans" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 10.5, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 700, opacity: 0.85,
        }}>
          <span>convite digital</span>
          <span>{EVENT.dateShort}</span>
        </div>

        <div style={{ position: 'relative', marginTop: 8 }}>
          <h1 className="font-b-display" style={{
            margin: 0, fontSize: 110, lineHeight: 0.86, letterSpacing: -0.05,
          }}>{EVENT.child}<br/>vira<br/>01</h1>
          <div style={{
            position: 'absolute', top: 28, right: -4,
            width: 64, height: 64, borderRadius: 999, background: p.mostarda, color: p.ink,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            transform: 'rotate(12deg)',
            boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
          }}>
            <span className="font-b-display" style={{ fontSize: 22, lineHeight: 1 }}>1</span>
            <span className="font-mono" style={{ fontSize: 8, marginTop: 2, letterSpacing: 0.4 }}>ANO</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 14 }}>
          <span className="font-b-body" style={{ fontSize: 22, fontStyle: 'italic' }}>tema</span>
          <span className="font-b-sans" style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.2, textTransform: 'uppercase' }}>{EVENT.theme}</span>
        </div>
      </div>

      {/* hero image full bleed */}
      <div style={{ padding: '12px 14px 0' }}>
        <div style={{ position: 'relative' }}>
          <Placeholder w="100%" h={220} label="capa · ai-gerada" bg="#E5DECE" radius={18}/>
          <div style={{
            position: 'absolute', left: 12, bottom: 12,
            background: p.azul, color: '#fff', padding: '6px 10px', borderRadius: 999,
          }} className="font-mono">
            <span style={{ fontSize: 10, letterSpacing: 0.6 }}>AI · capa nº 03 escolhida</span>
          </div>
        </div>
      </div>

      {/* meta — ticket style */}
      <div style={{ padding: '14px 14px 0' }}>
        <div style={{
          background: p.card, border: `1.5px solid ${p.ink}`, borderRadius: 18,
          padding: '0', overflow: 'hidden',
        }}>
          {/* row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1.5px dashed ${p.ink}`}}>
            <CapsuleMetaB label="DATA" value={EVENT.day} sub={`${EVENT.monthShort} · ${EVENT.year}`} accent={p.azul}/>
            <div style={{ borderLeft: `1.5px dashed ${p.ink}`}}>
              <CapsuleMetaB label="HORA" value="15h" sub="às 19h" accent={p.jade}/>
            </div>
          </div>
          <CapsuleMetaB label="LOCAL" value={EVENT.venueName} sub={`${EVENT.venueAddr} · ${EVENT.city}`} accent={p.mostarda}/>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '14px 14px 0' }}>
        <button className="btn font-b-sans" style={{
          width: '100%', background: p.ink, color: p.mostarda,
          padding: '16px', borderRadius: 14,
          fontSize: 15, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase',
        }}>
          confirmar &nbsp;→
        </button>
        <div style={{
          marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 4px',
        }}>
          <span className="font-mono" style={{ fontSize: 10.5, color: p.ink2 }}>seu link · maria.s</span>
          <span className="font-mono" style={{ fontSize: 10.5, color: p.ink2 }}>rsvp até {EVENT.rsvpDeadline}</span>
        </div>
      </div>

      {/* countdown stripe */}
      <div style={{ padding: '20px 14px 0' }}>
        <div style={{
          background: p.ink, color: '#F8F4E3', borderRadius: 18,
          padding: '14px 18px',
        }}>
          <div className="font-mono" style={{ fontSize: 10.5, letterSpacing: 0.6, opacity: 0.7 }}>T MINUS</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 4 }}>
            <span className="font-b-display" style={{ fontSize: 56, lineHeight: 1, color: p.mostarda }}>{EVENT.countdown.d}</span>
            <span className="font-b-sans" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>dias</span>
            <span style={{ flex: 1, height: 1, background: 'rgba(248,244,227,0.3)' }}/>
            <span className="font-mono" style={{ fontSize: 12 }}>{String(EVENT.countdown.h).padStart(2,'0')}:{String(EVENT.countdown.m).padStart(2,'0')}:{String(EVENT.countdown.s).padStart(2,'0')}</span>
          </div>
        </div>
      </div>

      {/* host */}
      <div style={{ padding: '20px 14px 0' }}>
        <div className="font-mono" style={{ fontSize: 10.5, letterSpacing: 0.6, color: p.ink2, textTransform: 'uppercase' }}>RECADO DA ANFITRIÃ</div>
        <p className="font-b-body" style={{ fontSize: 24, lineHeight: 1.32, color: p.ink, fontStyle: 'italic', margin: '6px 0 0' }}>
          "Quero guardar todo barulho, todo bolo na cara, toda risada — quando a Mavie tiver 10 a gente vai voltar aqui."
        </p>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name="Camila A" tint={p.azul} size={26}/>
          <span className="font-b-sans" style={{ fontSize: 12.5, color: p.ink, fontWeight: 600 }}>Camila & Diego &nbsp;<span style={{ color: p.ink2, fontWeight: 400 }}>· pais</span></span>
        </div>
      </div>

      {/* gift index */}
      <div style={{ padding: '20px 14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
          <h3 className="font-b-display" style={{ fontSize: 28, margin: 0, color: p.ink }}>presentes</h3>
          <span className="font-mono" style={{ fontSize: 10.5, color: p.ink2 }}>03 itens · 01 reservado</span>
        </div>
        {[
          { num: '01', t: 'Livrinho de pano', loja: 'A Pequena Biblioteca', c: p.magenta, status: 'aberto' },
          { num: '02', t: 'Tapete sensorial', loja: 'Brincar & Crescer', c: p.jade, status: 'reservado' },
          { num: '03', t: 'Bichinho de crochê', loja: 'Atelier da Lila', c: p.mostarda, status: 'aberto' },
        ].map((g,i)=>(
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'center',
            padding: '12px 0', borderTop: `1px solid ${p.ink}`,
            opacity: g.status === 'reservado' ? 0.5 : 1,
          }}>
            <span className="font-b-display" style={{ fontSize: 32, color: g.c, lineHeight: 1 }}>{g.num}</span>
            <div>
              <div className="font-b-sans" style={{ fontSize: 14, fontWeight: 700, color: p.ink }}>{g.t}</div>
              <div className="font-mono" style={{ fontSize: 10.5, color: p.ink2, marginTop: 2 }}>{g.loja}</div>
            </div>
            <span className="font-mono" style={{
              fontSize: 10, color: p.ink2, textTransform: 'uppercase', letterSpacing: 0.5,
              textDecoration: g.status === 'reservado' ? 'line-through' : 'none',
            }}>{g.status}</span>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${p.ink}`}}/>
      </div>

      {/* footer */}
      <div style={{ padding: '22px 14px 32px', textAlign: 'center' }}>
        <div className="font-mono" style={{ fontSize: 10, color: p.ink2, letterSpacing: 0.6 }}>
          MEMORIES · CAPSULE #001 · MAVIE-1-ANO
        </div>
      </div>
    </div>
  );
}

function CapsuleMetaB({ label, value, sub, accent }) {
  const p = PALETTE_B;
  return (
    <div style={{ padding: '14px 16px', position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 14, right: 14,
        width: 8, height: 8, borderRadius: 999, background: accent,
      }}/>
      <div className="font-mono" style={{ fontSize: 10, letterSpacing: 0.6, color: p.ink2 }}>{label}</div>
      <div className="font-b-display" style={{ fontSize: 30, color: p.ink, lineHeight: 1.05, marginTop: 4 }}>{value}</div>
      {sub && <div className="font-b-sans" style={{ fontSize: 11.5, color: p.ink2, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Convite desktop (Cápsula) ──────────────────────────────
function ConviteDesktopB() {
  const p = PALETTE_B;
  return (
    <Desktop url={EVENT.url} palette="b" w={1280} h={800}>
      <div style={{ background: p.bg, width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
        {/* top */}
        <div style={{
          padding: '18px 36px', display: 'flex', alignItems: 'center', gap: 18,
          borderBottom: `1.5px solid ${p.ink}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RingMark size={24} color={p.ink} count={3} dot={p.magenta}/>
            <span className="font-b-display" style={{ fontSize: 18, color: p.ink }}>Memories</span>
          </div>
          <span className="font-mono" style={{ fontSize: 11, color: p.ink2, letterSpacing: 0.6 }}>/ CAPSULE #001 · MAVIE-1-ANO</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center' }}>
            <span className="font-mono" style={{ fontSize: 11, color: p.ink2 }}>{EVENT.confirmados}/{EVENT.total} confirmados</span>
            <button className="btn font-b-sans" style={{
              background: p.ink, color: p.mostarda, padding: '8px 14px',
              borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
            }}>compartilhar</button>
            <Avatar name="Maria S" tint={p.azul} size={32}/>
          </div>
        </div>

        {/* hero grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '0.95fr 1.05fr',
          height: 'calc(100% - 70px)',
        }}>
          {/* left magenta block */}
          <div style={{
            background: p.magenta, color: '#FFF8E8', padding: '38px 44px 32px',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* dot grid */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none',
              backgroundImage: 'radial-gradient(#FFF8E8 1.4px, transparent 1.5px)',
              backgroundSize: '20px 20px',
            }}/>

            <div className="font-mono" style={{ fontSize: 11, letterSpacing: 0.6, opacity: 0.9 }}>CAPSULE / 001 / {EVENT.dateShort}</div>

            <h1 className="font-b-display" style={{
              margin: '32px 0 0', fontSize: 192, lineHeight: 0.82, letterSpacing: -0.05,
            }}>{EVENT.child}<br/>01</h1>

            <div style={{ marginTop: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className="font-b-body" style={{ fontSize: 28, fontStyle: 'italic' }}>tema</span>
              <span className="font-b-sans" style={{ fontSize: 16, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase' }}>{EVENT.theme}</span>
            </div>

            {/* mostarda badge */}
            <div style={{
              position: 'absolute', top: 50, right: 40,
              width: 132, height: 132, borderRadius: 999, background: p.mostarda, color: p.ink,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              transform: 'rotate(11deg)', boxShadow: '0 10px 24px rgba(0,0,0,0.16)',
            }}>
              <span className="font-b-display" style={{ fontSize: 64, lineHeight: 1 }}>1</span>
              <span className="font-mono" style={{ fontSize: 10, letterSpacing: 0.4 }}>ANINHO</span>
            </div>

            <div style={{
              position: 'absolute', bottom: 28, left: 44, right: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontFamily: 'JetBrains Mono', fontSize: 10.5, opacity: 0.9,
            }}>
              <span>AI · capa nº 03 escolhida pela anfitriã</span>
              <span>v.1.0</span>
            </div>
          </div>

          {/* right info */}
          <div style={{ padding: '36px 44px 32px', background: p.bg, position: 'relative', overflow: 'auto' }} className="no-scrollbar">
            {/* meta grid */}
            <div style={{
              border: `1.5px solid ${p.ink}`, borderRadius: 18, overflow: 'hidden',
              background: p.card,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `1.5px dashed ${p.ink}`}}>
                <CapsuleMetaB label="DATA" value={EVENT.day} sub={`${EVENT.monthShort} · ${EVENT.year}`} accent={p.azul}/>
                <div style={{ borderLeft: `1.5px dashed ${p.ink}`}}>
                  <CapsuleMetaB label="HORA" value="15h" sub="às 19h" accent={p.jade}/>
                </div>
                <div style={{ borderLeft: `1.5px dashed ${p.ink}`}}>
                  <CapsuleMetaB label="RSVP" value="07 mar" sub="prazo final" accent={p.magenta}/>
                </div>
              </div>
              <CapsuleMetaB label="LOCAL" value={EVENT.venueName} sub={`${EVENT.venueAddr} · ${EVENT.city}`} accent={p.mostarda}/>
            </div>

            {/* big CTA */}
            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
              <button className="btn font-b-sans" style={{
                background: p.ink, color: p.mostarda, padding: '18px',
                borderRadius: 14, fontSize: 15, fontWeight: 800,
                letterSpacing: 0.5, textTransform: 'uppercase',
              }}>confirmar presença &nbsp;→</button>
              <button className="btn font-b-sans" style={{
                background: 'transparent', color: p.ink,
                padding: '18px', borderRadius: 14, fontSize: 13, fontWeight: 700,
                letterSpacing: 0.4, textTransform: 'uppercase',
                border: `1.5px solid ${p.ink}`,
              }}><Ico.share s={14}/> WhatsApp</button>
            </div>

            {/* host quote */}
            <div style={{
              marginTop: 22, padding: '20px 22px',
              background: p.mostarda, borderRadius: 18,
              border: `1.5px solid ${p.ink}`, position: 'relative',
            }}>
              <span className="font-b-display" style={{
                position: 'absolute', top: 4, left: 18, fontSize: 60, lineHeight: 1,
                color: p.ink, opacity: 0.2,
              }}>"</span>
              <p className="font-b-body" style={{
                fontSize: 22, lineHeight: 1.34, color: p.ink, fontStyle: 'italic', margin: 0,
                paddingLeft: 24,
              }}>
                Quero guardar todo barulho, todo bolo na cara, toda risada — quando a Mavie tiver 10 a gente vai voltar aqui.
              </p>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar name="Camila A" tint={p.ink} size={22} ink={p.mostarda}/>
                <span className="font-b-sans" style={{ fontSize: 12, color: p.ink, fontWeight: 700 }}>Camila & Diego &nbsp;· pais</span>
              </div>
            </div>

            {/* countdown */}
            <div style={{
              marginTop: 18, padding: '14px 18px',
              background: p.ink, color: '#F8F4E3', borderRadius: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                <span className="font-mono" style={{ fontSize: 11, letterSpacing: 0.6, opacity: 0.7 }}>T MINUS</span>
                <span className="font-b-display" style={{ fontSize: 46, lineHeight: 1, color: p.mostarda }}>{EVENT.countdown.d}</span>
                <span className="font-b-sans" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>dias</span>
                <span className="font-mono" style={{ fontSize: 11, opacity: 0.8, marginLeft: 'auto' }}>
                  {String(EVENT.countdown.h).padStart(2,'0')}:{String(EVENT.countdown.m).padStart(2,'0')}:{String(EVENT.countdown.s).padStart(2,'0')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Desktop>
  );
}

Object.assign(window, { ConviteMobileB, ConviteDesktopB, CapsuleMetaB });
