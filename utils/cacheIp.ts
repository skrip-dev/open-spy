// IP Info Cache - stores IP information for 1 hour
interface IpCacheEntry {
  data: unknown;
  timestamp: number;
}

const ipInfoCache = new Map<string, IpCacheEntry>();
const IP_CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

export function getCachedIpInfo(ip: string): unknown | null {
  const cached = ipInfoCache.get(ip);
  if (!cached) return null;

  // Check if cache is still valid
  if (Date.now() - cached.timestamp > IP_CACHE_TTL) {
    ipInfoCache.delete(ip);
    return null;
  }

  return cached.data;
}

export function setCachedIpInfo(ip: string, data: unknown): void {
  ipInfoCache.set(ip, {
    data,
    timestamp: Date.now(),
  });

  // Clean up old entries periodically (keep cache size manageable)
  if (ipInfoCache.size > 1000) {
    const now = Date.now();
    for (const [key, value] of ipInfoCache.entries()) {
      if (now - value.timestamp > IP_CACHE_TTL) {
        ipInfoCache.delete(key);
      }
    }
  }
}
