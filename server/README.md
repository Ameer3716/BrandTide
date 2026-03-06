# BrandTide Backend API

Express.js backend server for BrandTide sentiment analysis platform with MongoDB and Google OAuth.

## 🚀 Features

- **Authentication & Authorization**
  - Local authentication (email/password)
  - Google OAuth 2.0 integration
  - JWT-based session management
  - Role-based access control

- **Sentiment Analysis**
  - Single review classification
  - Batch processing for CSV uploads
  - Confidence scoring
  - Multi-language support

- **Data Management**
  - User reviews storage
  - Product catalog
  - Insights generation
  - Highlights extraction
  - Dashboard metrics aggregation

- **Security**
  - Helmet.js security headers
  - Rate limiting
  - CORS configuration
  - Input validation
  - Password hashing with bcrypt

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Google OAuth credentials (optional, for Google sign-in)

## 🛠️ Installation

1. **Navigate to server directory**
```powershell
cd server
```

2. **Install dependencies**
```powershell
npm install
```

3. **Configure environment variables**
```powershell
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/brandtide
JWT_SECRET=your_secret_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIENT_URL=http://localhost:5173
```

4. **Start MongoDB** (if running locally)
```powershell
mongod
```

5. **Seed database with demo data**
```powershell
npm run seed
```

6. **Start development server**
```powershell
npm run dev
```

Server will start at `http://localhost:5000`

## 📁 Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── config.js           # Environment configuration
│   │   ├── database.js         # MongoDB connection
│   │   └── passport.js         # Passport OAuth strategies
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── reviewController.js # Review & classification
│   │   └── dashboardController.js # Dashboard metrics
│   ├── middlewares/
│   │   ├── auth.js             # JWT authentication
│   │   ├── error.js            # Error handling
│   │   └── validator.js        # Input validation
│   ├── models/
│   │   ├── User.js             # User schema
│   │   ├── Review.js           # Review schema
│   │   ├── Product.js          # Product schema
│   │   ├── Insight.js          # Insight schema
│   │   ├── Highlight.js        # Highlight schema
│   │   ├── Report.js           # Report schema
│   │   └── DashboardMetric.js  # Metrics schema
│   ├── routes/
│   │   ├── authRoutes.js       # Auth endpoints
│   │   ├── reviewRoutes.js     # Review endpoints
│   │   └── dashboardRoutes.js  # Dashboard endpoints
│   ├── scripts/
│   │   └── seed.js             # Database seeder
│   └── index.js                # App entry point
├── .env.example
├── .gitignore
└── package.json
```

## 🔑 API Endpoints

### Authentication
```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login user
GET    /api/auth/me                # Get current user
POST   /api/auth/logout            # Logout user
GET    /api/auth/google            # Initiate Google OAuth
GET    /api/auth/google/callback   # Google OAuth callback
```

### Reviews & Classification
```
POST   /api/reviews/classifier/single  # Classify single review
POST   /api/reviews/classifier/batch   # Classify batch reviews
POST   /api/reviews                     # Create review
GET    /api/reviews                     # Get user reviews
```

### Dashboard
```
GET    /api/dashboard/metrics     # Get dashboard metrics
GET    /api/dashboard/overview    # Get overview stats
```

### Health Check
```
GET    /health                     # Server health status
```

## 🔐 Authentication Flow

### Local Authentication
1. Register: `POST /api/auth/register`
2. Login: `POST /api/auth/login`
3. Receive JWT token
4. Include token in requests: `Authorization: Bearer <token>`

### Google OAuth
1. Frontend redirects to: `GET /api/auth/google`
2. User authenticates with Google
3. Callback: `GET /api/auth/google/callback`
4. Redirect to frontend with token
5. Frontend stores token and makes authenticated requests

## 📊 Database Schema

### Users
- Basic profile info (name, email, avatar)
- Authentication (password hash, Google ID)
- Role-based access

### Reviews
- User-submitted reviews
- Sentiment classification results
- Product associations
- Timestamps and metadata

### Products
- Product catalog
- Brand associations
- Categories

### Insights
- AI-generated insights
- Trend analysis
- Impact assessment

### Highlights
- Key review snippets
- Positive/negative highlights
- Frequency tracking

## 🧪 Demo Account

After running the seed script:
```
Email: demo@brandtide.com
Password: demo123
```

## 🚦 Scripts

```powershell
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm run seed     # Seed database with demo data
```

## 🔒 Security Features

- **Helmet**: Sets security HTTP headers
- **Rate Limiting**: Prevents abuse (100 requests per 15 minutes)
- **CORS**: Configured for frontend origin only
- **Input Validation**: Express-validator for request validation
- **Password Hashing**: bcrypt with salt rounds
- **JWT**: Secure token-based authentication

## 🌐 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/brandtide` |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRE` | Token expiration | `7d` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | - |
| `CLIENT_URL` | Frontend URL | `http://localhost:5173` |

## 🐛 Troubleshooting

**MongoDB Connection Error**
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network access if using Atlas

**Google OAuth Not Working**
- Verify credentials in `.env`
- Check authorized redirect URIs in Google Console
- Ensure Client URL matches frontend

**JWT Token Issues**
- Check JWT_SECRET is set
- Verify token format: `Bearer <token>`
- Check token expiration

## 📄 License

MIT

## 👥 Authors

BrandTide Team - Final Year Project
