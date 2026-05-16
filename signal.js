function getAvailableSignals(user) {
    const now = new Date();

    const kabulTime = new Date(
        now.toLocaleString("en-US", {
            timeZone: "Asia/Kabul"
        })
    );

    const hour = kabulTime.getHours();
    const minute = kabulTime.getMinutes();

    const currentMinutes = hour * 60 + minute;

    const signals = [];

    if (
        user.depositApproved &&
        user.investmentAmount >= 50
    ) {
        // 3:40
        if (currentMinutes >= 220) {
            signals.push("signal1");
        }

        // 8:40
        if (currentMinutes >= 520) {
            signals.push("signal2");
        }

        // referral 1
        if (
            user.invitedCount >= 1 &&
            currentMinutes >= 580
        ) {
            signals.push("signal3");
        }

        // referral 2
        if (
            user.invitedCount >= 2 &&
            currentMinutes >= 630
        ) {
            signals.push("signal4");
        }
    }

    return signals.filter(
        s => !user.dailySignals.includes(s)
    );
}

module.exports = getAvailableSignals;
