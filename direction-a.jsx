// direction-a.jsx — "Festa" scrapbook acolhedor
// Convite mobile + desktop, RSVP, Memória mobile/desktop

// ─── Convite mobile (Festa) ────────────────────────────────
function ConviteMobileA() {
  const p = PALETTE_A;
  return (
    <div style={{ background: p.bg, height: '100%', overflow: 'auto', position: 'relative' }} className="no-scrollbar">
      {/* paper texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5,
        backgroundImage: 'radial-gradient(rgba(0,0,0,0.05) 0.6px, transparent 0.7px)',
        backgroundSize: '7px 7px',
      }}/>

      {/* top status pad */}
      <div style={{ height: 54 }}/>

      {/* hero card */}
      <div style={{ padding: '8px 18px 0', position: 'relative' }}>
        <div style={{ position: 'relative', borderRadius: 20, overflow: 'visible' }}>
          <div className="tape" style={{ top: -10, left: 28, transform: 'rotate(-8deg)' }}/>
          <div className="tape" style={{ top: -8, right: 26, transform: 'rotate(7deg)', background: 'rgba(106,183,232,0.7)' }}/>

          {/* main card */}
          <div style={{
            background: p.card, borderRadius: 18,
            border: `1.5px solid ${p.ink}`,
            padding: '22px 18px 18px', position: 'relative',
            boxShadow: '6px 8px 0 rgba(27,18,9,0.08)',
          }}>
            <div className="font-a-body" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: 11, letterSpacing: 0.16, textTransform: 'uppercase',
              color: p.ink2, fontWeight: 600,
            }}>
              <span>convite · um aninho</span>
              <span style={{
                background: p.sol, color: p.ink, padding: '3px 8px',
                borderRadius: 999, fontSize: 10, fontWeight: 700,
              }}>RSVP até {EVENT.rsvpDeadline}</span>
            </div>

            <div style={{ marginTop: 18, textAlign: 'center', position: 'relative' }}>
              <ConfettiBurst style={{ position: 'absolute', top: -8, left: -6 }} scale={0.6}/>
              <ConfettiBurst style={{ position: 'absolute', top: -2, right: -10 }} scale={0.55}/>
              <div className="font-a-body" style={{
                fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase',
                color: p.ink2, fontWeight: 600,
              }}>tema · {EVENT.theme}</div>
              <h1 className="font-a-display-i" style={{
                margin: '6px 0 0', fontSize: 64, lineHeight: 0.92, color: p.ink,
              }}>{EVENT.child}</h1>
              <div className="font-a-display" style={{
                fontSize: 18, color: p.coral, marginTop: 4,
              }}>vai fazer <span className="hand-underline" style={{ color: p.coral }}>1 aninho</span></div>
            </div>

            {/* gallery polaroids */}
            <div style={{
              marginTop: 22, display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr', gap: 8, alignItems: 'end',
            }}>
              <div className="polaroid" style={{ transform: 'rotate(-5deg)' }}>
                <Placeholder w={'100%'} h={70} label="ensaio" bg={p.bg2}/>
              </div>
              <div className="polaroid" style={{ transform: 'rotate(2deg)', marginBottom: 6 }}>
                <Placeholder w={'100%'} h={84} label="mavie" bg="#F1D8C9"/>
              </div>
              <div className="polaroid" style={{ transform: 'rotate(6deg)' }}>
                <Placeholder w={'100%'} h={70} label="balões" bg="#D9E8F4"/>
              </div>
            </div>

            <div className="dotted" style={{ color: p.ink, marginTop: 22, opacity: 0.5 }}/>

            {/* meta */}
            <div style={{ marginTop: 16, display: 'grid', gap: 12, color: p.ink }}>
              <Row label="quando" value={EVENT.dateLong} sub={`${EVENT.timeStart} — ${EVENT.timeEnd}`} icon={<Ico.cal s={16}/>} accent={p.coral}/>
              <Row label="onde" value={EVENT.venueName} sub={EVENT.venueAddr} icon={<Ico.pin s={16}/>} accent={p.ceu}/>
              <Row label="quem convida" value={`${EVENT.hostFirst} & Diego`} sub="pais da Mavie" icon={<Ico.heart s={16}/>} accent={p.uva}/>
            </div>
          </div>
        </div>
      </div>

      {/* countdown */}
      <div style={{ padding: '20px 18px 0' }}>
        <div style={{
          background: p.coral, color: '#FFF7EE', borderRadius: 16,
          border: `1.5px solid ${p.ink}`,
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '4px 6px 0 rgba(27,18,9,0.12)',
        }}>
          <div className="font-a-display-i" style={{ fontSize: 22 }}>faltam</div>
          <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
            {[{n: EVENT.countdown.d, l: 'dias'},{n: EVENT.countdown.h, l: 'h'},{n: EVENT.countdown.m, l: 'min'}].map((x,i)=>(
              <div key={i} style={{ textAlign: 'center' }}>
                <div className="font-a-display" style={{ fontSize: 28, lineHeight: 1 }}>{String(x.n).padStart(2,'0')}</div>
                <div className="font-a-body" style={{ fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase', opacity: 0.9 }}>{x.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* host message */}
      <div style={{ padding: '20px 18px 0' }}>
        <div style={{
          background: p.bg2, borderRadius: 14, padding: '16px 16px 18px',
          border: `1.5px dashed ${p.ink}`, position: 'relative',
        }}>
          <div className="font-a-body" style={{ fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase', color: p.ink2, fontWeight: 700 }}>recado da Camila</div>
          <p className="font-a-display-i" style={{ margin: '6px 0 0', fontSize: 17, lineHeight: 1.35, color: p.ink }}>
            A nossa Mavie chegou no comecinho de 2025 e mudou tudo. Queremos celebrar com você esse primeiro giro em volta do sol — vem com a gente!
          </p>
        </div>
      </div>

      {/* RSVP CTA */}
      <div style={{ padding: '20px 18px 0' }}>
        <button className="btn font-a-body" style={{
          width: '100%', background: p.ink, color: p.bg,
          padding: '16px 18px', borderRadius: 14,
          fontSize: 16, fontWeight: 700, letterSpacing: 0.2,
          boxShadow: `4px 6px 0 ${p.sol}`,
        }}>
          <Ico.check s={18}/> Confirmar presença
        </button>
        <div className="font-a-body" style={{
          textAlign: 'center', fontSize: 12, color: p.ink2, marginTop: 8,
        }}>seu link individual · <b style={{ color: p.ink }}>maria.s</b></div>
      </div>

      {/* tabs */}
      <div style={{ padding: '22px 18px 0' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
          background: p.card, padding: 6, borderRadius: 12,
          border: `1.5px solid ${p.ink}`,
        }}>
          {['presentes','perguntas','local'].map((t,i)=>(
            <div key={t} className="font-a-body" style={{
              textAlign: 'center', padding: '8px 6px', borderRadius: 8,
              fontSize: 12, fontWeight: 600, letterSpacing: 0.2,
              background: i===0 ? p.uva : 'transparent',
              color: i===0 ? '#fff' : p.ink2,
            }}>{t}</div>
          ))}
        </div>
        <div style={{
          marginTop: 10, background: p.card, borderRadius: 14,
          border: `1.5px solid ${p.ink}`, padding: '14px',
        }}>
          {[
            { item: 'Livrinho de pano', loja: 'A Pequena Biblioteca', tomado: false, c: p.coral },
            { item: 'Tapete sensorial', loja: 'Brincar & Crescer', tomado: true, c: p.jardim },
            { item: 'Bichinho de crochê', loja: 'Atelier da Lila', tomado: false, c: p.sol },
          ].map((g,i)=>(
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0',
              borderBottom: i<2 ? `1px dashed rgba(27,18,9,0.18)` : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: g.c, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Ico.gift s={18}/></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-a-body" style={{ fontSize: 14, fontWeight: 700, color: p.ink }}>{g.item}</div>
                <div className="font-a-body" style={{ fontSize: 11.5, color: p.ink2, marginTop: 1 }}>{g.loja}</div>
              </div>
              {g.tomado
                ? <span className="pill" style={{ background: p.bg2, color: p.ink2, fontSize: 9.5 }}>tomado</span>
                : <span className="pill" style={{ background: p.ink, color: p.bg, fontSize: 9.5 }}>escolher</span>}
            </div>
          ))}
        </div>
      </div>

      {/* footer */}
      <div style={{ padding: '20px 18px 30px', textAlign: 'center' }}>
        <div className="font-a-body" style={{
          fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase',
          color: p.ink2, fontWeight: 600,
        }}>feito com Praesentia · cápsula permanente</div>
        <div className="font-a-display-i" style={{ fontSize: 13, color: p.ink2, marginTop: 4 }}>
          {EVENT.url}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, sub, icon, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8, background: accent, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div className="font-a-body" style={{ fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase', color: PALETTE_A.ink2, fontWeight: 700 }}>{label}</div>
        <div className="font-a-display" style={{ fontSize: 16, color: PALETTE_A.ink, lineHeight: 1.2, marginTop: 2 }}>{value}</div>
        {sub && <div className="font-a-body" style={{ fontSize: 12, color: PALETTE_A.ink2, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Convite desktop (Festa) ────────────────────────────────
function ConviteDesktopA() {
  const p = PALETTE_A;
  return (
    <Desktop url={EVENT.url} palette="a" w={1280} h={800}>
      <div style={{ background: p.bg, width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
        {/* paper texture */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5,
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.04) 0.6px, transparent 0.7px)',
          backgroundSize: '7px 7px',
        }}/>

        {/* top bar */}
        <div style={{
          padding: '18px 36px', display: 'flex', alignItems: 'center', gap: 14,
          position: 'relative',
        }}>
          <div className="font-a-display-i" style={{ fontSize: 22, color: p.ink }}>Praesentia</div>
          <div style={{ marginLeft: 14, display: 'flex', gap: 18 }}>
            {['convite','presentes','local','perguntas'].map((t,i)=>(
              <span key={t} className="font-a-body" style={{
                fontSize: 13, color: i===0?p.ink:p.ink2, fontWeight: i===0?700:500,
                borderBottom: i===0 ? `2px solid ${p.coral}` : 'none', paddingBottom: 4,
              }}>{t}</span>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="pill" style={{ background: p.card, color: p.ink2, border: `1.5px solid ${p.ink}` }}>
              <Ico.share s={11}/> compartilhar
            </span>
            <Avatar name="Maria S" tint={p.uva} size={32}/>
          </div>
        </div>

        {/* main */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 30,
          padding: '8px 48px 0', height: 'calc(100% - 64px)',
          position: 'relative',
        }}>
          {/* left - typography */}
          <div style={{ paddingTop: 24, position: 'relative' }}>
            <ConfettiBurst style={{ position: 'absolute', top: -10, left: -20 }} scale={0.8}/>

            <div className="font-a-body" style={{ fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', color: p.ink2, fontWeight: 700 }}>
              um convite especial para você
            </div>
            <h1 className="font-a-display-i" style={{
              margin: '14px 0 0', fontSize: 156, lineHeight: 0.86, color: p.ink, letterSpacing: -0.02,
            }}>{EVENT.child},</h1>
            <h2 className="font-a-display" style={{
              margin: '6px 0 0', fontSize: 56, lineHeight: 0.95, color: p.coral,
            }}>1 ano de <span className="hand-underline">jardim</span></h2>

            <p className="font-a-display-i" style={{
              fontSize: 22, lineHeight: 1.4, color: p.ink, maxWidth: 480, marginTop: 26,
            }}>
              Sob a sombra das acácias, no quintal favorito da vovó, vamos celebrar
              o primeiro giro em volta do sol da nossa pequena.
            </p>

            <div style={{ marginTop: 28, display: 'flex', gap: 12, alignItems: 'center' }}>
              <button className="btn font-a-body" style={{
                background: p.ink, color: p.bg, padding: '14px 22px', borderRadius: 12,
                fontSize: 15, fontWeight: 700, boxShadow: `4px 5px 0 ${p.sol}`,
              }}>
                <Ico.check s={16}/> Confirmar presença
              </button>
              <button className="btn font-a-body" style={{
                background: 'transparent', color: p.ink, padding: '14px 18px', borderRadius: 12,
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

          {/* right - polaroids stack + countdown */}
          <div style={{ paddingTop: 18, position: 'relative' }}>
            <div style={{ position: 'relative', height: 380 }}>
              <div className="polaroid float" style={{
                position: 'absolute', top: 8, left: 30, transform: 'rotate(-7deg)',
                width: 220, animationDelay: '0s',
              }}>
                <Placeholder w={200} h={220} label="ensaio · 1" bg={p.bg2}/>
                <div className="font-a-display-i" style={{ fontSize: 13, color: p.ink, marginTop: 8, textAlign: 'center' }}>nossa pequena · 11 meses</div>
              </div>
              <div className="polaroid float" style={{
                position: 'absolute', top: 40, right: 8, transform: 'rotate(6deg)',
                width: 240, animationDelay: '0.6s',
              }}>
                <Placeholder w={220} h={250} label="jardim botânico" bg="#D9E8DC"/>
                <div className="font-a-display-i" style={{ fontSize: 13, color: p.ink, marginTop: 8, textAlign: 'center' }}>onde a festa será</div>
              </div>
              <div className="tape" style={{ top: 0, left: 110, transform: 'rotate(-4deg)' }}/>
              <div className="tape" style={{ top: 32, right: 100, transform: 'rotate(8deg)', background: 'rgba(255,107,92,0.7)' }}/>
            </div>

            {/* countdown */}
            <div style={{
              marginTop: 22, background: p.uva, color: '#FFF7EE',
              borderRadius: 16, border: `1.5px solid ${p.ink}`,
              padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 22,
              boxShadow: `5px 6px 0 ${p.ink}`, position: 'relative',
            }}>
              <div>
                <div className="font-a-body" style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.85 }}>contagem regressiva</div>
                <div className="font-a-display-i" style={{ fontSize: 28, lineHeight: 1, marginTop: 4 }}>faltam</div>
              </div>
              <div style={{ display: 'flex', gap: 14, marginLeft: 'auto' }}>
                {[{n: EVENT.countdown.d, l: 'dias'},{n: EVENT.countdown.h, l: 'horas'},{n: EVENT.countdown.m, l: 'min'},{n: EVENT.countdown.s, l: 'seg'}].map((x,i)=>(
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div className="font-a-display" style={{ fontSize: 36, lineHeight: 1 }}>{String(x.n).padStart(2,'0')}</div>
                    <div className="font-a-body" style={{ fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.85 }}>{x.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* confirmados */}
            <div style={{
              marginTop: 18, padding: '14px 18px', background: p.card,
              borderRadius: 14, border: `1.5px solid ${p.ink}`,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <AvatarStack people={[
                { name: 'Ana B', tint: p.coral },{ name: 'Pedro L', tint: p.ceu },
                { name: 'Lu M', tint: p.sol },{ name: 'Caio R', tint: p.jardim },
              ]} size={28}/>
              <div style={{ flex: 1 }}>
                <div className="font-a-display" style={{ fontSize: 16, color: p.ink, lineHeight: 1.1 }}>
                  <b>{EVENT.confirmados}</b> de {EVENT.total} já confirmaram
                </div>
                <div className="font-a-body" style={{ fontSize: 11.5, color: p.ink2, marginTop: 2 }}>
                  vovó Maria, tio Caio e mais 45 famílias
                </div>
              </div>
              <Ico.arrow s={18}/>
            </div>
          </div>
        </div>
      </div>
    </Desktop>
  );
}

// ─── RSVP confirmação modal (mobile) ────────────────────────
function RSVPMobileA() {
  const p = PALETTE_A;
  return (
    <div style={{ background: p.bg, height: '100%', overflow: 'auto', position: 'relative' }} className="no-scrollbar">
      <div style={{ height: 54 }}/>

      {/* nav */}
      <div style={{ padding: '4px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 999, background: p.card,
          border: `1.5px solid ${p.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.ink,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 6l-6 6 6 6"/></svg>
        </div>
        <div className="font-a-body" style={{ fontSize: 12, color: p.ink2, fontWeight: 600 }}>voltar ao convite</div>
      </div>

      <div style={{ padding: '20px 22px 0', textAlign: 'center' }}>
        <ConfettiBurst style={{ margin: '0 auto' }} scale={1.4}/>
        <h1 className="font-a-display-i" style={{ fontSize: 52, lineHeight: 0.9, margin: '14px 0 0', color: p.ink }}>
          ebaa!
        </h1>
        <p className="font-a-display" style={{ fontSize: 22, color: p.coral, margin: '8px 0 0' }}>
          a Mavie vai te esperar
        </p>
        <p className="font-a-body" style={{ fontSize: 13.5, color: p.ink2, margin: '8px auto 0', maxWidth: 280, lineHeight: 1.5 }}>
          Sua confirmação foi enviada para Camila & Diego. Você vai receber lembretes pelo WhatsApp.
        </p>
      </div>

      {/* ticket */}
      <div style={{ padding: '24px 22px 0' }}>
        <div style={{
          background: p.card, borderRadius: 18, border: `1.5px solid ${p.ink}`,
          padding: '18px 18px 16px', position: 'relative', overflow: 'hidden',
          boxShadow: '6px 8px 0 rgba(27,18,9,0.08)',
        }}>
          {/* punched holes */}
          <div style={{ position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, borderRadius: 999, background: p.bg, border: `1.5px solid ${p.ink}` }}/>
          <div style={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, borderRadius: 999, background: p.bg, border: `1.5px solid ${p.ink}` }}/>

          <div className="font-a-body" style={{ fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', color: p.ink2, fontWeight: 700 }}>seu lugar está guardado</div>
          <div className="font-a-display-i" style={{ fontSize: 28, color: p.ink, marginTop: 4 }}>Maria Santos +2</div>

          <div className="dotted" style={{ color: p.ink, marginTop: 14, opacity: 0.5 }}/>

          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div className="font-a-body" style={{ fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', color: p.ink2, fontWeight: 700 }}>quando</div>
              <div className="font-a-display" style={{ fontSize: 14, color: p.ink, marginTop: 2 }}>14 mar · 15h</div>
            </div>
            <div>
              <div className="font-a-body" style={{ fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', color: p.ink2, fontWeight: 700 }}>onde</div>
              <div className="font-a-display" style={{ fontSize: 14, color: p.ink, marginTop: 2 }}>Quintal das Acácias</div>
            </div>
            <div>
              <div className="font-a-body" style={{ fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', color: p.ink2, fontWeight: 700 }}>código</div>
              <div className="font-mono" style={{ fontSize: 14, color: p.ink, marginTop: 2 }}>MAV-2026-MSF</div>
            </div>
            <div>
              <div className="font-a-body" style={{ fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', color: p.ink2, fontWeight: 700 }}>traje</div>
              <div className="font-a-display" style={{ fontSize: 14, color: p.ink, marginTop: 2 }}>Tons de jardim</div>
            </div>
          </div>

          <div style={{ marginTop: 14, padding: '10px 12px', background: p.bg2, borderRadius: 10 }}>
            <div className="font-a-body" style={{ fontSize: 11, color: p.ink2, fontWeight: 600 }}>
              <Ico.spark s={12}/> &nbsp;Você poderá publicar memórias até 48h após o evento
            </div>
          </div>
        </div>
      </div>

      {/* next steps */}
      <div style={{ padding: '22px 22px 0' }}>
        <div className="font-a-display" style={{ fontSize: 16, color: p.ink }}>próximos passos</div>
        <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
          {[
            { ico: <Ico.cal s={14}/>, t: 'Adicionar ao calendário', c: p.coral },
            { ico: <Ico.gift s={14}/>, t: 'Escolher um presente', c: p.sol },
            { ico: <Ico.cam s={14}/>, t: 'Ativar lembrete pra publicar fotos', c: p.uva },
          ].map((s,i)=>(
            <div key={i} style={{
              background: p.card, padding: '12px 14px', borderRadius: 12,
              border: `1.5px solid ${p.ink}`, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: s.c, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.ico}</div>
              <div className="font-a-display" style={{ flex: 1, fontSize: 15, color: p.ink }}>{s.t}</div>
              <Ico.arrow s={16}/>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 30 }}/>
    </div>
  );
}

Object.assign(window, { ConviteMobileA, ConviteDesktopA, RSVPMobileA, Row });
