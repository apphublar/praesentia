/**
 * Cria produtos/preços no Stripe Dashboard.
 *
 * Test mode:
 *   npm run stripe:bootstrap-prices
 *
 * Live mode (produção):
 *   STRIPE_LIVE_SECRET_KEY=sk_live_... npm run stripe:bootstrap-prices:live
 *   Ou defina STRIPE_LIVE_SECRET_KEY em .env.local (não commitar).
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const liveMode = process.argv.includes("--live");
const secretKey = (liveMode ? process.env.STRIPE_LIVE_SECRET_KEY : process.env.STRIPE_SECRET_KEY)?.trim();

if (!secretKey) {
  console.error(
    liveMode
      ? "Defina STRIPE_LIVE_SECRET_KEY (sk_live_...) em .env.local ou no ambiente."
      : "Defina STRIPE_SECRET_KEY (sk_test_...) em .env.local ou no ambiente."
  );
  process.exit(1);
}
if (liveMode && !secretKey.startsWith("sk_live_")) {
  console.error("Live mode exige STRIPE_LIVE_SECRET_KEY com prefixo sk_live_.");
  process.exit(1);
}
if (!liveMode && !secretKey.startsWith("sk_test_")) {
  console.error("Test mode exige STRIPE_SECRET_KEY com prefixo sk_test_.");
  process.exit(1);
}

/** @type {import("stripe").default} */
const stripe = new Stripe(secretKey);

/** @type {Array<{ sku: string; env: string; name: string; amountBrl: number; recurring?: "year" }>} */
const CATALOG = [
  { sku: "capsule", env: "STRIPE_PRICE_CAPSULE", name: "Cápsula Praesentia", amountBrl: 59 },
  { sku: "plus_yearly", env: "STRIPE_PRICE_PLUS_YEARLY", name: "Cápsula Plus (anual)", amountBrl: 197, recurring: "year" },
  { sku: "storage_5gb", env: "STRIPE_PRICE_STORAGE_5GB", name: "Armazenamento extra +5 GB", amountBrl: 19 },
  { sku: "storage_10gb", env: "STRIPE_PRICE_STORAGE_10GB", name: "Armazenamento extra +10 GB", amountBrl: 29 },
  { sku: "storage_25gb", env: "STRIPE_PRICE_STORAGE_25GB", name: "Armazenamento extra +25 GB", amountBrl: 49 },
  { sku: "storage_50gb", env: "STRIPE_PRICE_STORAGE_50GB", name: "Armazenamento extra +50 GB", amountBrl: 89 },
  { sku: "ai_inspiracao", env: "STRIPE_PRICE_AI_INSPIRACAO", name: "Convite IA · Inspiração", amountBrl: 9.9 },
  { sku: "ai_criativo", env: "STRIPE_PRICE_AI_CRIATIVO", name: "Convite IA · Criativo", amountBrl: 29.9 }
];

async function findProductBySku(sku) {
  const products = await stripe.products.search({
    query: `metadata['praesentia_sku']:'${sku}'`,
    limit: 1
  });
  return products.data[0] ?? null;
}

async function ensurePrice(productId, item) {
  const amount = Math.round(item.amountBrl * 100);
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 20 });
  const match = prices.data.find((p) => {
    if (p.currency !== "brl" || p.unit_amount !== amount) return false;
    if (item.recurring) return p.recurring?.interval === item.recurring;
    return !p.recurring;
  });
  if (match) return match;

  return stripe.prices.create({
    product: productId,
    currency: "brl",
    unit_amount: amount,
    ...(item.recurring ? { recurring: { interval: item.recurring } } : {})
  });
}

async function ensureCatalogItem(item) {
  let product = await findProductBySku(item.sku);
  if (!product) {
    product = await stripe.products.create({
      name: item.name,
      metadata: { praesentia_sku: item.sku }
    });
    console.log(`+ produto: ${item.name}`);
  } else {
    console.log(`= produto existente: ${item.name}`);
  }

  const price = await ensurePrice(product.id, item);
  return { env: item.env, priceId: price.id };
}

console.log(`Bootstrap Stripe (${liveMode ? "LIVE" : "test"} mode) — Praesentia\n`);

const envLines = [];
for (const item of CATALOG) {
  const { env, priceId } = await ensureCatalogItem(item);
  envLines.push(`${env}=${priceId}`);
  console.log(`  ${env} → ${priceId}`);
}

console.log("\nCopie para Vercel (Production):\n");
console.log(envLines.join("\n"));
if (liveMode) {
  console.log("\nWebhook produção:");
  console.log("  https://praesentia.com.br/api/billing/webhook/stripe");
  console.log("  eventos: checkout.session.completed + checkout.session.async_payment_succeeded");
} else {
  console.log("\nWebhook local (Stripe CLI):");
  console.log("  stripe listen --forward-to localhost:3000/api/billing/webhook/stripe");
  console.log("  → copie whsec_... para STRIPE_WEBHOOK_SECRET\n");
  console.log("Publishable key: Developers → API keys → pk_test_... → NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
}
