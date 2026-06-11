// site-home.jsx — landing/marketing page

function SiteHome({ goto }) {
  const p = PALETTE_A;
  return (
    <div style={{ background: p.bg, color: p.ink, position: 'relative' }}>
      <Paper/>

      {/* ─── Hero ─── */}
      <section style={{
        padding: '52px 6vw 36px', maxWidth: 1320, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,0.95fr)',
        gap: 40, alignItems: 'center',
      }} className="grid-collapse">
        <div style={{ position: 'relative' }}>
          <ConfettiBurst style={{ position: 'absolute', top: -22, left: -22 }} scale={1.1}/>
          <span className="pill" style={{ background: p.card, color: p.ink2, border: `1.5px solid ${p.ink}` }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: p.coral }}/> beta · convide.praesentia.com
          </span>
          <h1 className="font-a-display-i" style={{
            margin: '18px 0 0', fontSize: 'clamp(48px, 7vw, 108px)', lineHeight: 0.94,
          }}>
            Todo momento<br/>começa com<br/>
            <span style={{ color: p.coral }}>uma <span className="hand-underline">presença</span>.</span>
          </h1>
          <p className="font-a-body" style={{
            fontSize: 'clamp(15px, 1.4vw, 19px)', lineHeight: 1.55, color: p.ink2,
            marginTop: 22, maxWidth: 540,
          }}>
            Praesentia transforma seus eventos em <b style={{ color: p.ink }}>cápsulas do tempo digitais</b>.
            A IA cria o convite em minutos. O mesmo link, depois da festa, guarda para sempre
            tudo que cada pessoa que esteve lá quis deixar.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
            <button className="btn font-a-body" onClick={() => goto('/criar')} style={{
              background: p.ink, color: p.bg, padding: '16px 22px',
              borderRadius: 14, fontSize: 16, fontWeight: 700, letterSpacing: 0.2,
              boxShadow: `5px 6px 0 ${p.sol}`,
            }}>
              <Ico.spark s={18}/> Criar meu evento grátis
            </button>
            <button className="btn font-a-body" onClick={() => goto('/e/mavie-1-ano')} style={{
              background: 'transparent', color: p.ink, padding: '16px 20px',
              borderRadius: 14, fontSize: 15, fontWeight: 600,
              border: `1.5px solid ${p.ink}`,
            }}>
              Ver exemplo (Mavie · 1 ano)
            </button>
          </div>
          <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 12 }}>
            <AvatarStack people={[
              { name: 'Ana B', tint: p.coral },{ name: 'Pedro L', tint: p.ceu },
              { name: 'Lu M', tint: p.sol },{ name: 'Caio R', tint: p.jardim },
              { name: 'Lila', tint: p.uva },
            ]} size={26}/>
            <div className="font-a-body" style={{ fontSize: 12.5, color: p.ink2 }}>
              <b style={{ color: p.ink }}>12.487 famílias</b> já guardam suas memórias aqui
            </div>
          </div>
        </div>

        {/* right floating polaroid stack */}
        <div style={{ position: 'relative', minHeight: 480 }}>
          <div className="polaroid float" style={{
            position: 'absolute', top: 10, left: '8%', transform: 'rotate(-7deg)',
            width: 230, animationDelay: '0s',
          }}>
            <Placeholder w={210} h={230} label="ensaio · mavie" bg={p.bg2}/>
            <div className="font-a-display-i" style={{ fontSize: 13, color: p.ink, marginTop: 8, textAlign: 'center' }}>1 ano da mavie</div>
          </div>
          <div className="polaroid float" style={{
            position: 'absolute', top: 60, right: '4%', transform: 'rotate(6deg)',
            width: 250, zIndex: 3, animationDelay: '0.5s',
          }}>
            <Placeholder w={230} h={260} label="bolo · 17h12" bg="#F1D8C9"/>
            <div className="font-a-display-i" style={{ fontSize: 13, color: p.ink, marginTop: 8, textAlign: 'center' }}>parabéns da vovó</div>
          </div>
          <div className="polaroid float" style={{
            position: 'absolute', bottom: 24, left: '18%', transform: 'rotate(-3deg)',
            width: 210, animationDelay: '1s',
          }}>
            <Placeholder w={190} h={170} label="vídeo · 02:14" bg="#D9E8F4"/>
            <div className="font-a-display-i" style={{ fontSize: 13, color: p.ink, marginTop: 8, textAlign: 'center' }}>primeiros passos</div>
            <span style={{
              position: 'absolute', top: 22, left: 22,
              width: 30, height: 30, borderRadius: 999, background: 'rgba(255,255,255,0.95)',
              color: p.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Ico.play s={14}/></span>
          </div>
          <div className="tape" style={{ top: 0, left: '32%', transform: 'rotate(-4deg)' }}/>
          <div className="tape" style={{ top: 40, right: '32%', transform: 'rotate(7deg)', background: 'rgba(255,107,92,0.7)' }}/>
        </div>
      </section>

      {/* ─── 3 fases strip ─── */}
      <section style={{ padding: '36px 6vw', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{
          background: p.ink, color: p.bg, borderRadius: 22, padding: '32px 36px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(rgba(247,238,219,0.7) 1px, transparent 1.5px)',
            backgroundSize: '14px 14px',
          }}/>
          <div className="font-a-body" style={{
            fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase',
            color: p.sol, fontWeight: 700,
          }}>O mesmo link · três vidas</div>
          <h2 className="font-a-display-i" style={{
            fontSize: 'clamp(32px, 4vw, 56px)', margin: '8px 0 24px', lineHeight: 1,
          }}>
            Um endereço que não <span style={{ color: p.coral }}>expira</span>.
          </h2>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20,
          }} className="grid-collapse-3">
            {[
              { phase: 'antes', tag: 'Convite', desc: 'Convite digital com lista de convidados, RSVP, contagem regressiva e mensagem do anfitrião — pronto em minutos.', c: p.coral },
              { phase: 'durante', tag: 'Mural ao vivo', desc: 'Convidados contribuem com fotos, víeos e recados. Tudo organizado em uma timeline do evento.', c: p.sol },
              { phase: 'depois', tag: 'Cápsula do tempo', desc: 'O mesmo link vira memória permanente. 36 meses garantidos — expandíveis a qualquer momento.', c: p.uva },
            ].map((f, i) => (
              <div key={i} style={{
                background: 'rgba(247,238,219,0.07)', borderRadius: 16,
                padding: '20px 22px', border: `1px solid rgba(247,238,219,0.18)`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: f.c }}/>
                  <span className="font-a-body" style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 700, color: f.c }}>fase · {f.phase}</span>
                </div>
                <div className="font-a-display-i" style={{ fontSize: 30, color: p.bg, lineHeight: 1.05 }}>{f.tag}</div>
                <p className="font-a-body" style={{ fontSize: 13.5, color: 'rgba(247,238,219,0.78)', lineHeight: 1.55, marginTop: 8 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4 pilares (Como funciona) ─── */}
      <section style={{ padding: '40px 6vw', maxWidth: 1320, margin: '0 auto' }}>
        <div className="font-a-body" style={{ fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700, color: p.ink2 }}>como funciona</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, flexWrap: 'wrap', marginTop: 4 }}>
          <h2 className="font-a-display-i" style={{ fontSize: 'clamp(32px, 4vw, 56px)', margin: 0, lineHeight: 1 }}>Quatro passos. <span style={{ color: p.coral }}>Uma cápsula.</span></h2>
          <span className="font-a-body" style={{ fontSize: 13, color: p.ink2 }}>do convite ao arquivo permanente</span>
        </div>

        <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="grid-collapse-4">
          {[
            { n: '01', t: 'A IA cria o convite', d: 'Você diz o tipo, tema e local. Em 4 minutos o convite está pronto — texto, paleta, capa e mensagens personalizadas.', c: p.coral, ico: <Ico.spark s={18}/> },
            { n: '02', t: 'Lista personalizada', d: 'Lista de convidados e lista de presença personalizadas: cada pessoa recebe link individual, RSVP com nome e relatório do anfitrião em tempo real.', c: p.ceu, ico: <Ico.check s={18}/> },
            { n: '03', t: 'Mural ao vivo', d: 'Convidados sobem fotos, vídeos e recados durante o evento. Tudo entra automaticamente na timeline da cápsula.', c: p.sol, ico: <Ico.cam s={18}/> },
            { n: '04', t: 'Cápsula do tempo', d: 'Acabou a festa, o endereço vira memória permanente. 36 meses garantidos, com armazenamento expandível quando quiser.', c: p.uva, ico: <Ico.heart s={18}/> },
          ].map((s, i) => (
            <div key={i} style={{
              background: p.card, border: `1.5px solid ${p.ink}`, borderRadius: 16,
              padding: '20px 22px 22px', position: 'relative',
              boxShadow: '4px 5px 0 rgba(27,18,9,0.10)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: s.c, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{s.ico}</div>
                <span className="font-mono" style={{ fontSize: 11, color: p.ink2 }}>{s.n}</span>
              </div>
              <h3 className="font-a-display" style={{ margin: '14px 0 0', fontSize: 22, lineHeight: 1.1 }}>{s.t}</h3>
              <p className="font-a-body" style={{ fontSize: 13, color: p.ink2, lineHeight: 1.55, marginTop: 8 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <CotasSection/>

      {/* ─── A transformação visual ─── */}
      <section style={{ padding: '40px 6vw 30px', maxWidth: 1320, margin: '0 auto' }}>
        <div className="font-a-body" style={{ fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700, color: p.ink2 }}>o diferencial</div>
        <h2 className="font-a-display-i" style={{ fontSize: 'clamp(32px, 4vw, 56px)', margin: '4px 0 0', lineHeight: 1 }}>
          Não somos um app de <span style={{ color: p.coral, textDecoration: 'line-through' }}>convite</span>.<br/>
          Somos uma <span className="hand-underline" style={{ color: p.coral }}>cápsula do tempo</span>.
        </h2>
        <p className="font-a-body" style={{ fontSize: 16, color: p.ink2, maxWidth: 640, lineHeight: 1.55, marginTop: 14 }}>
          O convite é apenas a porta de entrada. O verdadeiro valor está em construir um
          arquivo digital que preserva fotos, vídeos e histórias de quem esteve lá — e
          que sua filha vai abrir aos 18 anos.
        </p>

        {/* horizontal transformation strip */}
        <div style={{
          marginTop: 28, background: p.card, border: `1.5px solid ${p.ink}`,
          borderRadius: 20, padding: '24px 28px',
          boxShadow: '6px 7px 0 rgba(27,18,9,0.08)',
        }}>
          <div className="font-mono" style={{ fontSize: 11, color: p.ink2, letterSpacing: 0.4 }}>praesentia.com/e/mavie-1-ano</div>
          <div style={{
            marginTop: 14, display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: 14, alignItems: 'stretch',
          }} className="grid-collapse-3">
            {[
              { tag: 'Antes', t: 'Convite', sub: '14 mar 2026 · 18 dias', c: p.coral, bg: '#FBE3CC',
                preview: <ConvitePreview p={p} bg="#FBE3CC"/> },
              { tag: 'Durante', t: 'Mural ao vivo', sub: 'sáb 14 mar · 15h às 19h', c: p.sol, bg: '#FFE9BD',
                preview: <MuralPreview p={p}/> },
              { tag: 'Depois · para sempre', t: 'Cápsula', sub: 'aberta · 15 mar 2026', c: p.uva, bg: '#E5D5F2',
                preview: <MemoryPreview p={p}/> },
            ].flatMap((c, i, arr) => [
              <PhaseCard key={`c${i}`} {...c}/>,
              i < arr.length - 1 && <Arrow key={`a${i}`} c={p.ink2}/>,
            ])}
          </div>
        </div>
      </section>

      {/* ─── exemplos / galeria ─── */}
      <section style={{ padding: '40px 6vw', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h2 className="font-a-display-i" style={{ fontSize: 'clamp(28px, 3.4vw, 44px)', margin: 0 }}>Cápsulas em destaque</h2>
          <span className="font-a-body" style={{ fontSize: 13, color: p.ink2 }}>memórias compartilhadas pelos próprios anfitriões</span>
        </div>
        <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="grid-collapse-4">
          {[
            { yr: '2024', t: 'Casamento João e Ana', stat: '412 fotos · 38 vídeos', c: '#F1D8C9', tilt: -2 },
            { yr: '2025', t: 'Formatura Eng. UFMG', stat: '186 fotos · 22 vídeos', c: '#D9E8F4', tilt: 3 },
            { yr: '2026', t: 'Mavie · 1 aninho', stat: '247 fotos · 38 vídeos', c: '#FBE3CC', tilt: -3, featured: true },
            { yr: '2026', t: 'Réveillon na cobertura', stat: '94 fotos · 12 vídeos', c: '#E5D5F2', tilt: 2 },
          ].map((e, i) => (
            <div key={i} className="polaroid" style={{ transform: `rotate(${e.tilt}deg)`, position: 'relative' }}>
              <Placeholder w={'100%'} h={170} label={e.t} bg={e.c}/>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div className="font-mono" style={{ fontSize: 10, color: p.ink2, letterSpacing: 0.4 }}>{e.yr}</div>
                {e.featured && <span className="pill" style={{ background: p.coral, color: '#fff', fontSize: 9 }}>destaque</span>}
              </div>
              <div className="font-a-display-i" style={{ fontSize: 15, color: p.ink, marginTop: 2 }}>{e.t}</div>
              <div className="font-a-body" style={{ fontSize: 11, color: p.ink2, marginTop: 2 }}>{e.stat}</div>
            </div>
          ))}
        </div>
      </section>

      <VidaEmCapsulasSection goto={goto}/>
      <PrivacidadeSection/>
      <AlbumImpressoSection/>
      <PrecosSection goto={goto}/>

      {/* ─── Big CTA ─── */}
      <section style={{ padding: '40px 6vw', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{
          background: p.coral, color: '#FFF7EE', borderRadius: 24, padding: '40px 36px',
          position: 'relative', overflow: 'hidden',
          border: `1.5px solid ${p.ink}`,
          boxShadow: `8px 10px 0 ${p.ink}`,
        }}>
          <ConfettiBurst style={{ position: 'absolute', right: 30, top: 30 }} scale={1.4}/>
          <span className="pill" style={{ background: 'rgba(255,255,255,0.18)', color: '#FFF7EE' }}>grátis · sem cartão</span>
          <h2 className="font-a-display-i" style={{
            fontSize: 'clamp(40px, 5.4vw, 76px)', margin: '14px 0 6px', lineHeight: 0.94, maxWidth: '85%',
          }}>O próximo evento que você vai amar começa agora.</h2>
          <p className="font-a-body" style={{ fontSize: 16, opacity: 0.92, lineHeight: 1.5, maxWidth: 600 }}>
            Crie o convite em minutos e transforme a noite em uma cápsula do tempo que você poderá revisitar para sempre.
          </p>
          <div style={{ marginTop: 22, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn font-a-body" onClick={() => goto('/criar')} style={{
              background: p.ink, color: p.bg, padding: '16px 22px', borderRadius: 14,
              fontSize: 15, fontWeight: 700,
            }}><Ico.spark s={16}/> Criar meu evento</button>
            <button className="btn font-a-body" onClick={() => goto('/e/mavie-1-ano')} style={{
              background: 'transparent', color: '#FFF7EE', padding: '16px 22px', borderRadius: 14,
              fontSize: 14, fontWeight: 600,
              border: `1.5px solid #FFF7EE`,
            }}>Ver demo da Mavie →</button>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section style={{ padding: '40px 6vw 60px', maxWidth: 980, margin: '0 auto' }}>
        <h2 className="font-a-display-i" style={{ fontSize: 'clamp(28px, 3.2vw, 40px)', margin: 0 }}>Perguntas frequentes</h2>
        <div style={{ marginTop: 18, borderTop: `1.5px solid ${p.ink}` }}>
          {[
            { q: 'Quanto custa de verdade?', a: 'O plano Gratuito é 100% sem cartão — cria o convite, lista de convidados, RSVP e link compartilhável, mas o evento fica disponível apenas até o fim da festa. O plano Cápsula é pagamento único de R$ 59 com no mínimo 36 meses de armazenamento (5 GB inclusos, amplável) e tudo que torna o evento uma memória permanente: cápsula do tempo, timeline, fotos, vídeos e domínio próprio. O plano Família é R$ 197/ano e cobre até 12 eventos conectados numa só timeline familiar, com 25 GB compartilhados.' },
            { q: 'O link realmente não expira?', a: 'Cápsulas pagas têm no mínimo 36 meses garantidos — você pode ampliar tempo e espaço com pacotes extras (a partir de R$ 19 por +5 GB). No plano Família, cada evento mantém o mesmo mínimo individual. Se a Praesentia algum dia fechar, nos comprometemos a entregar arquivo exportado pra todos os clientes com 6 meses de antecedência — está nos termos.' },
            { q: 'E a privacidade das crianças?', a: 'Aniversários infantis vêm com Modo Família ligado por padrão: rostos de menores só aparecem pra quem o anfitrião verificou. Cápsulas privadas nunca aparecem em buscadores. Quando a criança fizer 18 anos, a coleção passa pra conta dela.' },
            { q: 'Como a IA cria o convite?', a: 'Você responde 7 perguntas (tipo, data, local, tema, faixa etária, tom, e informações extras). Em 4 minutos a IA gera texto, paleta, capa, imagens personalizadas, mensagens, sugestões de hashtags e uma mensagem pós-evento. Tudo editável. A geração premium de imagens por IA está disponível nos planos Cápsula e Família.' },
            { q: 'Quanto espaço eu tenho na cápsula?', a: 'O plano Cápsula vem com 5 GB inclusos. Se precisar de mais, você expande na hora: +5 GB por R$ 19, +10 GB por R$ 29, +25 GB por R$ 49 ou +50 GB por R$ 89. Pagamento único, válido durante o período da cápsula. O plano Família já vem com 25 GB compartilhados entre todos os eventos do ano.' },
            { q: 'O que vai pra cápsula do tempo?', a: 'Fotos, vídeos e recados que você e seus convidados enviarem. Tudo organizado numa timeline do evento, com momentos destaque e a lista de quem esteve lá. Você pode exportar tudo a qualquer momento (zip + JSON dos metadados).' },
            { q: 'Funciona offline?', a: 'É um PWA. Você pode instalar como app no celular, e fotos batem assim que volta o sinal — bom pra festas em locais sem Wi-Fi.' },
          ].map((f, i) => (
            <FAQRow key={i} q={f.q} a={f.a}/>
          ))}
        </div>
      </section>
    </div>
  );
}

function PhaseCard({ tag, t, sub, c, bg, preview }) {
  const p = PALETTE_A;
  return (
    <div style={{
      background: bg, borderRadius: 16, padding: '14px 16px 16px',
      border: `1.5px solid ${p.ink}`, position: 'relative', overflow: 'hidden',
      minHeight: 220, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: c }}/>
        <span className="font-mono" style={{ fontSize: 10, color: p.ink2, letterSpacing: 0.4, textTransform: 'uppercase' }}>{tag}</span>
      </div>
      <h4 className="font-a-display-i" style={{ margin: '4px 0 0', fontSize: 24, lineHeight: 1, color: p.ink }}>{t}</h4>
      <div className="font-a-body" style={{ fontSize: 11.5, color: p.ink2, marginTop: 2 }}>{sub}</div>
      <div style={{ marginTop: 12, flex: 1, minHeight: 0 }}>{preview}</div>
    </div>
  );
}

function Arrow({ c }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2px' }}>
      <svg width="22" height="40" viewBox="0 0 22 40" fill="none" stroke={c} strokeWidth="1.5">
        <path d="M2 20h17M14 14l6 6-6 6"/>
      </svg>
    </div>
  );
}

function ConvitePreview({ p }) {
  return (
    <div style={{ background: p.card, borderRadius: 10, padding: '10px 12px', border: `1px solid rgba(27,18,9,0.18)` }}>
      <div className="font-a-display-i" style={{ fontSize: 22, color: p.ink, lineHeight: 1 }}>Mavie, 1.</div>
      <div className="font-a-body" style={{ fontSize: 9.5, color: p.ink2, marginTop: 4, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 700 }}>14 MAR · 15H</div>
      <div className="dotted" style={{ color: p.ink, marginTop: 6, opacity: 0.4 }}/>
      <div style={{ marginTop: 6, height: 28, background: p.ink, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: p.bg }}>confirmar</span>
      </div>
    </div>
  );
}
function MuralPreview({ p }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
      <Placeholder w="100%" h={48} label="" bg="#FBE3CC" radius={5}/>
      <Placeholder w="100%" h={48} label="" bg="#D9E8F4" radius={5}/>
      <Placeholder w="100%" h={48} label="" bg="#D7EDD9" radius={5}/>
      <Placeholder w="100%" h={48} label="" bg="#F1D8C9" radius={5}/>
      <div style={{ gridColumn: '1 / -1', background: p.uva, color: '#fff', borderRadius: 5, padding: '4px 6px', fontSize: 9, fontFamily: 'JetBrains Mono' }}>● AO VIVO · 47 pessoas</div>
    </div>
  );
}
function MemoryPreview({ p }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
        {['#F1D8C9','#D9E8F4','#D7EDD9','#FBE3CC','#E5D5F2','#FFE9BD','#F4D5BA','#D8E7F4'].map((c,i)=>(
          <div key={i} style={{ aspectRatio: '1/1', background: c, borderRadius: 3 }}/>
        ))}
      </div>
      <div style={{ marginTop: 6, fontFamily: 'Plus Jakarta Sans', fontSize: 10, color: p.ink2 }}>
        <b style={{ color: p.ink }}>247</b> fotos · <b style={{ color: p.ink }}>86</b> recados
      </div>
    </div>
  );
}

function FAQRow({ q, a }) {
  const [open, setOpen] = React.useState(false);
  const p = PALETTE_A;
  return (
    <div onClick={() => setOpen(!open)} style={{
      borderBottom: `1px solid rgba(27,18,9,0.18)`,
      padding: '18px 4px', cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h4 className="font-a-display" style={{ margin: 0, fontSize: 19, color: p.ink, flex: 1 }}>{q}</h4>
        <div style={{
          width: 28, height: 28, borderRadius: 999, background: open ? p.ink : 'transparent',
          color: open ? p.bg : p.ink, border: `1.5px solid ${p.ink}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </div>
      {open && (
        <p className="font-a-body" style={{
          margin: '10px 0 0', fontSize: 14, color: p.ink2, lineHeight: 1.6, maxWidth: 760,
        }}>{a}</p>
      )}
    </div>
  );
}

function Paper() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.45, zIndex: 0,
      backgroundImage: 'radial-gradient(rgba(0,0,0,0.04) 0.6px, transparent 0.7px)',
      backgroundSize: '7px 7px',
    }}/>
  );
}

Object.assign(window, { SiteHome, Paper });
