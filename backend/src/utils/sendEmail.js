import { Resend } from 'resend';

const stripHtml = (value) =>
    String(value || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const sendEmail = async (options = {}) => {
    const apiKey = String(process.env.RESEND_API_KEY || '').trim();
    if (!apiKey) {
        throw new Error('RESEND_API_KEY is not configured');
    }

    const to = options.email || options.to;
    if (!to) {
        throw new Error('Email recipient is required');
    }

    const rawFrom =
        process.env.EMAIL_FROM ||
        process.env.RESEND_FROM ||
        'TaskMate Support <onboarding@resend.dev>';
    const from = rawFrom.includes('<') ? rawFrom : `TaskMate Support <${rawFrom}>`;

    const subject = options.subject || 'TaskMate Notification';
    const html = options.html || options.text || '';
    const text = options.text && options.html ? String(options.text) : stripHtml(html);

    const resend = new Resend(apiKey);
    const response = await resend.emails.send({
        from,
        to,
        subject,
        html,
        text,
    });

    if (response?.error) {
        throw new Error(response.error.message || 'Failed to send email through Resend');
    }

    return response;
};

export default sendEmail;