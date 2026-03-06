import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import User from '../models/User.js'
import config from '../config/config.js'

export const configurePassport = () => {
  // Serialize user
  passport.serializeUser((user, done) => {
    done(null, user.id)
  })
  
  // Deserialize user
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id)
      done(null, user)
    } catch (error) {
      done(error, null)
    }
  })
  
  // Google OAuth Strategy
  if (config.google.clientId && config.google.clientSecret) {
    console.log('✅ Configuring Google OAuth Strategy')
    passport.use('google',
      new GoogleStrategy(
        {
          clientID: config.google.clientId,
          clientSecret: config.google.clientSecret,
          callbackURL: config.google.callbackUrl
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user exists
            let user = await User.findOne({ googleId: profile.id })
            
            if (user) {
              // User exists, return user
              return done(null, user)
            }
            
            // Check if email exists
            const email = profile.emails[0].value
            user = await User.findByEmail(email)
            
            if (user) {
              // Link Google account to existing user
              user.googleId = profile.id
              user.authProvider = 'google'
              user.avatar = profile.photos[0]?.value || user.avatar
              await user.save()
              return done(null, user)
            }
            
            // Create new user
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: email,
              avatar: profile.photos[0]?.value,
              authProvider: 'google',
              isActive: true
            })
            
            done(null, user)
            
          } catch (error) {
            done(error, null)
          }
        }
      )
    )
  } else {
    console.log('⚠️ Google OAuth not configured - missing credentials')
  }
}

export default passport
