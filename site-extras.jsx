// site-extras.jsx — /criar (AI chat) e /eu (perfil)

function SiteCreate({ goto }) {
  const p = PALETTE_A;
  const [step, setStep] = React.useState(4);
  const [draft, setDraft] = React.useState({
    title: 'A Mavie vai fazer 1 aninho!',
    capa: 1, // 0..2
  });
  const messagesRef = React.useRef(null);
  React.useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [step, draft]);

  return (
    <div style={{ background: p.bg, color: p.ink, minHeight: 'calc(100vh - 60px)', position: 'relative' }}>
      <Paper/>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 520px) minmax(0, 1fr)', height: 'calc(100vh - 60px)' }} className="grid-collapse">
        {/* chat side */}
        <div style={{ borderRight: `1.5px solid rgba(27,18,9,0.10)`, display: 'flex', flexDirection: 'column', background: p.bg, position: 'relative', zIndex: 1 }}>
          <div style={{ padding: '20px 28px 14px', borderBottom: `1px solid rgba(27,18,9,0.10)`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: p.ink, color: p.sol, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ico.spark s={18}/>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="font-a-display" style={{ fontSize: 17, color: p.ink, lineHeight: 1.15 }}>Vamos criar seu convite</div>
              <div className="font-a-body" style={{ fontSize: 12, color: p.ink2, marginTop: 2 }}>passo {step} de 6 · só faltam <b style={{ color: p.coral }}>{6 - step}</b></div>
            </div>
            <span className="pill" style={{ background: p.bg2, color: p.ink2, fontSize: 10, flexShrink: 0 }}>rascunho salvo</span>
          </div>

          {/* progress */}
          <div style={{ padding: '10px 28px', display: 'flex', gap: 6 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: 999,
                background: i <= step ? p.coral : p.bg2,
                transition: 'background 0.3s ease',
              }}/>
            ))}
          </div>

          <div ref={messagesRef} className="no-scrollbar" style={{ flex: 1, overflow: 'auto', padding: '12px 28px 12px' }}>
            <AIMsg side="ai" t="Oi! Vamos criar o convite. Me conta o tipo do evento, nome, data e local — texto livre, na ordem que preferir."/>
            <AIMsg side="me" t="Aniversário de 1 ano da minha filha Mavie. 14 de março de 2026, no Quintal das Acácias em SP. Tema: Jardim Encantado."/>
            <AIMsg side="ai" t="Adorei. Pra um aniversário de 1 ano com tema 'Jardim Encantado' tô propondo essa paleta:" chips={[p.coral, p.sol, p.jardim, p.ceu, p.uva]}/>
            <AIMsg side="me" t="Pode usar!"/>
            <AIMsg side="ai" t="Trabalhei nessa direção pro texto principal:" card={draft.title} cardSub="Sob a sombra das acácias, no quintal favorito da vovó, vamos celebrar o primeiro giro em volta do sol da nossa pequena." onRefazer={() => setDraft({...draft, title: 'Mavie completa 1 ano!'})}/>
            {step >= 4 && <AIMsg side="me" t="Quero uma capa mais infantil. Pode gerar 3 opções?"/>}
            {step >= 4 && <AIMsg side="ai" t="Gerei 3 opções. Qual prefere?" drafts={draft.capa} onPick={i => setDraft({...draft, capa: i})}/>}
            {step >= 5 && <AIMsg side="me" t="Botânico ficou perfeito."/>}
            {step >= 5 && <AIMsg side="ai" t="Beleza! Já preparei as mensagens de confirmação, descrição do evento e a mensagem pós-evento (que aparece quando o link virar a cápsula permanente). Olha só:" multi={['Confirmação RSVP','Descrição do evento','Mensagem pós-evento','5 hashtags sugeridas']}/>}
            {step >= 6 && <AIMsg side="ai" t="🎉 Tudo pronto! Quer publicar agora ou revisar antes?"/>}
          </div>

          {/* suggestion strip */}
          <div style={{ padding: '8px 28px', display: 'flex', gap: 6, overflow: 'auto', borderTop: `1px solid rgba(27,18,9,0.10)` }} className="no-scrollbar">
            {(step < 6 ? ['continuar →','mais formal','mais curto','traduzir pra inglês','adicionar mapa'] : ['publicar agora','revisar tudo','baixar PDF']).map((s,i)=>(
              <span key={i} onClick={() => step < 6 ? setStep(Math.min(6, step + 1)) : null} className="font-a-body" style={{
                flexShrink: 0, padding: '7px 12px', background: i === 0 ? p.ink : p.card,
                color: i === 0 ? p.bg : p.ink, borderRadius: 999, cursor: 'pointer',
                fontSize: 12, fontWeight: i === 0 ? 700 : 500,
                border: i === 0 ? 'none' : `1px solid rgba(27,18,9,0.18)`,
              }}>{s}</span>
            ))}
          </div>

          {/* input */}
          <div style={{ padding: '8px 28px 22px' }}>
            <div style={{
              background: p.card, borderRadius: 14, border: `1.5px solid ${p.ink}`,
              padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div className="font-a-body" style={{ flex: 1, fontSize: 13.5, color: p.ink2 }}>peça uma mudança, refine o tom, anexe foto...</div>
              <button style={{ width: 38, height: 38, borderRadius: 10, background: p.coral, color: '#fff', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Ico.send s={16}/>
              </button>
            </div>
          </div>
        </div>

        {/* preview side */}
        <div style={{ padding: '32px 5vw', overflow: 'auto', position: 'relative' }} className="no-scrollbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span className="font-a-body" style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: p.ink2, fontWeight: 700 }}>preview ao vivo</span>
            <span className="pill" style={{ background: p.card, color: p.ink2, border: `1px solid rgba(27,18,9,0.18)`, fontSize: 10 }}>desktop · mobile</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="font-a-body" style={{ background: 'transparent', border: 0, fontSize: 12, color: p.ink2, cursor: 'pointer' }}>↺ desfazer</button>
              <button onClick={() => goto('/e/mavie-1-ano')} className="btn font-a-body" style={{ background: p.ink, color: p.bg, padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                publicar
              </button>
            </div>
          </div>

          {/* phone preview */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: 320, minHeight: 600, background: p.card,
              borderRadius: 32, border: `1.5px solid ${p.ink}`, padding: 18, position: 'relative',
              boxShadow: '10px 12px 0 rgba(27,18,9,0.10)',
            }}>
              <div style={{ height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 80, height: 22, borderRadius: 999, background: p.ink }}/>
              </div>
              <div style={{ textAlign: 'center', padding: '14px 0 0', position: 'relative' }}>
                <ConfettiBurst style={{ margin: '0 auto' }} scale={0.85}/>
                <div className="font-a-body" style={{ fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase', color: p.ink2, fontWeight: 700, marginTop: 6 }}>tema · {EVENT.theme}</div>
                <h1 className="font-a-display-i" style={{ margin: '4px 0 0', fontSize: 64, lineHeight: 0.88, color: p.ink }}>{EVENT.child}</h1>
                <div className="font-a-display" style={{ fontSize: 20, color: p.coral, marginTop: 2 }}>{draft.title.includes('completa') ? '1 ano!' : '1 aninho'}</div>
              </div>
              <div style={{ marginTop: 14, padding: '0 4px' }}>
                <div className="polaroid" style={{ transform: 'rotate(-3deg)', width: '100%', padding: 6, paddingBottom: 22 }}>
                  <Placeholder w={'100%'} h={150} label={
                    ['aquarela','botânico','pop infantil'][draft.capa]
                  } bg={['#F4D5BA','#D7EDD9','#E5D5F2'][draft.capa]}/>
                </div>
              </div>
              <div style={{ padding: '14px 4px 0' }}>
                <div className="font-a-body" style={{ fontSize: 10.5, color: p.ink2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>quando · onde</div>
                <div className="font-a-display" style={{ fontSize: 15, color: p.ink, marginTop: 2 }}>14 mar 2026 · 15h</div>
                <div className="font-a-body" style={{ fontSize: 11, color: p.ink2 }}>Quintal das Acácias · SP</div>
              </div>
              <div style={{ marginTop: 18 }}>
                <button className="btn font-a-body" style={{
                  width: '100%', background: p.ink, color: p.bg, padding: '11px',
                  borderRadius: 10, fontSize: 13, fontWeight: 700,
                }}>Confirmar presença</button>
              </div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span className="font-mono" style={{ fontSize: 9.5, color: p.ink2 }}>praesentia.com/e/mavie-1-ano</span>
              </div>
            </div>
          </div>

          {/* generated assets list */}
          <div style={{ maxWidth: 420, margin: '24px auto 0', background: p.card, borderRadius: 14, border: `1px solid rgba(27,18,9,0.12)`, padding: 16 }}>
            <div className="font-a-body" style={{ fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', color: p.ink2, fontWeight: 700, marginBottom: 10 }}>a IA preparou para você</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { t: 'texto do convite', d: '3 variações' },
                { t: 'capa do convite', d: '3 imagens · 1 escolhida' },
                { t: 'paleta', d: 'jardim suave' },
                { t: 'mensagem pós-evento', d: 'pronta · revisar' },
                { t: 'hashtags', d: '#mavie1ano +6' },
                { t: 'descrição', d: 'pronta' },
              ].map((it,i)=>(
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: p.bg, borderRadius: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, background: p.coral, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ico.check s={11} w={3}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-a-body" style={{ fontSize: 12, fontWeight: 700, color: p.ink }}>{it.t}</div>
                    <div className="font-a-body" style={{ fontSize: 10.5, color: p.ink2 }}>{it.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIMsg({ side, t, chips, card, cardSub, onRefazer, drafts, onPick, multi }) {
  const p = PALETTE_A;
  if (side === 'me') return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '10px 0' }}>
      <div style={{
        background: p.ink, color: p.bg, borderRadius: '16px 16px 4px 16px',
        padding: '10px 14px', maxWidth: '85%',
        fontFamily: 'Plus Jakarta Sans', fontSize: 13.5,
      }}>{t}</div>
    </div>
  );
  return (
    <div style={{ margin: '14px 0', display: 'flex', gap: 10 }}>
      <div style={{ width: 26, height: 26, borderRadius: 8, background: p.coral, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        <Ico.spark s={13}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          background: p.card, borderRadius: '4px 16px 16px 16px',
          padding: '10px 14px', border: `1px solid rgba(27,18,9,0.10)`,
          fontFamily: 'Plus Jakarta Sans', fontSize: 13.5, color: p.ink, lineHeight: 1.45,
        }}>{t}</div>
        {chips && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
            <div style={{ display: 'flex' }}>
              {chips.map((c, ci) => (
                <span key={ci} style={{ width: 24, height: 24, borderRadius: 999, background: c, marginLeft: ci ? -7 : 0, boxShadow: `0 0 0 2px ${p.bg}` }}/>
              ))}
            </div>
            <span className="font-a-body" style={{ fontSize: 12, color: p.ink2, fontWeight: 600 }}>paleta · jardim suave</span>
            <button className="btn font-a-body" style={{ marginLeft: 'auto', background: p.bg2, color: p.ink, padding: '5px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 0 }}>trocar</button>
          </div>
        )}
        {card && (
          <div style={{ marginTop: 8, padding: '12px 14px', background: p.card, borderRadius: 12, border: `1.5px dashed rgba(27,18,9,0.3)` }}>
            <div className="font-a-display-i" style={{ fontSize: 20, color: p.ink, lineHeight: 1.15 }}>{card}</div>
            <p className="font-a-body" style={{ fontSize: 12.5, color: p.ink2, marginTop: 6, lineHeight: 1.5 }}>{cardSub}</p>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <span className="pill" style={{ background: p.jardim, color: '#fff', fontSize: 9 }}>usar</span>
              <span onClick={onRefazer} className="pill" style={{ background: p.bg2, color: p.ink2, fontSize: 9, cursor: 'pointer' }}>refazer</span>
              <span className="pill" style={{ background: p.bg2, color: p.ink2, fontSize: 9 }}>mais curto</span>
            </div>
          </div>
        )}
        {drafts !== undefined && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
            {[
              { c: '#F4D5BA', l: 'aquarela' },
              { c: '#D7EDD9', l: 'botânico' },
              { c: '#E5D5F2', l: 'pop infantil' },
            ].map((d, j)=>(
              <div key={j} onClick={() => onPick && onPick(j)} style={{
                aspectRatio: '3/4', borderRadius: 8, position: 'relative', overflow: 'hidden', cursor: 'pointer',
                border: drafts === j ? `2.5px solid ${p.coral}` : `1px solid rgba(27,18,9,0.15)`,
              }}>
                <Placeholder w={'100%'} h={'100%'} label={d.l} bg={d.c} radius={6}/>
                {drafts === j && (
                  <span style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 18, height: 18, borderRadius: 999, background: p.coral, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><Ico.check s={11} w={3}/></span>
                )}
              </div>
            ))}
          </div>
        )}
        {multi && (
          <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {multi.map((m,i)=>(
              <div key={i} style={{
                padding: '8px 10px', background: p.card, borderRadius: 8,
                border: `1px solid rgba(27,18,9,0.15)`, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: p.jardim, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ico.check s={9} w={3}/>
                </div>
                <span className="font-a-body" style={{ fontSize: 11.5, color: p.ink, fontWeight: 600 }}>{m}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Perfil /eu
// ────────────────────────────────────────────────────────────
function SiteProfile({ goto }) {
  const p = PALETTE_A;
  return (
    <div style={{ background: p.bg, color: p.ink, position: 'relative', minHeight: 'calc(100vh - 60px)' }}>
      <Paper/>

      <div style={{ padding: '40px 6vw 80px', maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        {/* Há X anos · lembrança */}
        <div onClick={() => goto('/e/mavie-1-ano')} style={{
          background: p.ink, color: p.bg, borderRadius: 18, padding: '18px 22px',
          marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer',
          boxShadow: '5px 6px 0 ' + p.coral,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(rgba(247,238,219,0.7) 1px, transparent 1.5px)',
            backgroundSize: '14px 14px',
          }}/>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <RingMark size={48} color={p.bg} count={3} dot={p.coral}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-mono" style={{ fontSize: 11, color: p.sol, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 700 }}>há 1 ano · hoje</div>
            <div className="font-a-display-i" style={{ fontSize: 22, color: p.bg, lineHeight: 1.2, marginTop: 4 }}>
              você esteve no Aniversário da tia Lila · 30 anos
            </div>
            <div className="font-a-body" style={{ fontSize: 12.5, color: 'rgba(247,238,219,0.78)', marginTop: 4 }}>
              92 fotos · 14 vídeos · 38 recados · você publicou 1 foto e 1 recado
            </div>
          </div>
          <button className="btn font-a-body" style={{
            background: p.sol, color: p.ink, padding: '10px 14px', borderRadius: 10,
            fontSize: 12, fontWeight: 700, border: 0, cursor: 'pointer', flexShrink: 0,
          }}>reabrir cápsula →</button>
        </div>

        {/* header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 28, alignItems: 'center' }} className="grid-collapse">
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{ position: 'relative' }}>
              <Avatar name="Maria S" tint={p.uva} size={108}/>
              <span style={{ position: 'absolute', bottom: 0, right: 0, background: p.coral, color: '#fff', padding: '3px 9px', borderRadius: 999, fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono', letterSpacing: 0.4 }}>+12</span>
            </div>
            <div>
              <div className="font-a-body" style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: p.ink2, fontWeight: 700 }}>seu perfil</div>
              <h1 className="font-a-display-i" style={{ fontSize: 'clamp(36px, 4vw, 56px)', margin: '4px 0 0', lineHeight: 1.05 }}>Maria Santos</h1>
              <div className="font-a-display" style={{ fontSize: 18, color: p.coral, marginTop: 8 }}>@maria.s · São Paulo</div>
              <p className="font-a-body" style={{ fontSize: 13.5, color: p.ink2, marginTop: 10, maxWidth: 480, lineHeight: 1.5 }}>
                Dindo da Mavie, mãe do Caio. Costumo chegar atrasada e sair sem despedir.
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { n: 14, l: 'eventos participados', c: p.coral },
              { n: 47, l: 'memórias compartilhadas', c: p.sol },
              { n: 3, l: 'eventos criados', c: p.uva },
            ].map((s,i)=>(
              <div key={i} style={{
                background: p.card, padding: '16px 18px', borderRadius: 14,
                border: `1.5px solid ${p.ink}`,
              }}>
                <div className="font-a-display" style={{ fontSize: 'clamp(36px, 3.4vw, 48px)', color: s.c, lineHeight: 1 }}>{s.n}</div>
                <div className="font-a-body" style={{ fontSize: 11, color: p.ink2, marginTop: 6, letterSpacing: 0.3, fontWeight: 600, lineHeight: 1.4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* nav tabs */}
        <div style={{ marginTop: 36, display: 'flex', gap: 18, borderBottom: `1px solid rgba(27,18,9,0.18)`, flexWrap: 'wrap' }}>
          {['cápsulas','presenças conectadas','criados','rascunhos','convites pendentes · 3'].map((t,i)=>(
            <button key={t} className="font-a-body" style={{
              background: 'transparent', border: 0, padding: '14px 4px', fontSize: 14,
              color: i === 0 ? p.ink : p.ink2, fontWeight: i === 0 ? 700 : 500, cursor: 'pointer',
              borderBottom: i === 0 ? `2.5px solid ${p.coral}` : '2.5px solid transparent',
              marginBottom: -1,
            }}>{t}</button>
          ))}
        </div>

        {/* presenças conectadas — preview */}
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <h3 className="font-a-display-i" style={{ fontSize: 28, margin: 0, lineHeight: 1.1 }}>pessoas que você acompanha</h3>
            <span className="font-a-body" style={{ fontSize: 12.5, color: p.ink2 }}>cápsulas onde você esteve junto · acompanhe a vida delas</span>
          </div>

          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="grid-collapse-3">
            {[
              { name: 'Mavie A.', tint: p.coral, count: 4, since: 'desde 2024', age: '· 1 ano', next: 'Mavie · 1 aninho', last: '14 mar 2026', highlight: true },
              { name: 'tia Lila', tint: p.uva, count: 7, since: 'desde 2018', age: '· 30 anos', next: 'Aniversário · 30 anos', last: '03 jun 2025' },
              { name: 'João & Ana', tint: p.jardim, count: 3, since: 'desde 2023', age: '· casal', next: 'Casamento', last: '22 nov 2025' },
            ].map((c, i) => (
              <div key={i} onClick={() => c.highlight && goto('/e/mavie-1-ano')} style={{
                background: c.highlight ? p.ink : p.card, color: c.highlight ? p.bg : p.ink,
                border: `1.5px solid ${p.ink}`, borderRadius: 16,
                padding: '18px 20px', cursor: c.highlight ? 'pointer' : 'default',
                position: 'relative', overflow: 'hidden',
              }}>
                {c.highlight && (
                  <div style={{
                    position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none',
                    backgroundImage: 'radial-gradient(rgba(247,238,219,0.7) 1px, transparent 1.5px)',
                    backgroundSize: '14px 14px',
                  }}/>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
                  <Avatar name={c.name} tint={c.tint} size={42}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-a-display-i" style={{
                      fontSize: 22, lineHeight: 1.1,
                      color: c.highlight ? p.bg : p.ink,
                    }}>{c.name} <span style={{ fontSize: 13, color: c.highlight ? p.sol : p.ink2 }}>{c.age}</span></div>
                    <div className="font-mono" style={{
                      fontSize: 10.5, marginTop: 4, letterSpacing: 0.4,
                      color: c.highlight ? 'rgba(247,238,219,0.7)' : p.ink2,
                    }}>{c.count} cápsulas juntos · {c.since}</div>
                  </div>
                </div>
                <div style={{
                  marginTop: 14, padding: '10px 12px', borderRadius: 10,
                  background: c.highlight ? 'rgba(247,238,219,0.08)' : p.bg2,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{ flex: 1 }}>
                    <div className="font-a-body" style={{
                      fontSize: 12, fontWeight: 700,
                      color: c.highlight ? p.bg : p.ink,
                    }}>{c.next}</div>
                    <div className="font-a-body" style={{
                      fontSize: 11, marginTop: 2,
                      color: c.highlight ? 'rgba(247,238,219,0.7)' : p.ink2,
                    }}>última · {c.last}</div>
                  </div>
                  <Ico.arrow s={16}/>
                </div>
                {c.highlight && (
                  <div className="font-a-body" style={{
                    marginTop: 12, fontSize: 11.5, color: p.sol, fontWeight: 700, letterSpacing: 0.3,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <Ico.spark s={12}/> ver a vida em cápsulas da Mavie →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* history by year */}
        <div style={{ marginTop: 28 }}>
          {[
            { year: '2026', events: [
              { date: '14 mar', t: 'Mavie · 1 aninho', host: 'Camila A & Diego', role: 'convidada', stat: '247 fotos · 86 recados', c: '#FBE3CC', live: false, soon: false },
              { date: '01 jan', t: 'Réveillon · cobertura', host: 'Lia M', role: 'convidada', stat: '94 fotos · 12 vídeos', c: '#E5D5F2' },
            ]},
            { year: '2025', events: [
              { date: '22 nov', t: 'Casamento João & Ana', host: 'Ana B', role: 'convidada', stat: '412 fotos · 38 vídeos', c: '#F1D8C9' },
              { date: '15 ago', t: 'Formatura Eng. UFMG', host: 'Pedro L', role: 'convidada', stat: '186 fotos · 22 vídeos', c: '#D9E8F4' },
              { date: '03 jun', t: 'Aniversário da Lila · 30 anos', host: 'tia Lila', role: 'criadora', stat: '92 fotos · 14 vídeos', c: '#D9E8DC' },
              { date: '12 mar', t: 'Festival do bairro', host: 'memória pública', role: 'visitante', stat: '1.8k fotos · 200 vídeos', c: p.bg2, public: true },
            ]},
            { year: '2024', events: [
              { date: '14 dez', t: 'Chá da Mavie', host: 'Camila A', role: 'convidada', stat: '88 fotos · 4 vídeos', c: '#FBE3CC' },
              { date: '20 set', t: 'Aniversário da vovó · 70', host: 'Diego A', role: 'criadora', stat: '156 fotos · 18 vídeos', c: '#F1D8C9' },
            ]},
            { year: '2023', events: [
              { date: '08 dez', t: 'Confraternização Empresa X', host: 'RH', role: 'convidada', stat: '64 fotos · 8 vídeos', c: '#D9E8F4' },
            ]},
          ].map((yr, yi) => (
            <div key={yi} style={{ marginTop: yi === 0 ? 0 : 36, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <h2 className="font-a-display-i" style={{ fontSize: 'clamp(56px, 6.4vw, 88px)', margin: 0, lineHeight: 0.9, color: yi === 0 ? p.coral : p.ink2 }}>{yr.year}</h2>
                <span className="font-a-body" style={{ fontSize: 13, color: p.ink2 }}>{yr.events.length} {yr.events.length === 1 ? 'evento' : 'eventos'}</span>
                <span style={{ flex: 1, height: 1, background: 'rgba(27,18,9,0.18)' }}/>
              </div>
              <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="grid-collapse-4">
                {yr.events.map((e, ei) => (
                  <div key={ei} onClick={() => e.t.includes('Mavie · 1') && goto('/e/mavie-1-ano')} className="polaroid" style={{
                    cursor: e.t.includes('Mavie · 1') ? 'pointer' : 'default',
                    transform: `rotate(${((yi*7 + ei*3) % 5 - 2) * 0.7}deg)`,
                    position: 'relative',
                  }}>
                    <div style={{ position: 'relative' }}>
                      <Placeholder w={'100%'} h={160} label={e.t} bg={e.c}/>
                      <span style={{
                        position: 'absolute', top: 8, left: 8,
                        background: e.role === 'criadora' ? p.coral : e.role === 'visitante' ? p.ceu : p.ink,
                        color: '#fff', padding: '3px 7px', borderRadius: 999,
                        fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: 0.4, textTransform: 'uppercase',
                      }}>{e.role}</span>
                      {e.public && (
                        <span style={{
                          position: 'absolute', top: 8, right: 8,
                          background: p.uva, color: '#fff', padding: '3px 7px', borderRadius: 999,
                          fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: 0.4, textTransform: 'uppercase',
                        }}>público</span>
                      )}
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <div className="font-mono" style={{ fontSize: 10, color: p.ink2 }}>{e.date}</div>
                    </div>
                    <div className="font-a-display-i" style={{ fontSize: 15, color: p.ink, marginTop: 2, lineHeight: 1.15 }}>{e.t}</div>
                    <div className="font-a-body" style={{ fontSize: 11, color: p.ink2, marginTop: 2 }}>por {e.host}</div>
                    <div className="font-a-body" style={{ fontSize: 10.5, color: p.ink2, marginTop: 4, fontFamily: 'JetBrains Mono' }}>{e.stat}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* footer note */}
        <div style={{
          marginTop: 60, padding: '22px 26px', background: p.ink, color: p.bg,
          borderRadius: 18, display: 'flex', alignItems: 'center', gap: 18,
        }}>
          <Ico.spark s={20}/>
          <div>
            <div className="font-a-display-i" style={{ fontSize: 20, color: p.bg, lineHeight: 1.1 }}>seus eventos nunca serão apagados</div>
            <div className="font-a-body" style={{ fontSize: 12.5, color: 'rgba(247,238,219,0.7)', marginTop: 4, lineHeight: 1.55, maxWidth: 600 }}>
              Cada cápsula que você ajudou a construir continua acessível pelo link original — quem esteve junto também tem acesso. Você pode exportar tudo a qualquer momento.
            </div>
          </div>
          <button className="btn font-a-body" style={{ marginLeft: 'auto', background: p.sol, color: p.ink, padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
            exportar histórico
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SiteCreate, SiteProfile, AIMsg });
