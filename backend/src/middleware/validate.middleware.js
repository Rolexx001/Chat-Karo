export const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const issues = result.error.issues || result.error.errors || [];
        const errors = issues.map((err) => ({
            field: Array.isArray(err.path) && err.path.length > 0 ? err.path.join('.') : 'root',
            message: err.message,
        }));
        return res.status(400).json({
            success: false,
            message: errors[0]?.message || "Validation failed",
            errors,
        });
    }
    req.body = result.data;
    next();
};
