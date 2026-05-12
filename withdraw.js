const express = require("express");
const router = express.Router();

const Withdraw = require("./Withdraw");

/* submit withdraw request */
router.post("/request", async (req, res) => {
    try {
        const {
            username,
            wallet,
            amount,
            network
        } = req.body;

        if (!username || !wallet) {
            return res.status(400).json({
                message: "Missing fields"
            });
        }

        const withdraw = new Withdraw({
            username,
            wallet,
            amount: amount || 0,
            network: network || "TRC20"
        });

        await withdraw.save();

        res.json({
            message: "Withdraw request submitted"
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
});

/* get all withdraws for admin */
router.get("/all", async (req, res) => {
    try {
        const withdraws = await Withdraw.find().sort({
            createdAt: -1
        });

        res.json(withdraws);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
});

module.exports = router;
