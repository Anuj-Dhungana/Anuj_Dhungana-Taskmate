const KHALTI_INITIATE_PATH = '/epayment/initiate/';
const KHALTI_LOOKUP_PATH = '/epayment/lookup/';

const getKhaltiBaseUrl = () => (process.env.KHALTI_BASE_URL || 'https://dev.khalti.com/api/v2').replace(/\/+$/, '');

const getKhaltiSecretKey = () => String(process.env.KHALTI_SECRET_KEY || '').trim();

const assertKhaltiConfig = () => {
    const secret = getKhaltiSecretKey();
    if (!secret) {
        const error = new Error('Khalti secret key is not configured');
        error.status = 500;
        throw error;
    }
};

const postKhaltiJson = async (path, payload) => {
    assertKhaltiConfig();

    const response = await fetch(`${getKhaltiBaseUrl()}${path}`, {
        method: 'POST',
        headers: {
            Authorization: `key ${getKhaltiSecretKey()}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = new Error(data?.detail || data?.message || `Khalti request failed with status ${response.status}`);
        error.status = response.status;
        error.providerResponse = data;
        throw error;
    }

    return data;
};

export const initiateKhaltiPayment = async (payload) => postKhaltiJson(KHALTI_INITIATE_PATH, payload);

export const lookupKhaltiPayment = async (pidx) => {
    if (!pidx) {
        const error = new Error('pidx is required');
        error.status = 400;
        throw error;
    }
    return postKhaltiJson(KHALTI_LOOKUP_PATH, { pidx });
};
