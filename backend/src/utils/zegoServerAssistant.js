import { createCipheriv } from 'crypto';

const ERROR_CODE = {
    appIDInvalid: 1,
    userIDInvalid: 3,
    secretInvalid: 5,
    effectiveTimeInSecondsInvalid: 6,
};

const randomInt = (min, max) => Math.ceil((min + (max - min)) * Math.random());

const makeRandomIv = () => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    const result = [];

    for (let index = 0; index < 16; index += 1) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        result.push(chars.charAt(randomIndex));
    }

    return result.join('');
};

const getAlgorithm = (key) => {
    switch (Buffer.from(key).length) {
        case 16:
            return 'aes-128-cbc';
        case 24:
            return 'aes-192-cbc';
        case 32:
            return 'aes-256-cbc';
        default:
            throw new Error(`Invalid key length: ${Buffer.from(key).length}`);
    }
};

const aesEncrypt = (plainText, key, iv) => {
    const cipher = createCipheriv(getAlgorithm(key), key, iv);
    cipher.setAutoPadding(true);

    const encrypted = cipher.update(plainText);
    const final = cipher.final();

    return Uint8Array.from(Buffer.concat([encrypted, final])).buffer;
};

export const generateToken04 = (appId, userId, secret, effectiveTimeInSeconds, payload = '') => {
    if (!appId || typeof appId !== 'number') {
        throw {
            errorCode: ERROR_CODE.appIDInvalid,
            errorMessage: 'appID invalid',
        };
    }

    if (!userId || typeof userId !== 'string') {
        throw {
            errorCode: ERROR_CODE.userIDInvalid,
            errorMessage: 'userId invalid',
        };
    }

    if (!secret || typeof secret !== 'string' || secret.length !== 32) {
        throw {
            errorCode: ERROR_CODE.secretInvalid,
            errorMessage: 'secret must be a 32 byte string',
        };
    }

    if (!effectiveTimeInSeconds || typeof effectiveTimeInSeconds !== 'number') {
        throw {
            errorCode: ERROR_CODE.effectiveTimeInSecondsInvalid,
            errorMessage: 'effectiveTimeInSeconds invalid',
        };
    }

    const createTime = Math.floor(Date.now() / 1000);
    const tokenInfo = {
        app_id: appId,
        user_id: userId,
        nonce: randomInt(-2147483648, 2147483647),
        ctime: createTime,
        expire: createTime + effectiveTimeInSeconds,
        payload,
    };

    const plainText = JSON.stringify(tokenInfo);
    const iv = makeRandomIv();
    const encryptBuffer = aesEncrypt(plainText, secret, iv);

    const expireBytes = new Uint8Array(8);
    const ivLengthBytes = new Uint8Array(2);
    const encryptedLengthBytes = new Uint8Array(2);

    new DataView(expireBytes.buffer).setBigInt64(0, BigInt(tokenInfo.expire), false);
    new DataView(ivLengthBytes.buffer).setUint16(0, iv.length, false);
    new DataView(encryptedLengthBytes.buffer).setUint16(0, encryptBuffer.byteLength, false);

    const buffer = Buffer.concat([
        Buffer.from(expireBytes),
        Buffer.from(ivLengthBytes),
        Buffer.from(iv),
        Buffer.from(encryptedLengthBytes),
        Buffer.from(encryptBuffer),
    ]);

    const tokenView = new DataView(Uint8Array.from(buffer).buffer);
    return `04${Buffer.from(tokenView.buffer).toString('base64')}`;
};
