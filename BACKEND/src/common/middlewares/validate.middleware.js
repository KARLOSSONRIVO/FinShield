import AppError from "../errors/AppErrors";

export function validate(schema){
    return (req, _res, next) => {
        const result = schema.safeParse({
        body: req.body,
        params: req.params,
        query: req.query,
    });

    if (!result.success) {
      const msg = result.error.issues?.[0]?.message || "Validation error";
      return next(new AppError(msg, 400, "VALIDATION_ERROR"));
    }

    if (result.data.body) req.body = result.data.body;
    if (result.data.params) req.params = result.data.params;
    if (result.data.query) req.query = result.data.query;
    next();
    };
}