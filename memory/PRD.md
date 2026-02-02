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
- **Email**: SMTP IONOS (smtp.ionos.fr:465 SSL/TLS) ✅
- **Auth**: JWT avec bcrypt
- **Déploiement**: VPS IONOS (creativindustry.com/devis) via Nginx + systemd

## Fonctionnalités Implémentées ✅

### Authentification
- [x] Inscription/Connexion JWT
- [x] Gestion de session avec token
- [x] **Réinitialisation mot de passe** (NEW - 1er Feb 2026)
  - Lien "Mot de passe oublié ?" sur la page de connexion
  - Email avec token de réinitialisation (expire 1h)
  - Page de définition du nouveau mot de passe

### Dashboard
- [x] Statistiques (total devis, envoyés, acceptés, refusés)
- [x] Chiffre d'affaires et taux de conversion
- [x] Actions rapides

### Gestion Clients
- [x] CRUD complet

### Gestion Prestations
- [x] CRUD complet avec prix HT, unité, TVA

### Création Devis
- [x] Éditeur avec aperçu temps réel format A4
- [x] Sélection client via dropdown ✅
- [x] Date d'événement (mariage)
- [x] Remise personnalisable

### Génération PDF
- [x] Format professionnel avec logo CREATIVINDUSTRY
- [x] Informations entreprise et client
- [x] Coordonnées bancaires

### Envoi Email ✅ TESTÉ ET FONCTIONNEL
- [x] Configuration SMTP IONOS (smtp.ionos.fr:465)
- [x] Email: infos@creativindustry.com
- [x] Email HTML professionnel avec PDF en pièce jointe
- [x] Messages d'erreur explicites si adresse invalide

### Factures
- [x] Conversion devis → facture
- [x] Gestion des acomptes
- [x] PDF facture avec détails paiements

### Paramètres Entreprise
- [x] Infos société et bancaires modifiables

## Configuration Email IONOS
```
SMTP_HOST=smtp.ionos.fr
SMTP_PORT=465
SMTP_EMAIL=infos@creativindustry.com
SMTP_PASSWORD=Soleil13...
```

## Corrections - 31 Janvier 2026 ✅
- **Email IONOS fonctionnel** - Testé et validé avec envoi réel
- **Erreurs frontend corrigées** - removeChild/ResizeObserver
- **Sélection client fonctionnelle**

## Backlog

### P1 (Important)
- [ ] Rappel automatique devis expirés
- [ ] Historique des envois d'email
- [ ] Vérifier le logo étiré dans les PDF (fix tenté mais non vérifié)

### P2 (Nice to have)
- [ ] Templates de devis personnalisables
- [ ] Multi-devises
- [ ] Import/Export CSV

## Instructions de Déploiement VPS
Après modification du code:
```bash
# Sur le VPS via SSH
cd /var/www/devis
git pull
cd frontend && npm run build
sudo systemctl restart devis-api
```

## Dernière mise à jour
1er février 2026 - Réinitialisation mot de passe implémentée ✅
