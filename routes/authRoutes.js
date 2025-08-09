import express from 'express';
import passport from 'passport';
import User from '../models/User.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.get('/googlelogin', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/chat/?error=google` }),
    async (req, res) => {
        try {
            const googleUser = req.user;
            const email = googleUser.emails[0].value;

            let user = await User.findOne({ email });
            if (!user) {
                const strongPassword = crypto.randomBytes(16).toString('hex');
                user = await User.create({
                    fullName: googleUser.displayName,
                    email,
                    password: strongPassword,
                });
            }

            const token = jwt.sign(
                { userId: user._id, email: user.email, fullName: user.fullName },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.redirect(`${process.env.FRONTEND_URL}/chat/?token=${token}`);
        } catch (error) {
            console.error('Google login error:', error.message);
            res.redirect('/login?error=google');
        }
    }
);

export default router;
