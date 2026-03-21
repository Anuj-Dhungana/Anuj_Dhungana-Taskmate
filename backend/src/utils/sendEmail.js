import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // 1. Create Transporter (Connection to Email Service)
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use STARTTLS
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS  
        },
        connectionTimeout: 10000, // 10 seconds — fail fast instead of hanging
        greetingTimeout: 10000,
        socketTimeout: 10000,
    });

    // 2. Define Email Options
    const mailOptions = {
        from: `"TaskMate Support" <${process.env.EMAIL_USER}>`,
        to: options.email || options.to,
        subject: options.subject,
        html: options.html || options.text
    };

    // 3. Send Email
    await transporter.sendMail(mailOptions);
};

export default sendEmail;