# Hosting Guide for MatchMe

This guide explains how to host the MatchMe application in a production environment (e.g., a Linux VPS like DigitalOcean, AWS EC2, or Linode).

## Prerequisites

- **Server:** A Linux server (Ubuntu 20.04/22.04 recommended).
- **Domain Name:** A domain pointing to your server's IP address (e.g., `matchme.example.com`).
- **Software:**
  - Node.js (v18+)
  - PostgreSQL (v14+)
  - Nginx (Web Server & Reverse Proxy)
  - PM2 (Process Manager for Node.js)

## 1. Server Setup

### Install Dependencies
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2
```

### Configure Database
```bash
# Login to PostgreSQL
sudo -u postgres psql

# Run SQL commands
CREATE DATABASE matchme_prod;
CREATE USER matchme_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE matchme_prod TO matchme_user;
\q
```

## 2. Backend Deployment

1.  **Clone/Copy Code:** Upload your code to the server (e.g., `/var/www/matchme`).
2.  **Install Dependencies:**
    ```bash
    cd /var/www/matchme/backend
    npm install --production
    ```
3.  **Configure Environment:**
    Create a `.env` file in the `backend` directory:
    ```env
    DATABASE_URL="postgresql://matchme_user:secure_password@localhost:5432/matchme_prod"
    JWT_SECRET="complex_random_secret_string"
    PORT=3001
    NODE_ENV=production
    ```
4.  **Run Migrations:**
    ```bash
    npx prisma migrate deploy
    ```
5.  **Start with PM2:**
    ```bash
    pm2 start src/index.js --name "matchme-backend"
    pm2 save
    pm2 startup
    ```

## 3. Frontend Deployment

1.  **Configure API URL:**
    Edit `frontend/src/config.ts` **before building**:
    ```typescript
    export const API_HOST = "matchme.example.com"; // Your domain
    export const API_PORT = ""; // Leave empty if using standard ports (80/443) via Nginx
    export const FRONTEND_PORT = ""; // Leave empty

    // If using Nginx reverse proxy (recommended):
    export const BASE_URL = `https://${API_HOST}`;
    export const API_URL = `${BASE_URL}/api`;
    export const SOCKET_URL = BASE_URL;
    ```
2.  **Build the App:**
    ```bash
    cd /var/www/matchme/frontend
    npm install
    npm run build
    ```
    This creates a `dist` folder containing the static files.

## 4. Nginx Configuration

Create a new Nginx configuration file:
`sudo nano /etc/nginx/sites-available/matchme`

```nginx
server {
    listen 80;
    server_name matchme.example.com;

    # Serve Frontend (Static Files)
    location / {
        root /var/www/matchme/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API Requests to Backend
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy Socket.IO (Real-time Chat)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/matchme /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 5. SSL (HTTPS)

Secure your site with a free Let's Encrypt certificate:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d matchme.example.com
```

Your application is now live and secure!
