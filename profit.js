async function updateProfit(user) {
    if (!user.depositApproved) return user;

    if (user.investmentAmount <= 0) return user;

    const now = new Date();
    const lastUpdate = new Date(user.lastProfitUpdate);

    const diffMs = now - lastUpdate;
    const minutesPassed = diffMs / 1000 / 60;

    if (minutesPassed <= 0) return user;

    const dailyProfit =
        (user.investmentAmount * user.dailyProfitRate) / 100;

    const profitPerMinute = dailyProfit / 1440;

    const earnedProfit = profitPerMinute * minutesPassed;

    user.balance += earnedProfit;
    user.lastProfitUpdate = now;

    await user.save();

    return user;
}

module.exports = updateProfit;
