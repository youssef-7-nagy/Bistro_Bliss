const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { User } = require("../models/User");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const path = require("path");

if (process.env.NODE_ENV === "production") {
  require("dotenv").config({ path: path.resolve(__dirname, "../.env.production") });
}
require("dotenv").config();

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const prodBackendUrl = "https://bistro-bliss-three.vercel.app";

let callbackURL = process.env.GOOGLE_CALLBACK_URL;

if (isProduction) {
  // In production / Vercel, ensure the callback URL is strictly production and never localhost
  if (!callbackURL || callbackURL.includes("localhost") || callbackURL.includes("127.0.0.1")) {
    callbackURL = vercelHost
      ? `https://${vercelHost}/auth/google/callback`
      : `${prodBackendUrl}/auth/google/callback`;
  }
} else {
  callbackURL = callbackURL || "http://localhost:8080/auth/google/callback";
}

if (clientID && clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email =
            profile.emails && profile.emails[0]
              ? profile.emails[0].value.toLowerCase().trim()
              : null;

          if (!email) {
            return done(new Error("No email found from Google account"), null);
          }

          let user = await User.findOne({
            $or: [{ googleId: profile.id }, { email }],
          });

          if (!user) {
            const generatedPassword = crypto.randomBytes(16).toString("hex");
            const hashedPassword = await bcrypt.hash(generatedPassword, 12);

            user = await User.create({
              name: profile.displayName || "Google User",
              email,
              password: hashedPassword,
              googleId: profile.id,
            });
          } else if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn("⚠️ Google OAuth credentials not found in environment variables.");
}

module.exports = passport;
