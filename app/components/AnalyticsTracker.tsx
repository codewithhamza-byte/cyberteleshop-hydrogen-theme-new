import {useAnalytics} from '@shopify/hydrogen';
import {useEffect, useRef} from 'react';
import {useLocation} from '@remix-run/react';

interface AnalyticsTrackerProps {
  metaPixelId?: string;
  googleTagId?: string;
  tiktokPixelId?: string;
  snapchatPixelId?: string;
  pinterestPixelId?: string;
}

export function AnalyticsTracker({
  metaPixelId,
  googleTagId,
  tiktokPixelId,
  snapchatPixelId,
  pinterestPixelId,
}: AnalyticsTrackerProps) {
  const {subscribe, register} = useAnalytics();
  const {ready} = register('Storefront Pixels');
  const location = useLocation();
  const initialized = useRef(false);

  // Initialize third-party pixel scripts
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // 1. Initialize Meta Pixel
    if (metaPixelId && metaPixelId !== 'YOUR_META_PIXEL_ID') {
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
    }

    // 2. Initialize Google Analytics (gtag.js)
    if (googleTagId && googleTagId.trim() !== '') {
      console.log(`[Analytics] Initializing Google Analytics with Tag ID: ${googleTagId}`);
      const scriptId = 'google-analytics-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${googleTagId}`;
        document.head.appendChild(script);

        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).gtag = function () {
          (window as any).dataLayer.push(arguments);
        };
        (window as any).gtag('js', new Date());
        (window as any).gtag('config', googleTagId);
      }
    }

    // 3. Initialize TikTok Pixel
    if (tiktokPixelId && tiktokPixelId.trim() !== '') {
      console.log(`[Analytics] Initializing TikTok Pixel with ID: ${tiktokPixelId}`);
      const ttqInstance = (window as any).ttq;
      if (!ttqInstance) {
        (function (w: any, d: any, t: string) {
          w.TiktokAnalyticsObject = t;
          var ttq = (w[t] = w[t] || []);
          ttq.methods = [
            'page',
            'track',
            'identify',
            'instances',
            'debug',
            'on',
            'off',
            'once',
            'ready',
            'alias',
            'group',
            'enableCookie',
            'disableCookie',
          ];
          ttq.setAndDefer = function (t: any, e: any) {
            t[e] = function () {
              t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
            };
          };
          for (var i = 0; i < ttq.methods.length; i++) {
            ttq.setAndDefer(ttq, ttq.methods[i]);
          }
          ttq.instance = function (t: any) {
            var e = ttq._i[t] || [],
              n = 0;
            for (n = 0; n < ttq.methods.length; n++) {
              ttq.setAndDefer(e, ttq.methods[n]);
            }
            return e;
          };
          ttq.load = function (e: any, n: any) {
            var i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
            ttq._i = ttq._i || {};
            ttq._i[e] = [];
            ttq._i[e]._u = i;
            ttq._t = ttq._t || {};
            ttq._t[e] = +new Date();
            ttq._o = ttq._o || {};
            ttq._o[e] = n || {};
            var o = d.createElement('script');
            o.type = 'text/javascript';
            o.async = true;
            o.src = i + '?sdkid=' + e + '&lib=' + t;
            var a = d.getElementsByTagName('script')[0];
            a.parentNode.insertBefore(o, a);
          };
        })(window, document, 'ttq');
      }
      (window as any).ttq.load(tiktokPixelId);
      (window as any).ttq.page();
    }

    // 4. Initialize Snapchat Pixel
    if (snapchatPixelId && snapchatPixelId.trim() !== '') {
      console.log(`[Analytics] Initializing Snapchat Pixel with ID: ${snapchatPixelId}`);
      const snapInstance = (window as any).snaptr;
      if (!snapInstance) {
        (function (e: any, t: any, n: string) {
          if (e.snaptr) return;
          var a = (e.snaptr = function () {
            a.handleRequest
              ? a.handleRequest.apply(a, arguments)
              : a.queue.push(arguments);
          });
          a.queue = [];
          var s = t.createElement(n);
          s.async = !0;
          s.src = 'https://sc-static.net/scevent.min.js';
          var r = t.getElementsByTagName(n)[0];
          r.parentNode.insertBefore(s, r);
        })(window, document, 'script');
      }
      (window as any).snaptr('init', snapchatPixelId);
      (window as any).snaptr('track', 'PAGE_VIEW');
    }

    // 5. Initialize Pinterest Pixel
    if (pinterestPixelId && pinterestPixelId.trim() !== '') {
      console.log(`[Analytics] Initializing Pinterest Pixel with ID: ${pinterestPixelId}`);
      const pintrkInstance = (window as any).pintrk;
      if (!pintrkInstance) {
        !(function (e: string) {
          if (!window.pintrk) {
            window.pintrk = function () {
              window.pintrk.queue.push(
                Array.prototype.slice.call(arguments),
              );
            };
            var n = window.pintrk;
            n.queue = [];
            n.version = '3.0';
            var t = document.createElement('script');
            t.async = !0;
            t.src = e;
            var r = document.getElementsByTagName('script')[0];
            r.parentNode.insertBefore(t, r);
          }
        })('https://s.pinimg.com/ct/core.js');
      }
      (window as any).pintrk('load', pinterestPixelId);
      (window as any).pintrk('page');
    }

    // Signal that the integration layout registration is complete
    ready();
  }, [metaPixelId, googleTagId, tiktokPixelId, snapchatPixelId, pinterestPixelId, ready]);

  // Subscribe to Shopify standard events and forward to loaded Pixel scripts
  useEffect(() => {
    const fireEvent = (name: string, payload: any) => {
      console.log(`[Analytics Event Triggered]: ${name}`, payload);

      // --- META PIXEL ---
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

      // --- GOOGLE ANALYTICS (gtag) ---
      if ((window as any).gtag) {
        try {
          if (name === 'page_viewed') {
            (window as any).gtag('event', 'page_view', {
              page_location: window.location.href,
              page_path: window.location.pathname,
              page_title: document.title,
            });
          } else if (name === 'product_viewed') {
            const product = payload.products?.[0];
            (window as any).gtag('event', 'view_item', {
              currency: product?.currency || 'PKR',
              value: parseFloat(product?.price || '0'),
              items: [
                {
                  item_id: product?.id,
                  item_name: product?.title,
                  price: parseFloat(product?.price || '0'),
                  quantity: 1,
                },
              ],
            });
          } else if (name === 'collection_viewed') {
            const collection = payload.collection;
            (window as any).gtag('event', 'view_item_list', {
              item_list_id: collection?.id,
              item_list_name: collection?.title || collection?.handle,
            });
          } else if (name === 'cart_viewed') {
            const cart = payload.cart;
            (window as any).gtag('event', 'view_cart', {
              currency: cart?.cost?.subtotalAmount?.currencyCode || 'PKR',
              value: parseFloat(cart?.cost?.subtotalAmount?.amount || '0'),
              items:
                cart?.lines?.edges?.map((e: any) => ({
                  item_id: e.node.merchandise?.product?.id || e.node.merchandise?.id,
                  item_name: e.node.merchandise?.product?.title || e.node.merchandise?.title,
                  price: parseFloat(e.node.merchandise?.price?.amount || '0'),
                  quantity: e.node.quantity,
                })) || [],
            });
          } else if (name === 'product_added_to_cart') {
            const line = payload.currentLine;
            const product = line?.merchandise?.product;
            const variant = line?.merchandise;
            (window as any).gtag('event', 'add_to_cart', {
              currency: line?.cost?.totalAmount?.currencyCode || variant?.price?.currencyCode || 'PKR',
              value: parseFloat(line?.cost?.totalAmount?.amount || variant?.price?.amount || '0'),
              items: [
                {
                  item_id: product?.id || variant?.id,
                  item_name: product?.title || variant?.title,
                  price: parseFloat(variant?.price?.amount || '0'),
                  quantity: line?.quantity || 1,
                },
              ],
            });
          } else if (name === 'product_removed_from_cart') {
            const line = payload.prevLine;
            const product = line?.merchandise?.product;
            const variant = line?.merchandise;
            (window as any).gtag('event', 'remove_from_cart', {
              currency: line?.cost?.totalAmount?.currencyCode || variant?.price?.currencyCode || 'PKR',
              value: parseFloat(line?.cost?.totalAmount?.amount || variant?.price?.amount || '0'),
              items: [
                {
                  item_id: product?.id || variant?.id,
                  item_name: product?.title || variant?.title,
                  price: parseFloat(variant?.price?.amount || '0'),
                  quantity: line?.quantity || 1,
                },
              ],
            });
          } else if (name === 'search_viewed') {
            (window as any).gtag('event', 'search', {
              search_term: payload.searchTerm,
            });
          }
        } catch (err) {
          console.error('[Analytics] Error tracking to Google Analytics:', err);
        }
      }

      // --- TIKTOK PIXEL ---
      if ((window as any).ttq) {
        try {
          if (name === 'page_viewed') {
            (window as any).ttq.page();
          } else if (name === 'product_viewed') {
            const product = payload.products?.[0];
            (window as any).ttq.track('ViewContent', {
              contents: [
                {
                  content_id: product?.id,
                  content_name: product?.title,
                  content_type: 'product',
                  price: parseFloat(product?.price || '0'),
                  quantity: 1,
                },
              ],
              value: parseFloat(product?.price || '0'),
              currency: product?.currency || 'PKR',
            });
          } else if (name === 'collection_viewed') {
            const collection = payload.collection;
            (window as any).ttq.track('ViewContent', {
              contents: [
                {
                  content_id: collection?.id,
                  content_name: collection?.handle,
                  content_type: 'product_group',
                },
              ],
            });
          } else if (name === 'cart_viewed') {
            const cart = payload.cart;
            (window as any).ttq.track('InitiateCheckout', {
              value: parseFloat(cart?.cost?.subtotalAmount?.amount || '0'),
              currency: cart?.cost?.subtotalAmount?.currencyCode || 'PKR',
            });
          } else if (name === 'product_added_to_cart') {
            const line = payload.currentLine;
            const product = line?.merchandise?.product;
            const variant = line?.merchandise;
            (window as any).ttq.track('AddToCart', {
              contents: [
                {
                  content_id: product?.id || variant?.id,
                  content_name: product?.title || variant?.title,
                  content_type: 'product',
                  price: parseFloat(variant?.price?.amount || '0'),
                  quantity: line?.quantity || 1,
                },
              ],
              value: parseFloat(line?.cost?.totalAmount?.amount || variant?.price?.amount || '0'),
              currency: line?.cost?.totalAmount?.currencyCode || variant?.price?.currencyCode || 'PKR',
            });
          } else if (name === 'search_viewed') {
            (window as any).ttq.track('Search', {
              query: payload.searchTerm,
            });
          }
        } catch (err) {
          console.error('[Analytics] Error tracking to TikTok:', err);
        }
      }

      // --- SNAPCHAT PIXEL ---
      if ((window as any).snaptr) {
        try {
          if (name === 'page_viewed') {
            (window as any).snaptr('track', 'PAGE_VIEW');
          } else if (name === 'product_viewed') {
            const product = payload.products?.[0];
            (window as any).snaptr('track', 'VIEW_CONTENT', {
              item_ids: product?.id ? [product.id] : [],
              price: parseFloat(product?.price || '0'),
              currency: product?.currency || 'PKR',
            });
          } else if (name === 'collection_viewed') {
            const collection = payload.collection;
            (window as any).snaptr('track', 'VIEW_CONTENT', {
              item_ids: collection?.id ? [collection.id] : [],
              content_type: 'product_group',
            });
          } else if (name === 'cart_viewed') {
            const cart = payload.cart;
            (window as any).snaptr('track', 'START_CHECKOUT', {
              price: parseFloat(cart?.cost?.subtotalAmount?.amount || '0'),
              currency: cart?.cost?.subtotalAmount?.currencyCode || 'PKR',
            });
          } else if (name === 'product_added_to_cart') {
            const line = payload.currentLine;
            const product = line?.merchandise?.product;
            const variant = line?.merchandise;
            (window as any).snaptr('track', 'ADD_CART', {
              item_ids: (product?.id || variant?.id) ? [product?.id || variant?.id] : [],
              price: parseFloat(variant?.price?.amount || '0'),
              currency: variant?.price?.currencyCode || 'PKR',
            });
          } else if (name === 'search_viewed') {
            (window as any).snaptr('track', 'SEARCH', {
              search_string: payload.searchTerm,
            });
          }
        } catch (err) {
          console.error('[Analytics] Error tracking to Snapchat:', err);
        }
      }

      // --- PINTEREST PIXEL ---
      if ((window as any).pintrk) {
        try {
          if (name === 'page_viewed') {
            (window as any).pintrk('track', 'pageview');
          } else if (name === 'product_viewed') {
            const product = payload.products?.[0];
            (window as any).pintrk('track', 'pagevisit', {
              line_items: [
                {
                  product_id: product?.id,
                  product_name: product?.title,
                  product_price: parseFloat(product?.price || '0'),
                },
              ],
            });
          } else if (name === 'collection_viewed') {
            const collection = payload.collection;
            (window as any).pintrk('track', 'pagevisit', {
              line_items: [
                {
                  product_id: collection?.id,
                  product_name: collection?.title || collection?.handle,
                },
              ],
            });
          } else if (name === 'cart_viewed') {
            const cart = payload.cart;
            (window as any).pintrk('track', 'signup');
          } else if (name === 'product_added_to_cart') {
            const line = payload.currentLine;
            const product = line?.merchandise?.product;
            const variant = line?.merchandise;
            (window as any).pintrk('track', 'addtocart', {
              line_items: [
                {
                  product_id: product?.id || variant?.id,
                  product_name: product?.title || variant?.title,
                  product_price: parseFloat(variant?.price?.amount || '0'),
                  product_quantity: line?.quantity || 1,
                },
              ],
            });
          } else if (name === 'search_viewed') {
            (window as any).pintrk('track', 'search', {
              search_query: payload.searchTerm,
            });
          }
        } catch (err) {
          console.error('[Analytics] Error tracking to Pinterest:', err);
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
