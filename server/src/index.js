import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import config from './config/config.js'
import { connectDB } from './config/database.js'
import { configurePassport } from './config/passport.js'
import passport from 'passport'
import { errorHandler, notFound } from './middlewares/error.js'

// Import routes
import authRoutes from './routes/authRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import dataRoutes from './routes/dataRoutes.js'
import scheduleRoutes from './routes/scheduleRoutes.js'
import stripeRoutes from './routes/stripeRoutes.js'

const app = express()

// Connect to MongoDB
connectDB()

// Configure Passport
configurePassport()

// Security middleware
app.use(helmet())

// Compression middleware for faster responses
app.use(compression())

// CORS configuration
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
})
app.use('/api/', limiter)

// Stripe webhook route MUST be before express.json() — it needs the raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }))

// Body parser middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Initialize Passport
app.use(passport.initialize())

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'BrandTide API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/data', dataRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/stripe', stripeRoutes)

// 404 handler
app.use(notFound)

// Error handler (must be last)
app.use(errorHandler)

// Start server
const PORT = config.port
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║                                            ║
║        🌊 BrandTide API Server 🌊         ║
║                                            ║
║  Environment: ${config.nodeEnv.padEnd(28)}  ║
║  Port:        ${PORT.toString().padEnd(28)}  ║
║  Database:    MongoDB Connected            ║
║  Status:      ✅ Running                   ║
║                                            ║
╚════════════════════════════════════════════╝
  `)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err)
  // Close server & exit process
  process.exit(1)
})

export default app
