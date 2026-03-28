import { getRedis } from '../config/redis.js';

const PREFIX_VERIFY = 'otp:verify:';
const PREFIX_2FA = 'otp:2fa:';

const normEmail = (email) => String(email || '').trim().toLowerCase();

export const TTL_VERIFY_SEC = 600; // 10 minutes (matches previous behavior)
export const TTL_2FA_SEC = 300; // 5 minutes

export const setVerifyOtp = async (email, code) => {
    const r = getRedis();
    await r.set(`${PREFIX_VERIFY}${normEmail(email)}`, String(code), 'EX', TTL_VERIFY_SEC);
};

export const verifyAndConsumeVerifyOtp = async (email, code) => {
    const key = `${PREFIX_VERIFY}${normEmail(email)}`;
    const r = getRedis();
    const stored = await r.get(key);
    if (!stored || stored !== String(code).trim()) {
        return false;
    }
    await r.del(key);
    return true;
};

export const deleteVerifyOtp = async (email) => {
    const r = getRedis();
    await r.del(`${PREFIX_VERIFY}${normEmail(email)}`);
};

export const set2faOtp = async (email, code) => {
    const r = getRedis();
    await r.set(`${PREFIX_2FA}${normEmail(email)}`, String(code), 'EX', TTL_2FA_SEC);
};

export const verifyAndConsume2faOtp = async (email, code) => {
    const key = `${PREFIX_2FA}${normEmail(email)}`;
    const r = getRedis();
    const stored = await r.get(key);
    if (!stored || stored !== String(code).trim()) {
        return false;
    }
    await r.del(key);
    return true;
};
