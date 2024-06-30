export const errorMiddleware = (err, req, res, next) => {
    err.message || (err.message = "A server error occurred");
    err.statusCode || (err.statusCode = 500);
    if (err.name === "CastError") {
        err.message = "Invalid Id provided";
    }
    return res.status(err.statusCode).json({
        success: false,
        message: err.message
    });
};
export const TryCatch = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
