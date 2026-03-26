import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // 1. Create Transporter (Connection to Email Service)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS  
        }
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