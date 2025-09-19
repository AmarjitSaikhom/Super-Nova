// During tests we don't want to connect to a real Redis instance.
// Export a minimal in-memory mock when NODE_ENV === 'test'.
if (process.env.NODE_ENV === 'test') {
  const store = new Map();

  const mockRedis = {
    async set(key, value, ...args) {
      // Support EX seconds option: set(key, value, 'EX', seconds)
      let ttlSeconds = null;
      if (args.length >= 2 && String(args[0]).toUpperCase() === 'EX') {
        ttlSeconds = Number(args[1]) || null;
      }

      store.set(key, { value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null });
      return 'OK';
    },
    async get(key) {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    async del(key) {
      return store.delete(key) ? 1 : 0;
    },
    on() {
      // No-op for event listeners in tests
    },
    quit() {
      // No-op
    },
  };

  module.exports = mockRedis;
} else {
  const { Redis } = require('ioredis');

  const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  });

  redis.on('connect', () => {
    console.log('Connected to Redis');
  });

  module.exports = redis;
}
