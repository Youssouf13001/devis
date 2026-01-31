# DevisPro - Application de Gestion de Devis

## Problème Original
Créer un site de création de devis permettant:
- Créer des devis professionnels au format PDF
- Envoyer les devis directement par email (SendGrid)
- Gérer les prestations et les clients
- Suivre le statut des devis (envoyé, accepté, refusé)
- Convertir les devis en factures
- Tableau de bord avec statistiques
- Paramètres entreprise modifiables

## Architecture
- **Frontend**: React avec Tailwind CSS et Shadcn UI
- **Backend**: FastAPI avec MongoDB
- **PDF**: ReportLab pour génération PDF
- **Email**: SendGrid pour envoi automatique
- **Auth**: JWT avec bcrypt

## User Personas
- **Freelance/Auto-entrepreneur**: Gestion simplifiée des devis clients
- **Petite entreprise**: Suivi complet du cycle devis → facture

## Fonctionnalités Implémentées ✅
1. **Authentification** - Inscription/Connexion JWT
2. **Dashboard** - Statistiques (devis, CA, taux conversion)
3. **Gestion Clients** - CRUD complet
4. **Gestion Prestations** - CRUD complet avec prix HT et TVA
5. **Création Devis** - Éditeur avec aperçu temps réel format A4
6. **Génération PDF** - Format professionnel avec infos entreprise
7. **Envoi Email** - SendGrid avec PDF en pièce jointe
8. **Suivi Statut** - Brouillon, Envoyé, Accepté, Refusé
9. **Conversion Facture** - Devis accepté → Facture
10. **Paramètres Entreprise** - Infos société et bancaires modifiables

## Backlog
### P0 (Critique) - Terminé
- [x] Auth JWT
- [x] CRUD Clients/Services/Devis
- [x] Génération PDF
- [x] Envoi email

### P1 (Important)
- [ ] Export factures PDF
- [ ] Historique des envois
- [ ] Rappel automatique devis expirés

### P2 (Nice to have)
- [ ] Templates de devis personnalisables
- [ ] Multi-devises
- [ ] Import/Export données CSV

## Date de création
31 janvier 2026
