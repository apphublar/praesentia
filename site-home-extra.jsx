// site-home-extra.jsx — novas seções da landing (cotas, vida em cápsulas, privacidade, preços)

// ─── Armazenamento em GB — o que cabe na sua cápsula ─────────
function CotasSection() {
  const p = PALETTE_A;
  const GOLD = '#FFB23E';

  const plans = [
    {
      tier: 'gratuito',
      label: 'Gratuito',
      capacity: '—',
      capacityNote: 'disponibilidade temporária',
      desc: 'O convite e a lista de convidados continuam ativos durante o evento, sem cápsula permanente.',
      bg: p.card,
      ink: p.ink,
      ink2: p.ink2,
      accent: p.ink2,
      breakdown: null,
    },
    {
      tier: 'capsula',
      label: 'Cápsula',
      capacity: '5 GB',
      capacityNote: 'inclusos · mín. 36 meses (ampliável)',
      desc: 'Espaço para guardar fotos do evento inteiro, vídeos curtos dos momentos especiais e recados dos convidados.',
      bg: p.ink,
      ink: p.bg,
      ink2: 'rgba(247,238,219,0.65)',
      accent: GOLD,
      featured: true,
      breakdown: [
        { label: 'fotos HD', v: '≈ 1.500', share: 0.62 },
        { label: 'vídeos curtos', v: '≈ 60', share: 0.28 },
        { label: 'recados de áudio', v: '≈ 200', share: 0.10 },
      ],
    },
    {
      tier: 'familia',
      label: 'Família',
      capacity: '25 GB',
      capacityNote: 'compartilhados · mín. 36 meses por evento',
      desc: 'Capacidade pensada para até 12 eventos por ano, com tudo conectado na mesma timeline familiar.',
      bg: p.card,
      ink: p.ink,
      ink2: p.ink2,
      accent: p.coral,
      breakdown: [
        { label: 'fotos HD', v: '≈ 7.500', share: 0.62 },
        { label: 'vídeos curtos', v: '≈ 300', share: 0.28 },
        { label: 'recados de áudio', v: '≈ 1.000', share: 0.10 },
      ],
    },
  ];

  return (
    <section style={{ padding: '40px 6vw', maxWidth: 1320, margin: '0 auto' }}>
      <div className="font-a-body" style={{ fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700, color: p.ink2 }}>armazenamento · em GB</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, flexWrap: 'wrap', marginTop: 4 }}>
        <h2 className="font-a-display-i" style={{ fontSize: 'clamp(32px, 4vw, 56px)', margin: 0, lineHeight: 1.05 }}>
          O que <span style={{ color: p.coral }}>cabe</span> na sua cápsula.
        </h2>
        <span className="font-a-body" style={{ fontSize: 13, color: p.ink2, maxWidth: 380 }}>
          sem cobrança por convidado · sem cota por pessoa — só espaço pra preencher como quiser
        </span>
      </div>

      <div style={{
        marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1.08fr 1fr', gap: 14,
      }} className="grid-collapse-3">
        {plans.map((pl, i) => (
          <div key={i} style={{
            background: pl.bg, color: pl.ink,
            border: pl.featured ? `1px solid rgba(255,226,182,0.22)` : `1.5px solid ${p.ink}`,
            borderRadius: 18, padding: '24px 24px 22px',
            position: 'relative',
            boxShadow: pl.featured
              ? '0 20px 50px -22px rgba(255,178,62,0.35), 0 0 0 1px rgba(255,226,182,0.10) inset'
              : '4px 5px 0 rgba(27,18,9,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 8, height: 8, borderRadius: 999, background: pl.accent,
                boxShadow: pl.featured ? `0 0 10px ${pl.accent}` : 'none',
              }}/>
              <div className="font-mono" style={{
                fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase',
                color: pl.ink2, fontWeight: 600,
              }}>plano · {pl.label.toLowerCase()}</div>
            </div>

            <div style={{
              marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 10,
            }}>
              <div className="font-a-display" style={{
                fontSize: pl.capacity === '—' ? 44 : 56,
                lineHeight: 0.9, letterSpacing: '-0.025em', color: pl.ink,
              }}>{pl.capacity}</div>
              <div className="font-mono" style={{
                fontSize: 10.5, color: pl.ink2, textTransform: 'uppercase', letterSpacing: 0.5,
                paddingBottom: 4,
              }}>{pl.capacityNote}</div>
            </div>

            <p className="font-a-body" style={{
              margin: '14px 0 0', fontSize: 13, color: pl.ink2, lineHeight: 1.55,
            }}>{pl.desc}</p>

            {pl.breakdown && (
              <div style={{ marginTop: 18 }}>
                <div className="font-mono" style={{
                  fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase',
                  color: pl.ink2, opacity: 0.7, marginBottom: 10,
                }}>cabe, por exemplo</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {pl.breakdown.map((b, j) => (
                    <GBRow key={j} {...b} ink={pl.ink} ink2={pl.ink2} accent={pl.accent}/>
                  ))}
                </div>
              </div>
            )}

            {!pl.breakdown && (
              <div style={{
                marginTop: 22, padding: '12px 14px',
                borderRadius: 10,
                border: `1px dashed rgba(27,18,9,0.18)`,
              }}>
                <p className="font-a-body" style={{
                  margin: 0, fontSize: 12, color: pl.ink2, lineHeight: 1.5, fontStyle: 'italic',
                }}>
                  Sem cápsula permanente. Para guardar pra sempre, comece em <b style={{ color: pl.ink, fontStyle: 'normal' }}>Cápsula</b>.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 22, padding: '14px 18px', background: p.bg2, borderRadius: 12,
        display: 'flex', alignItems: 'center', gap: 12, maxWidth: 760,
      }}>
        <Ico.spark s={18}/>
        <p className="font-a-body" style={{ margin: 0, fontSize: 13, color: p.ink, lineHeight: 1.5 }}>
          <b>Expanda quando quiser.</b> Se o evento for maior que o esperado, você adiciona +5, +10, +25 ou +50&nbsp;GB com um clique — pagamento único, válido durante toda a cápsula.
        </p>
      </div>
    </section>
  );
}

function GBRow({ label, v, share, ink, ink2, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span className="font-a-body" style={{
        fontSize: 12, width: 110, color: ink2, fontWeight: 500,
      }}>{label}</span>
      <div style={{
        flex: 1, height: 6, borderRadius: 999,
        background: 'rgba(255,255,255,0.06)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.04) inset',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0, width: `${share * 100}%`,
          background: accent, borderRadius: 999,
          boxShadow: `0 0 8px ${accent}`,
          opacity: 0.85,
        }}/>
      </div>
      <span className="font-mono" style={{
        fontSize: 11, color: ink, fontWeight: 700, minWidth: 52, textAlign: 'right',
      }}>{v}</span>
    </div>
  );
}

// ─── A vida em cápsulas (a visão de longo prazo) ──────────────
function VidaEmCapsulasSection({ goto }) {
  const p = PALETTE_A;
  const years = [
    { y: '2025', label: 'chá da Mavie · 11/2024', stat: '88 fotos', c: '#FBE3CC' },
    { y: '2026', label: 'Mavie · 1 aninho', stat: '247 fotos', c: '#F1D8C9', featured: true },
    { y: '2027', label: 'Mavie no jardim · 2 anos', stat: '184 fotos', c: '#D9E8DC' },
    { y: '2030', label: 'primeiro dia de escola', stat: '64 fotos', c: '#D9E8F4' },
    { y: '2032', label: 'aniversário · 7 anos', stat: '203 fotos', c: '#E5D5F2' },
    { y: '2038', label: 'formatura ensino fundamental', stat: '156 fotos', c: '#FFE9BD' },
    { y: '2044', label: 'formatura colegial · 18 anos', stat: 'aguardando', c: 'transparent', empty: true },
  ];
  return (
    <section style={{ padding: '40px 6vw 30px', maxWidth: 1320, margin: '0 auto', position: 'relative' }}>
      <div className="font-a-body" style={{ fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700, color: p.ink2 }}>a visão longa</div>
      <h2 className="font-a-display-i" style={{ fontSize: 'clamp(32px, 4.4vw, 64px)', margin: '4px 0 0', lineHeight: 1.02 }}>
        Quando a Mavie tiver 18,<br/>ela <span className="hand-underline" style={{ color: p.coral }}>abre tudo isso</span>.
      </h2>
      <p className="font-a-body" style={{ fontSize: 16, color: p.ink2, maxWidth: 680, lineHeight: 1.55, marginTop: 14 }}>
        Cada cápsula em que a Mavie aparece — feita pelos pais, pelos avós, pelos primos, pela própria escola —
        fica conectada num único lugar. Não é um app. É a coleção de presenças que formaram quem ela é.
      </p>

      {/* horizontal scroll thread */}
      <div style={{
        marginTop: 32, background: p.ink, color: p.bg, borderRadius: 22,
        padding: '28px 0 22px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(247,238,219,0.7) 1px, transparent 1.5px)',
          backgroundSize: '14px 14px',
        }}/>

        <div style={{ padding: '0 32px 14px', display: 'flex', alignItems: 'baseline', gap: 14, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name="Mavie A" tint={p.coral} size={36}/>
            <div>
              <div className="font-a-display-i" style={{ fontSize: 22, color: p.bg, lineHeight: 1 }}>Mavie Andrade</div>
              <div className="font-mono" style={{ fontSize: 11, color: 'rgba(247,238,219,0.7)', marginTop: 2 }}>nascida em jan/2025 · 7 cápsulas até agora</div>
            </div>
          </div>
          <span className="pill" style={{ marginLeft: 'auto', background: p.sol, color: p.ink, fontSize: 10 }}>
            visualização da família · privado
          </span>
        </div>

        {/* timeline rail */}
        <div style={{ position: 'relative', padding: '20px 32px 8px' }}>
          <div style={{
            position: 'absolute', left: 32, right: 32, top: '50%',
            height: 1.5, background: 'rgba(247,238,219,0.22)', transform: 'translateY(-1px)',
          }}/>
          <div className="no-scrollbar" style={{
            display: 'flex', gap: 18, overflowX: 'auto', padding: '4px 0',
            position: 'relative', scrollSnapType: 'x mandatory',
          }}>
            {years.map((y, i) => (
              <div key={i} style={{
                flexShrink: 0, width: 180, scrollSnapAlign: 'start',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              }}>
                {/* polaroid */}
                <div style={{
                  background: y.empty ? 'rgba(247,238,219,0.05)' : '#fff',
                  padding: y.empty ? '10px 10px 22px' : '8px 8px 22px',
                  borderRadius: 3, transform: `rotate(${(i % 3 - 1) * 2}deg)`,
                  border: y.empty ? `1.5px dashed rgba(247,238,219,0.3)` : 'none',
                  boxShadow: y.empty ? 'none' : '0 8px 18px rgba(0,0,0,0.3)',
                  width: 160,
                }}>
                  {y.empty ? (
                    <div style={{
                      width: 140, height: 90,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(247,238,219,0.5)',
                      textAlign: 'center', lineHeight: 1.5,
                    }}>aguardando<br/>nova cápsula</div>
                  ) : (
                    <Placeholder w={140} h={90} label={y.label.split(' · ')[0]} bg={y.c}/>
                  )}
                  <div style={{
                    fontFamily: 'JetBrains Mono', fontSize: 9, color: '#1B1209',
                    marginTop: 6, textAlign: 'center', letterSpacing: 0.4,
                    opacity: y.empty ? 0 : 1,
                  }}>{y.stat}</div>
                </div>
                {/* node */}
                <div style={{
                  width: 12, height: 12, borderRadius: 999,
                  background: y.featured ? p.coral : y.empty ? 'transparent' : p.bg,
                  border: y.empty ? `1.5px dashed rgba(247,238,219,0.5)` : 'none',
                  zIndex: 1,
                }}/>
                <div className="font-a-display" style={{
                  fontSize: 26, color: y.featured ? p.coral : (y.empty ? 'rgba(247,238,219,0.5)' : p.sol),
                  lineHeight: 1,
                }}>{y.y}</div>
                <div className="font-a-body" style={{
                  fontSize: 11, color: 'rgba(247,238,219,0.78)', textAlign: 'center', lineHeight: 1.35, maxWidth: 160,
                }}>{y.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          padding: '14px 32px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, borderTop: `1px solid rgba(247,238,219,0.15)`, marginTop: 14,
        }}>
          <span className="font-a-body" style={{ fontSize: 13, color: 'rgba(247,238,219,0.78)', fontStyle: 'italic' }}>
            "presença · do latim <i>praesentia</i> — o que está aqui, agora"
          </span>
          <button onClick={() => goto('/eu')} className="btn font-a-body" style={{
            background: 'transparent', color: p.bg, padding: '9px 14px', borderRadius: 999,
            fontSize: 12, fontWeight: 600, border: `1.5px solid ${p.bg}`, cursor: 'pointer',
          }}>ver meu perfil de presença →</button>
        </div>
      </div>
    </section>
  );
}

// ─── Álbum impresso — memórias em papel ──────────────────────
function AlbumImpressoSection() {
  const p = PALETTE_A;
  return (
    <section style={{ padding: '40px 6vw', maxWidth: 1320, margin: '0 auto' }}>
      <div style={{
        background: p.card, border: `1.5px solid ${p.ink}`, borderRadius: 22,
        padding: '36px clamp(24px, 4vw, 48px)', position: 'relative', overflow: 'hidden',
        boxShadow: '6px 7px 0 rgba(27,18,9,0.08)',
        display: 'grid', gridTemplateColumns: '1.15fr 0.85fr',
        gap: 36, alignItems: 'center',
      }} className="grid-collapse">
        {/* texto */}
        <div>
          <div className="font-a-body" style={{
            fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase',
            fontWeight: 700, color: p.ink2,
          }}>complemento · papel</div>
          <h2 className="font-a-display-i" style={{
            fontSize: 'clamp(30px, 3.6vw, 52px)', margin: '6px 0 0',
            lineHeight: 1.02, letterSpacing: '-0.01em',
          }}>
            Suas memórias,<br/>
            <span style={{ color: p.coral }}>em papel.</span>
          </h2>
          <p className="font-a-body" style={{
            fontSize: 15, color: p.ink2, lineHeight: 1.55,
            marginTop: 16, maxWidth: 520, textWrap: 'pretty',
          }}>
            As fotos guardadas na sua cápsula podem virar um <b style={{ color: p.ink }}>álbum impresso personalizado</b>:
            capa rígida, papel fotográfico premium e layout assinado pela Praesentia.
          </p>
          <ul style={{
            listStyle: 'none', padding: 0, margin: '20px 0 0',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {[
              'Você escolhe quais fotos entram, na ordem que quiser',
              'Layout limpo, assinado pela Praesentia',
              'Capa dura, formato A4, papel fotográfico premium',
              'Envio para todo o Brasil',
            ].map((it, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 999,
                  background: 'rgba(255,178,62,0.16)', color: p.sol,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 2,
                }}><Ico.check s={11} w={2.6}/></div>
                <span className="font-a-body" style={{ fontSize: 13.5, color: p.ink, lineHeight: 1.5 }}>{it}</span>
              </li>
            ))}
          </ul>
          <div style={{
            marginTop: 24, padding: '12px 16px',
            background: p.bg2, borderRadius: 10, maxWidth: 480,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: 999, background: p.coral, flexShrink: 0,
            }}/>
            <p className="font-a-body" style={{
              margin: 0, fontSize: 12.5, color: p.ink2, lineHeight: 1.5,
            }}>
              <b style={{ color: p.ink }}>Valor sob medida</b> pela quantidade de fotos selecionadas — você só paga pelo que escolher imprimir.
            </p>
          </div>
        </div>

        {/* visual: álbum mockup */}
        <div style={{
          position: 'relative', minHeight: 320,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* segundo álbum atrás */}
          <div style={{
            position: 'absolute', top: 24, right: 28, width: 200, height: 250,
            background: '#EFE2C6', borderRadius: '2px 6px 6px 2px',
            border: `1.5px solid ${p.ink}`,
            transform: 'rotate(6deg)',
            boxShadow: '8px 10px 20px rgba(0,0,0,0.12)',
          }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: p.coral, borderRadius: '2px 0 0 2px' }}/>
          </div>
          {/* álbum principal */}
          <div style={{
            position: 'relative', width: 230, height: 280,
            background: p.ink, borderRadius: '2px 8px 8px 2px',
            border: `1.5px solid ${p.ink}`,
            boxShadow: '12px 14px 28px rgba(0,0,0,0.22)',
            padding: '28px 22px 22px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            transform: 'rotate(-3deg)',
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, background: p.sol,
              borderRadius: '2px 0 0 2px',
            }}/>
            <div>
              <div className="font-mono" style={{
                fontSize: 9.5, letterSpacing: 0.6, color: p.sol, textTransform: 'uppercase',
              }}>PRAESENTIA · álbum</div>
              <div className="font-a-display-i" style={{
                fontSize: 28, lineHeight: 1, color: p.bg, marginTop: 14,
              }}>Mavie,<br/>1 ano.</div>
              <div className="font-a-body" style={{
                fontSize: 11, color: 'rgba(247,238,219,0.7)', marginTop: 6,
              }}>14 mar · 2026</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 18, height: 1, background: 'rgba(247,238,219,0.5)' }}/>
              <span className="font-mono" style={{
                fontSize: 9, color: 'rgba(247,238,219,0.55)', letterSpacing: 0.4,
              }}>capa rígida · 247 fotos</span>
            </div>
          </div>
          {/* foto solta */}
          <div className="polaroid" style={{
            position: 'absolute', bottom: 12, left: 8,
            transform: 'rotate(-8deg)', width: 110, padding: '6px 6px 16px',
            background: '#fff', borderRadius: 3,
            boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
          }}>
            <Placeholder w={98} h={70} label="" bg="#F1D8C9" radius={2}/>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Privacidade ─────────────────────────────────────────────
function PrivacidadeSection() {
  const p = PALETTE_A;
  return (
    <section style={{ padding: '40px 6vw', maxWidth: 1320, margin: '0 auto' }}>
      <div className="font-a-body" style={{ fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700, color: p.ink2 }}>privacidade</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, flexWrap: 'wrap', marginTop: 4 }}>
        <h2 className="font-a-display-i" style={{ fontSize: 'clamp(32px, 4vw, 56px)', margin: 0, lineHeight: 1.02 }}>
          Pensado pra <span style={{ color: p.coral }}>Mavie</span>.
        </h2>
        <span className="font-a-body" style={{ fontSize: 13, color: p.ink2, maxWidth: 420 }}>
          rostos de criança não viram pesquisa do Google
        </span>
      </div>

      <div style={{
        marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14,
      }} className="grid-collapse-3">
        {[
          {
            ico: <Ico.heart s={20}/>, c: p.coral,
            t: 'Modo família',
            d: 'Rostos de menores só são visíveis pra quem o anfitrião verificou. Toggle padrão ligado em todo evento com criança.',
          },
          {
            ico: <Ico.spark s={20}/>, c: p.uva,
            t: 'Sem indexação',
            d: 'Cápsulas privadas e compartilháveis não aparecem em buscadores. Robots.txt agressivo, no-archive, no-snippet.',
          },
          {
            ico: <Ico.check s={20}/>, c: p.jardim,
            t: 'Exportável + apagável',
            d: 'Você baixa tudo (zip de fotos, JSON de metadados) ou apaga a cápsula inteira a qualquer momento — sem suporte.',
          },
          {
            ico: <Ico.bell s={20}/>, c: p.sol,
            t: 'Moderação humana',
            d: 'Eventos públicos passam por moderação. Conteúdo abusivo é removido em até 4h — e a pessoa, banida.',
          },
          {
            ico: <Ico.share s={20}/>, c: p.ceu,
            t: 'Quem tem acesso',
            d: 'Lista clara de quem pode ver cada cápsula. Anfitrião revoga acesso sem ressentimento. O ex não fica.',
          },
          {
            ico: <Ico.cam s={20}/>, c: p.ink,
            t: 'Aos 18, é dela',
            d: 'Quando a Mavie completar 18 anos, a coleção de cápsulas que envolvem ela passa pra conta dela. Os pais perguntam antes de publicar.',
            highlight: true,
          },
        ].map((it, i) => (
          <div key={i} style={{
            background: it.highlight ? p.ink : p.card, color: it.highlight ? p.bg : p.ink,
            border: `1.5px solid ${p.ink}`, borderRadius: 14, padding: '20px 22px',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: it.c, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{it.ico}</div>
            <h4 className="font-a-display" style={{
              margin: '14px 0 0', fontSize: 19, lineHeight: 1.1,
              color: it.highlight ? p.bg : p.ink,
            }}>{it.t}</h4>
            <p className="font-a-body" style={{
              fontSize: 12.5, lineHeight: 1.55, marginTop: 6,
              color: it.highlight ? 'rgba(247,238,219,0.78)' : p.ink2,
            }}>{it.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Preços — premium dark stage ─────────────────────────────
function PrecosSection({ goto }) {
  const p = PALETTE_A;

  // injected once: micro-animations + glow keyframes for this section
  React.useEffect(() => {
    if (document.getElementById('precos-css')) return;
    const s = document.createElement('style');
    s.id = 'precos-css';
    s.textContent = `
      @keyframes precosHalo {
        0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
        50%      { opacity: 0.85; transform: translate(-50%, -50%) scale(1.06); }
      }
      @keyframes precosDrift {
        0%, 100% { transform: translateY(0); }
        50%      { transform: translateY(-3px); }
      }
      .precos-card {
        transition: transform 0.5s cubic-bezier(.2,.7,.2,1), box-shadow 0.5s ease;
      }
      .precos-card:hover { transform: translateY(-4px); }
      .precos-cta {
        transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
      }
      .precos-cta:hover { transform: translateY(-1px); }
      .precos-chip {
        transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease;
      }
      .precos-chip:hover {
        transform: translateY(-2px);
        border-color: rgba(255,178,62,0.65) !important;
      }
      .precos-stars {
        background-image:
          radial-gradient(circle, rgba(255,226,182,0.32) 0.7px, transparent 1.1px);
        background-size: 28px 28px;
        background-position: 0 0;
      }
      @media (max-width: 880px) {
        .precos-grid { grid-template-columns: 1fr !important; }
        .precos-featured { transform: none !important; }
        .precos-extras-grid { grid-template-columns: 1fr 1fr !important; }
      }
    `;
    document.head.appendChild(s);
  }, []);

  // emotional pull-quote inside each card (small italic line)
  const STAGE = '#1A120C';      // deep warm chocolate
  const STAGE_2 = '#0F0905';    // outer
  const CARD_CREAM = '#FFFAF0';
  const INK_SOFT = 'rgba(247,238,219,0.62)';
  const INK_FAINT = 'rgba(247,238,219,0.40)';
  const GOLD = '#FFB23E';

  return (
    <section id="preco" style={{ position: 'relative', padding: '0', marginTop: 32 }}>
      {/* full-bleed dark stage */}
      <div style={{
        position: 'relative',
        background: `radial-gradient(ellipse 90% 55% at 50% 32%, #2A1B10 0%, ${STAGE} 55%, ${STAGE_2} 100%)`,
        padding: '96px 6vw 80px',
        overflow: 'hidden',
      }}>
        {/* subtle starfield grain */}
        <div className="precos-stars" style={{
          position: 'absolute', inset: 0, opacity: 0.55, pointerEvents: 'none',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 80%)',
        }}/>

        {/* central halo glow behind featured card */}
        <div style={{
          position: 'absolute', left: '50%', top: '52%',
          width: 'min(820px, 90vw)', height: 'min(820px, 90vw)', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,178,62,0.22) 0%, rgba(255,107,92,0.08) 35%, transparent 65%)',
          filter: 'blur(20px)', pointerEvents: 'none',
          animation: 'precosHalo 7s ease-in-out infinite',
        }}/>

        <div style={{ position: 'relative', maxWidth: 1240, margin: '0 auto' }}>
          {/* eyebrow + heading */}
          <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
            <div className="font-mono" style={{
              fontSize: 11, letterSpacing: 0.32, textTransform: 'uppercase',
              color: GOLD, opacity: 0.85,
            }}>
              <span style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: 999,
                background: GOLD, marginRight: 8, transform: 'translateY(-1px)',
                boxShadow: `0 0 12px ${GOLD}`,
              }}/>
              planos · memórias permanentes
            </div>
            <h2 className="font-a-display-i" style={{
              fontSize: 'clamp(40px, 5.2vw, 76px)', lineHeight: 1.02,
              margin: '14px 0 0', color: '#F7EEDB',
              letterSpacing: '-0.015em', textWrap: 'balance',
            }}>
              Presença hoje.<br/>
              <span style={{
                background: 'linear-gradient(180deg, #FFE7B5 0%, #FFB23E 60%, #FF8A5C 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Memórias para sempre.</span>
            </h2>
            <p className="font-a-body" style={{
              margin: '18px auto 0', maxWidth: 520, color: INK_SOFT,
              fontSize: 15.5, lineHeight: 1.6, textWrap: 'pretty',
            }}>
              Três formas de transformar um momento em algo que você
              poderá revisitar daqui a cinco, dez, trinta anos.
            </p>
          </div>

          {/* plans grid */}
          <div className="precos-grid" style={{
            marginTop: 64,
            display: 'grid', gridTemplateColumns: '1fr 1.1fr 1fr',
            gap: 20, alignItems: 'stretch',
          }}>
            {/* ─── GRATUITO ─── */}
            <PlanCard
              tier="gratuito"
              name="Gratuito"
              subtitle="Crie e compartilhe seu evento facilmente."
              price="R$0"
              priceMeta="grátis para sempre"
              tagline="Ideal para criar convites online rápidos e compartilhar seus momentos."
              sections={[
                {
                  label: 'Convite & RSVP',
                  items: [
                    { v: 'Convite online personalizado' },
                    { v: 'Modelos prontos' },
                    { v: 'RSVP / confirmação de presença' },
                    { v: 'Lista de convidados' },
                    { v: 'Convidados ilimitados' },
                    { v: 'Link compartilhável' },
                    { v: 'Compartilhamento por WhatsApp' },
                    { v: 'Contagem regressiva' },
                  ],
                },
                {
                  label: 'IA & domínio',
                  items: [
                    { v: 'IA premium para criar o convite', off: true },
                    { v: 'Geração de imagens por IA', off: true },
                    { v: 'Domínio personalizado', off: true },
                  ],
                },
                {
                  label: 'Memórias permanentes',
                  items: [
                    { v: 'Cápsula do tempo', off: true },
                    { v: 'Timeline do evento', off: true },
                    { v: 'Fotos e vídeos', off: true },
                    { v: 'Sem marca d\u2019água', off: true },
                    { v: 'Exportação das memórias', off: true },
                  ],
                },
                {
                  label: 'Armazenamento',
                  items: [
                    { v: <span>Disponibilidade <b>temporária</b></span>, muted: true },
                  ],
                },
              ]}
              footnote="O evento permanece disponível temporariamente."
              cta="Começar grátis"
              ctaVariant="ghost"
              goto={goto}
            />

            {/* ─── CÁPSULA · FEATURED ─── */}
            <PlanCard
              tier="capsula"
              featured
              name="Cápsula"
              subtitle="Transforme seu evento em uma memória permanente."
              price="R$59"
              priceMeta="pagamento único"
              tagline="Perfeito para eternizar momentos especiais com fotos, vídeos e cápsula do tempo."
              sections={[
                {
                  label: 'Convite & RSVP',
                  items: [
                    { v: <span>Tudo do plano <b style={{ color: '#fff' }}>Gratuito</b></span> },
                    { v: 'Lista de convidados' },
                  ],
                },
                {
                  label: 'IA & domínio',
                  items: [
                    { v: 'IA premium para criar o convite' },
                    { v: 'Geração de imagem por IA' },
                    { v: 'Domínio personalizado' },
                  ],
                },
                {
                  label: 'Memórias permanentes',
                  items: [
                    { v: 'Cápsula do tempo' },
                    { v: 'Timeline do evento' },
                    { v: 'Fotos e vídeos' },
                    { v: 'Sem marca d\u2019água' },
                    { v: 'Exportação das memórias' },
                  ],
                },
                {
                  label: 'Armazenamento',
                  items: [
                    { v: <span><b style={{ color: '#fff' }}>5 GB</b> inclusos</span> },
                    { v: <span><b style={{ color: '#fff' }}>Mín. 36 meses</b> de armazenamento (ampliável)</span> },
                  ],
                },
              ]}
              emotion="“O convite termina. A memória continua.”"
              cta="Eternizar minha memória"
              ctaVariant="primary"
              goto={goto}
            />

            {/* ─── FAMÍLIA ─── */}
            <PlanCard
              tier="familia"
              name="Família"
              subtitle="Sua história organizada em uma única timeline."
              price="R$197"
              priceMeta="por ano"
              tagline="Para famílias e pessoas que desejam registrar os momentos mais importantes da vida."
              sections={[
                {
                  label: 'Convite & RSVP',
                  items: [
                    { v: <span>Tudo do plano <b style={{ color: p.ink }}>Cápsula</b></span> },
                    { v: 'Lista de convidados' },
                    { v: <span><b style={{ color: p.ink }}>Até 12 eventos</b> por ano</span> },
                  ],
                },
                {
                  label: 'IA & domínio',
                  items: [
                    { v: 'IA premium ilimitada' },
                    { v: 'Geração de imagens por IA' },
                    { v: 'Domínio personalizado' },
                    { v: 'Prioridade de processamento' },
                  ],
                },
                {
                  label: 'Memórias permanentes',
                  items: [
                    { v: 'Cápsulas conectadas' },
                    { v: 'Timeline familiar' },
                    { v: 'Fotos e vídeos' },
                    { v: 'Sem marca d\u2019água' },
                    { v: 'Exportação das memórias' },
                  ],
                },
                {
                  label: 'Armazenamento',
                  items: [
                    { v: <span><b style={{ color: p.ink }}>25 GB</b> compartilhados</span> },
                    { v: <span><b style={{ color: p.ink }}>Mín. 36 meses</b> por evento (ampliável)</span> },
                  ],
                },
              ]}
              emotion="“Cada momento da sua vida conectado em um só lugar.”"
              cta="Quero a timeline"
              ctaVariant="ghost"
              goto={goto}
            />
          </div>

          {/* ─── STORAGE EXTRAS — Expanda sua cápsula ─── */}
          <div style={{
            marginTop: 72,
            background: 'linear-gradient(180deg, rgba(255,250,240,0.04) 0%, rgba(255,250,240,0.015) 100%)',
            border: '1px solid rgba(255,250,240,0.10)',
            borderRadius: 24, padding: '32px clamp(20px, 3.5vw, 44px) 30px',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              gap: 24, flexWrap: 'wrap',
            }}>
              <div style={{ maxWidth: 420 }}>
                <div className="font-mono" style={{
                  fontSize: 10.5, letterSpacing: 0.32, textTransform: 'uppercase',
                  color: GOLD, opacity: 0.85,
                }}>extras · cápsula</div>
                <h3 className="font-a-display-i" style={{
                  margin: '8px 0 0', color: '#F7EEDB',
                  fontSize: 'clamp(26px, 2.6vw, 36px)', lineHeight: 1.05, letterSpacing: '-0.01em',
                }}>Expanda sua cápsula.</h3>
              </div>
              <p className="font-a-body" style={{
                margin: 0, color: INK_FAINT, fontSize: 13, lineHeight: 1.55, maxWidth: 360,
              }}>
                Pagamento único, válido durante o período da cápsula.
              </p>
            </div>

            <div className="precos-extras-grid" style={{
              marginTop: 26,
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
            }}>
              {[
                { gb: 5,  brl: 19 },
                { gb: 10, brl: 29 },
                { gb: 25, brl: 49 },
                { gb: 50, brl: 89 },
              ].map((x) => (
                <button key={x.gb} className="precos-chip btn font-a-body" style={{
                  background: 'rgba(255,250,240,0.025)',
                  border: '1px solid rgba(255,250,240,0.13)',
                  borderRadius: 16, padding: '20px 18px 18px',
                  textAlign: 'left', cursor: 'pointer', color: '#F7EEDB',
                  display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span className="font-a-display" style={{
                      fontSize: 36, lineHeight: 1, color: '#F7EEDB',
                    }}>+{x.gb}</span>
                    <span className="font-mono" style={{ fontSize: 11, color: INK_FAINT, letterSpacing: 0.4 }}>GB</span>
                  </div>
                  <div className="font-a-body" style={{
                    fontSize: 13.5, color: GOLD, fontWeight: 600, marginTop: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span>R$ {x.brl}</span>
                    <span style={{
                      width: 26, height: 26, borderRadius: 999,
                      border: `1px solid rgba(255,178,62,0.45)`,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      color: GOLD,
                    }}><Ico.plus s={12} w={2}/></span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ─── closing quote band ─── */}
          <div style={{
            marginTop: 64, textAlign: 'center', maxWidth: 720, margin: '64px auto 0',
            animation: 'precosDrift 8s ease-in-out infinite',
          }}>
            <div style={{
              width: 36, height: 1, background: 'rgba(255,226,182,0.35)', margin: '0 auto 24px',
            }}/>
            <p className="font-a-display-i" style={{
              margin: 0, fontSize: 'clamp(22px, 2.4vw, 32px)', lineHeight: 1.25,
              color: '#F7EEDB', letterSpacing: '-0.01em',
            }}>
              Porque os melhores momentos<br/>
              <span style={{
                background: 'linear-gradient(180deg, #FFE7B5 0%, #FFB23E 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>merecem ser revividos.</span>
            </p>
            <div className="font-mono" style={{
              marginTop: 18, fontSize: 10.5, letterSpacing: 0.4, textTransform: 'uppercase',
              color: INK_FAINT,
            }}>presença · permanência · praesentia</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── plan card ──────────────────────────────────────────────
function PlanCard({
  tier, featured, name, subtitle, price, priceMeta, tagline,
  sections, footnote, emotion, cta, ctaVariant, goto,
}) {
  const p = PALETTE_A;
  const GOLD = '#FFB23E';
  const isFeatured = !!featured;

  // visual tokens per tier
  const cardBg = isFeatured
    ? 'linear-gradient(180deg, #221610 0%, #15100A 100%)'
    : 'linear-gradient(180deg, #FFFAF0 0%, #FBF1DC 100%)';
  const ink = isFeatured ? '#F7EEDB' : p.ink;
  const ink2 = isFeatured ? 'rgba(247,238,219,0.62)' : p.ink2;
  const ink3 = isFeatured ? 'rgba(247,238,219,0.38)' : 'rgba(27,18,9,0.42)';
  const divider = isFeatured ? 'rgba(247,238,219,0.10)' : 'rgba(27,18,9,0.08)';
  const accent = isFeatured ? GOLD : (tier === 'familia' ? p.coral : p.ink2);

  const cardShadow = isFeatured
    ? '0 30px 80px -20px rgba(255,178,62,0.35), 0 20px 60px -30px rgba(255,107,92,0.30), 0 1px 0 rgba(255,226,182,0.18) inset'
    : '0 22px 50px -22px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.85) inset';

  const tierLabel = tier === 'familia' ? 'plano · família'
                  : tier === 'capsula' ? 'plano · cápsula'
                  : 'plano · gratuito';

  return (
    <article className="precos-card" style={{
      position: 'relative',
      background: cardBg, color: ink,
      borderRadius: 26,
      padding: '38px 30px 32px',
      border: isFeatured
        ? '1px solid rgba(255,226,182,0.22)'
        : '1px solid rgba(27,18,9,0.06)',
      boxShadow: cardShadow,
      display: 'flex', flexDirection: 'column',
      transform: isFeatured ? 'translateY(-14px) scale(1.015)' : 'none',
    }}>
      {/* featured ribbon */}
      {isFeatured && (
        <div style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          padding: '6px 14px', borderRadius: 999,
          background: 'linear-gradient(180deg, #FFE7B5 0%, #FFB23E 100%)',
          color: '#1B1209',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          letterSpacing: 0.6, fontWeight: 700, textTransform: 'uppercase',
          boxShadow: '0 8px 24px -6px rgba(255,178,62,0.55)',
          whiteSpace: 'nowrap',
        }}>★ mais escolhido</div>
      )}

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <TierGlyph tier={tier} ink={ink} accent={accent}/>
        <div className="font-mono" style={{
          fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase',
          color: isFeatured ? GOLD : ink2, fontWeight: 600,
        }}>{tierLabel}</div>
      </div>

      <h3 className="font-a-display-i" style={{
        margin: '18px 0 6px', fontSize: 40, lineHeight: 1, letterSpacing: '-0.015em',
      }}>{name}</h3>
      <p className="font-a-body" style={{
        margin: 0, fontSize: 13.5, lineHeight: 1.5, color: ink2,
      }}>{subtitle}</p>

      {/* ── PRICE BLOCK ── */}
      <div style={{
        marginTop: 26, paddingTop: 22, borderTop: `1px solid ${divider}`,
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div className="font-a-display" style={{
            fontSize: 56, lineHeight: 0.9, letterSpacing: '-0.025em', color: ink,
          }}>{price}</div>
        </div>
        <div className="font-mono" style={{
          fontSize: 10.5, color: ink3, textTransform: 'uppercase', letterSpacing: 0.5,
          textAlign: 'right',
        }}>{priceMeta}</div>
      </div>

      {/* ── TAGLINE ── */}
      <p className="font-a-body" style={{
        margin: '20px 0 0', fontSize: 13.5, lineHeight: 1.55,
        color: ink2, textWrap: 'pretty',
      }}>{tagline}</p>

      {/* ── EMOTIONAL QUOTE ── */}
      {emotion && (
        <div style={{
          marginTop: 20, padding: '16px 18px',
          borderRadius: 14,
          background: isFeatured ? 'rgba(255,226,182,0.06)' : 'rgba(255,107,92,0.05)',
          border: `1px dashed ${isFeatured ? 'rgba(255,226,182,0.22)' : 'rgba(255,107,92,0.28)'}`,
        }}>
          <p className="font-a-display-i" style={{
            margin: 0, fontSize: 15.5, lineHeight: 1.35,
            color: isFeatured ? '#FFE7B5' : p.coral,
            letterSpacing: '-0.005em',
          }}>{emotion}</p>
        </div>
      )}

      {/* ── STANDARDIZED SECTIONS ── */}
      <div style={{
        marginTop: 26, display: 'flex', flexDirection: 'column', gap: 20, flex: 1,
      }}>
        {sections.map((sec, i) => (
          <div key={i}>
            <div className="font-mono" style={{
              fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase',
              color: ink3, fontWeight: 600, marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>{sec.label}</span>
              <span style={{ flex: 1, height: 1, background: divider }}/>
            </div>
            <ul style={{
              listStyle: 'none', padding: 0, margin: 0,
              display: 'flex', flexDirection: 'column', gap: 9,
            }}>
              {sec.items.map((it, j) => (
                <PriceFeat
                  key={j} ink={ink} ink2={ink2} accent={accent}
                  featured={isFeatured} off={it.off} muted={it.muted}
                >{it.v}</PriceFeat>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {footnote && (
        <p className="font-a-body" style={{
          margin: '20px 0 0', fontSize: 11.5, lineHeight: 1.5,
          color: ink3, fontStyle: 'italic',
        }}>{footnote}</p>
      )}

      {/* ── CTA ── */}
      <button
        onClick={() => goto('/criar')}
        className="precos-cta btn font-a-body"
        style={ctaVariant === 'primary' ? {
          marginTop: 26, width: '100%',
          background: 'linear-gradient(180deg, #FFE7B5 0%, #FFB23E 55%, #FF8A5C 100%)',
          color: '#1B1209', padding: '16px',
          borderRadius: 14, fontSize: 14.5, fontWeight: 700,
          border: 0, cursor: 'pointer', letterSpacing: '-0.005em',
          boxShadow: '0 12px 32px -8px rgba(255,178,62,0.55), 0 1px 0 rgba(255,255,255,0.4) inset',
        } : {
          marginTop: 26, width: '100%',
          background: 'transparent', color: ink,
          padding: '16px', borderRadius: 14, fontSize: 14, fontWeight: 600,
          border: `1px solid ${isFeatured ? 'rgba(247,238,219,0.30)' : 'rgba(27,18,9,0.20)'}`,
          cursor: 'pointer', letterSpacing: '-0.005em',
        }}
      >
        {cta}
        <Ico.arrow s={14} w={1.8}/>
      </button>
    </article>
  );
}

// tier glyph — abstract, premium, no SVG illustrations
function TierGlyph({ tier, ink, accent }) {
  const common = {
    width: 28, height: 28, borderRadius: 8,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    border: `1px solid ${accent}`, flexShrink: 0,
  };
  if (tier === 'gratuito') {
    return (
      <div style={common}>
        <div style={{ width: 8, height: 8, borderRadius: 999, border: `1.2px solid ${accent}` }}/>
      </div>
    );
  }
  if (tier === 'capsula') {
    return (
      <div style={{ ...common, position: 'relative', background: 'rgba(255,178,62,0.08)' }}>
        <div style={{ width: 12, height: 12, borderRadius: 999, background: accent, boxShadow: `0 0 12px ${accent}` }}/>
        <div style={{ position: 'absolute', inset: 4, borderRadius: 999, border: `1px solid ${accent}`, opacity: 0.4 }}/>
      </div>
    );
  }
  // família — three connected dots
  return (
    <div style={{ ...common, gap: 2 }}>
      <div style={{ width: 5, height: 5, borderRadius: 999, background: accent }}/>
      <div style={{ width: 5, height: 5, borderRadius: 999, background: accent, opacity: 0.65 }}/>
      <div style={{ width: 5, height: 5, borderRadius: 999, background: accent, opacity: 0.35 }}/>
    </div>
  );
}

function PriceFeat({ children, ink, ink2, accent, featured, off, muted }) {
  // OFF state — not included in this plan
  if (off) {
    return (
      <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10, opacity: 0.42 }}>
        <div style={{
          width: 18, height: 18, borderRadius: 999,
          border: `1px solid ${ink2}`,
          flexShrink: 0, marginTop: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 7, height: 1, background: ink2 }}/>
        </div>
        <span className="font-a-body" style={{
          fontSize: 13.5, color: ink2, lineHeight: 1.5,
          textDecoration: 'line-through',
          textDecorationThickness: '0.6px',
          textDecorationColor: 'currentColor',
        }}>{children}</span>
      </li>
    );
  }

  // MUTED state — no icon, just italic muted text (used for "temporary availability")
  if (muted) {
    return (
      <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 18, height: 18, borderRadius: 999,
          border: `1px dashed ${ink2}`,
          flexShrink: 0, marginTop: 2, opacity: 0.6,
        }}/>
        <span className="font-a-body" style={{
          fontSize: 13.5, color: ink2, lineHeight: 1.5, fontStyle: 'italic',
        }}>{children}</span>
      </li>
    );
  }

  // INCLUDED state
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{
        width: 18, height: 18, borderRadius: 999,
        background: featured ? 'rgba(255,178,62,0.18)' : 'rgba(255,178,62,0.16)',
        color: accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 2,
        boxShadow: featured ? `0 0 0 1px rgba(255,226,182,0.20)` : 'none',
      }}><Ico.check s={11} w={2.6}/></div>
      <span className="font-a-body" style={{
        fontSize: 13.5, color: ink, opacity: featured ? 0.92 : 0.88, lineHeight: 1.5,
      }}>{children}</span>
    </li>
  );
}

Object.assign(window, { CotasSection, VidaEmCapsulasSection, PrivacidadeSection, AlbumImpressoSection, PrecosSection });
