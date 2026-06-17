import {
  CacheLong,
  CacheNone,
  CacheShort,
  generateCacheControlHeader,
} from '@shopify/hydrogen';

export function routeHeaders({loaderHeaders}: {loaderHeaders: Headers}) {
  // Keep the same cache-control headers when loading the page directly
  // versus when transititioning to the page from other areas in the app
  return {
    'Cache-Control': loaderHeaders.get('Cache-Control'),
  };
}

export const CACHE_SHORT = generateCacheControlHeader(CacheShort());
export const CACHE_LONG = generateCacheControlHeader(CacheLong());
export const CACHE_NONE = generateCacheControlHeader(CacheNone());

// Cache strategy optimized for running advertising campaigns (high performance, instant CDN delivery)
export const CACHE_AD_LANDING = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';
