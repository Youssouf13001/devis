# Guide de Déploiement sur VPS IONOS

## Architecture de l'application
- **Frontend** : React (port 3000)
- **Backend** : FastAPI Python (port 8001)
- **Base de données** : MongoDB

## Prérequis sur votre VPS

### 1. Installer les dépendances
```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Installer Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Installer Python 3.10+
sudo apt install -y python3 python3-pip python3-venv

# Installer MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Installer Nginx (si pas déjà installé)
sudo apt install -y nginx
```

### 2. Copier les fichiers de l'application
Créez le dossier pour l'application :
```bash
sudo mkdir -p /var/www/devis
cd /var/www/devis
```

Copiez les dossiers `frontend` et `backend` depuis GitHub ou via SFTP.

### 3. Configuration du Backend

```bash
cd /var/www/devis/backend

# Créer environnement virtuel
python3 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier .env
cat > .env << 'ENVEOF'
MONGO_URL="mongodb://localhost:27017"
DB_NAME="devis_database"
JWT_SECRET="votre-cle-secrete-production-changez-ceci"
SMTP_HOST="smtp.ionos.fr"
SMTP_PORT=465
SMTP_EMAIL="infos@creativindustry.com"
SMTP_PASSWORD="Soleil13..."
ENVEOF
```

### 4. Configuration du Frontend

```bash
cd /var/www/devis/frontend

# Installer les dépendances
npm install

# Créer le fichier .env
cat > .env << 'ENVEOF'
REACT_APP_BACKEND_URL=https://creativindustry.com/devis
ENVEOF

# Build pour production
npm run build
```

### 5. Service Systemd pour le Backend

Créer `/etc/systemd/system/devis-backend.service` :
```ini
[Unit]
Description=DevisPro Backend API
After=network.target mongod.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/devis/backend
Environment="PATH=/var/www/devis/backend/venv/bin"
ExecStart=/var/www/devis/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
```

Activer le service :
```bash
sudo systemctl daemon-reload
sudo systemctl enable devis-backend
sudo systemctl start devis-backend
```

### 6. Configuration Nginx

Ajoutez ceci à votre configuration Nginx existante (dans le bloc server de creativindustry.com) :

```nginx
# Application Devis - /devis
location /devis {
    alias /var/www/devis/frontend/build;
    try_files $uri $uri/ /devis/index.html;
}

# API Backend - /devis/api
location /devis/api {
    rewrite ^/devis/api/(.*) /api/$1 break;
    proxy_pass http://127.0.0.1:8001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

Redémarrer Nginx :
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Vérification

1. Vérifier que MongoDB fonctionne : `sudo systemctl status mongod`
2. Vérifier que le backend fonctionne : `sudo systemctl status devis-backend`
3. Tester l'API : `curl http://localhost:8001/api/health`
4. Accéder à l'application : https://creativindustry.com/devis

## Résumé des ports
- MongoDB : 27017 (local uniquement)
- Backend API : 8001 (local uniquement, via Nginx)
- Frontend : servi par Nginx (fichiers statiques)

## Maintenance
```bash
# Voir les logs du backend
sudo journalctl -u devis-backend -f

# Redémarrer le backend
sudo systemctl restart devis-backend

# Mettre à jour l'application
cd /var/www/devis
# Copier les nouveaux fichiers...
sudo systemctl restart devis-backend
cd frontend && npm run build
```
