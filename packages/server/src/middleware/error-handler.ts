import type { ErrorHandler } from 'hono';

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  const status = 'status' in err && typeof err.status === 'number' ? err.status : 500;

  return c.json(
    {
      success: false,
      error: {
        message: status === 500 ? 'Internal Server Error' : err.message,
      },
    },
    status as any,
  );
};
