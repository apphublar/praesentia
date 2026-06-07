// memory.jsx — Fase 2: a página de memórias permanente + timeline

// ─── Memória desktop (Festa) ────────────────────────────────
function MemoriaDesktopA() {
  const p = PALETTE_A;
  return (
    <Desktop url={EVENT.url} palette="a" w={1280} h={900}>
      <div style={{ background: p.bg, width: '100%', height: '100%', overflow: 'auto', position: 'relative' }} className="no-scrollbar">
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4,
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.04) 0.6px, transparent 0.7px)',
          backgroundSize: '7px 7px',
        }}/>

        {/* top */}
        <div style={{ padding: '20px 36px 0', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="font-a-display-i" style={{ fontSize: 22, color: p.ink }}>Praesentia</div>
          <span className="pill" style={{ background: p.jardim, color: '#fff' }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: '#fff' }}/> memória permanente
          </span>
          <span className="font-mono" style={{ fontSize: 11, color: p.ink2 }}>aberto em 15 mar 2026 · arquivado para sempre</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn font-a-body" style={{
              fontSize: 12, fontWeight: 600, color: p.ink, background: 'transparent',
              padding: '8px 12px', borderRadius: 999, border: `1.5px solid ${p.ink}`,
            }}><Ico.share s={13}/> compartilhar cápsula</button>
            <Avatar name="Maria S" tint={p.uva} size={32}/>
          </div>
        </div>

        {/* hero */}
        <div style={{
          margin: '14px 36px 0', padding: '24px 28px', borderRadius: 22,
          background: p.card, border: `1.5px solid ${p.ink}`,
          display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 28,
          boxShadow: '6px 8px 0 rgba(27,18,9,0.10)', position: 'relative', overflow: 'hidden',
        }}>
          <div>
            <div className="font-a-body" style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: p.ink2, fontWeight: 700 }}>
              o aniversário da
            </div>
            <h1 className="font-a-display-i" style={{ margin: '6px 0 0', fontSize: 96, lineHeight: 0.88, color: p.ink }}>{EVENT.child}</h1>
            <div className="font-a-display" style={{ fontSize: 28, color: p.coral, marginTop: 4 }}>1 ano · <span className="hand-underline">jardim encantado</span></div>

            <div className="dotted" style={{ color: p.ink, marginTop: 18, opacity: 0.4 }}/>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 16 }}>
              {[
                { n: 247, l: 'fotos', c: p.coral },
                { n: 38, l: 'vídeos', c: p.ceu },
                { n: 86, l: 'mensagens', c: p.uva },
                { n: 47, l: 'pessoas', c: p.jardim },
              ].map((s,i)=>(
                <div key={i}>
                  <div className="font-a-display" style={{ fontSize: 40, lineHeight: 1, color: s.c }}>{s.n}</div>
                  <div className="font-a-body" style={{ fontSize: 11, color: p.ink2, marginTop: 4, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 600 }}>{s.l}</div>
                </div>
              ))}
            </div>

            <p className="font-a-display-i" style={{ fontSize: 17, lineHeight: 1.4, color: p.ink, marginTop: 18, maxWidth: 460 }}>
              Foi um sábado de céu limpo. A Mavie usou a coroa de flores que a tia Lila fez. O bolo era de cenoura. Toda essa tarde mora aqui.
            </p>
          </div>

          {/* highlight photo + 3 polaroids */}
          <div style={{ position: 'relative' }}>
            <div className="polaroid" style={{ position: 'absolute', top: 0, left: 6, transform: 'rotate(-6deg)', width: 200 }}>
              <Placeholder w={180} h={200} label="bolo · 17h12" bg={p.bg2}/>
              <div className="font-a-display-i" style={{ fontSize: 12, textAlign: 'center', marginTop: 6, color: p.ink }}>parabéns da vovó</div>
            </div>
            <div className="polaroid" style={{ position: 'absolute', top: 28, right: 0, transform: 'rotate(7deg)', width: 220, zIndex: 2 }}>
              <Placeholder w={200} h={240} label="momento destaque" bg="#F1D8C9"/>
              <div className="font-a-display-i" style={{ fontSize: 12, textAlign: 'center', marginTop: 6, color: p.ink }}>♥ momento destaque</div>
            </div>
            <div className="polaroid" style={{ position: 'absolute', bottom: 0, left: 36, transform: 'rotate(-3deg)', width: 180 }}>
              <Placeholder w={160} h={150} label="vídeo · 02:14" bg="#D9E8F4"/>
              <div className="font-a-display-i" style={{ fontSize: 12, textAlign: 'center', marginTop: 6, color: p.ink }}>primeiros passos</div>
              <span style={{
                position: 'absolute', top: 18, left: 18,
                width: 28, height: 28, borderRadius: 999, background: 'rgba(255,255,255,0.95)',
                color: p.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Ico.play s={14}/></span>
            </div>
            <div className="tape" style={{ top: -6, left: 90, transform: 'rotate(-3deg)' }}/>
          </div>
        </div>

        {/* sub nav */}
        <div style={{
          padding: '20px 36px 0', display: 'flex', gap: 18, alignItems: 'center',
        }}>
          {['mural','linha do tempo','convidados','álbum'].map((t,i)=>(
            <span key={t} className="font-a-body" style={{
              fontSize: 13, color: i===0?p.ink:p.ink2, fontWeight: i===0?700:500,
              borderBottom: i===0 ? `2px solid ${p.coral}` : 'none', paddingBottom: 4,
            }}>{t} {i===0 && <span style={{ marginLeft: 4, color: p.ink2 }}>· 287</span>}</span>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <span className="pill" style={{ background: p.bg2, color: p.ink2, fontSize: 10 }}>tudo</span>
            <span className="pill" style={{ background: p.coral, color: '#fff', fontSize: 10 }}>fotos</span>
            <span className="pill" style={{ background: p.bg2, color: p.ink2, fontSize: 10 }}>vídeos</span>
            <span className="pill" style={{ background: p.bg2, color: p.ink2, fontSize: 10 }}>mensagens</span>
          </div>
        </div>

        {/* mural masonry */}
        <div style={{
          padding: '16px 36px 36px',
          columnCount: 4, columnGap: 14,
        }}>
          {[
            { h: 230, l: 'bolo · 17h12', c: p.bg2, tint: p.coral, who: 'vovó Maria' },
            { h: 180, l: 'mavie + papai', c: '#F1D8C9', tint: p.ceu, who: 'Ana B' },
            { h: 260, l: 'jardim · 15h44', c: '#D9E8DC', tint: p.jardim, who: 'tio Caio' },
            { h: 200, l: 'vídeo · 00:42', c: '#D9E8F4', isVideo: true, tint: p.uva, who: 'Lu M' },
            { h: 220, l: 'mensagem · ana', isText: true, msg: 'Mavie, que sua vida seja sempre cheia de flores e gente boa.', tint: p.sol, who: 'Ana B' },
            { h: 240, l: 'os 3 primos', c: '#FBE3CC', tint: p.coral, who: 'tia Lila' },
            { h: 160, l: 'coroa · close', c: '#F1D8C9', tint: p.uva, who: 'Pedro L' },
            { h: 200, l: 'bolo · corte', c: p.bg2, tint: p.coral, who: 'vovó Maria' },
            { h: 220, l: 'vídeo · 01:08', c: '#D9E8F4', isVideo: true, tint: p.jardim, who: 'Caio R' },
            { h: 180, l: 'mãe e filha', c: '#F1D8C9', tint: p.ceu, who: 'Camila' },
            { h: 220, l: 'mensagem · vovô', isText: true, msg: 'Que bom virar uma família com você por perto, mavie.', tint: p.sol, who: 'vovô João' },
            { h: 200, l: 'flores no chão', c: '#D9E8DC', tint: p.jardim, who: 'tia Lila' },
          ].map((it,i)=>(
            <div key={i} className="polaroid" style={{
              breakInside: 'avoid', marginBottom: 14,
              transform: `rotate(${(i%3 - 1) * 1.2}deg)`,
            }}>
              {it.isText ? (
                <div style={{
                  height: it.h - 60, background: it.tint, color: p.ink,
                  borderRadius: 4, padding: '14px 14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <p className="font-a-display-i" style={{ margin: 0, fontSize: 16, lineHeight: 1.35, textAlign: 'center' }}>{it.msg}</p>
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
                fontFamily: 'Plus Jakarta Sans', fontSize: 11, color: p.ink2,
              }}>
                <span>por {it.who}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Ico.heart s={11} fill={p.coral}/>{12 + (i*3)%19}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Desktop>
  );
}

// ─── Memória desktop (Cápsula) ──────────────────────────────
function MemoriaDesktopB() {
  const p = PALETTE_B;
  return (
    <Desktop url={EVENT.url} palette="b" w={1280} h={900}>
      <div style={{ background: p.bg, width: '100%', height: '100%', overflow: 'auto', position: 'relative' }} className="no-scrollbar">
        {/* top */}
        <div style={{
          padding: '18px 36px', display: 'flex', alignItems: 'center', gap: 16,
          borderBottom: `1.5px solid ${p.ink}`, background: p.bg,
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <RingMark size={24} color={p.ink} count={3} dot={p.magenta}/>
          <span className="font-b-display" style={{ fontSize: 18, color: p.ink }}>Praesentia</span>
          <span className="font-mono" style={{ fontSize: 11, color: p.ink2, letterSpacing: 0.5 }}>/ CAPSULE #001 · MAVIE-1-ANO · LACRADO 15 MAR 2026</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="pill" style={{ background: p.jade, color: '#fff' }}>arquivado para sempre</span>
            <Avatar name="Maria S" tint={p.azul} size={32}/>
          </div>
        </div>

        {/* hero — rings + stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1.1fr 0.9fr',
          padding: '32px 36px 24px', gap: 32, alignItems: 'center',
        }}>
          <div>
            <div className="font-mono" style={{ fontSize: 11, letterSpacing: 0.6, color: p.ink2 }}>{EVENT.dateShort}</div>
            <h1 className="font-b-display" style={{
              margin: '12px 0 0', fontSize: 132, lineHeight: 0.86, letterSpacing: -0.05, color: p.ink,
            }}>{EVENT.child}, 1.</h1>
            <p className="font-b-body" style={{ fontSize: 24, lineHeight: 1.32, fontStyle: 'italic', color: p.ink, marginTop: 16, maxWidth: 520 }}>
              <span style={{ color: p.magenta }}>2026 — </span>
              um sábado no quintal das acácias, coroa de flores, bolo de cenoura, choro fofo no fim. Tudo guardado aqui.
            </p>
            <div style={{ marginTop: 22, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { n: 247, l: 'fotos', c: p.magenta },
                { n: 38, l: 'vídeos', c: p.azul },
                { n: 86, l: 'mensagens', c: p.jade },
                { n: 47, l: 'pessoas', c: p.mostarda },
              ].map((s,i)=>(
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span className="font-b-display" style={{ fontSize: 46, lineHeight: 1, color: s.c }}>{s.n}</span>
                  <span className="font-b-sans" style={{ fontSize: 11, color: p.ink2, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>{s.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* the capsule — concentric rings */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', maxWidth: 420, margin: '0 auto' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 999, border: `1.5px solid ${p.ink}`}}/>
            <div style={{ position: 'absolute', inset: 24, borderRadius: 999, border: `1.5px solid ${p.ink}`}}/>
            <div style={{ position: 'absolute', inset: 50, borderRadius: 999, border: `1.5px solid ${p.ink}`, background: p.magenta }}/>
            <div style={{ position: 'absolute', inset: 80, borderRadius: 999, overflow: 'hidden' }}>
              <Placeholder w={'100%'} h={'100%'} label="momento destaque" bg="#E5DECE" radius={999}/>
            </div>
            {/* orbits of avatars */}
            {[
              { name: 'Ana B', tint: p.azul, a: 12 },
              { name: 'Pedro L', tint: p.mostarda, a: 78 },
              { name: 'Lu M', tint: p.jade, a: 142 },
              { name: 'Caio R', tint: p.ametista, a: 212 },
              { name: 'tia Lila', tint: p.magenta, a: 278 },
              { name: 'vovó M', tint: p.azul, a: 332 },
            ].map((g,i)=>{
              const r = 50; // %
              const rad = (g.a * Math.PI) / 180;
              const x = 50 + r * Math.cos(rad);
              const y = 50 + r * Math.sin(rad);
              return (
                <div key={i} style={{
                  position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)',
                  boxShadow: `0 0 0 4px ${p.bg}`, borderRadius: 999,
                }}>
                  <Avatar name={g.name} tint={g.tint} size={36}/>
                </div>
              );
            })}
            {/* label */}
            <div style={{
              position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, 64px)',
              textAlign: 'center', pointerEvents: 'none',
            }}>
              <div className="font-mono" style={{ fontSize: 10, color: '#FFF8E8', letterSpacing: 0.6 }}>CAPSULE #001</div>
            </div>
          </div>
        </div>

        {/* sub nav */}
        <div style={{
          padding: '8px 36px 0', display: 'flex', gap: 20, alignItems: 'center',
          borderTop: `1.5px solid ${p.ink}`, marginTop: 12,
        }}>
          {['mural','timeline','convidados','álbum'].map((t,i)=>(
            <span key={t} className="font-b-sans" style={{
              fontSize: 12, color: i===0?p.ink:p.ink2, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
              borderTop: i===0 ? `3px solid ${p.magenta}` : '3px solid transparent', paddingTop: 12, paddingBottom: 10,
            }}>{t}</span>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {['todos','fotos','vídeos','msgs'].map((f,i)=>(
              <span key={f} className="font-mono" style={{
                fontSize: 10, padding: '6px 10px', borderRadius: 999,
                background: i===1?p.ink:'transparent', color: i===1?p.mostarda:p.ink2,
                border: i===1 ? 'none' : `1px solid ${p.ink2}`,
                letterSpacing: 0.6, textTransform: 'uppercase',
              }}>{f}</span>
            ))}
          </div>
        </div>

        {/* grid */}
        <div style={{
          padding: '20px 36px 36px',
          display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8,
          gridAutoRows: 120,
        }}>
          {[
            { l: 'bolo · 17h12', c: '#F4D5BA', span: '3 / 2' },
            { l: 'mavie + papai', c: '#D8E7F4' },
            { l: 'flores', c: '#D7EDD9', span: '1 / 2' },
            { l: 'coroa', c: '#E5D5F2' },
            { l: 'primos', c: '#FBE3CC' },
            { l: 'mensagem · ana', c: p.mostarda, isText: true, msg: 'mavie, que sua vida seja sempre cheia de flores' },
            { l: 'vídeo · 02:14', c: '#D8E7F4', isVideo: true, span: '2 / 2' },
            { l: 'mãe e filha', c: '#F4D5BA' },
            { l: 'jardim', c: '#D7EDD9' },
            { l: 'bolo · corte', c: '#F4D5BA' },
            { l: 'msg · vovô', c: p.jade, isText: true, msg: 'que bom virar família com você', span: '2 / 1' },
            { l: 'vídeo · 00:42', c: '#E5D5F2', isVideo: true },
            { l: 'flores no chão', c: '#D7EDD9' },
            { l: 'risada', c: '#FBE3CC' },
          ].map((it,i)=>{
            const [cspan, rspan] = (it.span || '1 / 1').split(' / ').map(n => parseInt(n));
            return (
              <div key={i} style={{
                gridColumn: `span ${cspan}`, gridRow: `span ${rspan}`,
                position: 'relative', borderRadius: 10, overflow: 'hidden',
              }}>
                {it.isText ? (
                  <div style={{
                    width: '100%', height: '100%', background: it.c, color: p.ink,
                    padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <p className="font-b-body" style={{
                      fontStyle: 'italic', fontSize: 18, lineHeight: 1.3,
                      textAlign: 'center', margin: 0,
                    }}>"{it.msg}"</p>
                  </div>
                ) : (
                  <Placeholder w={'100%'} h={'100%'} label={it.l} bg={it.c} radius={10}/>
                )}
                {it.isVideo && (
                  <span style={{
                    position: 'absolute', left: 12, bottom: 10,
                    background: 'rgba(14,11,20,0.7)', color: '#fff',
                    padding: '4px 8px', borderRadius: 999,
                    fontFamily: 'JetBrains Mono', fontSize: 10,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}><Ico.play s={9}/> VÍDEO</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Desktop>
  );
}

// ─── Memória mobile (variante simples, agnóstica) ────────────
function MemoriaMobile() {
  const p = PALETTE_A;
  return (
    <div style={{ background: p.bg, height: '100%', overflow: 'auto' }} className="no-scrollbar">
      <div style={{ height: 54 }}/>

      <div style={{ padding: '4px 18px 0' }}>
        <span className="pill" style={{ background: p.jardim, color: '#fff' }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: '#fff' }}/> memória permanente
        </span>
        <h1 className="font-a-display-i" style={{ margin: '12px 0 0', fontSize: 56, lineHeight: 0.88, color: p.ink }}>{EVENT.child}, 1.</h1>
        <div className="font-a-display" style={{ fontSize: 18, color: p.coral, marginTop: 4 }}><span className="hand-underline">jardim encantado</span> · 14 mar 2026</div>
      </div>

      {/* stats inline */}
      <div style={{ padding: '14px 18px 0', display: 'flex', gap: 14 }}>
        {[
          { n: 247, l: 'fotos', c: p.coral },
          { n: 38, l: 'vídeos', c: p.ceu },
          { n: 86, l: 'msgs', c: p.uva },
        ].map((s,i)=>(
          <div key={i}>
            <div className="font-a-display" style={{ fontSize: 28, color: s.c, lineHeight: 1 }}>{s.n}</div>
            <div className="font-a-body" style={{ fontSize: 10.5, color: p.ink2, marginTop: 2, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 700 }}>{s.l}</div>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
          <AvatarStack people={[
            { name: 'A', tint: p.coral }, { name: 'P', tint: p.ceu }, { name: 'L', tint: p.uva },
          ]} size={22}/>
          <div className="font-a-body" style={{ fontSize: 10, color: p.ink2, marginTop: 2, textAlign: 'right' }}>+44</div>
        </div>
      </div>

      {/* highlight polaroid */}
      <div style={{ padding: '16px 18px 0' }}>
        <div className="polaroid" style={{ transform: 'rotate(-2deg)' }}>
          <Placeholder w={'100%'} h={240} label="momento destaque" bg="#F1D8C9"/>
          <div className="font-a-display-i" style={{ fontSize: 14, color: p.ink, marginTop: 8, textAlign: 'center' }}>
            ♥ momento destaque — parabéns da vovó
          </div>
        </div>
      </div>

      {/* mural feed */}
      <div style={{ padding: '20px 18px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 className="font-a-display" style={{ fontSize: 22, color: p.ink, margin: 0 }}>mural · 287 momentos</h3>
          <span className="font-a-body" style={{ fontSize: 11, color: p.ink2 }}>cronológico</span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
        }}>
          {[
            { h: 140, l: '15h12', c: p.bg2 },
            { h: 180, l: '15h44', c: '#D9E8F4', isVideo: true },
            { h: 180, l: '16h08', c: '#F1D8C9' },
            { h: 120, l: '16h22', c: '#D9E8DC' },
            { h: 200, l: '17h12 · bolo', c: '#FBE3CC' },
            { h: 140, l: '17h40', c: '#E5D5F2' },
          ].map((it,i)=>(
            <div key={i} style={{ position: 'relative' }}>
              <Placeholder w={'100%'} h={it.h} label={it.l} bg={it.c}/>
              {it.isVideo && (
                <span style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 22, height: 22, borderRadius: 999, background: 'rgba(0,0,0,0.7)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><Ico.play s={9}/></span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Timeline visual da cápsula (desktop) ───────────────────
function TimelineDesktop() {
  const p = PALETTE_B;
  const steps = [
    { d: '02 fev', t: 'Convite criado', sub: 'Camila usou a IA para gerar o convite em 4min', c: p.azul, ico: <Ico.spark s={14}/>, status: 'done' },
    { d: '04 fev', t: 'Primeiras confirmações', sub: '12 famílias confirmaram no 1º dia', c: p.jade, ico: <Ico.check s={14}/>, status: 'done' },
    { d: '07 mar', t: 'RSVP encerrado', sub: '47 de 62 confirmaram presença', c: p.mostarda, ico: <Ico.bell s={14}/>, status: 'done' },
    { d: '14 mar', t: 'Dia do evento', sub: 'sábado · 15h00 · Quintal das Acácias', c: p.magenta, ico: <Ico.heart s={14}/>, status: 'done', big: true },
    { d: '14 mar · 15h44', t: 'Primeiras fotos publicadas', sub: 'Ana B subiu 2 fotos, Pedro 1 vídeo', c: p.azul, ico: <Ico.cam s={14}/>, status: 'done' },
    { d: '14 mar · 17h12', t: 'Momento destaque escolhido', sub: 'Camila marcou o parabéns como destaque', c: p.magenta, ico: <Ico.heart s={14}/>, status: 'done' },
    { d: '15 mar', t: 'Memória permanente aberta', sub: 'A cápsula #001 foi arquivada para sempre', c: p.ametista, ico: <Ico.spark s={14}/>, status: 'done', big: true },
    { d: '— para sempre', t: 'Disponível em qualquer ano', sub: '2026 → 2030 → 2036 → ...', c: p.ink, ico: <Ico.arrow s={14}/>, status: 'future' },
  ];
  return (
    <Desktop url={EVENT.url + '/timeline'} palette="b" w={1280} h={720}>
      <div style={{ background: p.bg, width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
        {/* header */}
        <div style={{ padding: '22px 40px 0', display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <RingMark size={24} color={p.ink} count={3} dot={p.magenta}/>
          <h1 className="font-b-display" style={{ fontSize: 36, color: p.ink, margin: 0 }}>Linha do tempo</h1>
          <span className="font-mono" style={{ fontSize: 11, color: p.ink2 }}>CAPSULE #001 · MAVIE-1-ANO · 8 marcos</span>
          <span className="pill" style={{ marginLeft: 'auto', background: p.jade, color: '#fff' }}>cápsula lacrada</span>
        </div>

        {/* horizontal thread */}
        <div style={{
          position: 'relative', margin: '60px 40px 0',
          height: 480, overflow: 'hidden',
        }}>
          {/* the thread */}
          <div style={{
            position: 'absolute', left: 0, right: 0, top: '50%',
            height: 2, background: p.ink, opacity: 0.25,
            transform: 'translateY(-1px)',
          }}/>
          <div style={{
            position: 'absolute', left: 0, top: '50%',
            height: 2, width: '75%', background: p.ink,
            transform: 'translateY(-1px)',
          }}/>

          <div style={{
            display: 'flex', gap: 0, height: '100%',
            justifyContent: 'space-between', position: 'relative',
          }}>
            {steps.map((s,i)=>(
              <div key={i} style={{
                flex: 1, position: 'relative', display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                {/* card above or below alternating */}
                <div style={{
                  position: 'absolute',
                  top: i % 2 === 0 ? 0 : '54%',
                  bottom: i % 2 === 0 ? '54%' : 0,
                  left: '50%', transform: 'translateX(-50%)',
                  width: 156,
                  background: s.big ? s.c : p.card,
                  color: s.big ? '#fff' : p.ink,
                  border: s.big ? 'none' : `1.5px solid ${p.ink}`,
                  borderRadius: 12, padding: '12px 14px',
                  display: 'flex', flexDirection: 'column', justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start',
                  textAlign: 'left',
                }}>
                  <div className="font-mono" style={{ fontSize: 10, opacity: s.big ? 0.85 : 1, color: s.big ? '#fff' : p.ink2, letterSpacing: 0.4 }}>{s.d}</div>
                  <div className="font-b-sans" style={{ fontSize: 13, fontWeight: 700, marginTop: 4, lineHeight: 1.25 }}>{s.t}</div>
                  <div className="font-b-sans" style={{ fontSize: 11, opacity: s.big ? 0.85 : 1, color: s.big ? '#fff' : p.ink2, marginTop: 4, lineHeight: 1.4 }}>{s.sub}</div>
                </div>

                {/* connector line from node to card */}
                <div style={{
                  position: 'absolute', left: '50%', transform: 'translateX(-0.5px)',
                  top: i % 2 === 0 ? '24%' : '50%',
                  bottom: i % 2 === 0 ? '50%' : '24%',
                  width: 1, background: p.ink, opacity: 0.4,
                }}/>

                {/* node */}
                <div style={{
                  width: s.big ? 44 : 32, height: s.big ? 44 : 32, borderRadius: 999,
                  background: s.status === 'future' ? p.bg : s.c,
                  border: s.status === 'future' ? `2px dashed ${p.ink}` : `1.5px solid ${p.ink}`,
                  color: s.status === 'future' ? p.ink : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', zIndex: 2,
                }}>{s.ico}</div>
              </div>
            ))}
          </div>
        </div>

        {/* footer */}
        <div style={{
          position: 'absolute', left: 40, right: 40, bottom: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: `1.5px solid ${p.ink}`, paddingTop: 14,
        }}>
          <div className="font-b-body" style={{ fontStyle: 'italic', fontSize: 18, color: p.ink, maxWidth: 540, lineHeight: 1.4 }}>
            "O convite foi a porta de entrada. <span style={{ color: p.magenta }}>A memória é o que fica.</span>"
          </div>
          <span className="font-mono" style={{ fontSize: 11, color: p.ink2 }}>praesentia.com/e/mavie-1-ano</span>
        </div>
      </div>
    </Desktop>
  );
}

Object.assign(window, { MemoriaDesktopA, MemoriaDesktopB, MemoriaMobile, TimelineDesktop });
