export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    statusCode: 500,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "dev" ? err.message : undefined,
  });
};
