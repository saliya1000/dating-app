# Deployment Instructions

## Prerequisites
- A VPS (Virtual Private Server) running Linux (Ubuntu recommended).
- [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/) installed on the VPS.

## Setup Steps

1. **Clone the Repository**
   SSH into your VPS and clone your repository:
   ```bash
   git clone <your-repo-url>
   cd <your-repo-name>
   ```

2. **Configure Environment Variables**
   You can customize the environment variables in `docker-compose.yml` or create a `.env` file in the same directory:
   ```env
   POSTGRES_USER=myuser
   POSTGRES_PASSWORD=mypassword
   POSTGRES_DB=mydb
   JWT_SECRET=mysecuresecret
   ```

3. **Deploy**
   Run the following command to build and start the containers:
   ```bash
   docker compose up -d --build
   ```

4. **Verify**
   - Access your application at `http://<your-vps-ip>`.
   - The backend API is available at `http://<your-vps-ip>:3000`.

## Updating the Application
To deploy changes, pull the latest code and restart the containers:
```bash
git pull
docker compose up -d --build
```
