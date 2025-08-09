import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

// Passport Google Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.CHATBOT_BACKEND_URL}/auth/google/callback`,
        },
        (accessToken, refreshToken, profile, done) => {
            // Return user profile
            return done(null, profile);
        }
    )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
