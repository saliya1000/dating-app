## Getting Started

### Requirements
- Node.js 22.x (recommended) with npm 10.x
- PostgreSQL database configured for Prisma (`DATABASE_URL` inside `backend/.env`)

### Backend (API @ http://localhost:3000)
```bash
cd web/backend
npm install         # first time only
npx nodemon src/index.js
```

### Frontend (Vite dev server @ http://localhost:5173)
```bash
cd web/frontend
npm install         # first time only
npm run dev
```

> Keep both terminals running while developing. The React app (port 5173) proxies API calls to the Express server (port 3000).

## API Reference (current routes)

| Feature                 | Method | Endpoint             |
| ----------------------- | ------ | -------------------- |
| Register                | POST   | `/api/auth/register` |
| Login                   | POST   | `/api/auth/login`    |
| Get my profile          | GET    | `/api/users/me`      |
| Update profile          | PATCH  | `/api/users/me`      |
| Get my interests        | GET    | `/api/users/me/bio`  |
| Update interests        | PATCH  | `/api/users/me/bio`  |
| Send connection request | POST   | `/api/connections`   |
| Accept request          | PATCH  | `/api/connections/:id/accept`  |
| Reject request          | PATCH  | `/api/connections/:id/reject`  |
| Get my connections      | GET    | `/api/connections`   |
| Get recommendations     | GET    | `/api/recommendations` |

## Legacy quick reference (original notes)

To run backend server  
go to path `web>backend`  
then Run `npx nodemon src/index.js`  
backend server will run under `http://localhost:3000`

| Feature                 | Method | Endpoint                                |
| ----------------------- | ------ | --------------------------------------- |
| Register                | POST   | `/api/auth/register`                    |
| Login                   | POST   | `/api/auth/login`                       |
| Get my profile          | GET    | `/api/users/me`                         |
| Update profile          | PATCH  | `/api/users/me`                         |
| Get my interests        | GET    | `/api/users/me/bio`                     |
| Update interests        | PATCH  | `/api/users/me/bio`                     |
| Send connection request | POST   | `/api/connections/request/:recipientId` |
| Accept request          | POST   | `/api/connections/accept/:requesterId`  |
| Reject request          | POST   | `/api/connections/reject/:requesterId`  |
| Get my connections      | GET    | `/api/connections/my`                   |
| Get recommendations     | GET    | `/api/recommendations`                  |

These Endpoint Must work now