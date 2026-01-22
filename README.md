# MatchMe - Social Connection Platform

MatchMe is a modern, full-stack web application designed to connect people based on shared interests, hobbies, and geographic proximity. It features real-time chat, smart recommendations, and a comprehensive admin dashboard.

## 🌟 Key Features

### For Users
*   **Smart Matching**: AI-powered recommendation algorithm based on shared interests, music, hobbies, and location.
*   **Real-time Chat**: Instant messaging with online status, typing indicators, and read receipts.
*   **Profile Management**: Customizable profiles with bios, interests, and profile pictures.
*   **Connection System**: Send, accept, and reject connection requests.
*   **Location-Based**: Find matches within your preferred distance.
*   **Responsive Design**: Seamless experience across mobile, tablet, and desktop devices.

### For Admins
*   **Dashboard**: Overview of platform statistics and user activity.
*   **User Management**: Search, ban, disable, or delete users.
*   **Report System**: Review and take action on user reports.

## 🧠 Recommendation Algorithm

MatchMe uses a smart scoring system to find the best connections for you:

1.  **Filtering**: We first exclude users who are:
    *   Outside your preferred maximum distance.
    *   Already connected with you or have a pending request.
    *   Inactive, banned, or have incomplete profiles.

2.  **Scoring**: We calculate a compatibility score for each remaining user:
    *   **+2 points** for each match with your *explicit preferences* (Preferred Interest, Music, Hobby).
    *   **+1 point** for each direct match with your *own profile details* (e.g., you both like "Hiking").

3.  **Ranking**: Users are sorted by their total compatibility score, and the top 10 matches are recommended to you.

## 🛠️ Tech Stack

*   **Frontend**: React, TypeScript, Vite, Socket.IO Client
*   **Backend**: Node.js, Express, Socket.IO
*   **Database**: PostgreSQL, Prisma ORM
*   **Authentication**: JWT (JSON Web Tokens)

## API Documentation

Here are the key API endpoints available in the backend:

### Authentication
*   `POST /api/auth/register` - Register a new user
*   `POST /api/auth/login` - Login and receive a JWT token

### Users
*   `GET /api/users/me` - Get current user's profile
*   `PATCH /api/users/me` - Update profile details
*   `GET /api/users/:id/profile` - Get full profile of a user
*   `GET /api/users/me/bio` - Get current user's bio and interests
*   `PATCH /api/users/me/bio` - Update bio and interests
*   `GET /api/users/:id/bio` - Get bio of a specific user

### Connections
*   `GET /api/connections` - Get list of connection IDs
*   `POST /api/connections` - Send a connection request
*   `PATCH /api/connections/:id/accept` - Accept a connection request

### Recommendations
*   `GET /api/recommendations` - Get list of recommended user IDs

### Chat
*   `GET /api/chat/:connectionId` - Get chat history for a connection

## 🚀 Getting Started

Follow these steps to get the project running on your local machine.

### Prerequisites
*   Node.js (v16 or higher)
*   PostgreSQL (v12 or higher)
*   Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd web
```

### 2. Database Setup
You need to create a PostgreSQL database and user.

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Run the following SQL commands:
CREATE USER saliya WITH PASSWORD 'mypassword';
CREATE DATABASE matchme OWNER saliya;
GRANT ALL PRIVILEGES ON DATABASE matchme TO saliya;
\q
```

### 3. Backend Setup
The backend includes a pre-configured `.env` file for your convenience.

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Seed the database with test data (Admin & Users)
node prisma/seed_admin.js
node prisma/seed_comprehensive.js

# Start the backend server
npm start
```
The backend will run on `http://localhost:3000`.

### 4. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
The frontend will run on `http://localhost:5173`.

## 🎮 How to Use

### Login Credentials
We have pre-seeded the database with the following accounts for testing:

**Admin Account:**
*   **Email**: `admin@example.com`
*   **Password**: `admin123`

**Test User Accounts:**
*   **User 1**: `casey1@example.com` / `password123`
*   **User 2**: `river2@example.com` / `password123`
*   **User 3**: `cameron83@example.com` / `password123`

### Typical Workflow
1.  **Login** with one of the test user accounts.
2.  **Explore** the Dashboard to see your stats and top recommendations.
3.  **Edit Profile** to update your interests and location.
4.  **Connect** with other users from the Recommendations page.
5.  **Chat** with connected users in real-time.
6.  **Login as Admin** to view platform stats and manage users.

## 📁 Project Structure

```
web/
├── backend/
│   ├── prisma/          # Database schema and seeds
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── middleware/  # Auth and validation
│   │   └── index.js     # Server entry point
│   └── .env             # Environment variables (Included for review)
│
└── frontend/
    ├── src/
    │   ├── pages/       # Application pages
    │   ├── components/  # Reusable UI components
    │   └── utils/       # API helpers and types
    └── vite.config.ts   # Vite configuration
```