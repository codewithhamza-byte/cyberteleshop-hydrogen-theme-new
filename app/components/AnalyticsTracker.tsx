import {useAnalytics} from '@shopify/hydrogen';
import {useEffect, useRef} from 'react';
import {useLocation} from '@remix-run/react';

interface AnalyticsTrackerProps {
  metaPixelId?: string;
}

export function AnalyticsTracker({
  metaPixelId,
}: AnalyticsTrackerProps) {
  const {subscribe} = useAnalytics();
  const location = useLocation();
  const initialized = useRef(false);

  // Initialize third-party pixel scripts
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Initialize Meta Pixel
    if (metaPixelId) {
      console.log(`[Analytics] Initializing Meta Pixel with ID: ${metaPixelId}`);
      const fbInstance = (window as any).fbq;
      if (!fbInstance) {
        const initFB = function (
          f: any,
          b: any,
          e: any,
          v: any,
          n?: any,
          t?: any,
          s?: any,
        ) {
          if (f.fbq) return;
          n = f.fbq = function () {
            n.callMethod
              ? n.callMethod.apply(n, arguments)
              : n.queue.push(arguments);
          };
          if (!f._fbq) f._fbq = n;
          n.push = n;
          n.loaded = !0;
          n.version = '2.0';
          n.queue = [];
          t = b.createElement(e);
          t.async = !0;
          t.src = v;
          s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s);
        };
        initFB(
          window,
          document,
          'script',
          'https://connect.facebook.net/en_US/fbevents.js',
        );
      }
      (window as any).fbq('init', metaPixelId);
      (window as any).fbq('track', 'PageView');
    } else {
      console.log('[Analytics] Meta Pixel ID not configured. In developer mode.');
    }
  }, [metaPixelId]);

  // Subscribe to Shopify standard events and forward to FB Pixel
  useEffect(() => {
    const fireEvent = (name: string, payload: any) => {
      console.log(`[Analytics Event Triggered]: ${name}`, payload);

      // Meta Pixel
      if ((window as any).fbq) {
        try {
          if (name === 'page_viewed') {
            (window as any).fbq('track', 'PageView');
          } else if (name === 'product_viewed') {
            const product = payload.products?.[0];
            (window as any).fbq('track', 'ViewContent', {
              content_name: product?.title,
              content_ids: [product?.id],
              content_type: 'product',
              value: product?.price,
              currency: product?.currency || 'PKR',
            });
          } else if (name === 'collection_viewed') {
            const collection = payload.collection;
            (window as any).fbq('track', 'ViewContent', {
              content_name: collection?.handle,
              content_ids: [collection?.id],
              content_type: 'product_group',
            });
          } else if (name === 'cart_viewed') {
            const cart = payload.cart;
            (window as any).fbq('track', 'InitiateCheckout', {
              value: cart?.cost?.subtotalAmount?.amount || '0',
              currency: cart?.cost?.subtotalAmount?.currencyCode || 'PKR',
            });
          } else if (name === 'product_added_to_cart') {
            const line = payload.currentLine;
            const product = line?.merchandise?.product;
            const variant = line?.merchandise;
            (window as any).fbq('track', 'AddToCart', {
              content_name: product?.title || variant?.title,
              content_ids: [product?.id || variant?.id],
              content_type: 'product',
              value: line?.cost?.totalAmount?.amount || variant?.price?.amount,
              currency: line?.cost?.totalAmount?.currencyCode || variant?.price?.currencyCode || 'PKR',
              quantity: line?.quantity || 1,
            });
          } else if (name === 'product_removed_from_cart') {
            const line = payload.prevLine;
            const product = line?.merchandise?.product;
            const variant = line?.merchandise;
            (window as any).fbq('trackCustom', 'RemoveFromCart', {
              content_name: product?.title || variant?.title,
              content_ids: [product?.id || variant?.id],
              content_type: 'product',
              value: line?.cost?.totalAmount?.amount || variant?.price?.amount,
              currency: line?.cost?.totalAmount?.currencyCode || variant?.price?.currencyCode || 'PKR',
              quantity: line?.quantity || 1,
            });
          } else if (name === 'cart_updated') {
            // Log fallback or additional updates
            console.log('[Analytics] Cart updated state:', payload.cart);
          } else if (name === 'search_viewed') {
            (window as any).fbq('track', 'Search', {
              search_string: payload.searchTerm,
            });
          } else if (name === 'custom_wishlist_viewed') {
            (window as any).fbq('trackCustom', 'WishlistViewed', {
              wishlist_length: payload.wishlistLength,
              wishlist_ids: payload.wishlistIds,
            });
          } else if (name === 'custom_compare_viewed') {
            (window as any).fbq('trackCustom', 'CompareViewed', {
              compare_length: payload.compareLength,
              compare_ids: payload.compareIds,
            });
          }
        } catch (err) {
          console.error('[Analytics] Error tracking to Meta Pixel:', err);
        }
      }
    };

    // Subscriptions
    const unsubPage = subscribe('page_viewed', (data) => fireEvent('page_viewed', data)) as any;
    const unsubProduct = subscribe('product_viewed', (data) => fireEvent('product_viewed', data)) as any;
    const unsubCollection = subscribe('collection_viewed', (data) => fireEvent('collection_viewed', data)) as any;
    const unsubCartViewed = subscribe('cart_viewed', (data) => fireEvent('cart_viewed', data)) as any;
    const unsubCart = subscribe('cart_updated', (data) => fireEvent('cart_updated', data)) as any;
    const unsubAddToCart = subscribe('product_added_to_cart', (data) => fireEvent('product_added_to_cart', data)) as any;
    const unsubRemoveFromCart = subscribe('product_removed_from_cart', (data) => fireEvent('product_removed_from_cart', data)) as any;
    const unsubSearch = subscribe('search_viewed', (data) => fireEvent('search_viewed', data)) as any;
    const unsubWishlist = subscribe('custom_wishlist_viewed', (data) => fireEvent('custom_wishlist_viewed', data)) as any;
    const unsubCompare = subscribe('custom_compare_viewed', (data) => fireEvent('custom_compare_viewed', data)) as any;

    return () => {
      if (typeof unsubPage === 'function') unsubPage();
      if (typeof unsubProduct === 'function') unsubProduct();
      if (typeof unsubCollection === 'function') unsubCollection();
      if (typeof unsubCartViewed === 'function') unsubCartViewed();
      if (typeof unsubCart === 'function') unsubCart();
      if (typeof unsubAddToCart === 'function') unsubAddToCart();
      if (typeof unsubRemoveFromCart === 'function') unsubRemoveFromCart();
      if (typeof unsubSearch === 'function') unsubSearch();
      if (typeof unsubWishlist === 'function') unsubWishlist();
      if (typeof unsubCompare === 'function') unsubCompare();
    };
  }, [subscribe, location]);

  return null;
}
