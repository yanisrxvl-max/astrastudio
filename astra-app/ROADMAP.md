# Roadmap — Astra Studio App

> Features post-lancement. À implémenter quand le business atteint 3+ clients actifs.
> Aucune de ces features n'est nécessaire au MVP.

## 1. Stripe Integration
- Paiement en ligne des devis (client clique "Accepter et payer" → Stripe Checkout)
- Paiement récurrent pour les abonnements mensuels (Stripe Subscriptions)
- Dashboard des revenus côté admin

## 2. Signatures électroniques
- Signature numérique des devis (canvas de signature ou DocuSign API)

## 3. Messagerie intégrée
- Chat interne admin ↔ client (Supabase Realtime)
- Remplace les emails pour la communication courante

## 4. Preview vidéo
- Lecteur vidéo intégré avec preview basse résolution (720p)
- Vidéo 4K reste téléchargeable, preview via service de transcoding
- Options : Mux ou Cloudflare Stream

## 5. Reporting automatisé
- Intégration APIs Instagram / TikTok pour stats des contenus publiés
- Génération automatique du reporting mensuel en PDF

## 6. Facturation
- Système de factures avec numérotation légale (pas juste des devis)
- Export comptable CSV pour l'expert-comptable

## 7. Calendrier
- Intégration Calendly depuis le portail client
- Vue calendrier côté admin (shootings, calls planifiés)
