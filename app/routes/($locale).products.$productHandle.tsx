import {useRef, Suspense, useState, useEffect} from 'react';
import {Listbox} from '@headlessui/react';
import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {useLoaderData, Await} from '@remix-run/react';
import {
  getSeoMeta,
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
  getProductOptions,
  type MappedProductOptions,
} from '@shopify/hydrogen';
import {Money} from '~/components/Money';
import invariant from 'tiny-invariant';
import clsx from 'clsx';
import type {
  Maybe,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';

import type {ProductFragment} from 'storefrontapi.generated';
import {Heading, Text} from '~/components/Text';
import {Link} from '~/components/Link';
import {Button} from '~/components/Button';
import {AddToCartButton} from '~/components/AddToCartButton';
import {Skeleton} from '~/components/Skeleton';
import {ProductSwimlane} from '~/components/ProductSwimlane';
import {ProductGallery} from '~/components/ProductGallery';
import {IconCaret, IconCheck, IconClose} from '~/components/Icon';
import {getExcerpt} from '~/lib/utils';
import {seoPayload} from '~/lib/seo.server';
import type {Storefront} from '~/lib/type';
import {routeHeaders, CACHE_AD_LANDING} from '~/data/cache';
import {MEDIA_FRAGMENT, PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import {JudgemePreviewBadge, JudgemeReviewWidget} from '@judgeme/shopify-hydrogen';

export const headers = routeHeaders;

export async function loader(args: LoaderFunctionArgs) {
  const {productHandle} = args.params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return defer(
    {...deferredData, ...criticalData},
    {
      headers: {
        'Cache-Control': CACHE_AD_LANDING,
      },
    },
  );
}

async function loadCriticalData({
  params,
  request,
  context,
}: LoaderFunctionArgs) {
  const {productHandle} = params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  const selectedOptions = getSelectedProductOptions(request);

  const [{shop, product}] = await Promise.all([
    context.storefront.query(PRODUCT_QUERY, {
      variables: {
        handle: productHandle,
        selectedOptions,
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
      cache: context.storefront.CacheShort(),
    }),
  ]);

  if (!product?.id) {
    throw new Response('product', {status: 404});
  }

  const recommended = getRecommendedProducts(context.storefront, product.id);
  const selectedVariant = product.selectedOrFirstAvailableVariant ?? {};
  const variants = getAdjacentAndFirstAvailableVariants(product);

  const seo = seoPayload.product({
    product: {...product, variants},
    selectedVariant,
    url: request.url,
  });

  return {
    product,
    variants,
    shop,
    storeDomain: shop.primaryDomain.url,
    recommended,
    seo,
  };
}

function loadDeferredData(args: LoaderFunctionArgs) {
  return {};
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

function ProductCountdown({ targetDate }: { targetDate?: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Determine the countdown target
    let finalTargetDate = targetDate;
    if (!finalTargetDate) {
      // Evergreen fallback: target 11:59:59 PM today (or tomorrow if <2 hours left)
      const now = new Date();
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      if (endOfToday.getTime() - now.getTime() < 2 * 60 * 60 * 1000) {
        endOfToday.setDate(endOfToday.getDate() + 1);
      }
      finalTargetDate = endOfToday.toISOString();
    }

    const calculateTime = () => {
      const difference = +new Date(finalTargetDate) - +new Date();
      if (difference <= 0) {
        return null;
      }
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Initial calculation
    setTimeLeft(calculateTime());

    const timer = setInterval(() => {
      const remaining = calculateTime();
      setTimeLeft(remaining);
      if (!remaining) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!mounted || !timeLeft) return null;

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-neutral-900 dark:to-neutral-950 border border-[#D33E13]/10 dark:border-[#D33E13]/20 rounded-xl p-2.5 shadow-sm mt-3 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="flex h-1.5 w-1.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#D33E13]"></span>
          </span>
          <h4 className="text-[10px] font-black uppercase tracking-wider text-[#D33E13]">
            Limited Time Offer!
          </h4>
        </div>
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-100 dark:border-neutral-700 shadow-sm">
          Ends Soon
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* Days */}
        {timeLeft.days > 0 && (
          <>
            <div className="flex flex-col items-center">
              <div className="bg-[#D33E13] text-white rounded-lg h-8 w-8 flex items-center justify-center text-xs font-black tracking-tight shadow-sm shadow-red-500/10">
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <span className="text-[8px] font-extrabold uppercase tracking-widest text-neutral-400 mt-0.5">
                Days
              </span>
            </div>
            <span className="text-sm font-black text-[#D33E13] pb-3 animate-pulse">:</span>
          </>
        )}

        {/* Hours */}
        <div className="flex flex-col items-center">
          <div className="bg-[#D33E13] text-white rounded-lg h-8 w-8 flex items-center justify-center text-xs font-black tracking-tight shadow-sm shadow-red-500/10">
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <span className="text-[8px] font-extrabold uppercase tracking-widest text-neutral-400 mt-0.5">
            Hours
          </span>
        </div>
        
        <span className="text-sm font-black text-[#D33E13] pb-3 animate-pulse">:</span>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div className="bg-[#D33E13] text-white rounded-lg h-8 w-8 flex items-center justify-center text-xs font-black tracking-tight shadow-sm shadow-red-500/10">
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <span className="text-[8px] font-extrabold uppercase tracking-widest text-neutral-400 mt-0.5">
            Mins
          </span>
        </div>

        <span className="text-sm font-black text-[#D33E13] pb-3 animate-pulse">:</span>

        {/* Seconds */}
        <div className="flex flex-col items-center">
          <div className="bg-[#D33E13] text-white rounded-lg h-8 w-8 flex items-center justify-center text-xs font-black tracking-tight shadow-sm shadow-red-500/10">
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <span className="text-[8px] font-extrabold uppercase tracking-widest text-neutral-400 mt-0.5">
            Secs
          </span>
        </div>
        
        <div className="ml-auto hidden sm:block">
          <p className="text-[10px] font-extrabold text-neutral-600 dark:text-neutral-300 leading-snug">
            Order now to secure promotional pricing.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Product() {
  const {product, shop, recommended, variants, storeDomain} =
    useLoaderData<typeof loader>();
  const {media, title, vendor, descriptionHtml} = product;
  const {shippingPolicy, refundPolicy} = shop;

  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    variants,
  );

  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const [activeTab, setActiveTab] = useState<'description' | 'shipping' | 'returns'>('description');
  const [toast, setToast] = useState<string | null>(null);
  const [askQuestionOpen, setAskQuestionOpen] = useState(false);
  const [viewersCount, setViewersCount] = useState(13);
  const [salesCount, setSalesCount] = useState(10);
  const [deliveryDate, setDeliveryDate] = useState('');

  // Dynamic viewer count + delivery date
  useEffect(() => {
    setViewersCount(Math.floor(Math.random() * 15) + 8);
    setSalesCount(Math.floor(Math.random() * 12) + 6);

    // Calculate delivery date (today + 4 days)
    const date = new Date();
    date.setDate(date.getDate() + 4);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    setDeliveryDate(date.toLocaleDateString('en-US', options));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      showToast('Product link copied to clipboard!');
    }
  };

  const isOutOfStock = !selectedVariant?.availableForSale;



  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 sm:py-3">
        {/* Breadcrumb Navigation & Utility Controls */}
        <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-gray-100 mb-2 sm:mb-4">
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
            <Link to="/" className="hover:text-primary transition-colors font-medium">Home</Link>
            <span>/</span>
            {product.collections?.nodes?.[0] ? (
              <>
                <Link
                  to={`/collections/${product.collections.nodes[0].handle}`}
                  className="hover:text-primary transition-colors font-medium"
                >
                  {product.collections.nodes[0].title}
                </Link>
                <span>/</span>
              </>
            ) : (
              <>
                <Link to="/collections/all" className="hover:text-primary transition-colors font-medium">
                  Products
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-gray-800 font-semibold truncate max-w-[150px] md:max-w-none">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title="Go Back"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <Link
              to="/collections/all"
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title="View All Collections"
            >
              <GridIcon className="w-5 h-5" />
            </Link>
            <button
              onClick={() => window.history.forward()}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title="Go Forward"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Product Presentation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 lg:gap-14 items-start w-full max-w-full overflow-hidden">
          {/* Left Column: Media Gallery */}
          <div className="lg:col-span-7 min-w-0 w-full overflow-hidden">
            <ProductGallery media={media.nodes} className="w-full" />
          </div>

          {/* Right Column: Info & Buy Actions */}
          <div className="lg:col-span-5 min-w-0 w-full">
            <div className="flex flex-col gap-2 sm:gap-3">
              {/* Urgency Factor badge */}
              <div className="flex items-center gap-2 text-[#D33E13] font-semibold text-xs md:text-sm bg-[#D33E13]/5 px-3 py-1.5 rounded-full w-fit">
                <span>🔥</span>
                <span>{salesCount} sold in last 24 hours</span>
              </div>

              {/* Product title */}
              <div className="grid gap-1">
                <Heading as="h1" className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                  {title}
                </Heading>
                <div className="flex flex-wrap items-center gap-3.5 mt-1">
                  <button
                    onClick={() => {
                      const element = document.getElementById('product-reviews');
                      if (element) {
                        element.scrollIntoView({behavior: 'smooth', block: 'start'});
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold transition-colors focus:outline-none"
                  >
                    <JudgemePreviewBadge id={product.id} template="product" />
                  </button>
                </div>
              </div>

              {/* Price display */}
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-2xl md:text-3xl font-bold text-gray-900">
                  <Money data={selectedVariant.price} withoutTrailingZeros />
                </span>
                {selectedVariant.compareAtPrice &&
                  selectedVariant.price.amount < selectedVariant.compareAtPrice.amount && (
                    <>
                      <span className="text-lg text-gray-400 line-through">
                        <Money data={selectedVariant.compareAtPrice} withoutTrailingZeros />
                      </span>
                      <span className="bg-[#D33E13]/10 text-[#D33E13] text-xs font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#D33E13]/25 shadow-sm">
                        Save {Math.round(((Number(selectedVariant.compareAtPrice.amount) - Number(selectedVariant.price.amount)) / Number(selectedVariant.compareAtPrice.amount)) * 100)}%
                      </span>
                    </>
                  )}
              </div>

              {/* Social Proof viewing count */}
              <div className="flex items-center gap-2 sm:gap-2.5 text-gray-600 text-xs bg-gray-50 border border-gray-150 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 w-fit font-semibold shadow-sm">
                <span className="text-base animate-pulse">👁️</span>
                <span>
                  <strong className="text-[#D33E13] font-extrabold">{viewersCount} customers</strong> are viewing this right now
                </span>
              </div>

              {/* Countdown Timer */}
              <ProductCountdown targetDate={product.countdownTimer?.value} />

              {/* Dynamic Product options & add/buy CTA buttons — sticky so it follows you while scrolling */}
              <div className="sticky top-[calc(var(--header-height,80px)+8px)] z-30 bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-neutral-100 p-3 sm:p-4 -mx-1">
                <ProductForm
                  product={product}
                  productOptions={productOptions}
                  selectedVariant={selectedVariant}
                  storeDomain={storeDomain}
                  showToast={showToast}
                  isOutOfStock={isOutOfStock}
                  handleShare={handleShare}
                />
              </div>

              {/* Trust badges and shipping estimate */}
              <div className="flex flex-col gap-2 sm:gap-3.5 py-2.5 sm:py-4 border-t border-b border-gray-100 my-1 sm:my-2">
                <div className="flex items-start gap-3">
                  <span className="text-xl">📦</span>
                  <div>
                    <h5 className="font-bold text-gray-900 text-sm">
                      Estimate delivery: {deliveryDate || '3-6 days'}
                    </h5>
                    <p className="text-xs text-gray-500 font-medium">Free shipping nationwide on orders above Rs. 5,000</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">🔄</span>
                  <div>
                    <h5 className="font-bold text-gray-900 text-sm">Return within 15 days of purchase</h5>
                    <p className="text-xs text-gray-500 font-medium">Duties & taxes are non-refundable. Easy label returns.</p>
                  </div>
                </div>
              </div>

              {/* Product Meta details checklist */}
              <div className="bg-gray-50/60 border border-gray-100 rounded-2xl p-3 sm:p-5 text-xs md:text-sm flex flex-col gap-2 sm:gap-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-gray-500 font-semibold">Sku:</span>
                  <span className="text-gray-800 font-bold">{selectedVariant.sku || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-gray-500 font-semibold">Available:</span>
                  <span
                    className={clsx(
                      'font-bold px-2 py-0.5 rounded-full text-xs',
                      selectedVariant.availableForSale
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700',
                    )}
                  >
                    {selectedVariant.availableForSale ? 'Instock' : 'Out of stock'}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-gray-500 font-semibold">Type:</span>
                  <span className="text-gray-800 font-bold">{product.productType || 'Simple'}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-500 font-semibold shrink-0">Collections:</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {product.collections?.nodes?.length ? (
                      product.collections.nodes.map((col: any) => (
                        <Link
                          key={col.handle}
                          to={`/collections/${col.handle}`}
                          className="text-[#D33E13] hover:underline font-bold text-xs bg-[#D33E13]/5 px-2 py-0.5 rounded"
                        >
                          {col.title}
                        </Link>
                      ))
                    ) : (
                      <span className="text-gray-800 font-bold">N/A</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Tabbed Content Area */}
        <div id="product-tabs" className="mt-6 sm:mt-16 border-t border-gray-100 pt-5 sm:pt-10">
          <div className="flex flex-wrap gap-2 justify-center mb-4 sm:mb-8 border-b border-gray-100 pb-3 sm:pb-4">
            {(['description', 'shipping', 'returns'] as const).map((tab) => {
              const labels = {
                description: 'Description',
                shipping: 'Shipping & Returns',
                returns: 'Return Policies',
              };
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    'px-5 py-2.5 md:px-6 md:py-3 rounded-full font-extrabold text-xs md:text-sm transition-all duration-200 focus:outline-none',
                    isActive
                      ? 'bg-[#D33E13] text-white shadow-md shadow-[#D33E13]/10 transform scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 md:p-8 min-h-[180px] sm:min-h-[220px] shadow-sm animate-fadeIn">
            {activeTab === 'description' && (
              <div
                className="prose max-w-none prose-orange text-gray-700 leading-relaxed text-sm md:text-base"
                dangerouslySetInnerHTML={{
                  __html: descriptionHtml || '<p>No description available.</p>',
                }}
              />
            )}

            {activeTab === 'shipping' && (
              <div className="prose max-w-none text-gray-700 text-sm md:text-base leading-relaxed">
                {shippingPolicy?.body ? (
                  <div dangerouslySetInnerHTML={{__html: shippingPolicy.body}} />
                ) : (
                  <div>
                    <h4 className="text-base md:text-lg font-bold text-gray-900 mb-3">Shipping Rates & Timelines</h4>
                    <p className="mb-4">
                      We offer standard shipping to all major cities across Pakistan. All orders are packed and processed within 24-48 business hours.
                    </p>
                    <ul className="list-disc list-inside flex flex-col gap-2">
                      <li>Standard Delivery: 3 to 6 working days.</li>
                      <li>Free shipping on orders above Rs. 5,000.</li>
                      <li>Cash on Delivery (COD) available nationwide.</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'returns' && (
              <div className="prose max-w-none text-gray-700 text-sm md:text-base leading-relaxed">
                {refundPolicy?.body ? (
                  <div dangerouslySetInnerHTML={{__html: refundPolicy.body}} />
                ) : (
                  <div>
                    <h4 className="text-base md:text-lg font-bold text-gray-900 mb-3">Return & Refund Policy</h4>
                    <p className="mb-4">
                      Returns are accepted within 15 days of customer receipt on unworn, unused items.
                    </p>
                    <ul className="list-disc list-inside flex flex-col gap-2 mb-4">
                      <li>Returns for receiving incorrect items.</li>
                      <li>Item damaged during transportation.</li>
                      <li>Returns must be in the original safety wrapping/packaging.</li>
                    </ul>
                    <p className="text-xs text-gray-400 italic">
                      Please contact customer care with proof of purchase to arrange return shipments.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dedicated Judge.me Reviews Section */}
        <div id="product-reviews" className="mt-16 border-t border-gray-100 pt-16 scroll-mt-24">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-8 text-center uppercase tracking-wider">
              Customer Reviews
            </h2>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
              <JudgemeReviewWidget id={product.id} />
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Products Carousel */}
      <Suspense fallback={<Skeleton className="h-32" />}>
        <Await
          errorElement="There was a problem loading related products"
          resolve={recommended}
        >
          {(products) => (
            <ProductSwimlane title="Related Products" products={products} />
          )}
        </Await>
      </Suspense>

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-950 text-white px-5 py-3.5 rounded-xl shadow-2xl z-[200] flex items-center gap-3 border border-gray-800 animate-slideIn">
          <span className="text-lg">💡</span>
          <span className="font-semibold text-xs md:text-sm">{toast}</span>
        </div>
      )}

      {/* Ask Question Popup Modal */}
      {askQuestionOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn px-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setAskQuestionOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
            >
              <IconClose className="w-5 h-5" />
            </button>
            <h3 className="text-lg md:text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span>✉️</span> Ask about this product
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAskQuestionOpen(false);
                showToast('Question sent! We will contact you soon.');
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Your Name
                </label>
                <input
                  required
                  type="text"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D33E13] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Your Email
                </label>
                <input
                  required
                  type="email"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D33E13] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Your Question
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D33E13] transition-colors"
                  defaultValue={`Hi, I'm interested in "${title}" and would like to know more details.`}
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-[#D33E13] hover:bg-[#b0300d] text-white font-extrabold py-3 rounded-xl transition-all duration-200 mt-2 text-sm shadow-md shadow-[#D33E13]/10"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Spacing for persistent bottom bar */}
      <div className="pb-20 sm:pb-24" />
    </>
  );
}

/**
 * Enhanced ProductForm component with quantity selectors, wishlist buttons,
 * and custom styled option selectors.
 */
export function ProductForm({
  product,
  productOptions,
  selectedVariant,
  storeDomain,
  showToast,
  isOutOfStock,
  handleShare,
}: {
  product: ProductFragment;
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  storeDomain: string;
  showToast: (msg: string) => void;
  isOutOfStock: boolean;
  handleShare: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlist, setIsWishlist] = useState(false);
  const [isCompare, setIsCompare] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wList = JSON.parse(localStorage.getItem('wishlist') || '[]') as string[];
      setIsWishlist(wList.includes(product.id));

      const cList = JSON.parse(localStorage.getItem('compare') || '[]') as string[];
      setIsCompare(cList.includes(product.id));
    }
  }, [product.id]);

  const toggleWishlist = () => {
    if (typeof window !== 'undefined') {
      let list = JSON.parse(localStorage.getItem('wishlist') || '[]') as string[];
      if (list.includes(product.id)) {
        list = list.filter((id: string) => id !== product.id);
        setIsWishlist(false);
        showToast('Removed from wishlist');
      } else {
        list.push(product.id);
        setIsWishlist(true);
        showToast('Added to wishlist');
      }
      localStorage.setItem('wishlist', JSON.stringify(list));
      window.dispatchEvent(new Event('wishlist-updated'));
    }
  };

  const toggleCompare = () => {
    if (typeof window !== 'undefined') {
      let list = JSON.parse(localStorage.getItem('compare') || '[]') as string[];
      if (list.includes(product.id)) {
        list = list.filter((id: string) => id !== product.id);
        setIsCompare(false);
        showToast('Removed from compare list');
      } else {
        if (list.length >= 4) {
          showToast('You can compare up to 4 products');
          return;
        }
        list.push(product.id);
        setIsCompare(true);
        showToast('Added to compare list');
      }
      localStorage.setItem('compare', JSON.stringify(list));
      window.dispatchEvent(new Event('compare-updated'));
    }
  };

  return (
    <div className="grid gap-3 sm:gap-6">
      <div className="grid gap-2 sm:gap-4">
        {/* Scarcity Progress Bar */}
        {selectedVariant && selectedVariant.availableForSale && (
          <div className="bg-orange-50/70 border border-orange-100/80 rounded-2xl p-3 sm:p-4 w-full shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                ⚡ Hurry! Selling fast - 87% of stock claimed
              </span>
              <span className="text-xs font-extrabold text-red-600 animate-pulse">
                Only 3 left!
              </span>
            </div>
            <div className="w-full bg-gray-200/60 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#E04A1D] to-[#D33E13] h-full rounded-full transition-all duration-1000"
                style={{ width: '87%' }}
              />
            </div>
          </div>
        )}

        {/* Render Option Swatches / Option Buttons */}
        {productOptions
          .filter(
            (option) =>
              !(
                option.name === 'Title' &&
                option.optionValues.length === 1 &&
                option.optionValues[0].name === 'Default Title'
              ),
          )
          .map((option) => {
            const optionIndex = productOptions.findIndex((o) => o.name === option.name);
            const isColorOption = option.name.toLowerCase() === 'color' || option.name.toLowerCase() === 'colour';
            // Check if option is standard or has many options
            return (
              <div
                key={option.name}
                className="product-options flex flex-col flex-wrap mb-2 gap-y-2 last:mb-0"
              >
                <Heading as="legend" className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  {option.name}
                </Heading>
                <div className="flex flex-wrap items-baseline gap-2.5">
                  {option.optionValues.length > 7 ? (
                    <div className="relative w-full">
                    <Listbox>
                      {({open}) => (
                        <>
                          <Listbox.Button
                            ref={closeRef}
                            className={clsx(
                              'flex items-center justify-between w-full py-3 px-4 border border-gray-200 rounded-xl bg-white text-sm font-semibold text-gray-800',
                              open && 'border-[#D33E13]',
                            )}
                          >
                            <span>
                              {selectedVariant?.selectedOptions[optionIndex].value}
                            </span>
                            <IconCaret direction={open ? 'up' : 'down'} />
                          </Listbox.Button>
                          <Listbox.Options
                            className={clsx(
                              'border-gray-200 bg-white absolute bottom-12 z-30 grid h-48 w-full overflow-y-scroll rounded-xl border px-2 py-2 transition-[max-height] duration-150 sm:bottom-auto md:border-b shadow-lg',
                              open ? 'max-h-48' : 'max-h-0',
                            )}
                          >
                            {option.optionValues
                              .filter((value) => value.available)
                              .map(
                                ({
                                  isDifferentProduct,
                                  name,
                                  variantUriQuery,
                                  handle,
                                  selected,
                                }) => (
                                  <Listbox.Option
                                    key={`option-${option.name}-${name}`}
                                    value={name}
                                  >
                                    <Link
                                      {...(!isDifferentProduct ? {rel: 'nofollow'} : {})}
                                      to={`/products/${handle}?${variantUriQuery}`}
                                      preventScrollReset
                                      className={clsx(
                                        'text-primary w-full p-2.5 text-sm font-medium transition rounded-lg flex justify-start items-center text-left cursor-pointer hover:bg-gray-50',
                                        selected && 'bg-gray-100 font-bold',
                                      )}
                                      onClick={() => {
                                        if (!closeRef?.current) return;
                                        closeRef.current.click();
                                      }}
                                    >
                                      {name}
                                      {selected && (
                                        <span className="ml-auto">
                                          <IconCheck />
                                        </span>
                                      )}
                                    </Link>
                                  </Listbox.Option>
                                ),
                              )}
                          </Listbox.Options>
                        </>
                      )}
                    </Listbox>
                  </div>
                ) : (
                  option.optionValues.map(
                    ({
                      isDifferentProduct,
                      name,
                      variantUriQuery,
                      handle,
                      selected,
                      available,
                      swatch,
                    }) => (
                      <Link
                        key={option.name + name}
                        {...(!isDifferentProduct ? {rel: 'nofollow'} : {})}
                        to={`/products/${handle}?${variantUriQuery}`}
                        preventScrollReset
                        prefetch="intent"
                        replace
                        className={clsx(
                          'cursor-pointer transition-all duration-200 text-center inline-block',
                          isColorOption
                            ? 'p-0.5 border-2 rounded-full shadow-sm hover:scale-105 active:scale-95'
                            : 'px-4 py-2 border rounded-xl font-bold text-xs md:text-sm shadow-sm hover:border-gray-400 active:scale-95',
                          selected
                            ? isColorOption
                              ? 'border-[#D33E13] scale-110 shadow-md'
                              : 'border-[#D33E13] bg-[#D33E13]/5 text-[#D33E13] scale-102 font-extrabold'
                            : isColorOption
                              ? 'border-gray-200 hover:border-gray-400 bg-white'
                              : 'border-gray-200 bg-white text-gray-700',
                          available
                            ? 'opacity-100'
                            : 'opacity-40 cursor-not-allowed line-through',
                        )}
                      >
                        {isColorOption ? (
                          <ProductOptionSwatch swatch={swatch} name={name} />
                        ) : (
                          <span>{name}</span>
                        )}
                      </Link>
                    ),
                  )
                )}
              </div>
            </div>
          );
        })}

        {/* Quantity, Cart and Checkout panel */}
        {selectedVariant && (
          <div className="flex flex-col gap-2.5 sm:gap-4 mt-1 sm:mt-2">
            {/* Row 1: Quantity + Add to Cart */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Quantity Selector */}
              <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 h-[52px] px-2.5 shadow-sm">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => q - 1)}
                  className="w-8 h-8 flex items-center justify-center text-xl text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-500 font-bold"
                >
                  &minus;
                </button>
                <span className="w-10 text-center font-extrabold text-gray-800 text-sm">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 flex items-center justify-center text-lg text-gray-500 hover:text-gray-900 font-bold"
                >
                  &#43;
                </button>
              </div>

              {/* Add to Cart Button */}
              <div className="flex-1 min-w-[180px]">
                {isOutOfStock ? (
                  <Button
                    variant="secondary"
                    disabled
                    className="w-full border-gray-200 bg-gray-100 text-gray-400 h-[52px] rounded-xl flex items-center justify-center font-bold text-sm"
                  >
                    Sold out
                  </Button>
                ) : (
                  <AddToCartButton
                    lines={[
                      {
                        merchandiseId: selectedVariant.id!,
                        quantity: quantity,
                      },
                    ]}
                    className="w-full bg-[#D33E13] hover:bg-[#b0300d] text-white font-extrabold py-3.5 px-6 rounded-xl transition-all duration-200 transform active:scale-[0.98] shadow-md shadow-[#D33E13]/10 flex items-center justify-center gap-2 h-[52px] text-sm leading-none"
                    data-test="add-to-cart"
                  >
                    <span>Add to Cart</span>
                  </AddToCartButton>
                )}
              </div>
            </div>

            {/* Row 2: Buy It Now Checkout CTA */}
            {!isOutOfStock && (
              <>
                <button
                  onClick={() => {
                    const checkoutUrl = `${storeDomain}/cart/${selectedVariant.id.replace(
                      'gid://shopify/ProductVariant/',
                      '',
                    )}:${quantity}`;
                    window.location.href = checkoutUrl;
                  }}
                  className="w-full bg-[#E04A1D] hover:bg-[#c53a12] text-white font-extrabold py-4 px-6 rounded-xl transition-all duration-200 shadow-md flex items-center justify-center text-base md:text-lg tracking-wide uppercase active:scale-[0.98]"
                >
                  Buy it now
                </button>

                {/* Wishlist | Compare | Share */}
                <div className="flex items-center gap-4 text-xs text-gray-500 font-bold py-1 border-y border-gray-100">
                  <button
                    onClick={toggleWishlist}
                    className={clsx(
                      'flex items-center gap-1.5 transition-colors',
                      isWishlist ? 'text-[#D33E13]' : 'hover:text-[#D33E13]',
                    )}
                  >
                    <HeartIcon
                      className={clsx('w-3.5 h-3.5', isWishlist ? 'fill-current' : 'fill-none stroke-current')}
                    />
                    {isWishlist ? 'Wishlisted' : 'Wishlist'}
                  </button>
                  <span className="text-gray-200">|</span>
                  <button
                    onClick={toggleCompare}
                    className={clsx(
                      'flex items-center gap-1.5 transition-colors',
                      isCompare ? 'text-[#D33E13]' : 'hover:text-[#D33E13]',
                    )}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                    {isCompare ? 'Comparing' : 'Compare'}
                  </button>
                  <span className="text-gray-200">|</span>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 hover:text-[#D33E13] transition-colors"
                  >
                    <ShareIcon className="w-3.5 h-3.5" />
                    Share
                  </button>
                </div>

                {/* Secure Checkout Badges */}
                <div className="flex flex-col items-center gap-2 mt-2 py-2 border-t border-gray-100">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Guaranteed Safe Checkout</span>
                  <div className="flex justify-center gap-3.5 items-center flex-wrap">
                    <VisaIcon className="h-4 w-auto opacity-70 hover:opacity-100 transition-opacity" />
                    <MastercardIcon className="h-4 w-auto opacity-70 hover:opacity-100 transition-opacity" />
                    <CodIcon />
                    <div className="flex items-center gap-1 text-gray-500 text-[10px] font-extrabold">
                      <SecureIcon className="w-3.5 h-3.5" />
                      <span>SSL SECURED</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Persistent Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] py-2 px-3 sm:py-3 sm:px-6 w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
          {/* Quantity Selector */}
          <div className="flex items-center border-2 border-gray-100 rounded-full bg-gray-50 h-10 sm:h-12 px-1 flex-shrink-0">
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => q - 1)}
              className="w-8 sm:w-10 h-full flex items-center justify-center text-xl text-gray-400 hover:text-black disabled:opacity-30 transition-colors"
            >
              &minus;
            </button>
            <span className="w-6 sm:w-8 text-center font-bold text-black text-sm sm:text-base">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 sm:w-10 h-full flex items-center justify-center text-xl text-gray-400 hover:text-black transition-colors"
            >
              &#43;
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-1 items-center gap-2 sm:gap-3 min-w-0">
            {!isOutOfStock ? (
              <>
                <AddToCartButton
                  lines={[{merchandiseId: selectedVariant.id!, quantity}]}
                  className="flex-1 bg-black hover:bg-neutral-800 text-white font-extrabold py-2 px-2 sm:px-6 rounded-full text-[11px] sm:text-sm whitespace-nowrap shadow-md h-10 sm:h-12 flex items-center justify-center transition-transform active:scale-95 uppercase tracking-wider"
                >
                  Add to Cart
                </AddToCartButton>
                <button
                  onClick={() => {
                    const checkoutUrl = `${storeDomain}/cart/${selectedVariant.id.replace(
                      'gid://shopify/ProductVariant/',
                      '',
                    )}:${quantity}`;
                    window.location.href = checkoutUrl;
                  }}
                  className="flex-1 bg-[#D33E13] hover:bg-[#b0300d] text-white font-extrabold py-2 px-2 sm:px-6 rounded-full text-[11px] sm:text-sm whitespace-nowrap shadow-md shadow-[#D33E13]/20 h-10 sm:h-12 flex items-center justify-center transition-transform active:scale-95 uppercase tracking-wider"
                >
                  Buy it now
                </button>
              </>
            ) : (
              <div className="flex-1 bg-gray-100 text-gray-400 font-bold py-2 px-4 rounded-full text-sm sm:text-base whitespace-nowrap h-10 sm:h-12 flex items-center justify-center uppercase tracking-widest">
                Sold Out
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductOptionSwatch({
  swatch,
  name,
}: {
  swatch?: Maybe<ProductOptionValueSwatch> | undefined;
  name: string;
}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  // Custom client-side color swatch resolver to map standard colors automatically
  const getHexColor = (colorName: string): string | null => {
    const colors: Record<string, string> = {
      black: '#000000',
      white: '#ffffff',
      red: '#e53e3e',
      blue: '#3182ce',
      green: '#38a169',
      yellow: '#ecc94b',
      orange: '#dd6b20',
      purple: '#805ad5',
      pink: '#d53f8c',
      gray: '#718096',
      charcoal: '#333333',
      ember: '#ff7233',
      sand: '#e2d5c3',
      mint: '#a7f3d0',
      navy: '#1a365d',
      gold: '#d69e2e',
      silver: '#cbd5e0',
      bronze: '#cd7f32',
    };
    return colors[colorName.toLowerCase().trim()] || null;
  };

  const resolvedColor = color || getHexColor(name);

  if (!image && !resolvedColor) return <span>{name}</span>;

  return (
    <div
      aria-label={name}
      className="w-7 h-7 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center mx-auto shadow-inner"
      style={{
        backgroundColor: resolvedColor || 'transparent',
      }}
    >
      {!!image && (
        <img src={image} alt={name} className="w-full h-full object-cover" />
      )}
    </div>
  );
}

// Payment support icons
function VisaIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M4 10H44V38H4V10Z" fill="#1A1F71"/>
      <path d="M19.123 29.832L16.297 18.067H13.627L10.957 26.697C10.627 27.687 10.357 28.517 9.537 29.237C8.617 30.017 7.237 30.732 5 30.932V31.5H11.597C12.927 31.5 13.917 30.717 14.247 29.352L15.687 23.367L19.123 29.832ZM31.117 22.032C31.117 20.367 29.837 19.347 27.567 18.237C25.297 17.127 23.757 16.592 23.757 15.627C23.757 14.887 24.597 14.077 26.477 14.077C28.357 14.077 29.417 14.737 30.347 15.167L30.977 12.352C29.977 11.952 28.597 11.5 26.797 11.5C22.617 11.5 19.687 13.517 19.687 16.947C19.687 19.137 21.687 20.247 23.277 21.032C24.867 21.817 25.687 22.377 25.687 23.097C25.687 23.867 24.817 24.717 23.017 24.717C21.217 24.717 20.067 24.117 19.123 23.687L18.497 26.517C19.497 26.982 21.117 27.352 22.917 27.352C27.357 27.352 31.117 25.137 31.117 22.032ZM36.957 18.067H34.407C33.627 18.067 33.017 18.517 32.737 19.182L28.187 29.897H31.527L32.197 28.097H36.217L36.577 29.897H39.527L36.957 18.067ZM33.097 25.597L35.217 19.882L35.827 23.097L33.097 25.597ZM24.457 18.067H22.327L19.237 29.897H22.327L24.457 18.067Z" fill="#F7B600"/>
    </svg>
  );
}

function MastercardIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M4 10H44V38H4V10Z" fill="#3F3F3F"/>
      <circle cx="20" cy="24" r="10" fill="#FF5F00" fillOpacity="0.9"/>
      <circle cx="28" cy="24" r="10" fill="#F79E1B" fillOpacity="0.9"/>
    </svg>
  );
}

function CodIcon() {
  return (
    <span className="border border-gray-300 rounded px-1.5 py-0.5 text-[9px] font-extrabold text-gray-500 uppercase bg-gray-50 tracking-wider">
      COD
    </span>
  );
}

function SecureIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

// Icons utilities specifically styled for product detail sections
function ChevronLeftIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}



function GridIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function HeartIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ShareIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function QuestionMarkCircleIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    id
    availableForSale
    selectedOptions {
      name
      value
    }
    image {
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    productType
    collections(first: 10) {
      nodes {
        title
        handle
      }
    }
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    countdownTimer: metafield(namespace: "custom", key: "countdown_timer") {
      value
    }
    seo {
      description
      title
    }
    media(first: 7) {
      nodes {
        ...Media
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
    shop {
      name
      primaryDomain {
        url
      }
      shippingPolicy {
        body
        handle
      }
      refundPolicy {
        body
        handle
      }
    }
  }
  ${MEDIA_FRAGMENT}
  ${PRODUCT_FRAGMENT}
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  query productRecommendations(
    $productId: ID!
    $count: Int
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    recommended: productRecommendations(productId: $productId) {
      ...ProductCard
    }
    additional: products(first: $count, sortKey: BEST_SELLING) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

async function getRecommendedProducts(
  storefront: Storefront,
  productId: string,
) {
  const products = await storefront.query(RECOMMENDED_PRODUCTS_QUERY, {
    variables: {productId, count: 12},
    cache: storefront.CacheShort(),
  });

  invariant(products, 'No data returned from Shopify API');

  const mergedProducts = (products.recommended ?? [])
    .concat(products.additional.nodes)
    .filter(
      (value, index, array) =>
        array.findIndex((value2) => value2.id === value.id) === index,
    );

  const originalProduct = mergedProducts.findIndex(
    (item) => item.id === productId,
  );

  mergedProducts.splice(originalProduct, 1);

  return {nodes: mergedProducts};
}
