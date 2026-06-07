// flows.jsx — fluxos compartilhados
// AI chat mobile + desktop, mural ao vivo, upload, evento público

// ─── Chat IA — Mobile ──────────────────────────────────────
function AIChatMobile() {
  const p = PALETTE_A;
  const conversation = [
    { who: 'ai', t: 'Oi Camila! Vamos criar o convite da Mavie. Comecei a montar com o que você me contou. Te mostro algumas opções?' },
    { who: 'me', t: 'Sim!' },
    { who: 'ai', t: 'Pra um aniversário de 1 ano com tema "Jardim Encantado" tô sugerindo essa paleta — quer trocar?', chips: [
      { c: '#FF6B5C' },{ c: '#FFB23E' },{ c: '#6FBF73' },{ c: '#6AB7E8' },{ c: '#B69AE8' },
    ], action: 'paleta · "Jardim suave"' },
    { who: 'ai', t: 'E o texto:', card: {
      title: 'A Mavie vai fazer 1 aninho!',
      body: 'Sob a sombra das acácias, no quintal favorito da vovó, vamos celebrar o primeiro giro em volta do sol da nossa pequena.',
    }},
    { who: 'me', t: 'Adorei o texto. Pode gerar uma capa mais infantil?' },
    { who: 'ai', t: 'Tô gerando 3 opções pra capa.', loading: true },
  ];

  return (
    <div style={{ background: p.bg, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 54 }}/>

      {/* nav */}
      <div style={{
        padding: '6px 18px 12px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: `1px solid rgba(27,18,9,0.12)`,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: p.ink,
          color: p.sol, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="spin" style={{ display: 'inline-flex' }}><Ico.spark s={18}/></div>
        </div>
        <div>
          <div className="font-a-display" style={{ fontSize: 16, color: p.ink, lineHeight: 1.1 }}>Assistente Memories</div>
          <div className="font-a-body" style={{ fontSize: 11, color: p.ink2 }}>passo 4 de 6 · convite da Mavie</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <span className="pill" style={{ background: p.card, color: p.ink2, fontSize: 10, border: `1px solid rgba(27,18,9,0.18)` }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: p.jardim }} className="live-dot"/> salvando
          </span>
        </div>
      </div>

      {/* messages */}
      <div className="no-scrollbar" style={{ flex: 1, overflow: 'auto', padding: '14px 16px 8px' }}>
        {conversation.map((m, i) => {
          if (m.who === 'me') return (
            <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', margin: '8px 0' }}>
              <div style={{
                background: p.ink, color: p.bg, borderRadius: '16px 16px 4px 16px',
                padding: '10px 14px', maxWidth: '78%',
                fontFamily: 'Plus Jakarta Sans', fontSize: 14,
              }}>{m.t}</div>
            </div>
          );
          return (
            <div key={i} style={{ margin: '12px 0', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8, background: p.coral, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
              }}><Ico.spark s={13}/></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  background: p.card, borderRadius: '4px 16px 16px 16px',
                  padding: '10px 14px',
                  border: `1px solid rgba(27,18,9,0.10)`,
                  fontFamily: 'Plus Jakarta Sans', fontSize: 14, color: p.ink, lineHeight: 1.4,
                }}>
                  {m.t}
                </div>
                {/* palette chips */}
                {m.chips && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                    <div style={{ display: 'flex' }}>
                      {m.chips.map((c, ci) => (
                        <span key={ci} style={{
                          width: 26, height: 26, borderRadius: 999, background: c.c,
                          marginLeft: ci ? -8 : 0, boxShadow: '0 0 0 2px ' + p.bg,
                        }}/>
                      ))}
                    </div>
                    <span className="font-a-body" style={{ fontSize: 12, color: p.ink2, fontWeight: 600 }}>{m.action}</span>
                    <button className="btn font-a-body" style={{
                      marginLeft: 'auto', background: p.bg2, color: p.ink, padding: '6px 10px',
                      borderRadius: 999, fontSize: 11, fontWeight: 700,
                    }}>trocar</button>
                  </div>
                )}
                {/* card preview */}
                {m.card && (
                  <div style={{
                    marginTop: 8, padding: '12px 14px', background: p.card,
                    borderRadius: 12, border: `1.5px dashed rgba(27,18,9,0.3)`,
                  }}>
                    <div className="font-a-display-i" style={{ fontSize: 18, color: p.ink, lineHeight: 1.2 }}>{m.card.title}</div>
                    <p className="font-a-body" style={{ fontSize: 12.5, color: p.ink2, marginTop: 6, lineHeight: 1.45 }}>{m.card.body}</p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <span className="pill" style={{ background: p.jardim, color: '#fff', fontSize: 9 }}>usar este</span>
                      <span className="pill" style={{ background: p.bg2, color: p.ink2, fontSize: 9 }}>refazer</span>
                      <span className="pill" style={{ background: p.bg2, color: p.ink2, fontSize: 9 }}>mais formal</span>
                    </div>
                  </div>
                )}
                {/* loading row of 3 capa drafts */}
                {m.loading && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
                    {[0,1,2].map(j=>(
                      <div key={j} style={{
                        aspectRatio: '3/4', borderRadius: 10, background: p.bg2,
                        position: 'relative', overflow: 'hidden',
                        border: `1.5px solid rgba(27,18,9,0.15)`,
                      }}>
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: `linear-gradient(110deg, transparent 30%, rgba(255,178,62,0.4) 50%, transparent 70%)`,
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 1.6s linear infinite',
                        }}/>
                        <span style={{
                          position: 'absolute', left: 6, bottom: 6,
                          fontFamily: 'JetBrains Mono', fontSize: 9, color: p.ink2,
                        }}>capa {j+1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
      </div>

      {/* suggestion strip */}
      <div style={{
        padding: '10px 14px 8px', display: 'flex', gap: 8, overflow: 'auto',
        borderTop: `1px solid rgba(27,18,9,0.10)`,
      }}>
        {['mudar tom pra mais formal','adicionar lista de presentes','sugerir mais 3 títulos','traduzir pra inglês'].map((s,i)=>(
          <span key={i} className="font-a-body" style={{
            flexShrink: 0, padding: '8px 12px', background: p.card, borderRadius: 999,
            fontSize: 12, color: p.ink, border: `1px solid rgba(27,18,9,0.18)`,
          }}>{s}</span>
        ))}
      </div>

      {/* input */}
      <div style={{
        padding: '8px 14px 16px', display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <div style={{
          flex: 1, background: p.card, borderRadius: 999,
          border: `1.5px solid ${p.ink}`,
          padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'Plus Jakarta Sans', fontSize: 14, color: p.ink2,
        }}>
          peça uma mudança ou cole detalhes...
        </div>
        <button style={{
          width: 44, height: 44, borderRadius: 999, background: p.coral, color: '#fff',
          border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Ico.send s={18}/></button>
      </div>
    </div>
  );
}

// ─── Chat IA — Desktop (split: chat + preview ao vivo) ──────
function AIChatDesktop() {
  const p = PALETTE_A;
  return (
    <Desktop url="memories.com/criar" palette="a" w={1280} h={800}>
      <div style={{ background: p.bg, width: '100%', height: '100%', display: 'flex' }}>
        {/* left chat */}
        <div style={{
          width: 520, borderRight: `1.5px solid rgba(27,18,9,0.12)`,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: `1px solid rgba(27,18,9,0.10)`,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: p.ink,
              color: p.sol, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Ico.spark s={18}/></div>
            <div>
              <div className="font-a-display" style={{ fontSize: 18, color: p.ink, lineHeight: 1.1 }}>Vamos criar o convite</div>
              <div className="font-a-body" style={{ fontSize: 12, color: p.ink2 }}>passo 4 de 6 · só faltam <b style={{ color: p.coral }}>2</b></div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <span className="pill" style={{ background: p.bg2, color: p.ink2, fontSize: 10 }}>rascunho salvo</span>
            </div>
          </div>

          {/* progress dots */}
          <div style={{ padding: '10px 22px', display: 'flex', gap: 6 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: 999,
                background: i <= 4 ? p.coral : p.bg2,
              }}/>
            ))}
          </div>

          <div className="no-scrollbar" style={{ flex: 1, overflow: 'auto', padding: '8px 22px 12px' }}>
            {[
              { who: 'ai', t: 'Conta um pouco sobre a Mavie — o que você quer que esse convite passe pra família?' },
              { who: 'me', t: 'Quero algo doce, com cara de natureza, sem fofura demais. Que dê pra emoldurar.' },
              { who: 'ai', t: 'Perfeito. Trabalhei nessa direção:', card: true },
              { who: 'me', t: 'Adorei o texto. Pode tentar uma capa mais infantil?' },
              { who: 'ai', t: 'Gerei 3 opções de capa. Qual você prefere?', drafts: true },
            ].map((m, i) => m.who === 'me' ? (
              <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', margin: '10px 0' }}>
                <div style={{
                  background: p.ink, color: p.bg, borderRadius: '16px 16px 4px 16px',
                  padding: '10px 14px', maxWidth: '85%',
                  fontFamily: 'Plus Jakarta Sans', fontSize: 13.5,
                }}>{m.t}</div>
              </div>
            ) : (
              <div key={i} style={{ margin: '14px 0', display: 'flex', gap: 10 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8, background: p.coral, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
                }}><Ico.spark s={13}/></div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    background: p.card, borderRadius: '4px 16px 16px 16px',
                    padding: '10px 14px',
                    border: `1px solid rgba(27,18,9,0.10)`,
                    fontFamily: 'Plus Jakarta Sans', fontSize: 13.5, color: p.ink, lineHeight: 1.45,
                  }}>{m.t}</div>
                  {m.card && (
                    <div style={{
                      marginTop: 8, padding: '12px 14px', background: p.card,
                      borderRadius: 12, border: `1.5px dashed rgba(27,18,9,0.3)`,
                    }}>
                      <div className="font-a-display-i" style={{ fontSize: 20, color: p.ink, lineHeight: 1.15 }}>A Mavie vai fazer 1 aninho!</div>
                      <p className="font-a-body" style={{ fontSize: 12.5, color: p.ink2, marginTop: 6, lineHeight: 1.5 }}>
                        Sob a sombra das acácias, no quintal favorito da vovó, vamos celebrar o primeiro giro em volta do sol da nossa pequena.
                      </p>
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                        <span className="pill" style={{ background: p.jardim, color: '#fff', fontSize: 9 }}>usar</span>
                        <span className="pill" style={{ background: p.bg2, color: p.ink2, fontSize: 9 }}>refazer</span>
                        <span className="pill" style={{ background: p.bg2, color: p.ink2, fontSize: 9 }}>mais curto</span>
                      </div>
                    </div>
                  )}
                  {m.drafts && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
                      {[
                        { c: '#F4D5BA', l: 'aquarela' },
                        { c: '#D7EDD9', l: 'botânico', selected: true },
                        { c: '#E5D5F2', l: 'pop infantil' },
                      ].map((d, j)=>(
                        <div key={j} style={{
                          aspectRatio: '3/4', borderRadius: 8, position: 'relative', overflow: 'hidden',
                          border: d.selected ? `2.5px solid ${p.coral}` : `1px solid rgba(27,18,9,0.15)`,
                        }}>
                          <Placeholder w={'100%'} h={'100%'} label={d.l} bg={d.c} radius={6}/>
                          {d.selected && (
                            <span style={{
                              position: 'absolute', top: 6, right: 6,
                              width: 18, height: 18, borderRadius: 999, background: p.coral,
                              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}><Ico.check s={11} w={3}/></span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* input */}
          <div style={{ padding: '8px 18px 16px' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflow: 'auto' }} className="no-scrollbar">
              {['mais 3 títulos','traduzir pra inglês','adicionar mapa','sugerir hashtags'].map((s,i)=>(
                <span key={i} className="font-a-body" style={{
                  flexShrink: 0, padding: '6px 10px', background: p.card, borderRadius: 999,
                  fontSize: 11.5, color: p.ink, border: `1px solid rgba(27,18,9,0.18)`,
                }}>{s}</span>
              ))}
            </div>
            <div style={{
              background: p.card, borderRadius: 14, border: `1.5px solid ${p.ink}`,
              padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div className="font-a-body" style={{ flex: 1, fontSize: 13, color: p.ink2 }}>peça uma mudança, refine o tom, anexe foto...</div>
              <button style={{ width: 36, height: 36, borderRadius: 10, background: p.coral, color: '#fff', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ico.send s={16}/>
              </button>
            </div>
          </div>
        </div>

        {/* right preview */}
        <div style={{ flex: 1, padding: '24px 36px', position: 'relative', overflow: 'auto' }} className="no-scrollbar">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
          }}>
            <span className="font-a-body" style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: p.ink2, fontWeight: 700 }}>preview ao vivo</span>
            <span className="pill" style={{ background: p.card, color: p.ink2, border: `1px solid rgba(27,18,9,0.18)`, fontSize: 10 }}>desktop · mobile</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <span className="pill" style={{ background: p.bg2, color: p.ink2, fontSize: 10 }}>↺ desfazer</span>
              <span className="pill" style={{ background: p.ink, color: p.bg, fontSize: 10 }}>publicar</span>
            </div>
          </div>

          {/* mini mobile preview */}
          <div style={{
            margin: '0 auto', width: 280, height: 540, background: p.card,
            borderRadius: 28, border: `1.5px solid ${p.ink}`, padding: 14, position: 'relative',
            boxShadow: '8px 10px 0 rgba(27,18,9,0.10)',
          }}>
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
              <ConfettiBurst style={{ margin: '0 auto' }} scale={0.7}/>
              <div className="font-a-body" style={{ fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', color: p.ink2, fontWeight: 700 }}>tema · {EVENT.theme}</div>
              <h1 className="font-a-display-i" style={{ margin: '4px 0 0', fontSize: 56, lineHeight: 0.88, color: p.ink }}>{EVENT.child}</h1>
              <div className="font-a-display" style={{ fontSize: 18, color: p.coral, marginTop: 2 }}>1 aninho</div>
            </div>
            <div style={{ marginTop: 16, padding: '0 8px' }}>
              <div className="polaroid" style={{ transform: 'rotate(-3deg)', width: '100%', padding: 6, paddingBottom: 22 }}>
                <Placeholder w={'100%'} h={140} label="capa · botânico" bg="#D7EDD9"/>
              </div>
            </div>
            <div style={{ padding: '12px 8px 0' }}>
              <div className="font-a-body" style={{ fontSize: 11, color: p.ink2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>quando</div>
              <div className="font-a-display" style={{ fontSize: 14, color: p.ink, marginTop: 2 }}>14 mar 2026 · 15h</div>
            </div>
            <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
              <button className="btn font-a-body" style={{
                width: '100%', background: p.ink, color: p.bg,
                padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              }}>Confirmar presença</button>
            </div>
          </div>

          {/* updates list */}
          <div style={{ marginTop: 18, padding: '14px 16px', background: p.card, borderRadius: 14, border: `1px solid rgba(27,18,9,0.12)` }}>
            <div className="font-a-body" style={{ fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', color: p.ink2, fontWeight: 700, marginBottom: 8 }}>a IA preparou</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { ico: <Ico.spark s={11}/>, t: 'texto do convite', d: '3 variações' },
                { ico: <Ico.spark s={11}/>, t: 'capa do convite', d: '3 imagens · 1 escolhida' },
                { ico: <Ico.spark s={11}/>, t: 'paleta', d: 'jardim suave' },
                { ico: <Ico.spark s={11}/>, t: 'mensagem pós-evento', d: 'pronta · revisar' },
                { ico: <Ico.spark s={11}/>, t: 'hashtags', d: '#mavie1ano +6' },
                { ico: <Ico.spark s={11}/>, t: 'descrição do evento', d: 'pronta' },
              ].map((it,i)=>(
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', background: p.bg, borderRadius: 8,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 5, background: p.coral, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{it.ico}</div>
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
    </Desktop>
  );
}

// ─── Mural ao vivo (mobile) ─────────────────────────────────
function MuralAoVivoMobile() {
  const p = PALETTE_A;
  const posts = [
    { who: 'Ana B', tint: p.coral, time: 'agora', kind: 'photo', h: 200, c: p.bg2, l: 'bolo · 17h12', likes: 12, comments: 3, msg: 'que tarde linda 🌿' },
    { who: 'Pedro L', tint: p.ceu, time: '2 min', kind: 'video', h: 200, c: '#D9E8F4', l: 'vídeo · 00:42', likes: 8, comments: 1 },
    { who: 'tio Caio', tint: p.jardim, time: '4 min', kind: 'message', msg: 'Mavie, que sua vida seja tão linda quanto essa tarde. Tio te ama.' },
    { who: 'tia Lila', tint: p.uva, time: '8 min', kind: 'photo', h: 220, c: '#FBE3CC', l: 'coroa de flores', likes: 21, comments: 5 },
  ];
  return (
    <div style={{ background: p.bg, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 54 }}/>

      {/* event header sticky */}
      <div style={{ padding: '6px 18px 12px' }}>
        <div style={{
          background: p.coral, color: '#FFF8E8', borderRadius: 14,
          padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div className="font-a-display-i" style={{ fontSize: 22, lineHeight: 1 }}>{EVENT.child} · 1 ano</div>
          <span className="pill" style={{
            background: 'rgba(255,255,255,0.95)', color: p.coral,
            marginLeft: 'auto', fontSize: 9.5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: p.coral }} className="live-dot"/> ao vivo
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '8px 4px 0',
        }}>
          <AvatarStack people={[{name:'A',tint:p.coral},{name:'P',tint:p.ceu},{name:'L',tint:p.uva}]} size={20}/>
          <span className="font-a-body" style={{ fontSize: 11.5, color: p.ink2 }}>47 pessoas estão aqui agora</span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <span className="pill" style={{ background: p.bg2, color: p.ink2, fontSize: 9 }}>tudo</span>
            <span className="pill" style={{ background: p.coral, color: '#fff', fontSize: 9 }}>fotos</span>
            <span className="pill" style={{ background: p.bg2, color: p.ink2, fontSize: 9 }}>vídeos</span>
          </span>
        </div>
      </div>

      {/* feed */}
      <div className="no-scrollbar" style={{ flex: 1, overflow: 'auto', padding: '4px 14px 12px' }}>
        {posts.map((it, i) => (
          <div key={i} style={{
            background: p.card, borderRadius: 14,
            border: `1px solid rgba(27,18,9,0.10)`,
            padding: '12px', marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={it.who} tint={it.tint} size={28}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-a-body" style={{ fontSize: 13, fontWeight: 700, color: p.ink }}>{it.who}</div>
                <div className="font-a-body" style={{ fontSize: 10.5, color: p.ink2 }}>publicou {it.time} {it.kind === 'video' && '· vídeo'}</div>
              </div>
              <Ico.dots s={16}/>
            </div>
            {it.kind === 'message' ? (
              <div style={{
                marginTop: 10, padding: '14px 16px',
                background: p.sol, color: p.ink, borderRadius: 10,
              }}>
                <p className="font-a-display-i" style={{ margin: 0, fontSize: 17, lineHeight: 1.4 }}>"{it.msg}"</p>
              </div>
            ) : (
              <div style={{ marginTop: 10, borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
                <Placeholder w={'100%'} h={it.h} label={it.l} bg={it.c}/>
                {it.kind === 'video' && (
                  <>
                    <span style={{
                      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
                      width: 48, height: 48, borderRadius: 999, background: 'rgba(255,255,255,0.95)',
                      color: p.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}><Ico.play s={20}/></span>
                    <span style={{
                      position: 'absolute', right: 10, bottom: 10, background: 'rgba(27,18,9,0.7)',
                      color: '#fff', padding: '3px 7px', borderRadius: 6,
                      fontFamily: 'JetBrains Mono', fontSize: 10,
                    }}>00:42</span>
                  </>
                )}
                {it.msg && (
                  <div style={{
                    position: 'absolute', left: 10, bottom: 10, right: 10,
                    background: 'rgba(255,255,255,0.95)', borderRadius: 8,
                    padding: '6px 10px', fontFamily: 'Plus Jakarta Sans', fontSize: 12, color: p.ink,
                  }}>{it.msg}</div>
                )}
              </div>
            )}
            {/* actions */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, marginTop: 10,
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: p.coral }}>
                <Ico.heart s={16} fill={p.coral}/>
                <span className="font-a-body" style={{ fontSize: 12, color: p.ink, fontWeight: 600 }}>{it.likes || 4}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: p.ink2 }}>
                <Ico.msg s={16}/>
                <span className="font-a-body" style={{ fontSize: 12, color: p.ink, fontWeight: 600 }}>{it.comments || 0}</span>
              </span>
              <span style={{ marginLeft: 'auto', color: p.ink2 }}><Ico.share s={14}/></span>
            </div>
          </div>
        ))}
      </div>

      {/* composer */}
      <div style={{
        padding: '10px 14px 16px', background: p.bg, borderTop: `1px solid rgba(27,18,9,0.10)`,
      }}>
        <div className="font-a-body" style={{
          fontSize: 10.5, color: p.ink2, fontWeight: 700, letterSpacing: 0.4,
          textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between',
        }}>
          <span>seu espaço para hoje</span>
          <span>1/2 fotos · 0/1 vídeo · 0/1 mensagem</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 6 }}>
          {[
            { ico: <Ico.cam s={16}/>, l: '+ foto', c: p.coral, used: 1, max: 2 },
            { ico: <Ico.play s={14}/>, l: '+ vídeo', c: p.ceu, used: 0, max: 1 },
            { ico: <Ico.msg s={14}/>, l: '+ recado', c: p.uva, used: 0, max: 1 },
          ].map((b,i)=>(
            <button key={i} style={{
              background: p.card, border: `1.5px solid ${p.ink}`,
              padding: '10px 8px', borderRadius: 12,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: p.ink, fontFamily: 'Plus Jakarta Sans',
            }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: b.c, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{b.ico}</div>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{b.l}</span>
              <span style={{ fontSize: 9.5, color: p.ink2, fontFamily: 'JetBrains Mono' }}>{b.used}/{b.max}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Upload (mobile, foco em qualidade) ─────────────────────
function UploadMobile() {
  const p = PALETTE_A;
  return (
    <div style={{ background: p.bg, height: '100%', overflow: 'auto' }} className="no-scrollbar">
      <div style={{ height: 54 }}/>

      <div style={{ padding: '8px 18px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 999, background: p.card, border: `1.5px solid ${p.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={p.ink} strokeWidth="2" strokeLinecap="round"><path d="M15 6l-6 6 6 6"/></svg>
        </div>
        <div>
          <div className="font-a-display" style={{ fontSize: 18, color: p.ink }}>compartilhar memória</div>
          <div className="font-a-body" style={{ fontSize: 11, color: p.ink2 }}>Mavie · 1 ano · ao vivo</div>
        </div>
      </div>

      {/* hint */}
      <div style={{ padding: '14px 18px 0' }}>
        <div style={{
          background: p.uva, color: '#fff', borderRadius: 12, padding: '12px 14px',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <Ico.spark s={18}/>
          <div>
            <div className="font-a-body" style={{ fontSize: 12.5, fontWeight: 700 }}>Aqui é qualidade, não quantidade.</div>
            <div className="font-a-body" style={{ fontSize: 11.5, opacity: 0.92, marginTop: 2, lineHeight: 1.4 }}>
              Cada convidado tem 2 fotos, 1 vídeo e 1 recado pra deixar nessa cápsula. Escolha o que importa.
            </div>
          </div>
        </div>
      </div>

      {/* slots */}
      <div style={{ padding: '18px 18px 0' }}>
        <div className="font-a-body" style={{ fontSize: 11, color: p.ink2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>fotos · 1 de 2</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
          <div style={{
            aspectRatio: '3/4', borderRadius: 12, position: 'relative', overflow: 'hidden',
            border: `1.5px solid ${p.ink}`,
          }}>
            <Placeholder w={'100%'} h={'100%'} label="ana · 17h12" bg={p.bg2} radius={10}/>
            <span style={{
              position: 'absolute', top: 8, right: 8, background: p.jardim, color: '#fff',
              padding: '4px 7px', borderRadius: 999, fontFamily: 'JetBrains Mono', fontSize: 9,
            }}>✓ subida</span>
          </div>
          <div style={{
            aspectRatio: '3/4', borderRadius: 12, position: 'relative',
            border: `1.5px dashed ${p.ink}`, background: p.card,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 999, background: p.coral, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico.plus s={20}/>
            </div>
            <span className="font-a-body" style={{ fontSize: 12, color: p.ink, fontWeight: 700 }}>foto 2 / 2</span>
            <span className="font-mono" style={{ fontSize: 9.5, color: p.ink2 }}>câmera · galeria</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '18px 18px 0' }}>
        <div className="font-a-body" style={{ fontSize: 11, color: p.ink2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>vídeo · 0 de 1</div>
        <div style={{
          marginTop: 8, padding: '14px', borderRadius: 12, background: p.card,
          border: `1.5px dashed ${p.ink}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: p.ceu, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ico.play s={20}/>
          </div>
          <div style={{ flex: 1 }}>
            <div className="font-a-body" style={{ fontSize: 13.5, color: p.ink, fontWeight: 700 }}>Gravar 1 vídeo curto</div>
            <div className="font-a-body" style={{ fontSize: 11.5, color: p.ink2, marginTop: 2 }}>até 60 segundos · vertical funciona melhor</div>
          </div>
          <Ico.plus s={18}/>
        </div>
      </div>

      <div style={{ padding: '18px 18px 0' }}>
        <div className="font-a-body" style={{ fontSize: 11, color: p.ink2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>recado · 0 de 1</div>
        <div style={{
          marginTop: 8, padding: '14px', borderRadius: 12, background: p.sol, color: p.ink,
          border: `1.5px solid ${p.ink}`,
        }}>
          <p className="font-a-display-i" style={{
            margin: 0, fontSize: 18, lineHeight: 1.35, color: p.ink, opacity: 0.55,
          }}>"deixe um recado pra Mavie ler quando crescer..."</p>
          <div style={{
            marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontFamily: 'JetBrains Mono', fontSize: 10, color: p.ink2,
          }}>
            <span>0 / 240</span>
            <span style={{
              background: p.ink, color: p.sol, padding: '5px 10px',
              borderRadius: 999, fontWeight: 700, letterSpacing: 0.3,
            }}>escrever</span>
          </div>
        </div>
      </div>

      {/* publish */}
      <div style={{ padding: '24px 18px 32px' }}>
        <button className="btn font-a-body" style={{
          width: '100%', background: p.ink, color: p.bg,
          padding: '14px', borderRadius: 12, fontSize: 14.5, fontWeight: 700,
          boxShadow: `4px 5px 0 ${p.coral}`,
        }}>
          <Ico.heart s={16}/> publicar na cápsula
        </button>
        <div className="font-a-body" style={{ textAlign: 'center', fontSize: 11, color: p.ink2, marginTop: 8, lineHeight: 1.5 }}>
          O que você publicar aqui vai morar para sempre no álbum da Mavie. Esse link nunca expira.
        </div>
      </div>
    </div>
  );
}

// ─── Evento público (festival, mobile) ──────────────────────
function EventoPublicoMobile() {
  const p = PALETTE_B;
  return (
    <div style={{ background: p.bg, height: '100%', overflow: 'auto' }} className="no-scrollbar">
      <div style={{ height: 54 }}/>

      {/* top */}
      <div style={{ padding: '6px 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <RingMark size={22} color={p.ink} count={3} dot={p.magenta}/>
        <span className="font-mono" style={{ fontSize: 11, color: p.ink, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 700 }}>capsule pública</span>
        <span style={{ marginLeft: 'auto' }}>
          <Ico.share s={16}/>
        </span>
      </div>

      {/* hero cover */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ position: 'relative' }}>
          <Placeholder w={'100%'} h={260} label="festival do bairro · 2026" bg="#E5DECE" radius={16}/>
          <div style={{
            position: 'absolute', left: 12, top: 12,
            background: p.magenta, color: '#FFF8E8', padding: '5px 10px',
            borderRadius: 999, fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: 0.5,
          }}>AO VIVO · 23 MAI</div>
          <div style={{
            position: 'absolute', right: 12, bottom: 12,
            background: 'rgba(14,11,20,0.7)', color: '#fff', padding: '5px 10px',
            borderRadius: 999, fontFamily: 'JetBrains Mono', fontSize: 10,
          }}>SP · LARGO DA BATATA</div>
        </div>
        <h1 className="font-b-display" style={{ margin: '14px 0 0', fontSize: 44, lineHeight: 0.9, color: p.ink }}>Festival<br/>do Bairro</h1>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AvatarStack people={[
            {name:'A',tint:p.magenta},{name:'B',tint:p.azul},{name:'C',tint:p.jade},{name:'D',tint:p.mostarda},
          ]} size={22}/>
          <span className="font-b-sans" style={{ fontSize: 12, color: p.ink2, fontWeight: 600 }}><b style={{ color: p.ink }}>2.4k</b> pessoas neste evento</span>
        </div>
      </div>

      {/* join */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{
          background: p.card, border: `1.5px solid ${p.ink}`, borderRadius: 14,
          padding: '14px 16px',
        }}>
          <div className="font-b-sans" style={{ fontSize: 12.5, fontWeight: 700, color: p.ink }}>
            entrar voluntariamente neste evento
          </div>
          <div className="font-b-sans" style={{ fontSize: 11.5, color: p.ink2, marginTop: 4, lineHeight: 1.5 }}>
            Você poderá publicar até 2 fotos, 1 vídeo e 1 recado — junto com mais 2.400 pessoas — criando uma memória coletiva desse momento.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn font-b-sans" style={{
              background: p.ink, color: p.mostarda, padding: '10px 14px',
              borderRadius: 10, fontSize: 12, fontWeight: 700,
              letterSpacing: 0.4, textTransform: 'uppercase',
            }}>entrar no evento</button>
            <button className="btn font-b-sans" style={{
              background: 'transparent', color: p.ink, padding: '10px 14px',
              borderRadius: 10, fontSize: 12, fontWeight: 700,
              letterSpacing: 0.4, textTransform: 'uppercase',
              border: `1.5px solid ${p.ink}`,
            }}>só assistir</button>
          </div>
        </div>
      </div>

      {/* live mural — grid 3 */}
      <div style={{ padding: '20px 16px 0', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h3 className="font-b-display" style={{ fontSize: 22, color: p.ink, margin: 0 }}>mural coletivo</h3>
        <span className="font-mono" style={{ fontSize: 10.5, color: p.ink2 }}>1.847 momentos</span>
      </div>
      <div style={{
        padding: '8px 16px 0', display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr', gap: 4,
      }}>
        {[
          {c:'#F4D5BA',l:'palco principal'},
          {c:'#D8E7F4',l:'fila do food truck',v:true},
          {c:'#FBE3CC',l:'fogos · 22h12'},
          {c:'#D7EDD9',l:'cartaz'},
          {c:'#E5D5F2',l:'plateia',v:true},
          {c:'#F4D5BA',l:'banda B'},
          {c:'#D8E7F4',l:'grafite'},
          {c:'#D7EDD9',l:'praça'},
          {c:'#FBE3CC',l:'amigos'},
        ].map((it,i)=>(
          <div key={i} style={{ position: 'relative', aspectRatio: '1/1' }}>
            <Placeholder w={'100%'} h={'100%'} label={it.l} bg={it.c} radius={6}/>
            {it.v && (
              <span style={{
                position: 'absolute', left: 4, bottom: 4,
                background: 'rgba(14,11,20,0.75)', color: '#fff', padding: '2px 5px',
                borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: 8,
              }}>VIDEO</span>
            )}
          </div>
        ))}
      </div>

      {/* trending tags */}
      <div style={{ padding: '20px 16px 0' }}>
        <div className="font-mono" style={{ fontSize: 10.5, color: p.ink2, letterSpacing: 0.5, textTransform: 'uppercase' }}>tags em alta agora</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {[
            { t: '#festivaldobairro', c: p.magenta },
            { t: '#largobatata2026', c: p.azul },
            { t: '#fogos', c: p.mostarda },
            { t: '#sambadetreta', c: p.jade },
            { t: '#bandaprincipal', c: p.ametista },
          ].map((tg,i)=>(
            <span key={i} className="font-mono" style={{
              fontSize: 10.5, padding: '6px 10px', borderRadius: 999,
              background: tg.c, color: '#fff', letterSpacing: 0.3,
            }}>{tg.t}</span>
          ))}
        </div>
      </div>

      {/* hosted by city */}
      <div style={{ padding: '20px 16px 30px' }}>
        <div style={{
          background: p.ink, color: '#F8F4E3', borderRadius: 14, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Avatar name="SP" tint={p.mostarda} ink={p.ink} size={36}/>
          <div>
            <div className="font-b-sans" style={{ fontSize: 12.5, fontWeight: 700 }}>Memória coletiva</div>
            <div className="font-b-sans" style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>fica para sempre no acervo público da cidade</div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AIChatMobile, AIChatDesktop, MuralAoVivoMobile, UploadMobile, EventoPublicoMobile });
