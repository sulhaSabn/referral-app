const TronWeb = require("tronweb");
const cron = require("node-cron");

const User = require("./User");
const Transaction = require("./Transaction");

const tronWeb = new TronWeb({
    fullHost: "https://api.trongrid.io"
});

const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

/* Check deposits every 30 sec */
cron.schedule("*/30 * * * * *", async () => {
    try {
        console.log("Checking deposits...");

        const users = await User.find({
            walletAddress: { $ne: "" }
        });

        for (const user of users) {
            const txs =
                await tronWeb.trx.getTransactionsRelated(
                    user.walletAddress,
                    "to",
                    20,
                    0
                );

            for (const tx of txs) {
                const txid = tx.txID;

                const exists = await Transaction.findOne({
                    txid
                });

                if (exists) continue;

                const contractData =
                    tx.raw_data.contract?.[0];

                if (!contractData) continue;

                await Transaction.create({
                    txid,
                    address: user.walletAddress,
                    amount: 0
                });

                user.depositApproved = true;
                user.balance += 100; // temporary demo amount
                await user.save();

                console.log(
                    `Deposit detected for ${user.username}`
                );
            }
        }
    } catch (error) {
        console.log(error);
    }
});
