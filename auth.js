const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const TronWeb = require("tronweb");

const router = express.Router();

const User = require("./User");
const { sendResetEmail } = require("./mailer");

/* Generate referral code */
function generateReferralCode() {
    return Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
}

/* Generate reset token */
function generateResetToken() {
    return Math.random()
        .toString(36)
        .substring(2, 12);
}

/* Create wallet */

async function createWallet() {
    const account = await TronWeb.createAccount();

    return {
        address: account.address.base58,
        privateKey: account.privateKey
    };
}
/* Register */
router.post("/register", async (req, res) => {
    try {
        const { username, email, password, referralCode } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "All fields required"
            });
        }

        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message:
                    "Password must contain uppercase, lowercase, number and minimum 8 chars"
            });
        }

        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        let inviter = null;

        if (referralCode) {
            inviter = await User.findOne({ referralCode });

            if (!inviter) {
                return res.status(400).json({
                    message: "Invalid referral code"
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        /* Auto wallet creation */
        const wallet = await createWallet();
        const user = new User({
    username,
    email,
    password: hashedPassword,
    balance: 0,
    walletAddress: wallet.address,
    referralCode: generateReferralCode(),
    invitedBy: referralCode || null,
    invitedCount: 0,
    depositApproved: false
});

        await user.save();

        if (inviter) {
            inviter.invitedCount += 1;
            await inviter.save();
        }

        res.json({
    message: "Registration successful",
    walletAddress: wallet.address
});

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
});

/* Login */
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        /* Admin from env */
        if (
            username === process.env.ADMIN_USER &&
            password === process.env.ADMIN_PASS
        ) {
            const token = jwt.sign(
                {
                    username: process.env.ADMIN_USER,
                    isAdmin: true
                },
                process.env.JWT_SECRET
            );

            return res.json({
                token,
                user: {
                    username: process.env.ADMIN_USER,
                    isAdmin: true,
                    balance: 0,
                    invitedCount: 0,
                    depositApproved: true
                }
            });
        }

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            return res.status(400).json({
                message: "Wrong password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
                isAdmin: false
            },
            process.env.JWT_SECRET
        );

        res.json({
            token,
            user
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
});

/* Forgot password */
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "Email not found"
            });
        }

        const token = generateResetToken();

        user.resetToken = token;
        await user.save();

        await sendResetEmail(email, token);

        res.json({
            message: "Reset email sent"
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
});

/* Reset password */
router.post("/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const user = await User.findOne({
            resetToken: token
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid token"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.resetToken = null;

        await user.save();

        res.json({
            message: "Password changed successfully"
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
});

module.exports = router;
