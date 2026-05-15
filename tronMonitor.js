const cron = require("node-cron");
const axios = require("axios");

const User = require("./User");
const Transaction = require("./Transaction");

/* Check deposits every 30 seconds */
cron.schedule("*/30 * * * * *", async () => {
    try {
        console.log("Checking deposits...");

        const users = await User.find({
            walletAddress: { $ne: "" }
        });

        for (const user of users) {
            try {
                const response = await axios.get(
                    `https://api.trongrid.io/v1/accounts/${user.walletAddress}/transactions/trc20`,
                    {
                        headers: process.env.TRONGRID_API_KEY
                            ? {
                                  "TRON-PRO-API-KEY":
                                      process.env.TRONGRID_API_KEY
                              }
                            : {}
                    }
                );

                const txs = response.data.data || [];

                for (const tx of txs) {
                    /* only incoming USDT */
                    if (
                        !tx.token_info ||
                        tx.token_info.symbol !== "USDT" ||
                        tx.to !== user.walletAddress
                    ) {
                        continue;
                    }

                    const txid = tx.transaction_id;

                    /* prevent duplicate deposits */
                    const exists = await Transaction.findOne({
                        txid
                    });

                    if (exists) continue;

                    const amount = Number(tx.value) / 1000000;

                    await Transaction.create({
                        txid,
                        address: user.walletAddress,
                        amount
                    });

                    user.depositApproved = true;
                    user.balance += amount;

                    await user.save();

                    console.log(
                        `Deposit detected for ${user.username}: ${amount} USDT`
                    );
                }
            } catch (walletError) {
                console.log(
                    `Wallet check error (${user.username}):`,
                    walletError.message
                );
            }
        }
    } catch (error) {
        console.log("Deposit monitor error:", error.message);
    }
});

module.exports = {};
