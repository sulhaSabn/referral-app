const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendResetEmail(email, token) {
    try {
        const resetLink =
    `https://restpasswordr.rf.gd/?token=${token}`;
        await transporter.sendMail({
            from: `"Energy Referral" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Password Reset Request",
            html: `
                <div style="font-family:Arial,sans-serif;padding:20px;">
                    <h2>Password Reset</h2>
                    <p>You requested password reset.</p>
                    <p>Click button below:</p>

                    <a href="${resetLink}"
                       style="
                            display:inline-block;
                            padding:12px 20px;
                            background:#27ae60;
                            color:white;
                            text-decoration:none;
                            border-radius:8px;
                       ">
                       Reset Password
                    </a>

                    <p style="margin-top:20px;">
                        Or open this link manually:
                    </p>

                    <p>${resetLink}</p>

                    <p>If you did not request this, ignore this email.</p>
                </div>
            `
        });

        console.log("✅ Reset email sent");

    } catch (error) {
        console.log("❌ Email error:", error);
        throw error;
    }
}

module.exports = {
    sendResetEmail
};
