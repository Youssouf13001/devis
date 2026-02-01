# Déploiement DevisPro sur VPS IONOS Ubuntu 22.04

## ÉTAPE 1 : Préparer le dossier sur le VPS

Connectez-vous en SSH à votre VPS et exécutez :

```bash
# Créer le dossier
sudo mkdir -p /var/www/devis
sudo chown -R $USER:$USER /var/www/devis
cd /var/www/devis
```

## ÉTAPE 2 : Transférer les fichiers

### Option A : Via GitHub (recommandé)
1. Sauvegardez d'abord sur GitHub via Emergent ("Save to GitHub")
2. Sur le VPS :
```bash
cd /var/www/devis
git clone https://github.com/VOTRE_USERNAME/VOTRE_REPO.git .
```

### Option B : Via SFTP
Utilisez FileZilla ou un autre client SFTP pour copier les dossiers `frontend` et `backend` vers `/var/www/devis/`

## ÉTAPE 3 : Configurer le Backend

```bash
cd /var/www/devis/backend

# Créer environnement virtuel Python
python3 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install --upgrade pip
pip install -r requirements.txt

# Créer le fichier .env
cat > .env << 'ENVEOF'
MONGO_URL="mongodb://localhost:27017"
DB_NAME="creativindustry_devis"
JWT_SECRET="creativindustry-devis-secret-2026-prod"
SMTP_HOST="smtp.ionos.fr"
SMTP_PORT=465
SMTP_EMAIL="infos@creativindustry.com"
SMTP_PASSWORD="Soleil13..."
ENVEOF

# Tester que ça fonctionne
python3 -c "from server import app; print('✅ Backend OK')"
```

## ÉTAPE 4 : Configurer le Frontend

```bash
cd /var/www/devis/frontend

# Créer le fichier .env pour la production
cat > .env << 'ENVEOF'
REACT_APP_BACKEND_URL=https://creativindustry.com/devis
ENVEOF

# Installer les dépendances et builder
npm install
npm run build

echo "✅ Frontend build terminé"
```

## ÉTAPE 5 : Créer le service systemd pour le backend

```bash
sudo tee /etc/systemd/system/devis-api.service << 'SERVICEEOF'
[Unit]
Description=CreativIndustry DevisPro API
After=network.target mongodb.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/devis/backend
Environment="PATH=/var/www/devis/backend/venv/bin"
ExecStart=/var/www/devis/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Donner les permissions
sudo chown -R www-data:www-data /var/www/devis

# Activer et démarrer le service
sudo systemctl daemon-reload
sudo systemctl enable devis-api
sudo systemctl start devis-api

# Vérifier que ça fonctionne
sudo systemctl status devis-api
curl http://localhost:8001/api/health
```

## ÉTAPE 6 : Configurer Nginx

Éditez votre fichier de configuration Nginx pour creativindustry.com :

```bash
sudo nano /etc/nginx/sites-available/creativindustry.com
```

Ajoutez ces lignes DANS le bloc `server { ... }` existant :

```nginx
    # ===== APPLICATION DEVIS =====
    
    # Frontend React (fichiers statiques)
    location /devis {
        alias /var/www/devis/frontend/build;
        index index.html;
        try_files $uri $uri/ /devis/index.html;
    }
    
    # Backend API
    location /devis/api/ {
        rewrite ^/devis/api/(.*) /api/$1 break;
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # ===== FIN APPLICATION DEVIS =====
```

Testez et rechargez Nginx :
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## ÉTAPE 7 : Tester

1. Testez l'API : `curl https://creativindustry.com/devis/api/health`
2. Ouvrez dans le navigateur : `https://creativindustry.com/devis`

## Commandes utiles

```bash
# Voir les logs du backend
sudo journalctl -u devis-api -f

# Redémarrer le backend
sudo systemctl restart devis-api

# Vérifier MongoDB
sudo systemctl status mongodb
```

## En cas de problème

1. Vérifiez les logs : `sudo journalctl -u devis-api -n 50`
2. Vérifiez Nginx : `sudo nginx -t`
3. Vérifiez les permissions : `ls -la /var/www/devis/`
