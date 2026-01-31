# DevisPro - Application de Gestion de Devis

## Problème Original
Créer un site de création de devis permettant:
- Créer des devis professionnels au format PDF
- Envoyer les devis directement par email
- Gérer les prestations et les clients
- Suivre le statut des devis (envoyé, accepté, refusé)
- Convertir les devis en factures
- Gérer les acomptes sur les factures
- Tableau de bord avec statistiques
- Paramètres entreprise modifiables

## Architecture
- **Frontend**: React avec Tailwind CSS et Shadcn UI
- **Backend**: FastAPI avec MongoDB
- **PDF**: ReportLab pour génération PDF
- **Email**: SMTP IONOS (smtp.ionos.fr:465 SSL/TLS)
- **Auth**: JWT avec bcrypt

## User Personas
- **Freelance/Auto-entrepreneur**: Gestion simplifiée des devis clients
- **Petite entreprise**: Suivi complet du cycle devis → facture

## Fonctionnalités Implémentées ✅

### Authentification
- [x] Inscription/Connexion JWT
- [x] Gestion de session avec token

### Dashboard
- [x] Statistiques (total devis, envoyés, acceptés, refusés)
- [x] Chiffre d'affaires et taux de conversion
- [x] Nombre de clients et prestations
- [x] Actions rapides

### Gestion Clients
- [x] CRUD complet (création, lecture, modification, suppression)
- [x] Informations: nom, email, téléphone, adresse

### Gestion Prestations
- [x] CRUD complet
- [x] Prix HT, unité, taux TVA

### Création Devis
- [x] Éditeur avec aperçu temps réel format A4
- [x] Sélection client via dropdown ✅ (bug corrigé le 31/01/2026)
- [x] Ajout prestations depuis catalogue ou manuel
- [x] Date d'événement (mariage)
- [x] Remise personnalisable
- [x] Notes additionnelles

### Génération PDF
- [x] Format professionnel avec logo CREATIVINDUSTRY
- [x] Informations entreprise et client
- [x] Tableau des prestations
- [x] Détails TVA et récapitulatif
- [x] Coordonnées bancaires
- [x] Conditions de paiement

### Envoi Email
- [x] Configuration SMTP IONOS ✅ (mise à jour le 31/01/2026)
- [x] Email HTML professionnel
- [x] PDF en pièce jointe

### Factures
- [x] Conversion devis accepté → facture
- [x] Suivi statut (en attente, partiellement payée, payée, annulée)
- [x] Gestion des acomptes (ajout/suppression)
- [x] Historique des paiements
- [x] PDF facture avec détails paiements

### Paramètres Entreprise
- [x] Nom, adresse, email, téléphone
- [x] SIREN, numéro TVA
- [x] Coordonnées bancaires (IBAN, BIC)

## Corrections Bug - 31 Janvier 2026 ✅
- **Erreurs Frontend corrigées**: Suppression des erreurs `removeChild` et `ResizeObserver` qui bloquaient l'interface
- **Sélection client fonctionnelle**: Le dropdown de sélection client fonctionne correctement
- **Email IONOS**: Migration de SendGrid vers SMTP IONOS (smtp.ionos.fr:465)

## Configuration Email IONOS
```
SMTP_HOST=smtp.ionos.fr
SMTP_PORT=465
SMTP_EMAIL=infos@creativindustry.com
```

## Backlog

### P0 (Critique) - Terminé ✅
- [x] Auth JWT
- [x] CRUD Clients/Services/Devis
- [x] Génération PDF
- [x] Envoi email SMTP IONOS
- [x] Correction bug sélection client

### P1 (Important) - À faire
- [ ] Historique des envois d'email
- [ ] Rappel automatique devis expirés
- [ ] Export factures PDF avec acomptes (améliorations)

### P2 (Nice to have)
- [ ] Templates de devis personnalisables
- [ ] Multi-devises
- [ ] Import/Export données CSV
- [ ] Statistiques avancées

## API Endpoints

### Auth
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur courant

### Clients
- `GET /api/clients` - Liste des clients
- `POST /api/clients` - Créer client
- `PUT /api/clients/{id}` - Modifier client
- `DELETE /api/clients/{id}` - Supprimer client

### Services
- `GET /api/services` - Liste des prestations
- `POST /api/services` - Créer prestation
- `PUT /api/services/{id}` - Modifier prestation
- `DELETE /api/services/{id}` - Supprimer prestation

### Devis
- `GET /api/quotes` - Liste des devis
- `POST /api/quotes` - Créer devis
- `PUT /api/quotes/{id}` - Modifier devis
- `DELETE /api/quotes/{id}` - Supprimer devis
- `GET /api/quotes/{id}/pdf` - Télécharger PDF
- `POST /api/quotes/{id}/send` - Envoyer par email
- `POST /api/quotes/{id}/convert-to-invoice` - Convertir en facture

### Factures
- `GET /api/invoices` - Liste des factures
- `GET /api/invoices/{id}/pdf` - Télécharger PDF facture
- `PUT /api/invoices/{id}/status` - Modifier statut
- `POST /api/invoices/{id}/payment` - Ajouter acompte
- `DELETE /api/invoices/{id}/payment/{payment_id}` - Supprimer acompte

### Dashboard & Settings
- `GET /api/dashboard/stats` - Statistiques
- `GET /api/company` - Paramètres entreprise
- `PUT /api/company` - Modifier paramètres

## Date de création
31 janvier 2026

## Dernière mise à jour
31 janvier 2026 - Configuration SMTP IONOS + Correction bugs frontend
