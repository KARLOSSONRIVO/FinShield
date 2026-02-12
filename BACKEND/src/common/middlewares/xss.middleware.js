import DOMPurify from 'isomorphic-dompurify';

const sanitize = (obj) => {
    if (!obj) return obj;

    if (Array.isArray(obj)) {
        return obj.map(sanitize);
    }

    if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach(key => {
            obj[key] = sanitize(obj[key]);
        });
        return obj;
    }

    if (typeof obj === 'string') {
        return DOMPurify.sanitize(obj);
    }

    return obj;
};

export const xssMiddleware = (req, res, next) => {
    if (req.body) req.body = sanitize(req.body);
    if (req.query) req.query = sanitize(req.query);
    if (req.params) req.params = sanitize(req.params);
    next();
};
