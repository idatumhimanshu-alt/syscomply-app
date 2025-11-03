import nodemailer from 'nodemailer';

const sendEmail = async (to, subject, message) => {
    try {

        const transporter = nodemailer.createTransport({
            service: 'gmail', // Use your email provider
            auth: {
                user: process.env.EMAIL_USER, // Your email from .env
                pass: process.env.EMAIL_PASS  // Your email password from .env
            }

        //     host: "sandbox.smtp.mailtrap.io",
        // port: 2525,
        // auth: {
        //   user: "e802c2c160def7",
        //   pass: "d687cd1bd3668e"
        // }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text: message
        };

        await transporter.sendMail(mailOptions);
        console.log(`📩 Email sent successfully to ${to}`);
    } catch (error) {
        console.error("❌ Error sending email:", error.message);
    }
};

export default sendEmail;
