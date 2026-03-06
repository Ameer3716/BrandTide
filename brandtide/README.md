# BrandTide — AI-Powered Sentiment Analysis Platform

<div align="center">

![BrandTide Logo](https://via.placeholder.com/150x150/6366F1/FFFFFF?text=BrandTide)

**Transform Customer Reviews into Actionable Insights**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-green)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)

</div>

---

## 🌊 Overview

BrandTide is a comprehensive full-stack sentiment analysis platform designed to help businesses understand customer feedback at scale. Built as a Final Year Project, it combines cutting-edge NLP techniques with modern web technologies to deliver real-time sentiment insights.

### ✨ Key Features

- **🤖 AI Sentiment Analysis** - Classify reviews as Positive, Neutral, or Negative with confidence scores
- **📊 Interactive Dashboard** - Real-time metrics, charts, and trend visualization
- **📈 Advanced Insights** - Topic detection, trend tracking, and anomaly identification
- **💬 Highlight Extraction** - Automatic extraction of key review snippets
- **📄 Batch Processing** - Upload and analyze thousands of reviews via CSV
- **📋 Automated Reports** - Generate PDF reports with scheduling capabilities
- **🔐 Secure Authentication** - Local signup/login + Google OAuth 2.0
- **🎨 Modern UI** - Dark neon gradient theme with glassmorphism design

---

## 🏗️ Architecture

### Tech Stack

#### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router v6
- **CSV**: PapaParse
- **PDF**: jsPDF + html2canvas

#### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: Passport.js (Local + Google OAuth)
- **Security**: Helmet, bcrypt, JWT, rate-limiting
- **Validation**: Express Validator

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- MongoDB (local installation or MongoDB Atlas account)
- Git
- npm or yarn

### Installation

1. **Clone the repository**
```powershell
git clone <your-repo-url>
cd brandtide
```

2. **Install dependencies**
```powershell
# Frontend dependencies
cd brandtide
npm install

# Backend dependencies
cd ..
cd server
npm install
```

3. **Configure environment variables**

**Backend** (`../server/.env`):
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/brandtide
JWT_SECRET=your_secure_random_secret_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_secret
CLIENT_URL=http://localhost:5173
```

**Frontend** (`brandtide/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

4. **Start MongoDB**
```powershell
mongod
```

5. **Seed the database** (creates demo data)
```powershell
cd ..
cd server
npm run seed
```

6. **Launch the application**

**Option A: Use the launcher script (Windows)**
```powershell
cd brandtide
start-all.bat
```

**Option B: Manual start**

Terminal 1 - Backend:
```powershell
cd server
npm run dev
```

Terminal 2 - Frontend:
```powershell
cd brandtide
npm run dev
```

7. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health

### Demo Account
```
Email: demo@brandtide.com
Password: demo123
```

---

## 📁 Project Structure

```
project-root/
├── brandtide/                # Frontend application
│   ├── src/                  # Frontend source
│   ├── components/ui/        # Reusable UI components
│   ├── pages/                # Page components
│   │   ├── Landing.tsx       # Marketing landing page
│   │   ├── Dashboard.tsx     # Analytics dashboard
│   │   ├── Insights.tsx      # AI insights page
│   │   ├── Highlights.tsx    # Key snippets
│   │   ├── Classifier.tsx    # Single review classifier
│   │   ├── Batch.tsx         # CSV batch processing
│   │   ├── Reviews.tsx       # Reviews management
│   │   ├── Reports.tsx       # Report generation
│   │   ├── Login.tsx         # Login page
│   │   └── Register.tsx      # Registration page
│   ├── services/             # API service layer
│   ├── state/                # Global state management
│   ├── shell/                # App layout components
│   ├── lib/                  # Utilities & helpers
│   └── public/               # Static assets
│
└── server/                   # Backend application
    └── src/
        ├── config/           # Configuration
        │   ├── config.js     # Environment config
        │   ├── database.js   # MongoDB connection
        │   └── passport.js   # OAuth strategies
        ├── controllers/      # Request handlers
        │   ├── authController.js
        │   ├── reviewController.js
        │   └── dashboardController.js
        ├── middlewares/      # Express middlewares
        │   ├── auth.js       # JWT authentication
        │   ├── error.js      # Error handling
        │   └── validator.js  # Input validation
        ├── models/           # Mongoose schemas
        │   ├── User.js
        │   ├── Review.js
        │   ├── Product.js
        │   ├── Insight.js
        │   ├── Highlight.js
        │   ├── Report.js
        │   └── DashboardMetric.js
        ├── routes/           # API routes
        │   ├── authRoutes.js
        │   ├── reviewRoutes.js
        │   └── dashboardRoutes.js
        └── scripts/
            └── seed.js       # Database seeder
```

---

## 🔌 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Create new account | ❌ |
| POST | `/api/auth/login` | Login with credentials | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |
| POST | `/api/auth/logout` | Logout user | ✅ |
| GET | `/api/auth/google` | Initiate Google OAuth | ❌ |
| GET | `/api/auth/google/callback` | OAuth callback | ❌ |

### Review & Classification Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/reviews/classifier/single` | Classify one review | ✅ |
| POST | `/api/reviews/classifier/batch` | Classify multiple reviews | ✅ |
| POST | `/api/reviews` | Create review | ✅ |
| GET | `/api/reviews` | Get user reviews | ✅ |

### Dashboard Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/dashboard/metrics` | Get dashboard metrics | ✅ |
| GET | `/api/dashboard/overview` | Get overview statistics | ✅ |

---

## 🗄️ Database Schema

### Collections

- **users** - User accounts & authentication
- **reviews** - Review data with sentiment labels
- **products** - Product catalog
- **insights** - AI-generated insights
- **highlights** - Key review excerpts
- **reports** - Report configurations
- **dashboardmetrics** - Aggregated analytics

---

## 🎨 Features Showcase

### 1. Dashboard
- Real-time sentiment distribution (donut chart)
- Sentiment trends over time (line chart)
- Top products by review volume
- Key performance indicators

### 2. Insights
- Topic modeling & clustering
- Sentiment trend analysis
- Impact assessment (high/medium/low)
- Actionable recommendations

### 3. Highlights
- Automatic extraction of positive/negative snippets
- Frequency tracking
- Bookmarking capability

### 4. Classifier
- Single review classification
- Real-time confidence scoring
- Language detection

### 5. Batch Processing
- CSV upload & validation
- Preview before processing
- Bulk sentiment classification
- Export results

### 6. Reports
- PDF generation from dashboard
- Scheduled report delivery
- Custom date ranges
- Brand/product filtering

---

## 🔐 Security Features

✅ **Password Security**
- bcrypt hashing with salt rounds
- Minimum length validation

✅ **Authentication**
- JWT-based sessions
- Token expiration
- Secure token storage

✅ **API Protection**
- Rate limiting (100 req/15min)
- Helmet security headers
- CORS restrictions
- Input validation & sanitization

✅ **Authorization**
- Role-based access control
- Route protection middleware
- User-specific data isolation

---

## 🚢 Deployment

### Frontend (Vercel/Netlify)
```powershell
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Heroku/VPS)
```powershell
cd server
npm start
```

Set production environment variables and ensure MongoDB Atlas connection.

---

## 🛠️ Development

### Frontend Commands
```powershell
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview build
```

### Backend Commands
```powershell
npm run dev      # Start with nodemon
npm start        # Production server
npm run seed     # Seed database
```

---

## 📖 Documentation

- [Detailed Setup Guide](SETUP_GUIDE.md)
- [Google OAuth Setup Guide](SETUP_GUIDE.md#google-oauth-setup)

---

## 🐛 Troubleshooting

**MongoDB connection issues?**
- Ensure MongoDB is running
- Check connection string in `.env`
- Whitelist IP if using Atlas

**CORS errors?**
- Verify `CLIENT_URL` in backend `.env`
- Check API URL in frontend `.env`

**Authentication not working?**
- Ensure `JWT_SECRET` is set
- Check token format in requests
- Verify Google OAuth credentials

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed troubleshooting.

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 👥 Team

**Final Year Project Team**
- Waleed Ahmad - AI/ML Engineer
- Abdullah Cheema - AI/ML Engineer  
- Ameer Sultan - Web & AI Engineer

**Supervisor**: Dr. Qamar-uz-Zaman

---

## 🙏 Acknowledgments

- Built with passion as a Computer Science FYP
- Inspired by modern sentiment analysis research
- Designed for real-world business applications

---

## 📞 Support

For questions or issues:
- Check [SETUP_GUIDE.md](SETUP_GUIDE.md)
- Review API documentation
- Open an issue on GitHub

---

<div align="center">

**Built with ❤️ using React, Node.js, and MongoDB**

[⭐ Star this repo](https://github.com/Ameer3716/BrandTide) if you found it helpful!

</div>
