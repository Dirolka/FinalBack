import mongoose from 'mongoose';

export function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      message: 'Validation error',
      details: Object.fromEntries(
        Object.entries(err.errors).map(([key, val]) => [key, val.message])
      )
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: 'Invalid id' });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      message: err.message || 'Duplicate entry'
    });
  }

  console.error('Server error:', err);
  const errMsg = err.message || String(err);
  return res.status(500).json({
    message: 'Internal Server Error',
    error: errMsg
  });
}
