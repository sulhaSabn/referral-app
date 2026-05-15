const TronWeb = require("tronweb");
const cron = require("node-cron");
const axios = require("axios");

const User = require("./User");
const Transaction = require("./Transaction");

const tronWeb = new TronWeb({
    fullHost: "https://api.trongrid.io"
});

/* check every 30 sec */
cron.schedule("*/30 * * * * *", async () => {
    try {
        console.log("Checking deposits...");

        const users = await User.find({
            walletAddress: { $ne: "" }
        });

        for (const user of users) {

            const response = await axios.get(
                `https://api.trongrid.io/v1/accounts/${user.walletAddress}/transactions/trc20`
            );

            const txs = response.data.data || [];

            for (const tx of txs) {
                const txid = tx.transaction_id;

                const exists = await Transaction.findOne({ txid });
                if (exists) continue;

                await Transaction.create({
                    txid,
                    address: user.walletAddress,
                    amount: Number(tx.value) / 1000000
                });

                user.depositApproved = true;
                user.balance += Number(tx.value) / 1000000;

                await user.save();

                console.log(`Deposit detected for ${user.username}`);
            }
        }

    } catch (error) {
        console.log("Deposit monitor error:", error.message);
    }
});
