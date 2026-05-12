const express = require("express");
const router = express.Router();

const User = require("./User");

const projects = {
    1: {
        id: 1,
        name: "Starter Plan",
        price: 100,
        roi: 1
    },
    2: {
        id: 2,
        name: "Silver Plan",
        price: 300,
        roi: 1.2
    },
    3: {
        id: 3,
        name: "Gold Plan",
        price: 500,
        roi: 1.5
    },
    4: {
        id: 4,
        name: "VIP Plan",
        price: 1000,
        roi: 1.8
    },
    5: {
        id: 5,
        name: "Premium Plan",
        price: 3000,
        roi: 2
    }
};

/* محاسبه سود روزانه */
function calculateProfit(user) {
    let totalProfit = 0;

    if (!user.projects || user.projects.length === 0) {
        return 0;
    }

    user.projects.forEach(project => {
        const buyDate = new Date(project.purchaseDate);
        const now = new Date();

        const diffTime = now - buyDate;
        const daysPassed = Math.floor(
            diffTime / (1000 * 60 * 60 * 24)
        );

        const dailyProfit =
            (project.price * project.roi) / 100;

        totalProfit += dailyProfit * daysPassed;
    });

    return totalProfit;
}

/* خرید پروژه */
router.post("/buy", async (req, res) => {
    try {
        const { username, projectId } = req.body;

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const project = projects[projectId];

        if (!project) {
            return res.status(400).json({
                message: "Invalid project"
            });
        }

        if (!user.depositApproved) {
            return res.status(400).json({
                message: "Deposit not approved"
            });
        }

        if (user.balance < project.price) {
            return res.status(400).json({
                message: "Insufficient balance"
            });
        }

        const alreadyBought = user.projects.some(
            item => item.projectId === project.id
        );

        if (alreadyBought) {
            return res.status(400).json({
                message: "Already purchased"
            });
        }

        user.balance -= project.price;

        user.projects.push({
            projectId: project.id,
            name: project.name,
            price: project.price,
            roi: project.roi,
            purchaseDate: new Date()
        });

        await user.save();

        res.json({
            message: "Project purchased successfully",
            user
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
});

/* گرفتن اطلاعات dashboard با سود */
router.get("/dashboard/:username", async (req, res) => {
    try {
        const user = await User.findOne({
            username: req.params.username
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const profit = calculateProfit(user);

        const totalBalance = user.balance + profit;

        res.json({
            user,
            profit,
            totalBalance
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
});

module.exports = router;
