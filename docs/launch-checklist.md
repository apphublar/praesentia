# Checklist de lançamento — Praesentia

Marque `[x]` conforme concluir. Ordem sugerida: Fase 1 → 2 → 3.

**Última revisão:** jun/2026 · **Commit base:** `002144f`

---

## Fase 1 — Go-live mínimo (P0)

### Pagamentos
- [x] Pacote `stripe` instalado e variáveis documentadas em `.env.example`
- [ ] Price IDs criados no Stripe Dashboard (Cápsula, Plus, GB extras, Inspiração, Criativo)
- [x] Rotas de billing retornam `checkoutUrl` quando Stripe configurado
- [x] `POST /api/billing/webhook/stripe` valida assinatura e libera planos
- [x] UI redireciona para Stripe (modals, upgrade, upsell IA)
- [x] Em produção sem Stripe → erro claro (sem ativação gratuita)
- [ ] Testar: pagamento ok, cancelado, webhook duplicado

### Banco e infra
- [ ] Supabase Postgres em produção (`DATABASE_URL`)
- [ ] Rodar `docs/database-schema.sql` + migrações `001`–`013`
- [ ] Confirmar migração `013-user-ai-invite-pool.sql` (pool IA por conta)
- [ ] Cloudflare R2 bucket privado + credenciais scoped
- [ ] Upload de mídia sem fallback `mock://`
- [ ] `APP_ENV=production` na Vercel Production
- [ ] `ALLOW_DEV_AUTH_BYPASS=false` em produção

### Auth
- [ ] Supabase Auth em produção (redirect URLs configuradas)
- [ ] Email confirmation habilitado para usuários públicos
- [ ] MFA obrigatório para contas admin (`ADMIN_EMAILS`)

### Legal / LGPD
- [x] Página `/termos` publicada
- [x] Página `/privacidade` publicada
- [x] Links do RSVP funcionando
- [ ] Fluxo de exportação de dados do usuário
- [ ] Fluxo de exclusão de conta/dados
- [ ] Consentimento documentado no cadastro/RSVP

---

## Fase 2 — Operação estável (P1)

### Realtime e escala
- [ ] Substituir SSE in-process por provider distribuído (Supabase Realtime / Ably / Pusher)
- [ ] Testar mural/telão com 2+ instâncias Vercel

### Email
- [ ] Resend: domínio verificado (SPF, DKIM, DMARC)
- [ ] Email de confirmação de conta
- [ ] Recuperação de senha testada em prod
- [ ] Notificações RSVP (opcional no lançamento)

### Observabilidade
- [ ] Sentry (ou equivalente) integrado no código
- [ ] Alertas para erros 5xx e falhas de webhook
- [ ] Logs de auditoria revisáveis

### Admin plataforma
- [ ] Painel `/admin` com métricas reais (usuários, eventos, storage)
- [ ] Busca de usuário/evento para suporte
- [ ] Visualização de audit logs globais

### Produto prometido
- [ ] Subdomínio customizado: UI + persistência + middleware DNS
- [ ] Perfil `/eu` conectado ao usuário autenticado (dados reais)
- [ ] Criptografia real de chaves Pix

### Qualidade
- [x] GitHub Actions: `typecheck` + `build` em PR
- [ ] Rate limits em auth, upload e billing
- [ ] Turnstile/Captcha em formulários públicos sensíveis

---

## Fase 3 — Produto completo (P2)

### UX e código
- [ ] Renomear componentes `prototype-*` → produção
- [ ] Remover código morto (`event-experience.tsx`, `create-event-flow.tsx`)
- [ ] Remover `site*.jsx`, `_logo-temp/`, `prototype-temp/` do repo
- [ ] Atualizar `README.md` (status real do projeto)

### Features extras
- [ ] Upload offline / Background Sync (PWA)
- [ ] Thumbnails e processamento de vídeo
- [ ] Álbum impresso (pedido + checkout + fulfillment)
- [ ] Analytics real (GA4 / PostHog) substituindo `console.info`
- [ ] Deprecar pacote legado R$4,90 (`purchase-ai-cover-pack`) se não for mais usado

### Marketing honesto
- [ ] Revisar números fictícios (“12.487 famílias”)
- [ ] FAQ alinhado ao que está implementado

### Operações
- [ ] Backup automático Supabase + teste de restore
- [ ] Runbook de incidentes
- [ ] WAF Cloudflare ativo no domínio

---

## Testes manuais antes do lançamento

- [ ] Criar evento → gerar 1 convite IA → ver upsell → comprar Inspiração (Stripe test)
- [ ] Criar 2º evento → confirmar que versão grátis não repete
- [ ] Ativar Cápsula R$59 via Stripe → mural/telão/cápsula liberados
- [ ] Convidado RSVP → aceitar termos → links legais ok
- [ ] Upload foto no mural → aparece no telão
- [ ] Ampliar storage +5 GB via Stripe
- [ ] Cápsula Plus: 6 eventos, pool 10 versões IA distribuídas

---

## Variáveis de ambiente (produção)

Ver `.env.example` e `docs/production-readiness.md`. Mínimo:

`DATABASE_URL`, `SESSION_SECRET`, Supabase keys, R2 keys, Stripe keys + price IDs, `RESEND_API_KEY`, `OPENAI_API_KEY`, `APP_ENV=production`, `NEXT_PUBLIC_APP_URL`.
