# BrandTide - Full Stack Setup Guide

## 📚 Overview

BrandTide is a full-stack sentiment analysis platform with:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB
- **Authentication**: Local auth + Google OAuth 2.0
- **Features**: AI sentiment classification, dashboard analytics, batch processing

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- Git

### 1. Clone & Install

```powershell
# Clone repository
git clone <your-repo-url>
cd project-root

# Install frontend dependencies
cd brandtide
npm install

# Install backend dependencies
cd ..
cd server
npm install
```

### 2. Configure Environment

**Backend (.env)**
```powershell
cd server
cp .env.example .env
```

Edit `..\server\.env`:
```env
MONGODB_URI=mongodb://localhost:27017/brandtide
JWT_SECRET=generate_a_strong_random_secret_here
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_secret
CLIENT_URL=http://localhost:5173
```

**Frontend (.env)**
```powershell
cd ..
cd brandtide
cp .env.example .env
```

Edit `brandtide/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start MongoDB

```powershell
# Start MongoDB service
mongod
```

### 4. Seed Database

```powershell
cd server
npm run seed
```

This creates:
- Demo user: `demo@brandtide.com` / `demo123`
- 150 sample reviews
- Products, insights, highlights

### 5. Run Development Servers

**Terminal 1 - Backend:**
```powershell
cd server
npm run dev
```
Backend runs on `http://localhost:5000`

**Terminal 2 - Frontend:**
```powershell
cd brandtide
npm run dev
```
Frontend runs on `http://localhost:5173`

### 6. Access Application

Open browser: `http://localhost:5173`

**Demo Login:**
- Email: `demo@brandtide.com`
- Password: `demo123`

---

## 🏗️ Architecture

### Frontend Structure
```
src/
├── components/ui/     # Reusable UI components
├── pages/             # Route pages
├── services/          # API service layer
├── state/             # Auth context & state
├── lib/               # Utilities & mock data
└── shell/             # App layout & providers
```

### Backend Structure
```
server/src/
├── config/            # Environment & database config
├── controllers/       # Business logic
├── middlewares/       # Auth, validation, errors
├── models/            # MongoDB schemas
├── routes/            # API route definitions
└── scripts/           # Database seeders
```

---

## 🔐 Authentication Flow

### Local Registration/Login
1. User submits form on `/register` or `/login`
2. Frontend calls `POST /api/auth/register` or `/api/auth/login`
3. Backend validates, hashes password, creates/finds user
4. Returns JWT token + user data
5. Frontend stores in localStorage as `bt:user`
6. Token sent in `Authorization: Bearer <token>` header

### Google OAuth
1. User clicks "Continue with Google"
2. Frontend redirects to `GET /api/auth/google`
3. Backend redirects to Google OAuth consent
4. User authorizes
5. Google redirects to `GET /api/auth/google/callback`
6. Backend creates/finds user, generates JWT
7. Redirects to frontend with token in URL
8. Frontend extracts token, stores in localStorage

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout (protected)
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback

### Reviews & Classification
- `POST /api/reviews/classifier/single` - Classify one review
- `POST /api/reviews/classifier/batch` - Classify multiple reviews
- `POST /api/reviews` - Create review (protected)
- `GET /api/reviews` - Get user reviews (protected)

### Dashboard
- `GET /api/dashboard/metrics?days=30` - Get metrics (protected)
- `GET /api/dashboard/overview` - Get overview stats (protected)

---

## 🗄️ Database Collections

### users
- Authentication & profile data
- Password hashes (bcrypt)
- Google ID for OAuth users

### reviews
- User-submitted reviews
- Sentiment classification results
- Product associations
- Topics & metadata

### products
- Product catalog
- Brand associations

### insights
- AI-generated insights
- Trend analysis
- Impact assessment

### highlights
- Key review excerpts
- Positive/negative snippets

### reports
- Scheduled report configurations
- PDF generation settings

### dashboardmetrics
- Aggregated analytics
- Time-series data
- Top products/topics

---

## 🔧 Configuration Options

### Backend Rate Limiting
Edit `..\server\.env`:
```env
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100   # Max requests per window
```

### JWT Expiration
```env
JWT_EXPIRE=7d  # 7 days (can be: 1h, 30m, 90d, etc.)
```

### CORS Origins
Edit `server/src/index.js`:
```javascript
app.use(cors({
  origin: [config.clientUrl, 'https://yourdomain.com'],
  credentials: true
}))
```

---

## 🛠️ Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project "BrandTide"
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials
5. Add authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://localhost:5000`
6. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
7. Copy Client ID and Secret to `server/.env`

---

## 📦 Production Deployment

### Frontend (Vercel/Netlify)
```powershell
npm run build
```
Deploy `dist/` folder

Set environment variable:
- `VITE_API_URL=https://your-backend-url.com/api`

### Backend (Railway/Heroku/VPS)
```powershell
cd server
npm start
```

Set environment variables:
- `NODE_ENV=production`
- `MONGODB_URI=mongodb+srv://...`
- `CLIENT_URL=https://your-frontend-url.com`
- All other `.env` vars

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod`
- Check URI in `.env`
- For Atlas: whitelist your IP

### CORS Errors
- Verify `CLIENT_URL` in backend `.env`
- Check frontend API URL matches backend
- Clear browser cache

### Google OAuth Not Working
- Verify callback URL matches Google Console
- Check Client ID/Secret in `.env`
- Ensure redirect URIs are authorized

### JWT Token Invalid
- Check `JWT_SECRET` is set
- Token may be expired - re-login
- Verify Authorization header format

---

## 📄 Scripts Reference

### Frontend
```powershell
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
```

### Backend
```powershell
npm run dev          # Development with nodemon
npm start            # Production server
npm run seed         # Seed database
```

---

## 🔒 Security Best Practices

✅ **Implemented:**
- Password hashing (bcrypt)
- JWT authentication
- Input validation
- Rate limiting
- Helmet security headers
- CORS restrictions

⚠️ **For Production:**
- Use strong JWT_SECRET (64+ chars)
- Enable HTTPS only
- Set secure cookie flags
- Implement refresh tokens
- Add request logging
- Setup monitoring/alerts

---

## 📚 Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide Icons

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- Passport.js (OAuth)
- JWT
- bcryptjs

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

---

## 📞 Support

For issues or questions:
- Check troubleshooting guide
- Review API documentation
- Contact: team@brandtide.com

---

## 📜 License

MIT License - see LICENSE file

---

**Built with ❤️ by the BrandTide Team**
