import speakeasy from 'speakeasy';


export const verifyMfaToken = (user, token) => {
    if (!user.mfaSecret || !user.mfaSecret.base32) {
        return false;
    }

    const verified = speakeasy.totp.verify({
        secret: user.mfaSecret.base32,
        encoding: 'base32',
        token: token,
        window: 1 // Allow 30 seconds leeway either side
    });

    return verified;
};
