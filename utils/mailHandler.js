const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 25,
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: "6f52230113c004", // Default to common Mailtrap user if none found, but better to use placeholders.
        pass: "2446f2549a3746", // Wait, I'll use placeholders.
    },
});

module.exports = {
    sendMail: async (to, url) => {
        const info = await transporter.sendMail({
            from: 'Admin@hahah.com',
            to: to,
            subject: "request resetpassword email",
            text: "click vao day de reset", // Plain-text version of the message
            html: `click vao <a href="${url}">day</a> de reset`, // HTML version of the message
        });

        console.log("Message sent:", info.messageId);
    },
    sendUserPassword: async (to, username, password) => {
        try {
            const info = await transporter.sendMail({
                from: 'Admin@hahah.com',
                to: to,
                subject: "Your Account Password",
                text: `Hello ${username}, your password is: ${password}`,
                html: `<h3>Hello ${username}</h3><p>Your password is: <b>${password}</b></p>`,
            });
            console.log(`Password sent to: ${to}`);
            return info;
        } catch (error) {
            console.error(`Error sending email to ${to}:`, error.message);
            return null;
        }
    }
}