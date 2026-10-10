# Vitamor — activation de la réception directe

Destination unique : https://docs.google.com/spreadsheets/d/1AsnEnuC38D3izEwHxuaRp4tV4zAufOGwKN_XtI9tBVI/edit

## Mise à jour Google nécessaire avant activation publique

1. Ouvrir le projet Apps Script existant **Vitamor — Test réception directe**.
2. Remplacer intégralement `Code.gs` par `direct-receiver.gs` de ce dossier, puis enregistrer.
3. Conserver la propriété existante `DIRECT_SHEET_SECRET`. Ne pas la recopier dans Git ou le chat.
4. **Déployer → Gérer les déploiements → Modifier (crayon) → Version : Nouvelle version → Déployer**. Modifier le déploiement existant conserve son URL `/exec`.
5. Ouvrir l'URL `/exec` : elle doit afficher `ok: true`, `service: vitamor-direct`, `receiver_version: 2`. Cela vérifie la version, pas encore une écriture.

## Vercel

Projet `vitamor`, domaine `vitamor-fruits.vercel.app`, dossier racine `vitamor`.
Production utilise uniquement `DIRECT_SHEET_URL` et `DIRECT_SHEET_SECRET` (Secret serveur). Le transport Make est retiré du gestionnaire de demandes. La version 2 du récepteur est obligatoire : aucun ancien acquittement ne confirme une commande.

## Vérification avant annonces

- Publier la version du site après mise à jour Google.
- Effectuer un POST fictif via `/api/consumer-lead`, puis contrôler la ligne dans le Sheet.
- Les numéros `0600000000` et `0700000000` restent marqués TEST, sans expédition et sans Lead publicitaire dans la page.
- Un événement rejoué retourne le même ID ; un événement différent avec le même téléphone dans les 3 jours retourne `duplicate_phone`.
- Le panier n'envoie pas de Lead. Seule une commande confirmée par le Sheet peut déclencher le Lead.
- Les anciens indicateurs locaux d'une commande prétendument enregistrée sont remplacés par des indicateurs v2.

## Fonctionnement et limites

Le verrou Apps Script sérialise les écritures. Les valeurs sont littérales, le téléphone reste du texte, les modifications manuelles du nom/adresse/ville sont préservées. Les paniers terminés ne sont pas rouverts par un ancien envoi du navigateur. Un nouvel achat du même téléphone est autorisé après 3 jours.

Le serveur réessaie une fois en cas d'erreur de transport/5xx/indisponibilité d'écriture, avec exactement le même événement signé. Il n'y a pas de file d'attente durable externe : une indisponibilité persistante est présentée comme un échec, jamais comme une commande reçue. Le parcours nécessite donc encore une vérification réelle après chaque changement du récepteur. La limitation par IP dans Vercel est par instance ; la déduplication du téléphone est durable dans le Sheet.

Aucun transfert vers l'ancien CRM ni vers le transporteur n'est activé ici.
