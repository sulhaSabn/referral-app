const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { TronWeb } = require("tronweb");
const getAvailableSignals = require("./signal");
const router = express.Router();

const User = require("./User");
const { sendResetEmail } = require("./mailer");
const updateProfit = require("./profit");


/* Generate reset token */
function generateResetToken() {
    return Math.random()
        .toString(36)
        .substring(2, 12);
}


/* Generate unique referral code */
async function generateReferralCode() {
    let code;
    let exists = true;

    while (exists) {
        code = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

        exists = await User.findOne({
            referralCode: code
        });
    }

    return code;
}


/* Create TRON wallet */
async function createWallet() {
    try {
        const account = await TronWeb.createAccount();

        return {
            address: account.address.base58,
            privateKey: account.privateKey
        };
    } catch (error) {
        throw new Error("Wallet generation failed");
    }
}


/* REGISTER */
router.post("/register", async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            referralCode
        } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "All fields required"
            });
        }

        const existingUser = await User.findOne({
            $or: [
                { username },
                { email }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        let inviter = null;

        if (referralCode) {
            inviter = await User.findOne({
                referralCode
            });

            if (!inviter) {
                return res.status(400).json({
                    message: "Invalid referral code"
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const wallet = await createWallet();

        const user = new User({
            username,
            email,
            password: hashedPassword,
            balance: 0,
            investmentAmount: 0,
            dailyProfitRate: 2,
            walletAddress: wallet.address,
            privateKey: wallet.privateKey,
            referralCode: await generateReferralCode(),
            invitedBy: referralCode || null,
            lastProfitUpdate: new Date()
        });

        await user.save();

        if (inviter) {
            inviter.invitedCount += 1;
            await inviter.save();
        }

        res.json({
            success: true,
            message: "Registration successful",
            walletAddress: wallet.address
        });

    } catch (err) {
        console.log("Register error:", err);
        res.status(500).json({
            message: err.message
        });
    }
});


/* LOGIN */
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        /* Admin login */
        if (
            username === process.env.ADMIN_USER &&
            password === process.env.ADMIN_PASS
        ) {
            const token = jwt.sign(
                {
                    username,
                    isAdmin: true
                },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            return res.json({
                token,
                user: {
                    username,
                    isAdmin: true
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

        await updateProfit(user);

        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
                isAdmin: user.isAdmin || false
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                balance: user.balance,
                investmentAmount: user.investmentAmount,
                dailyProfitRate: user.dailyProfitRate,
                walletAddress: user.walletAddress,
                referralCode: user.referralCode,
                invitedCount: user.invitedCount,
                depositApproved: user.depositApproved,
                isAdmin: user.isAdmin
            }
        });

    } catch (err) {
        console.log("Login error:", err);
        res.status(500).json({
            message: err.message
        });
    }
});


/* UPDATE PROFIT */
router.post("/update-profit", async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        await updateProfit(user);

        res.json({
            success: true,
            balance: user.balance,
            investmentAmount: user.investmentAmount,
            dailyProfitRate: user.dailyProfitRate
        });

    } catch (err) {
        console.log("Profit update error:", err);
        res.status(500).json({
            message: err.message
        });
    }
});


/* FORGOT PASSWORD */
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
        user.resetTokenExpiry = Date.now() + 3600000;

        await user.save();

        await sendResetEmail(email, token);

        res.json({
            success: true,
            message: "Reset email sent"
        });

    } catch (err) {
        console.log("Forgot password error:", err);
        res.status(500).json({
            message: err.message
        });
    }
});


/* RESET PASSWORD */
router.post("/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: {
                $gt: Date.now()
            }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired token"
            });
        }

        user.password = await bcrypt.hash(
            newPassword,
            10
        );

        user.resetToken = null;
        user.resetTokenExpiry = null;

        await user.save();

        res.json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (err) {
        console.log("Reset password error:", err);
        res.status(500).json({
            message: err.message
        });
    }
});
router.post("/signals", async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const signals = getAvailableSignals(user);

        res.json({
            success: true,
            signals
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
});
router.post("/claim-signal", async (req, res) => {
    try {
        const { userId, signalId } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const availableSignals =
            getAvailableSignals(user);

        if (
            !availableSignals.includes(signalId)
        ) {
            return res.status(400).json({
                message: "Signal unavailable"
            });
        }

        const reward =
            user.investmentAmount * 0.005;

        user.pendingSignalReward = reward;
        user.signalClaimTime = new Date();
        user.dailySignals.push(signalId);

        await user.save();

        res.json({
            success: true,
            message:
                "Signal claimed. Reward after 30 minutes."
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
});
router.post("/check-signal-reward", async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (
            user.pendingSignalReward > 0 &&
            user.signalClaimTime
        ) {
            const diff =
                Date.now() -
                new Date(user.signalClaimTime);

            if (diff >= 1800000) {
                user.balance +=
                    user.pendingSignalReward;

                user.pendingSignalReward = 0;
                user.signalClaimTime = null;

                await user.save();
            }
        }

        res.json({
            success: true,
            balance: user.balance
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
});
module.exports = router;
