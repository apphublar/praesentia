// app.jsx — compositor principal

function App() {
  const [t, setT] = useTweaks(/*EDITMODE-BEGIN*/{
    "showFesta": true,
    "showCapsula": true,
    "background": "neutral"
  }/*EDITMODE-END*/);

  const bgMap = {
    neutral: '#E5DECE',
    festa: '#F7EEDB',
    capsula: '#EFEAD8',
    noite: '#13111E',
  };
  const bg = bgMap[t.background] || '#E5DECE';

  return (
    <div style={{
      background: bg, minHeight: '100vh',
      transition: 'background 0.3s ease',
    }}>
      <DesignCanvas>
        {/* FASE 1 — Convite */}
        <DCSection id="convite" title="Fase 1 · O convite" subtitle="Página exclusiva do evento, RSVP, contagem regressiva. Duas direções comparáveis lado a lado.">
          {t.showFesta && (
            <DCArtboard id="convite-mobile-a" label="📱 Convite · Direção A (Festa)" width={390} height={844}>
              <ConviteMobileA/>
            </DCArtboard>
          )}
          {t.showCapsula && (
            <DCArtboard id="convite-mobile-b" label="📱 Convite · Direção B (Cápsula)" width={390} height={844}>
              <ConviteMobileB/>
            </DCArtboard>
          )}
          {t.showFesta && (
            <DCArtboard id="convite-desktop-a" label="🖥 Convite desktop · Festa" width={1280} height={800}>
              <ConviteDesktopA/>
            </DCArtboard>
          )}
          {t.showCapsula && (
            <DCArtboard id="convite-desktop-b" label="🖥 Convite desktop · Cápsula" width={1280} height={800}>
              <ConviteDesktopB/>
            </DCArtboard>
          )}
          <DCArtboard id="rsvp-mobile" label="📱 RSVP confirmado" width={390} height={844}>
            <RSVPMobileA/>
          </DCArtboard>
        </DCSection>

        {/* FASE IA — Criação */}
        <DCSection id="ia" title="Criação com IA" subtitle="Chat conversacional. O usuário descreve o evento; a IA gera texto, paleta, capa e mensagens.">
          <DCArtboard id="ia-mobile" label="📱 Chat assistente — passo 4/6" width={390} height={844}>
            <AIChatMobile/>
          </DCArtboard>
          <DCArtboard id="ia-desktop" label="🖥 Chat + preview ao vivo" width={1280} height={800}>
            <AIChatDesktop/>
          </DCArtboard>
        </DCSection>

        {/* Mural */}
        <DCSection id="mural" title="Durante o evento · Mural ao vivo" subtitle="Cada convidado tem cota: até 2 fotos, 1 vídeo e 1 recado. Qualidade > quantidade.">
          <DCArtboard id="mural-mobile" label="📱 Mural ao vivo" width={390} height={844}>
            <MuralAoVivoMobile/>
          </DCArtboard>
          <DCArtboard id="upload-mobile" label="📱 Compartilhar memória" width={390} height={844}>
            <UploadMobile/>
          </DCArtboard>
        </DCSection>

        {/* FASE 2 — Memória permanente */}
        <DCSection id="memoria" title="Fase 2 · Memória permanente" subtitle="Mesmo link, novo papel. A cápsula vira álbum social arquivado para sempre.">
          {t.showFesta && (
            <DCArtboard id="memoria-desktop-a" label="🖥 Cápsula · Festa (mural masonry)" width={1280} height={900}>
              <MemoriaDesktopA/>
            </DCArtboard>
          )}
          {t.showCapsula && (
            <DCArtboard id="memoria-desktop-b" label="🖥 Cápsula · Cápsula (rings)" width={1280} height={900}>
              <MemoriaDesktopB/>
            </DCArtboard>
          )}
          <DCArtboard id="memoria-mobile" label="📱 Cápsula mobile" width={390} height={844}>
            <MemoriaMobile/>
          </DCArtboard>
        </DCSection>

        {/* Timeline visual */}
        <DCSection id="timeline" title="Linha do tempo da cápsula" subtitle="Do convite ao arquivamento — o evento contado em 8 marcos.">
          <DCArtboard id="timeline-desktop" label="🖥 Timeline" width={1280} height={720}>
            <TimelineDesktop/>
          </DCArtboard>
        </DCSection>

        {/* Evento público */}
        <DCSection id="publico" title="Evento público" subtitle="Festivais, shows, congressos — qualquer um entra voluntariamente e contribui. Cria uma memória coletiva.">
          <DCArtboard id="publico-mobile" label="📱 Festival do Bairro" width={390} height={844}>
            <EventoPublicoMobile/>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Direções visuais">
          <TweakToggle label="Direção A · Festa" value={t.showFesta} onChange={v => setT('showFesta', v)}/>
          <TweakToggle label="Direção B · Cápsula" value={t.showCapsula} onChange={v => setT('showCapsula', v)}/>
        </TweakSection>

        <TweakSection label="Fundo do canvas">
          <TweakSelect
            label="Tom de fundo"
            value={t.background}
            onChange={v => setT('background', v)}
            options={[
              { value: 'neutral', label: 'Neutro · pergaminho' },
              { value: 'festa', label: 'Festa · creme quente' },
              { value: 'capsula', label: 'Cápsula · marfim' },
              { value: 'noite', label: 'Noite · cápsula escura' },
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
