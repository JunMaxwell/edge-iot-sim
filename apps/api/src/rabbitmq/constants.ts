// Connection defaults (overridable via env — see .env.example)
export const DEFAULT_RABBITMQ_URL = "amqp://guest:guest@localhost:5672";

// Initial-connect retry policy: exponential backoff, capped attempts.
export const MAX_CONNECT_ATTEMPTS = 5;
export const BASE_BACKOFF_MS = 500;
