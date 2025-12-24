const NodeCache = require('node-cache');

// Create cache with 10 minutes default TTL
const cache = new NodeCache({ 
  stdTTL: 600, // 10 minutes
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false // Better performance, but be careful with object mutations
});

/**
 * Cache middleware for GET requests
 * @param {number} duration - Cache duration in seconds (default: 600 = 10 minutes)
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (duration = 600) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key from URL and query params
    const key = `cache:${req.originalUrl || req.url}`;
    
    // Try to get cached response
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      // Cache hit - return cached response
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Cache HIT: ${key}`);
      }
      return res.json(cachedResponse);
    }

    // Cache miss - continue to route handler
    if (process.env.NODE_ENV === 'development') {
      console.log(`❌ Cache MISS: ${key}`);
    }

    // Store original res.json function
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode === 200 && body.success !== false) {
        cache.set(key, body, duration);
        if (process.env.NODE_ENV === 'development') {
          console.log(`💾 Cache SET: ${key} (${duration}s)`);
        }
      }
      
      return originalJson(body);
    };

    next();
  };
};

/**
 * Clear cache by pattern
 * @param {string} pattern - Pattern to match keys (supports wildcards)
 */
const clearCache = (pattern = null) => {
  if (pattern) {
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    cache.del(matchingKeys);
    console.log(`🗑️  Cleared ${matchingKeys.length} cache entries matching: ${pattern}`);
  } else {
    cache.flushAll();
    console.log('🗑️  Cleared all cache');
  }
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize,
  };
};

module.exports = {
  cacheMiddleware,
  clearCache,
  getCacheStats,
  cache, // Export cache instance for manual operations
};
