# MatchMe - Social Connection Platform

A modern, full-stack web application for connecting people based on shared interests and proximity. Built with React, Node.js, Express, Prisma, and PostgreSQL.

## 🌟 Features

### User Features
- **User Authentication**: Secure registration and login with JWT-based authentication
- **Profile Management**: Create and customize user profiles with bio, interests, and profile pictures
- **Smart Recommendations**: AI-powered matching algorithm based on:
  - Shared interests (up to 3 interests)
  - Music preferences
  - Hobbies
  - Geographic proximity (with configurable max distance)
- **Connection System**: 
  - Send connection requests
  - Accept/reject incoming requests
  - View all connections (pending and accepted)
  - Disconnect from users
- **Real-time Chat**: 
  - Live messaging with Socket.IO
  - Online/offline status indicators
  - Typing indicators
  - Message history with pagination
  - Unread message counts
- **User Discovery**: Browse recommended matches with compatibility scores
- **Responsive Design**: Fully responsive UI that works seamlessly on mobile, tablet, and desktop

### Admin Features
- **Admin Dashboard**: Comprehensive overview of platform statistics
- **User Management**: 
  - View all users
  - Ban/unban users
  - Activate/deactivate accounts
  - Delete users
  - Search and filter users
- **Report Management**:
  - Review user reports
  - Take action on reported users
  - Track report status (pending, resolved, dismissed)
- **Platform Analytics**: Real-time statistics on users, connections, and activity

## 🛠️ Tech Stack

### Frontend
- **React** (v19.2.0) - UI framework
- **TypeScript** - Type safety
- **React Router** (v7.9.6) - Client-side routing
- **Socket.IO Client** (v4.8.1) - Real-time communication
- **Vite** (v7.2.2) - Build tool and dev server

### Backend
- **Node.js** - Runtime environment
- **Express** (v5.1.0) - Web framework
- **Prisma** (v4.16.2) - ORM and database toolkit
- **PostgreSQL** - Database
- **Socket.IO** (v4.8.1) - WebSocket server
- **JWT** (v9.0.2) - Authentication
- **bcrypt** (v6.0.0) - Password hashing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **PostgreSQL** (v12 or higher)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd web
```

### 2. Database Setup

#### Create PostgreSQL Database
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE matchme;

# Create user (optional, or use existing user)
CREATE USER saliya WITH PASSWORD 'mypassword';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE matchme TO saliya;

# Exit psql
\q
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL="postgresql://saliya:mypassword@localhost:5432/matchme"
JWT_SECRET="your-secret-key-here"
EOF

# Run Prisma migrations
npx prisma migrate dev

# Seed the database with sample data
node prisma/seed_admin.js        # Creates admin account
node prisma/seed_comprehensive.js # Creates 500 sample users with connections

# Start the backend server
npm start
```

The backend server will start on `http://localhost:3000`

### 4. Frontend Setup

```bash
# Open a new terminal
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:5173`

## 🎮 Usage

### Default Accounts

After seeding the database, you can use these accounts:

#### Admin Account
- **Email**: `admin@example.com`
- **Password**: `admin123`

#### Regular User Accounts
- **Email**: `casey1@example.com` / **Password**: `password123`
- **Email**: `river2@example.com` / **Password**: `password123`
- **Email**: `cameron83@example.com` / **Password**: `password123`

All seeded users have the password: `password123`

### Getting Started

1. **Register/Login**: Create a new account or use one of the test accounts
2. **Complete Profile**: Add your bio, interests, music preferences, and hobbies
3. **Set Location**: Allow location access or manually set your coordinates
4. **Browse Recommendations**: View personalized match suggestions
5. **Connect**: Send connection requests to users you're interested in
6. **Chat**: Once connected, start chatting in real-time
7. **Admin Panel**: Login with admin credentials to access the admin dashboard

## 📁 Project Structure

```
web/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   ├── migrations/            # Database migrations
│   │   ├── seed_admin.js          # Admin account seeder
│   │   └── seed_comprehensive.js  # Sample data seeder
│   ├── src/
│   │   ├── index.js               # Server entry point
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT authentication
│   │   │   └── admin.js           # Admin authorization
│   │   └── routes/
│   │       ├── auth.js            # Authentication routes
│   │       ├── users.js           # User management
│   │       ├── connections.js     # Connection management
│   │       ├── recommendations.js # Match recommendations
│   │       ├── chat.js            # Chat endpoints
│   │       ├── admin.js           # Admin routes
│   │       └── reports.js         # User reports
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.tsx                # Main app component
    │   ├── App.css                # Global styles
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Register.tsx
    │   │   ├── Profile.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── Recommendations.tsx
    │   │   ├── Connections.tsx
    │   │   ├── Chat.tsx
    │   │   ├── AdminDashboard.tsx
    │   │   ├── AdminUsers.tsx
    │   │   └── AdminReports.tsx
    │   ├── components/
    │   │   └── OnlineIndicator.tsx
    │   └── utils/
    │       ├── api.ts             # API client
    │       └── constants.ts       # App constants
    └── package.json
```

## 🔧 Available Scripts

### Backend
```bash
npm start          # Start backend server with nodemon (auto-reload)
npm test           # Run tests (not configured yet)
```

### Frontend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

### Database
```bash
npx prisma migrate dev     # Create and apply migrations
npx prisma studio          # Open Prisma Studio (database GUI)
npx prisma generate        # Generate Prisma Client
node prisma/seed_admin.js  # Seed admin account
node prisma/seed_comprehensive.js  # Seed sample data
```

## 🔐 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/matchme"
JWT_SECRET="your-secret-key-here"
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update profile
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/me/bio` - Get user interests
- `PATCH /api/users/me/bio` - Update interests

### Connections
- `GET /api/connections` - Get all connections
- `POST /api/connections` - Send connection request
- `PATCH /api/connections/:id/accept` - Accept request
- `PATCH /api/connections/:id/reject` - Reject request
- `DELETE /api/connections/:id` - Delete connection

### Recommendations
- `GET /api/recommendations` - Get match recommendations

### Chat
- `GET /api/chat/:connectionId` - Get chat history
- `POST /api/chat/:connectionId/read` - Mark messages as read

### Admin (Requires admin role)
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/:id/ban` - Ban/unban user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/reports` - Get all reports
- `PATCH /api/admin/reports/:id` - Update report status

## 🎨 Features in Detail

### Matching Algorithm
The recommendation system scores users based on:
- **Interest Match** (3 points max): 1 point for each matching interest
- **Music Match** (1 point): Shared music preference
- **Hobby Match** (1 point): Shared hobby
- **Total Score**: 0-5 points

Users are filtered by:
- Not already connected
- Not dismissed
- Within max distance (if set)
- Active and not banned

### Real-time Features
- **Online Status**: See who's online in real-time
- **Typing Indicators**: Know when someone is typing
- **Live Notifications**: Instant alerts for new messages and connection requests
- **Auto-sync**: Connection list updates automatically

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Adaptive Layout**: Chat interface switches between list/chat view on mobile
- **Touch-Friendly**: Large tap targets and smooth interactions
- **Cross-Browser**: Works on all modern browsers

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Restart PostgreSQL
sudo service postgresql restart

# Verify database exists
psql -U postgres -c "\l"
```

### Port Already in Use
```bash
# Kill process on port 3000 (backend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Prisma Issues
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Regenerate Prisma Client
npx prisma generate
```

## 📝 License

This project is licensed under the ISC License.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by popular social networking platforms
- Designed for learning and demonstration purposes