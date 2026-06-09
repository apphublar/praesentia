# OpenAI — Convites com IA

A Praesentia usa a API da OpenAI para gerar **textos** e **imagens** dos convites.

## Variáveis de ambiente

```env
OPENAI_API_KEY=sk-...
OPENAI_TEXT_MODEL=gpt-4o-mini
OPENAI_IMAGE_MODEL=gpt-image-2
```

Configure `OPENAI_API_KEY` no `.env.local` (desenvolvimento) e nas **Environment Variables** da Vercel (produção).

## O que cada modelo faz

| Recurso | Modelo | Endpoint |
|---------|--------|----------|
| Texto do convite (headline, mensagem, WhatsApp, hashtags) | `gpt-4o-mini` | `POST /api/events/:eventId/generate-invite-text` |
| Imagem vertical do convite | `gpt-image-2` (mais recente) | `POST /api/events/:eventId/generate-cover` |

> **Modelo padrão:** `gpt-image-2` — sucessor do DALL-E 3 e da família `gpt-image-1`, com melhor qualidade e seguimento de instruções. Formato vertical: `1024x1536`, qualidade `high`. Para usar o legado, defina `OPENAI_IMAGE_MODEL=dall-e-3`.

## Limites por plano

| Plano | Texto | Imagem |
|-------|-------|--------|
| Gratuito | 1 geração, sem ajustes | 1 geração, sem ajustes |
| Cápsula / Plus | 1 geração + 3 ajustes | 2 versões + 3 ajustes |

## Persistência das imagens

URLs da DALL-E expiram em cerca de 1 hora. O app baixa a imagem e:

1. Envia para **Cloudflare R2** (se configurado) — recomendado em produção
2. Ou salva como **data URL** no banco (fallback em desenvolvimento)

## Migração Supabase

Após `001-plan-flow.sql`, rode também:

```
docs/migrations/002-invite-ai.sql
```

## Painel do organizador

Em `/dashboard/eventos/[id]`:

1. **Texto do convite** — gera e copia mensagem para WhatsApp
2. **Imagem do convite** — gera capa vertical para Stories/WhatsApp
