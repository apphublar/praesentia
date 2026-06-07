// site.jsx — router + nav + footer

function useHashRoute(defaultRoute = '/') {
  const [route, setRoute] = React.useState(() => (window.location.hash.replace(/^#/, '') || defaultRoute));
  React.useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace(/^#/, '') || defaultRoute);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [defaultRoute]);
  const goto = React.useCallback((path) => {
    window.location.hash = path;
    // scroll to top on route change
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'auto' }), 0);
  }, []);
  return [route, goto];
}

function SiteNav({ route, goto }) {
  const p = PALETTE_A;
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { to: '/#funciona', l: 'como funciona' },
    { to: '/#exemplos', l: 'histórias' },
    { to: '/#preco', l: 'preços' },
    { to: '/eu', l: 'meu perfil' },
  ];

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: scrolled ? 'rgba(247,238,219,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(10px)' : 'none',
      borderBottom: scrolled ? `1px solid rgba(27,18,9,0.10)` : 'none',
      transition: 'background 0.2s ease, border 0.2s ease',
    }}>
      <div style={{
        maxWidth: 1320, margin: '0 auto', padding: '14px 6vw',
        display: 'flex', alignItems: 'center', gap: 18,
      }}>
        <div onClick={() => goto('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Logo/>
          <span className="font-a-display-i" style={{ fontSize: 22, color: p.ink }}>Praesentia</span>
        </div>
        <nav style={{ display: 'flex', gap: 22, marginLeft: 16 }} className="nav-links">
          {links.map(l => (
            <span key={l.to} onClick={() => goto(l.to.split('#')[0] || '/')} className="font-a-body" style={{
              fontSize: 13.5, color: p.ink, fontWeight: 500, cursor: 'pointer',
            }}>{l.l}</span>
          ))}
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="font-a-body" style={{ fontSize: 13.5, color: p.ink, cursor: 'pointer' }}>entrar</span>
          <button onClick={() => goto('/criar')} className="btn font-a-body" style={{
            background: p.ink, color: p.bg, padding: '9px 16px',
            borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 0,
            boxShadow: `3px 4px 0 ${p.sol}`,
          }}><Ico.spark s={14}/> criar grátis</button>
        </div>
      </div>
    </header>
  );
}

function Logo({ size = 36 }) {
  const p = PALETTE_A;
  return (
    <svg width={size} height={size} viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="17" fill="none" stroke={p.ink} strokeWidth="1.2" opacity="0.35"/>
      <circle cx="18" cy="18" r="13" fill="none" stroke={p.ink} strokeWidth="1.2" opacity="0.55"/>
      <circle cx="18" cy="18" r="9" fill="none" stroke={p.coral} strokeWidth="1.5"/>
      <circle cx="18" cy="18" r="5" fill={p.coral}/>
      <circle cx="18" cy="18" r="2" fill={p.sol}/>
    </svg>
  );
}

function SiteFooter({ goto }) {
  const p = PALETTE_A;
  return (
    <footer style={{ background: p.ink, color: p.bg, padding: '48px 6vw 28px', position: 'relative' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 32 }} className="grid-collapse-4">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Logo/>
            <span className="font-a-display-i" style={{ fontSize: 26, color: p.bg }}>Praesentia</span>
          </div>
          <p className="font-a-body" style={{ fontSize: 13.5, color: 'rgba(247,238,219,0.7)', maxWidth: 380, marginTop: 14, lineHeight: 1.55 }}>
            Eventos transformados em cápsulas do tempo digitais.
            Convide com IA. Festeje. Lembre para sempre.
          </p>
          <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
            <button onClick={() => goto('/criar')} className="btn font-a-body" style={{
              background: p.sol, color: p.ink, padding: '11px 16px', borderRadius: 10,
              fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 0,
            }}><Ico.spark s={14}/> criar evento</button>
            <button onClick={() => goto('/e/mavie-1-ano')} className="btn font-a-body" style={{
              background: 'transparent', color: p.bg, padding: '11px 16px', borderRadius: 10,
              fontSize: 13, fontWeight: 600, border: `1.5px solid ${p.bg}`, cursor: 'pointer',
            }}>ver demo</button>
          </div>
        </div>
        <FooterCol title="produto" links={['criar evento','exemplos','aplicativo','preços','novidades']}/>
        <FooterCol title="empresa" links={['sobre','blog','imprensa','carreiras','contato']}/>
        <FooterCol title="suporte" links={['central de ajuda','termos','privacidade','cookies','exportar dados']}/>
      </div>
      <div style={{
        maxWidth: 1320, margin: '36px auto 0', paddingTop: 22,
        borderTop: `1px solid rgba(247,238,219,0.15)`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <span className="font-mono" style={{ fontSize: 11, color: 'rgba(247,238,219,0.6)' }}>© 2026 Praesentia · feito em São Paulo · cápsulas para sempre</span>
        <span className="font-mono" style={{ fontSize: 11, color: 'rgba(247,238,219,0.6)' }}>v0.4 · beta</span>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <div className="font-a-body" style={{ fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: PALETTE_A.sol, fontWeight: 700 }}>{title}</div>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {links.map(l => (
          <span key={l} className="font-a-body" style={{ fontSize: 13, color: 'rgba(247,238,219,0.78)', cursor: 'pointer' }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Router
// ──────────────────────────────────────────────
function SiteApp() {
  const [route, goto] = useHashRoute('/');

  // route parsing
  let page = 'home';
  let eventPhase = null;
  const r = route.replace(/\/+$/, '') || '/';

  if (r === '/') page = 'home';
  else if (r === '/criar') page = 'create';
  else if (r === '/eu') page = 'profile';
  else if (r.startsWith('/e/')) {
    page = 'event';
    if (r.endsWith('/rsvp')) eventPhase = 'antes';
  }
  else page = 'home';

  return (
    <div>
      <SiteNav route={route} goto={goto}/>
      {page === 'home' && <SiteHome goto={goto}/>}
      {page === 'event' && <SiteEvent goto={goto} phase={eventPhase}/>}
      {page === 'create' && <SiteCreate goto={goto}/>}
      {page === 'profile' && <SiteProfile goto={goto}/>}
      {page !== 'create' && <SiteFooter goto={goto}/>}
    </div>
  );
}

const siteRoot = ReactDOM.createRoot(document.getElementById('root'));
siteRoot.render(<SiteApp/>);
