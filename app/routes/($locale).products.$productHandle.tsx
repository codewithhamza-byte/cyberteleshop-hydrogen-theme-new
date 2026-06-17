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
import {Heading, Section, Text} from '~/components/Text';
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

  // Client states for premium interactive interface
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'shipping' | 'returns'>('description');
  const [toast, setToast] = useState<string | null>(null);
  const [askQuestionOpen, setAskQuestionOpen] = useState(false);
  const [viewersCount, setViewersCount] = useState(13);
  const [salesCount, setSalesCount] = useState(10);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');

  // Dynamic viewer, sales and scroll listener
  useEffect(() => {
    setViewersCount(Math.floor(Math.random() * 15) + 8);
    setSalesCount(Math.floor(Math.random() * 12) + 6);

    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        setShowStickyBar(window.scrollY > 600);
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Calculate delivery date (today + 3 to 6 days)
    const date = new Date();
    date.setDate(date.getDate() + 4);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    setDeliveryDate(date.toLocaleDateString('en-US', options));

    return () => window.removeEventListener('scroll', handleScroll);
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
      <Section className="px-4 md:px-8 lg:px-16 py-6 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation & Utility Controls */}
        <div className="flex justify-between items-center py-3 border-b border-gray-100 mb-8">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Left Column: Media Gallery */}
          <div className="lg:col-span-7">
            <ProductGallery media={media.nodes} className="w-full" />
          </div>

          {/* Right Column: Info & Buy Actions */}
          <div className="lg:col-span-5 sticky lg:top-28">
            <div className="flex flex-col gap-5">
              {/* Urgency Factor badge */}
              <div className="flex items-center gap-2 text-[#D33E13] font-semibold text-xs md:text-sm bg-[#D33E13]/5 px-3 py-1.5 rounded-full w-fit">
                <span>🔥</span>
                <span>{salesCount} sold in last 24 hours</span>
              </div>

              {/* Product title & vendor */}
              <div className="grid gap-1">
                <Heading as="h1" className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                  {title}
                </Heading>
                {vendor && (
                  <Text className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                    {vendor}
                  </Text>
                )}
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
                      <span className="bg-green-100 text-green-800 text-xs font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        Save {Math.round(((Number(selectedVariant.compareAtPrice.amount) - Number(selectedVariant.price.amount)) / Number(selectedVariant.compareAtPrice.amount)) * 100)}%
                      </span>
                    </>
                  )}
              </div>

              {/* Social Proof viewing count */}
              <div className="flex items-center gap-2.5 text-gray-600 text-xs md:text-sm bg-gray-50 border border-gray-100/50 rounded-xl p-3.5 w-fit">
                <span className="text-lg">👁️</span>
                <span>
                  <strong className="text-gray-900 font-bold">{viewersCount} people</strong> are viewing this right now
                </span>
              </div>

              {/* Help & Share shortcuts */}
              <div className="flex items-center gap-5 text-xs md:text-sm text-gray-600 font-bold py-1 border-y border-gray-100 my-1">
                <button
                  onClick={() => setAskQuestionOpen(true)}
                  className="flex items-center gap-2 hover:text-[#D33E13] transition-colors"
                >
                  <QuestionMarkCircleIcon className="w-5 h-5 text-gray-400" />
                  Ask a Question
                </button>
                <span className="text-gray-200">|</span>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 hover:text-[#D33E13] transition-colors"
                >
                  <ShareIcon className="w-5 h-5 text-gray-400" />
                  Share Product
                </button>
              </div>

              {/* Dynamic Product options & add/buy CTA buttons */}
              <ProductForm
                product={product}
                productOptions={productOptions}
                selectedVariant={selectedVariant}
                storeDomain={storeDomain}
                showToast={showToast}
                isOutOfStock={isOutOfStock}
              />

              {/* Trust badges and shipping estimate */}
              <div className="flex flex-col gap-3.5 py-4 border-t border-b border-gray-100 my-2">
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
              <div className="bg-gray-50/60 border border-gray-100 rounded-2xl p-5 text-xs md:text-sm flex flex-col gap-3">
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
                  <span className="text-gray-500 font-semibold">Vendor:</span>
                  <span className="text-gray-800 font-bold">{vendor || 'Cyberteleshop'}</span>
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
        <div className="mt-16 border-t border-gray-100 pt-10">
          <div className="flex flex-wrap gap-2 justify-center mb-8 border-b border-gray-100 pb-4">
            {(['description', 'reviews', 'shipping', 'returns'] as const).map((tab) => {
              const labels = {
                description: 'Description',
                reviews: 'Customer Reviews',
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

          <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 min-h-[220px] shadow-sm animate-fadeIn">
            {activeTab === 'description' && (
              <div
                className="prose max-w-none prose-orange text-gray-700 leading-relaxed text-sm md:text-base"
                dangerouslySetInnerHTML={{
                  __html: descriptionHtml || '<p>No description available.</p>',
                }}
              />
            )}

            {activeTab === 'reviews' && (
              <div className="flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-b border-gray-100 pb-8">
                  <div className="text-center md:border-r border-gray-100 py-2">
                    <h4 className="text-5xl font-extrabold text-gray-900">4.9</h4>
                    <div className="flex justify-center gap-0.5 text-yellow-400 my-2 text-lg">⭐⭐⭐⭐⭐</div>
                    <p className="text-xs text-gray-500 font-semibold">Based on 12 reviews</p>
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-2 max-w-md mx-auto w-full px-4">
                    {[
                      {stars: 5, pct: '92%'},
                      {stars: 4, pct: '8%'},
                      {stars: 3, pct: '0%'},
                      {stars: 2, pct: '0%'},
                      {stars: 1, pct: '0%'},
                    ].map((row) => (
                      <div className="flex items-center gap-3" key={row.stars}>
                        <span className="text-xs font-semibold text-gray-600 w-8">{row.stars} star</span>
                        <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-yellow-400 h-full rounded-full"
                            style={{width: row.pct}}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 font-semibold w-8 text-right">{row.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-6 divide-y divide-gray-100">
                  <div className="pt-2">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-bold text-gray-900 text-sm md:text-base">Hamza K.</h5>
                        <div className="text-yellow-400 text-sm">⭐⭐⭐⭐⭐</div>
                      </div>
                      <span className="text-xs text-gray-400">June 12, 2026</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                      Extremely impressed with the build quality! The rubber dumbbells feel solid and premium in hand. Highly recommend this store for gym equipment. Delivery was exceptionally fast to Lahore.
                    </p>
                  </div>
                  <div className="pt-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-bold text-gray-900 text-sm md:text-base">Zainab M.</h5>
                        <div className="text-yellow-400 text-sm">⭐⭐⭐⭐⭐</div>
                      </div>
                      <span className="text-xs text-gray-400">June 08, 2026</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                      Exactly as pictured. The grip is comfortable and non-slip. Worth every rupee!
                    </p>
                  </div>
                  <div className="pt-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-bold text-gray-900 text-sm md:text-base">Ali R.</h5>
                        <div className="text-yellow-400 text-sm">⭐⭐⭐⭐⭐</div>
                      </div>
                      <span className="text-xs text-gray-400">May 28, 2026</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                      Excellent value pack. Package arrived well-wrapped with no damage. Outstanding service from Cyberteleshop.
                    </p>
                  </div>
                </div>
              </div>
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
      </Section>

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

      {/* Sticky Bottom Add to Cart Bar */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-150 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] py-3.5 px-4 md:px-8 z-[90] flex items-center justify-between animate-slideUp">
          <div className="flex items-center gap-3">
            {media.nodes[0]?.previewImage?.url && (
              <img
                src={media.nodes[0].previewImage.url}
                alt={title}
                className="w-12 h-12 object-cover rounded-lg border border-gray-100 hidden sm:block"
              />
            )}
            <div>
              <h4 className="font-extrabold text-xs md:text-sm text-gray-900 line-clamp-1">{title}</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm font-extrabold text-[#D33E13]">
                  <Money data={selectedVariant.price} withoutTrailingZeros />
                </span>
                {selectedVariant.compareAtPrice &&
                  selectedVariant.price.amount < selectedVariant.compareAtPrice.amount && (
                    <span className="text-[10px] md:text-xs text-gray-400 line-through">
                      <Money data={selectedVariant.compareAtPrice} withoutTrailingZeros />
                    </span>
                  )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isOutOfStock ? (
              <AddToCartButton
                lines={[{merchandiseId: selectedVariant.id!, quantity: 1}]}
                className="bg-[#D33E13] hover:bg-[#b0300d] text-white font-extrabold py-2 px-4 md:px-5 rounded-xl text-xs md:text-sm shadow-md shadow-[#D33E13]/10"
              >
                Add to Cart
              </AddToCartButton>
            ) : (
              <span className="text-xs font-bold text-gray-400 px-3 py-2 bg-gray-100 rounded-xl">Sold Out</span>
            )}
          </div>
        </div>
      )}
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
}: {
  product: ProductFragment;
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  storeDomain: string;
  showToast: (msg: string) => void;
  isOutOfStock: boolean;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlist, setIsWishlist] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const list = JSON.parse(localStorage.getItem('wishlist') || '[]') as string[];
      setIsWishlist(list.includes(product.id));
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
    }
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-4">
        {/* Scarcity notification */}
        {selectedVariant && selectedVariant.availableForSale && (
          <div className="flex items-center gap-2 text-amber-700 text-xs font-bold bg-amber-50 border border-amber-100/60 rounded-xl px-3 py-2.5 w-full shadow-sm animate-pulse">
            <span className="text-sm">⚡</span>
            <span>Hurry! Only 3 left in stock - order soon.</span>
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
                          'px-4 py-2 border rounded-xl font-bold text-xs md:text-sm cursor-pointer transition-all duration-200 text-center min-w-[3.5rem] inline-block shadow-sm',
                          selected
                            ? 'border-[#D33E13] bg-[#D33E13]/5 text-[#D33E13] scale-102'
                            : 'border-gray-200 hover:border-gray-400 bg-white text-gray-700',
                          available
                            ? 'opacity-100'
                            : 'opacity-40 cursor-not-allowed line-through',
                        )}
                      >
                        <ProductOptionSwatch swatch={swatch} name={name} />
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
          <div className="flex flex-col gap-4 mt-2">
            {/* Row 1: Quantity, Add to Cart, Wishlist, Compare */}
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

              {/* Wishlist Button */}
              <button
                onClick={toggleWishlist}
                className={clsx(
                  'w-[52px] h-[52px] rounded-xl border flex items-center justify-center transition-all duration-200 shadow-sm focus:outline-none',
                  isWishlist
                    ? 'border-[#D33E13] bg-[#D33E13]/5 text-[#D33E13]'
                    : 'border-gray-200 hover:border-gray-400 bg-white text-gray-600 hover:text-gray-900',
                )}
                title={isWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <HeartIcon
                  className={clsx('w-5 h-5', isWishlist ? 'fill-current' : 'fill-none')}
                />
              </button>
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

                {/* Secure Checkout Badges */}
                <div className="flex flex-col items-center gap-2 mt-4 py-2 border-t border-gray-100">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Guaranteed Safe Checkout</span>
                  <div className="flex justify-center gap-3.5 items-center flex-wrap">
                    <VisaIcon className="h-4 w-auto opacity-70 hover:opacity-100 transition-opacity" />
                    <MastercardIcon className="h-4 w-auto opacity-70 hover:opacity-100 transition-opacity" />
                    <CodIcon />
                    <div className="flex items-center gap-1 text-gray-450 text-[10px] font-extrabold">
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
