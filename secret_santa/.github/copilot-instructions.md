# Secret Santa - AI Assistant Instructions

## Project Overview
A full-stack Secret Santa gift exchange application built with the MERN stack (MongoDB, Express.js, React, Node.js). Users can register, verify their email, participate in Secret Santa draws, create wishlists, and chat with their assigned recipients.

---

## Tech Stack

### Backend (Server)
- **Framework:** Express.js (Node.js)
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens) with HTTP-only cookies
- **Email:** Nodemailer with Gmail SMTP
- **Validation:** express-validator
- **Security:** bcryptjs for password hashing, helmet, cors
- **File Upload:** Multer (for avatars/images)

### Frontend (Client)
- **Framework:** React 18 with Vite
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **State Management:** React Context API (AuthContext)
- **Styling:** Bootstrap 5 + Custom CSS
- **Icons:** Font Awesome

---

## Project Structure

```
secret_santa/
├── server/                          # Backend API
│   ├── config/
│   │   └── db.js                   # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js       # Auth logic (register, login, verify, etc.)
│   │   ├── wishlistController.js   # Wishlist CRUD
│   │   ├── villageController.js    # Village/group management
│   │   ├── chatController.js       # Real-time chat
│   │   └── childController.js      # Child profiles
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification & role-based access
│   │   ├── error.js                # Centralized error handler
│   │   └── validate.js             # express-validator error formatter
│   ├── models/
│   │   ├── User.js                 # User schema (auth, profile)
│   │   ├── Wishlist.js             # Wishlist items
│   │   ├── Village.js              # Secret Santa groups
│   │   ├── Chat.js                 # Chat messages
│   │   └── Child.js                # Child profiles
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth/* endpoints
│   │   ├── wishlistRoutes.js       # /api/wishlist/* endpoints
│   │   ├── villageRoutes.js        # /api/village/* endpoints
│   │   ├── chatRoutes.js           # /api/chat/* endpoints
│   │   └── childRoutes.js          # /api/children/* endpoints
│   ├── utils/
│   │   ├── asyncHandler.js         # Async error wrapper
│   │   ├── AppError.js             # Custom error class
│   │   └── sendEmail.js            # Email service (Nodemailer)
│   ├── validators/
│   │   └── authValidators.js       # Input validation schemas
│   ├── public/
│   │   └── avatars/                # Uploaded user avatars
│   ├── index.js                    # Server entry point
│   ├── .env                        # Environment variables
│   └── package.json
│
├── src/                             # Frontend React app
│   ├── components/                 # Reusable components
│   ├── context/
│   │   ├── AuthContext.jsx         # Authentication state provider
│   │   └── useAuth.js              # Auth context hook
│   ├── Pages/
│   │   ├── LoginPage.jsx           # Login form
│   │   ├── SignupPage.jsx          # Registration form
│   │   ├── Dashboard.jsx           # User dashboard
│   │   └── ...                     # Other pages
│   ├── services/
│   │   └── authService.js          # Axios API client
│   ├── styles/                     # CSS files
│   ├── App.jsx                     # Main app component & routes
│   ├── main.jsx                    # React entry point
│   └── package.json
│
└── package.json                     # Root workspace config
```

---

## Core Features

### 1. Authentication System
- **Registration:** Email verification required
- **Login:** JWT-based with HTTP-only cookies
- **Email Verification:** Token-based (1-hour expiry)
- **Password Reset:** Email-based token reset
- **Protected Routes:** JWT middleware on backend, AuthContext on frontend

### 2. Error Handling (IMPORTANT!)
We use a **centralized error handling system**:

#### Backend Error Flow:
```javascript
// 1. Controllers throw AppError
throw new AppError('Email already exists', 400);

// 2. asyncHandler catches async errors
exports.register = asyncHandler(async (req, res, next) => {
  // Your code here
});

// 3. Centralized error middleware formats response
// In middleware/error.js
{
  success: false,
  error: "User-friendly error message",
  stack: "..." // Only in development
}
```

#### Frontend Error Display:
```javascript
// LoginPage.jsx shows verification messages from URL params
?verified=success → Green success alert
?verified=error → Red error alert
```

### 3. Email Verification Flow
```
1. User registers → Backend creates user with isVerified: false
2. Email sent with link: http://localhost:5000/api/auth/verify-email/{token}
3. User clicks link → Backend GET request
4. Backend verifies token → Sets isVerified: true
5. Backend redirects → http://localhost:5173/login?verified=success
6. Login page shows success message
```

### 4. API Architecture
- **Base URL:** `http://localhost:5000/api`
- **Authentication:** JWT in Authorization header: `Bearer {token}`
- **Response Format:**
  ```json
  {
    "success": true,
    "data": {...} or "message": "..."
  }
  ```
- **Error Format:**
  ```json
  {
    "success": false,
    "error": "Error message"
  }
  ```

---

## Environment Variables

### Backend (.env)
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/secret_santa

# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=Secret Santa <noreply@secretsanta.com>
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:5000/api
```

---

## Key Conventions

### 1. Validation
- Use **express-validator** for input validation
- Define validation rules in `validators/authValidators.js`
- Use centralized `validate` middleware
- Show **first error per field** (user-friendly)

### 2. Error Handling
- **Always use `asyncHandler`** for async functions
- **Throw `AppError`** for operational errors
- **Never use try-catch** in controllers (asyncHandler does it)
- **Status codes:**
  - 200: Success
  - 201: Created
  - 400: Bad Request (validation errors)
  - 401: Unauthorized (auth errors)
  - 404: Not Found
  - 500: Server Error

### 3. Authentication
- **Protected routes** use `protect` middleware
- **Token stored in:** localStorage (frontend) + HTTP-only cookie (backend)
- **Token format:** `Bearer {token}` in Authorization header
- **Axios interceptor** automatically adds token to requests

### 4. Database Queries
```javascript
// Case-insensitive email search
email: { $regex: new RegExp(`^${email}$`, 'i') }

// Find with multiple conditions
$or: [{ email }, { username }]

// Date comparison
verificationExpires: { $gt: Date.now() }
```

### 5. Password Handling
```javascript
// In User model
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
```

---

## Common Issues & Solutions

### Issue: "Email verified but user still shows isVerified: false"
**Solution:** 
- Check if `verifyEmail` controller has `await user.save()`
- Verify token hasn't expired (1-hour limit)
- Check MongoDB that verificationToken matches email link

### Issue: "Instant redirect to login on verify link"
**Solution:**
- Email link should go to **backend**: `http://localhost:5000/api/auth/verify-email/{token}`
- **NOT frontend**: `http://localhost:5173/verify-email/{token}`
- Remove frontend verify route from App.jsx

### Issue: "CORS errors"
**Solution:**
- Ensure `CLIENT_URL=http://localhost:5173` in .env
- Check CORS config in `server/index.js` includes your frontend URL

### Issue: "Token expired" errors
**Solution:**
- Verification token expires in 1 hour
- For testing, increase in authController.js:
  ```javascript
  verificationExpires: Date.now() + 86400000 // 24 hours
  ```

---

## Testing Endpoints

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@test.com",
    "password": "Test123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@test.com",
    "password": "Test123"
  }'
```

### Get Current User (Protected)
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Development Workflow

### Starting the Project
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd ..
npm run dev

# MongoDB should be running on localhost:27017
```

### Code Style
- **Use async/await** (not callbacks or .then())
- **ES6 modules** on frontend (import/export)
- **CommonJS** on backend (require/module.exports)
- **Consistent naming:**
  - Controllers: `someController.js`
  - Routes: `someRoutes.js`
  - Models: `SomeModel.js` (PascalCase)
  - Components: `SomePage.jsx` (PascalCase)

### Git Workflow (if applicable)
- Main branch: `main`
- Feature branches: `feature/auth-system`
- Commit format: `feat: add email verification`

---

## Important Notes for AI Assistance

1. **Always use the new error handling system:**
   - `asyncHandler` wrapper
   - `throw new AppError(message, statusCode)`
   - Never manual try-catch in controllers

2. **Email verification flow is critical:**
   - Link must go to backend API, not frontend
   - Backend redirects to login with query params
   - Login page reads query params and shows message

3. **When suggesting code changes:**
   - Show full file path in comments
   - Use `// ...existing code...` for unchanged parts
   - Test with fresh user registration (old tokens may be expired)

4. **Security considerations:**
   - Never expose JWT_SECRET
   - Always validate user input
   - Use parameterized queries (Mongoose does this)
   - Hash passwords before storing

5. **Common debugging steps:**
   - Check server console logs
   - Check browser console & Network tab
   - Verify .env variables are loaded
   - Check MongoDB data directly
   - Restart server after .env changes

---

## Current Known Issues
- None at the moment (project is functional)

## Next Features to Implement
- Real-time chat notifications
- Image upload for wishlist items
- Secret Santa draw algorithm
- Email reminders for events
- Admin dashboard

---

## Contact & Resources
- MongoDB Compass: GUI for database inspection
- Postman/Hoppscotch: API testing
- React DevTools: Component inspection
- Gmail App Passwords: For email functionality

---

**Last Updated:** December 2024
**Project Status:** In active development
**Current Focus:** Authentication & Email Verification System