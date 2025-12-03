# Copilot Instructions for Secret Santa Codebase

## Project Overview
Secret Santa is a full-stack web application (React + Express + MongoDB) for managing anonymous gift exchanges. Key features include user authentication, chat rooms with optional anonymity, wishlist management, and child profile management.

**Tech Stack:**
- **Frontend:** React 19 + Vite + React Router v7 (ES modules)
- **Backend:** Express 5.x + Node.js (CommonJS) + MongoDB + Mongoose 8.x
- **Auth:** JWT tokens (localStorage + Bearer headers) with email verification
- **Chat:** Encrypted AES-256-CBC messages with HMAC authentication

---

## Architecture Patterns

### Frontend Structure (`src/`)
- **Routes:** All defined in `App.jsx` — public routes (login, signup, password reset) and protected routes (dashboard, chat, wishlist)
- **Auth Flow:** `AuthContext.jsx` manages user state; `useAuth()` hook provides authentication methods
- **Protected Routes:** Wrapper at `Components/ProtectedRoute.jsx` checks `user` state before rendering
- **API Calls:** Centralized in `services/authService.js` using axios interceptors:
  - Attaches Bearer token from localStorage to all requests
  - Auto-redirects to `/login` on 401 (except auth check requests)
  - Base URL: `http://localhost:5000/api` (configurable via `VITE_API_URL`)

### Backend Structure (`server/`)
- **Entry Point:** `server/index.js` initializes Express, MongoDB, CORS, and mounts routes
- **Routes:** Organized by resource (`authRoutes`, `userRoutes`, `chatRoutes`, etc.)
- **Auth Middleware:** `middleware/auth.js` exports `protect` (JWT verification) and `authorize`/`adminOnly` (role-based access)
  - Accepts tokens in cookies OR `Authorization: Bearer <token>` header
  - Decodes token and sets `req.user.id` and `req.user.role`
- **Models:** Mongoose schemas in `models/` with pre-save hooks for password hashing (`bcryptjs`)

---

## Critical Developer Workflows

### Local Development
```bash
# Frontend (port 5173)
cd secret_santa && npm run dev

# Backend (port 5000)
cd server && npm run dev  # Uses nodemon for auto-reload
```

### Database & Email Setup
- **MongoDB:** Connection string in `server/.env` (MONGODB_URI)
- **Email Service:** Configure in `.env`: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`
- **Reset Database:** `node server/resetDb.js` (clears all data)
- **Test Email:** `node server/testEmail.js` (debug email configuration)
- **Generate Avatars:** `node server/scripts/generateAvatars.js` (populates local avatar options)

### Build & Deployment
- **Frontend Build:** `npm run build` → outputs to `build/` (Vite)
- **Linting:** `npm run lint` (ESLint, frontend only)
- **Backend Tests:** `npm test` in server directory (Jest)

---

## Key Patterns & Conventions

### Authentication & Tokens
- Tokens stored in **localStorage** (frontend) and sent as `Authorization: Bearer <token>` header
- Backend also sets **httpOnly cookies** for cookie-based clients
- JWT payload structure: `{ user: { id, role }, expiresIn: '7d' }`
- Email verification required before login; reset tokens expire in 1 hour

### Chat & Message Encryption
- **All chat messages encrypted** using AES-256-CBC (`Message.encryptText()`)
- **HMAC-SHA256 authentication** tag prevents tampering
- Encryption keys stored in `server/.env`: `CHAT_SECRET_KEY`, `CHAT_HMAC_KEY`
- **Anonymous mode:** Rooms toggle privacy; users get assigned anonymous names from `anonymousNamePool` array
- Messages decrypted on retrieval; failed decryption shows `[Message could not be decrypted]`

### User Models & Avatars
- **Avatar System:** Local avatars loaded from `public/avatars/avatars.json` at startup
- If avatars missing: warns to run `node server/scripts/generateAvatars.js`
- Fallback: empty string (frontend shows placeholder)
- **User Schema:** Includes `isVerified`, `role` (user/admin), password hashing pre-save hook

### Error Handling
- **Backend:** Global error middleware in `server/index.js` (last middleware) catches all errors
- **Frontend:** API interceptor in `authService.js` handles 401 errors; `try-catch` in components
- **Database Errors:** MongoDB connection retries every 5 seconds on failure; logs to console

---

## Integration Points & Data Flows

### Auth Flow
1. User submits login/signup → `authService.login()` POST to `/api/auth/login`
2. Backend validates credentials, hashes password (bcryptjs), returns JWT token
3. Frontend stores token in localStorage, sets `AuthContext.user`
4. Protected routes check `user` state via `useAuth()` hook
5. On logout: clear cookie (backend) + remove token (frontend) + reset context

### Chat Room Flow
1. User creates room: POST `/api/chat/create-room` (protected)
2. Room stored in MongoDB with organizer ID and participant list
3. Messages encrypted before storage; decrypted on fetch
4. Anonymous mode toggle: only organizer can change (authorization check)
5. Anonymous names mapped per user per room (stored as Map in ChatRoom model)

### Email Notifications
- Used in: password reset, email verification
- Sent via Nodemailer (SMTP configuration in `.env`)
- Templates: HTML strings in controller methods (e.g., `authController.forgotPassword`)

---

## Project-Specific Conventions

### File Naming
- React components: PascalCase (e.g., `Dashboard.jsx`, `ProfileCard.jsx`)
- Utility/service files: camelCase (e.g., `authService.js`, `sendEmail.js`)
- Models/controllers: PascalCase (e.g., `User.js`, `authController.js`)

### Code Style
- **Frontend:** ES modules (`import/export`); React hooks for state
- **Backend:** CommonJS (`require/module.exports`); middleware as exported functions
- **Async:** `async/await` for both frontend and backend
- **Validation:** Backend uses `express-validator`; frontend validates before submit

### Database Indexing
- Chat messages indexed by `roomId` and `createdAt` for efficient querying
- User email/username unique indexes prevent duplicates

---

## Common Tasks for AI Agents

### Adding a New Protected Route
1. Create component in `src/Pages/` or `src/Components/`
2. Add route to `src/App.jsx` wrapped in `<ProtectedRoute>`
3. Use `const { user } = useAuth()` to access authenticated user

### Adding a New API Endpoint
1. Create route file in `server/routes/`
2. Mount in `server/index.js` with `app.use('/api/<resource>', require(...))`
3. Use `protect` middleware for authentication
4. Return JSON with `{ success: true, data: ... }` or error messages

### Debugging Auth Issues
- Check `localStorage.getItem('token')` in DevTools Console
- Verify JWT secret in `server/.env` matches between auth and other routes
- Check CORS config in `server/index.js` for allowed origins
- Email verification: check database for `isVerified: true` on user doc

---

## Environment Variables Checklist

### Frontend (`src/` uses `import.meta.env`)
- `VITE_API_URL`: Backend API base URL (default: `http://localhost:5000/api`)

### Backend (`server/.env`)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for signing tokens
- `JWT_EXPIRE`, `JWT_COOKIE_EXPIRE`: Token expiration (default: 7 days)
- `CHAT_SECRET_KEY`, `CHAT_HMAC_KEY`: Message encryption keys (hex format)
- `CLIENT_URL`: Frontend URL for email links (e.g., password reset)
- `NODE_ENV`: 'development' or 'production'
- `EMAIL_*`: SMTP configuration (host, port, user, password, from)
- `PORT`: Server port (default: 5000)

---

## Notes for Maintainers
- No TypeScript currently; vanilla JS with ESLint
- PWA configured in `vite.config.js` (auto-updates service workers)
- Message encryption keys must be 32 bytes (64 hex chars); pad shorter keys with zeros
- Chat room anonymity is room-specific; same user has different anonymous names in different rooms
