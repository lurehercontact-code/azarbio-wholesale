# Vitamor consumer landing page

This directory is a standalone Vercel project for the consumer `Offre Famille` page. Its homepage (`/`) and `/offre-famille` both serve the consumer landing page; the wholesale site remains in the repository root.

## Vercel project setup

Create a Vercel project named `vitamor` from this Git repository and set **Root Directory** to `vitamor`. Deploy production, then check both `https://vitamor.vercel.app/` and `https://vitamor.vercel.app/offre-famille`.

Before accepting live orders, configure the `MAKE_WEBHOOK_URL` Production environment variable with the same active Make webhook used by the existing consumer order flow. The consumer API returns a configuration error if this variable is missing. Keep the webhook secret in Vercel Environment Variables; do not commit it here.
