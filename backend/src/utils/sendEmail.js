import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // 1. Create Transporter (Connection to Email Service)
    const transporter = nodemailer.createTransport({
        service: 'gmail', // You can use 'hotmail' or others
        auth: {
            user: process.env.EMAIL_USER, // Your email
            pass: process.env.EMAIL_PASS  // Your App Password (not login password)
        }
    });

    // 2. Define Email Options
    const mailOptions = {
        from: `"TaskMate Support" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.text // We will send HTML formatted text
    };

    // 3. Send Email
    await transporter.sendMail(mailOptions);
};

export default sendEmail;