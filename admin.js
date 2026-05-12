const express = require("express");
const router = express.Router();

const User = require("./User");
const Withdraw = require("./Withdraw");
const auth = require("./authMiddleware");

router.get("/users", auth, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({
            message: "Forbidden"
        });
    }

    const users = await User.find().select("-password");
    res.json(users);
});

router.post("/approve-deposit", auth, async (req, res) => {
    try {
        const { username } = req.body;

        if (!req.user.isAdmin) {
            return res.status(403).json({
                message: "Forbidden"
            });
        }

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!user.depositApproved) {
            user.depositApproved = true;

            if (user.invitedBy) {
                const inviter = await User.findOne({
                    referralCode: user.invitedBy
                });

                if (inviter) {
                    inviter.balance += 25;
                    await inviter.save();
                }
            }

            await user.save();
        }

        res.json({
            message: "Deposit approved"
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
});

router.post("/approve-withdraw", auth, async (req, res) => {
    try {
        const { id, status } = req.body;

        await Withdraw.updateOne(
            { _id: id },
            { $set: { status } }
        );

        res.json({
            message: "Withdraw updated"
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
});

module.exports = router;
