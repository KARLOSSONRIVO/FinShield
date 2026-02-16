import speakeasy from 'speakeasy';
import qrcode from 'qrcode';


export const generateMfaSecret = async (email) => {
    const secret = speakeasy.generateSecret({
        length: 20,
        name: `FinShield (${email})`,
        issuer: 'FinShield'
    });

    const otpauthUrl = secret.otpauth_url;
    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);

    return {
        secret: secret, // Object containing base32, hex, etc.
        qrCodeUrl
    };
};