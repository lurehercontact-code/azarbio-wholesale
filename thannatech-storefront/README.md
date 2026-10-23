# Vitamor storefront and ThannaTech boutique admin

Prepared 2026-10-23 for the existing Cloudflare CRM. This module has NOT yet been deployed to the CRM: Desktop Commander was offline. The separate Vercel design preview never accepts real orders and uses presentation-only availability; it is not the live stock service.

## Included

- Arabic-first mobile storefront with cream/green identity, swipeable slider, categories, product details, gallery, product options, mixed cart, notes, server quote and COD checkout.
- Shared inventory with bundles resolved into gram/unit components; no opening stock or dispatch is created by storefront setup.
- Admin-only boutique management inside ThannaTech: draft/save/preview/publish/restore, prices scoped to the boutique, catalog, physical references, composed packs, images, mobile/desktop slides, sections, cities/shipping, real testimonials, policies, contact, promotion codes and analytics IDs.
- Quote/pricing validated by the server. Request receipts preserve the exact accepted payload and prices on retry. Customer fields and prices from the browser cannot override trusted configuration. Existing CRM order ingestion remains the durable order writer.
- Existing submitter blocking hooks, first-party signed visitor cookies, bounded media upload and role/brand restrictions. Draft previews use the standard authenticated CRM API, never a public preview token.
- First-party funnel events and CRM source totals. Browser analytics can be blocked/inflated and are not a guarantee of ad attribution or conversion rate.

## Verification completed

`npm test` in this packet: 10 tests pass using Node 24 and SQLite. They cover draft privacy/versioning, stale-write prevention, admin/brand permissions, store-only prices, bundle aggregate stock, coupons/shipping, signed visitor cookies, idempotent checkout retries, phone/cart input, composed offers, hidden data and cross-origin writes. Syntax checks passed for the changed modules.

Desktop design preview was tested through actual browser interactions: selecting 1 kg fruit plus two marshmallow sachets gives 437 MAD, with free delivery and disabled preview checkout.

The full 99-test CRM suite, real integration with submitter protection, signed-in browser testing, actual iPhone/Android checkout, and production deployment remain to run once the PC is connected. Do not represent the preview as a functioning live store.

## Integration when the PC is online

The last known CRM commit is `2e5c576`. Read `AGENTS.md` if one now exists; inspect current git status first. Do not overwrite newer edits.

1. From `C:\Users\pc\cod-crm-cloudflare`, run `node <packet-path>\install.mjs` to validate all integration anchors without editing.
2. Review, then run the same command with `--apply`. The script validates the entire plan before writing, and copies only the new module files plus five surgical integrations.
3. Run `npm test`, `npx wrangler deploy --dry-run` and meaningful signed-in/mobile browser checks. Verify the new trusted `storeOfferPrices` option cannot be supplied by public legacy intake/manual payloads.
4. Review migration status. Apply only the new `0017_storefront_admin.sql` migration after tests; it creates store configuration, version, media, event and receipt tables. No quantities, domain records, shipping parcels or customer messages are inserted.
5. Deploy the tested CRM. Admin → Gestion des boutiques → Vitamor → Créer la boutique. Edit the draft, upload actual images, configure policies and check stock. Use Prévisualiser, then Publier to the preparation path `/shop/vitamor`.
6. Visitor signing uses `STORE_VISITOR_SECRET` if configured, otherwise a purpose-separated HMAC key from the existing `SETUP_TOKEN`; no secret is exposed in the browser. Do not print or copy environment secrets.
7. Only after full acceptance: export and safely migrate Storeep data, verify domain/email DNS and redirects, then plan the vitamor.ma cutover and rollback. No DNS changes are included here.

## Important remaining checks

- No Storeep order export/import has been performed. No existing customer history has been imported into this module.
- Product ingredient/allergen/returns/privacy texts are merchant data to fill; no legal/fiscal or health compliance claim is made.
- Existing stock must be verified. Do not invent inventory or silently apply the previously rejected opening quantities.
- The design preview has checkout blocked at both UI and server; stock is presentation data only. Remove the Vercel preview adapter from a real storefront release and connect the actual Cloudflare service.
- Root serving for vitamor.ma, SEO redirects/canonicals, optional delivery-city catalog, tracking end-to-end and final performance/load validation are cutover tasks. The existing Storeep domain remains unchanged.

## Storage notes

The first version optimizes raster uploads to at most 300 KB and stores media in D1. This keeps setup simple; moving larger galleries or video hosting to R2 is a later optimization. Video fields accept an existing HTTPS video URL. No paid provider or subscription is enabled by this code.

## Store information update — 2026-10-23

Added editable Arabic about, delivery/payment, exchanges/returns, privacy, preservation/allergens, customer support and WhatsApp subscription-request pages, linked from the footer with shareable #info/<key> URLs. The subscription requires an unchecked affirmative consent and only prepares a WhatsApp message; the visitor must send it. There is no automatic mailing list enrollment or marketing transmission. Cookie choice can be reset from the footer.

Before real launch, complete verified seller legal identity (RC/ICE/address where applicable), CNDP declaration/authorization details and any cross-border processing formalities; never fabricate registration numbers. Validate actual ingredient labels and support procedures. Policies preserve statutory remedies; food is not universally excluded from withdrawal. No stock, existing customer or carrier data was modified.

Primary references reviewed: https://www.cndp.ma/conformite-des-sites-web/ and https://www.mcinet.gov.ma/sites/default/files/Guide%20du%20consommateur%20-%20FR.pdf (law 31-08).
