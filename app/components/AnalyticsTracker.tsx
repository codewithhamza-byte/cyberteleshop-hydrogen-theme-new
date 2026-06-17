import {useAnalytics} from '@shopify/hydrogen';
import {useEffect, useRef} from 'react';
import {useLocation} from '@remix-run/react';

interface AnalyticsTrackerProps {
  metaPixelId?: string;
  gaMeasurementId?: string;
}

export function AnalyticsTracker({
  metaPixelId,
  gaMeasurementId,
}: AnalyticsTrackerProps) {
  const {subscribe} = useAnalytics();
  const location = useLocation();
  const initialized = useRef(false);

  // Initialize third-party pixel scripts
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // 1. Initialize Google Analytics 4 (GA4)
    if (gaMeasurementId) {
      console.log(`[Analytics] Initializing GA4 with ID: ${gaMeasurementId}`);
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
      document.head.appendChild(script);

      (window as any).dataLayer = (window as any).dataLayer || [];
      const gtag = function () {
        (window as any).dataLayer.push(arguments);
      };
      (window as any).gtag = gtag;
      (gtag as any)('js', new Date());
      (gtag as any)('config', gaMeasurementId, {
        page_path: window.location.pathname,
      });
    } else {
      console.log('[Analytics] GA4 measurement ID not configured. In developer mode.');
    }

    // 2. Initialize Meta Pixel
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
  }, [gaMeasurementId, metaPixelId]);

  // Subscribe to Shopify standard events and forward to Gtag / FB Pixel
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
          } else if (name === 'cart_updated') {
            // Track when items are added/updated in cart
            const lastUpdatedLine = payload.prevCart?.lines?.nodes?.[0];
            if (lastUpdatedLine) {
              (window as any).fbq('track', 'AddToCart', {
                content_name: lastUpdatedLine.merchandise?.product?.title,
                content_ids: [lastUpdatedLine.merchandise?.product?.id],
                content_type: 'product',
                value: lastUpdatedLine.cost?.totalAmount?.amount,
                currency: lastUpdatedLine.cost?.totalAmount?.currencyCode || 'PKR',
              });
            }
          } else if (name === 'search_viewed') {
            (window as any).fbq('track', 'Search', {
              search_string: payload.searchTerm,
            });
          }
        } catch (err) {
          console.error('[Analytics] Error tracking to Meta Pixel:', err);
        }
      }

      // Google Analytics 4 (GA4)
      if ((window as any).gtag) {
        try {
          if (name === 'page_viewed') {
            (window as any).gtag('event', 'page_view', {
              page_path: payload.pathname || window.location.pathname,
              page_title: document.title,
            });
          } else if (name === 'product_viewed') {
            const product = payload.products?.[0];
            (window as any).gtag('event', 'view_item', {
              currency: product?.currency || 'PKR',
              value: Number(product?.price || 0),
              items: [
                {
                  item_id: product?.id,
                  item_name: product?.title,
                  price: Number(product?.price || 0),
                  quantity: 1,
                },
              ],
            });
          } else if (name === 'cart_updated') {
            const lastUpdatedLine = payload.prevCart?.lines?.nodes?.[0];
            if (lastUpdatedLine) {
              (window as any).gtag('event', 'add_to_cart', {
                currency: lastUpdatedLine.cost?.totalAmount?.currencyCode || 'PKR',
                value: Number(lastUpdatedLine.cost?.totalAmount?.amount || 0),
                items: [
                  {
                    item_id: lastUpdatedLine.merchandise?.product?.id,
                    item_name: lastUpdatedLine.merchandise?.product?.title,
                    price: Number(lastUpdatedLine.merchandise?.price?.amount || 0),
                    quantity: lastUpdatedLine.quantity,
                  },
                ],
              });
            }
          } else if (name === 'search_viewed') {
            (window as any).gtag('event', 'search', {
              search_term: payload.searchTerm,
            });
          }
        } catch (err) {
          console.error('[Analytics] Error tracking to GA4:', err);
        }
      }
    };

    // Subscriptions
    const unsubPage = subscribe('page_viewed', (data) => fireEvent('page_viewed', data)) as any;
    const unsubProduct = subscribe('product_viewed', (data) => fireEvent('product_viewed', data)) as any;
    const unsubCart = subscribe('cart_updated', (data) => fireEvent('cart_updated', data)) as any;
    const unsubSearch = subscribe('search_viewed', (data) => fireEvent('search_viewed', data)) as any;

    return () => {
      if (typeof unsubPage === 'function') unsubPage();
      if (typeof unsubProduct === 'function') unsubProduct();
      if (typeof unsubCart === 'function') unsubCart();
      if (typeof unsubSearch === 'function') unsubSearch();
    };
  }, [subscribe, location]);

  return null;
}
