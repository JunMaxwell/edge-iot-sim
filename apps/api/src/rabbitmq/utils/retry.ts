export const withRetry = async <T>(
  operation: () => Promise<T> | T,
  maxRetries: number = 3,
  baseBackoffMs: number = 1000,
): Promise<T> => {
  let attempt = 1;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= maxRetries) {
        throw error;
      }
      const backoff = baseBackoffMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, backoff));
      attempt++;
    }
  }
};
