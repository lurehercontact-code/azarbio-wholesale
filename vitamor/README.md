# Vitamor — réception directe ThannaTech

Le projet Vercel **vitamor**, domaine `vitamor-fruits.vercel.app`, utilise le dossier `vitamor` de ce dépôt et la branche `codex/vitamor-consumer-project`.

## Flux actuel

Navigateur → `/api/consumer-lead` sur Vercel → `/api/intake` sur Cloudflare → D1.
Le navigateur ne reçoit aucune clé CRM. Les commandes et paniers contactables sont envoyés directement à ThannaTech. Le chemin actif ne transmet plus les commandes à Google Sheets ou Make. Les anciens fichiers Apps Script et leurs tests sont conservés comme historique; ils ne sont plus appelés par le handler.

## Configuration Vercel (production, côté serveur)

- `THANNATECH_CRM_URL`: `https://vitamor-azarbio-crm.vitamor-azarbio.workers.dev/api/intake`
- `THANNATECH_CRM_SOURCE`: `site-vitamor-vercel`
- `THANNATECH_CRM_TOKEN`: secret stocké dans Vercel; seul son SHA-256 est stocké dans `sources` du CRM.

Aucune valeur de secret dans Git, le HTML, les logs ou les variables publiques. Ne pas donner les identifiants de production aux previews.

## Contrat et règles

- Identifiant événement stable, conservé dans sessionStorage; même événement pour le panier et la commande.
- `500G` = 500 g / 199 DH; `1KG` = 1 000 g / 299 DH; `2KG_PLUS_500G` = 2 500 g / 499 DH. Livraison 0 DH, comme la page actuelle.
- Le CRM recalcule les prix et quantités depuis son catalogue; un prix envoyé par le navigateur ne fait pas autorité.
- État initial `Nouveau`; stock réservé seulement après confirmation dans le CRM.
- Un panier devient une commande avec le même identifiant; un ancien événement panier ne réouvre pas une commande.
- Répéter un événement ne crée pas de doublon. Pour cette source, une autre commande en cours avec le même téléphone et la même marque dans les 72 heures est refusée avec `duplicate_phone`. Les annulations, livraisons terminées et suppressions test ne bloquent pas cette règle.
- La page de remerciement, le cookie de blocage et le Lead ne se déclenchent qu’après un accusé CRM valide. Les entrées portant le mot test sont exclues du Lead navigateur.
- Deux tentatives serveur bornées, avec le même payload. Si le CRM n’accuse pas réception, le formulaire reste disponible et affiche une erreur; aucune réussite fictive. L’identifiant est réutilisé lors d’une nouvelle tentative. Les captures panier se relancent lors des événements online/pageshow.
- UTM, identifiants/noms campagne et publicité, vidéo, page d’entrée, référent et navigateur sont transmis lorsqu’ils sont disponibles.

## Tests

`node --test vitamor/tests/*.test.mjs` depuis la racine. Les tests CRM correspondants se trouvent dans le dépôt `cod-crm-cloudflare`. Vérifier aussi le formulaire mobile avec une commande clairement marquée TEST, puis vérifier son identifiant dans D1.
