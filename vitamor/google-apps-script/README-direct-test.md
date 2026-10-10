# Vitamor — isolated Google Sheets receiver test

Destination: https://docs.google.com/spreadsheets/d/1AsnEnuC38D3izEwHxuaRp4tV4zAufOGwKN_XtI9tBVI/edit

Current state: the spreadsheet exists. Local tests pass. Apps Script has **not** been deployed or authorized, Vercel connection secrets have **not** been set, and no live HTTP write has been verified. The existing consumer endpoint and CRM are unchanged.

## Activate the isolated receiver

1. In the new test sheet, choose Extensions → Apps Script.
2. Replace the default source with `direct-test-receiver.gs` and save.
3. Run `initializeDirectTest` once. Review and approve Google's Sheets permission prompt yourself. The code writes exclusively to the test sheet ID above and does not access the existing CRM.
4. Project settings → Script properties: copy the generated `DIRECT_SHEET_SECRET` **directly** into the Vitamor Vercel project's sensitive environment variable `DIRECT_SHEET_TEST_SECRET`. Do not paste the secret in chat, source code, the spreadsheet, or execution logs.
5. Deploy → New deployment → Web app. Execute as the owner; access Anyone. The public endpoint accepts writes only with a valid HMAC signature and a timestamp within five minutes. It never returns customer fields or spreadsheet contents. Review the new access before deploying.
6. Put the deployment URL ending in `/exec` in Vitamor's `DIRECT_SHEET_TEST_URL` environment variable for the test deployment environment. Keep the secret in that same environment. A project deployment is needed after configuring environment variables.

## HTTP acceptance checklist — required before CRM switch

1. Visit `/test-reception.html` on the deployment containing this change. There are no Meta/GA4 events on this test page.
2. Save a phone-only cart with fictional `0600000000`, empty name/city/address: one row must appear in Abandonnés with an `ok:true` HTTP response.
3. Fill the name and city and submit another abandoned snapshot: the same row must update; no duplicate.
4. Edit name, city, address, and status in the Sheet manually; send another snapshot. Manual changes must remain.
5. Submit a complete order: one Commandes row with `Nouveau`; default abandoned status changes to `Envoyé`, while a manually changed status stays unchanged.
6. Repeat the complete order without creating a new identifier: the same ID is returned with `duplicate:true`, and the row count stays unchanged.
7. Send a late abandoned snapshot: it must not reopen the completed cart.
8. Verify wrong signatures, missing configuration, invalid phone, incomplete order, and Google write failure cannot yield success.
9. Check literal phone text with leading zero, status colors, editable customer fields, chronological append position, and no formulas in customer fields.

Only the two fictional numbers `0600000000` and `0700000000` are accepted by this first deployment. Real traffic requires a separate reviewed change after these tests pass. Migrating the CRM, production forms, historic data, ad tracking, and Make's waiting queue is outside this isolated test change.

## Limitations

Sheets and Apps Script still have technical quotas and can fail. This is not a durable queue or an unlimited database. The test receiver uses a script lock to serialize writes. Reads scan only used rows; scaling and indexing must be reviewed before adopting it for high volume. Multi-tab writes are not transactional; a stable event ID makes a final-order retry safe after a partial write. A persisted copy of the pending customer submission and an explicit retry policy should be added before live deployment.

## Local validation

`node --test vitamor/tests/direct-sheet.test.mjs vitamor/tests/direct-test-api.test.mjs`

These are local mocked tests, not proof of Google deployment or HTTP connectivity.
