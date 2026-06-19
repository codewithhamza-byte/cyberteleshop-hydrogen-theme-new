import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {Suspense, useState, useRef, useEffect} from 'react';
import {Await, useLoaderData} from '@remix-run/react';
import {getSeoMeta, Image} from '@shopify/hydrogen';
import {ProductCard} from '~/components/ProductCard';

import {Button} from '~/components/Button';
import {FeaturedCollections} from '~/components/FeaturedCollections';
import {ProductSwimlane} from '~/components/ProductSwimlane';
import {Heading, Section, Text} from '~/components/Text';
import {Grid} from '~/components/Grid';
import {Link} from '~/components/Link';
import type {HomepageCategoryCollectionsQuery} from 'storefrontapi.generated';
import {seoPayload} from '~/lib/seo.server';
import {routeHeaders, CACHE_AD_LANDING} from '~/data/cache';
import {PRODUCT_CARD_FRAGMENT} from '~/data/fragments';

export const headers = routeHeaders;

export async function loader(args: LoaderFunctionArgs) {
  const {params, context} = args;
  const {language, country} = context.storefront.i18n;

  if (
    params.locale &&
    params.locale.toLowerCase() !== `${language}-${country}`.toLowerCase()
  ) {
    throw new Response(null, {status: 404});
  }

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

async function loadCriticalData({context, request}: LoaderFunctionArgs) {
  const {shop, brandMetaobject} = await context.storefront.query(HOMEPAGE_SEO_QUERY, {
    cache: context.storefront.CacheShort(),
  });

  console.log('[Homepage Metaobject Debug] brandMetaobject nodes:', brandMetaobject?.nodes);
  const brandNode = brandMetaobject?.nodes?.[0];
  const brandFields: Record<string, any> = {};
  if (brandNode) {
    for (const field of brandNode.fields || []) {
      brandFields[field.key] = field;
    }
  }

  return {
    shop,
    brandFields,
    seo: seoPayload.home({url: request.url}),
  };
}

function loadDeferredData({context}: LoaderFunctionArgs) {
  const {language, country} = context.storefront.i18n;

  const featuredProducts = context.storefront
    .query(HOMEPAGE_FEATURED_PRODUCTS_QUERY, {
      variables: {
        country,
        language,
      },
      cache: context.storefront.CacheShort(),
    })
    .catch((error) => {
      console.error(error);
      return null;
    });

  const categoryCollections = context.storefront
    .query(CATEGORY_COLLECTIONS_QUERY, {
      variables: {
        country,
        language,
      },
      cache: context.storefront.CacheShort(),
    })
    .catch((error) => {
      console.error(error);
      return null;
    });

  const showcaseCollections = context.storefront
    .query(COLLECTIONS_SHOWCASE_QUERY, {
      variables: {
        country,
        language,
      },
      cache: context.storefront.CacheShort(),
    })
    .catch((error) => {
      console.error(error);
      return null;
    });

  return {
    featuredProducts,
    categoryCollections,
    showcaseCollections,
  };
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Homepage() {
  const {
    shop,
    brandFields,
    featuredProducts,
    categoryCollections,
    showcaseCollections,
  } = useLoaderData<typeof loader>();

  return (
    <>
      <LandingHero brandFields={brandFields} />
      {showcaseCollections && (
        <Suspense>
          <Await resolve={showcaseCollections}>
            {(response) => (
              <>
                <CollectionShowcase data={response} />
                
                {/* 1st Section: New Products */}
                <ProductSection
                  title="New Products"
                  subtitle="Discover our latest arrivals and newest additions to the store."
                  products={response?.newArrivals?.products?.nodes || []}
                />

                {/* 2nd Section: Fitness */}
                <ProductSection
                  title="Fitness"
                  subtitle="Stay Active. Stay Strong. Discover the Best in Fitness Gear."
                  products={response?.fitness?.products?.nodes || []}
                />

                {/* 3rd Section: Health & Beauty */}
                <ProductSection
                  title="Health & Beauty"
                  subtitle="Feel Good. Look Great. Explore Premium Health & Beauty Products."
                  products={response?.healthBeauty?.products?.nodes || []}
                />

                {/* Customer Testimonials Section */}
                <TestimonialsSection />
              </>
            )}
          </Await>
        </Suspense>
      )}
      {categoryCollections && (
        <Suspense>
          <Await resolve={categoryCollections}>
            {(response) => (
              <>
                <CategorySlider collections={response} />
                {/* Flash Sale Countdown right after Category Slider */}
                <FlashSaleCountdown />
              </>
            )}
          </Await>
        </Suspense>
      )}
      <FeatureBlocks />

      {featuredProducts && (
        <Suspense>
          <Await resolve={featuredProducts}>
            {(response) => {
              if (
                !response ||
                !response.products ||
                !response.products.nodes
              ) {
                return null;
              }

              return (
                <ProductSwimlane
                  products={response.products}
                  title="Featured Products"
                  count={8}
                />
              );
            }}
          </Await>
        </Suspense>
      )}

      <SmartTechPromo />
    </>
  );
}

function SmartTechPromo() {
  return (
    <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white overflow-hidden rounded-[1.75rem] md:rounded-[2.5rem] my-12 mx-4 md:mx-8 lg:mx-16 border border-gray-800 shadow-2xl relative py-12 md:py-16">
      {/* Decorative gradient background glows */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 rounded-full bg-[#D33E13]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 rounded-full bg-orange-600/10 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-12 items-center">
          
          {/* Left Column: Promotion Copy */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#D33E13] border border-[#D33E13]/30 px-3 py-1 rounded-full bg-[#D33E13]/5 mb-6">
              Limited Time Event
            </span>
            <Heading as="h2" className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-none text-white mb-6 uppercase">
              Next-Gen <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-[#D33E13]">
                Smart Tech
              </span>
            </Heading>
            <p className="text-sm md:text-base text-gray-300 mb-8 leading-relaxed font-medium">
              Elevate your lifestyle with our curated range of smart gadgets, premium sound setups, and elite gaming peripherals. Checked and verified for absolute performance before delivery.
            </p>
            <Link 
              to="/collections/all"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#D33E13] hover:bg-[#b8330d] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-200 shadow-lg shadow-[#D33E13]/20 hover:-translate-y-0.5"
            >
              Shop the Sale <span>&rarr;</span>
            </Link>
          </div>

          {/* Right Column: Dynamic Cards Grid */}
          <div className="lg:col-span-7 grid gap-4 grid-cols-1 sm:grid-cols-2">
            
            {/* Card 1 */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
              <span className="text-2xl mb-4 block">🎧</span>
              <Heading as="h4" className="text-base font-extrabold text-white mb-2 group-hover:text-[#D33E13] transition-colors">
                Premium Audio
              </Heading>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                Noise-cancelling headsets and surround-sound systems for crystal clarity.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
              <span className="text-2xl mb-4 block">⌚</span>
              <Heading as="h4" className="text-base font-extrabold text-white mb-2 group-hover:text-[#D33E13] transition-colors">
                Wearable Gadgets
              </Heading>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                Smartwatches featuring health tracking, GPS navigation, and long battery life.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
              <span className="text-2xl mb-4 block">🕹️</span>
              <Heading as="h4" className="text-base font-extrabold text-white mb-2 group-hover:text-[#D33E13] transition-colors">
                Gaming Gear
              </Heading>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                RGB controllers, keypads, and mechanical mice optimized for elite response speeds.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
              <span className="text-2xl mb-4 block">🔌</span>
              <Heading as="h4" className="text-base font-extrabold text-white mb-2 group-hover:text-[#D33E13] transition-colors">
                Smart Utilities
              </Heading>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                Wireless fast-charging stands, high-output powerbanks, and auto adapters.
              </p>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

function LandingHero({brandFields}: {brandFields: any}) {
  const heroBannerImage = brandFields?.hero_banner_image;
  
  let heroBannerLink = '/collections/all';
  const rawLink = brandFields?.hero_banner_link?.value;
  if (rawLink) {
    try {
      const parsed = JSON.parse(rawLink) as any;
      heroBannerLink = parsed?.url || rawLink;
    } catch {
      heroBannerLink = rawLink;
    }
  }

  let imageUrl =
    'https://cdn.shopify.com/s/files/1/0680/6172/4863/files/blue_gradient_electronic_sales_promotion_banner_72_x_25_in.webp?v=1747654973';
  let altText = 'CyberTeleshop Premium Electronic Sales Banner';
  let width = 2000;
  let height = 694;

  if (heroBannerImage?.reference?.image?.url) {
    imageUrl = heroBannerImage.reference.image.url;
    altText = heroBannerImage.reference.image.altText || altText;
    width = heroBannerImage.reference.image.width || width;
    height = heroBannerImage.reference.image.height || height;
  } else if (heroBannerImage?.value) {
    imageUrl = heroBannerImage.value;
  }

  return (
    <section className="w-full bg-contrast overflow-hidden border-b border-primary/5">
      <Link to={heroBannerLink} className="block relative group w-full">
        <Image
          data={{
            __typename: 'Image',
            url: imageUrl,
            altText: altText,
            width: width,
            height: height,
          }}
          className="w-full h-[160px] sm:h-auto object-cover object-[65%] sm:object-center block select-none"
          sizes="100vw"
          width={width}
          height={height}
          loading="eager"
          fetchPriority="high"
        />
        {/* Subtle hover overlay to invite action */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition duration-300" />
      </Link>
    </section>
  );
}

function CollectionShowcase({data}: {data: any}) {
  const tabs = [
    {
      id: 'hot-deals',
      label: '🔥 Hot Deals',
      products: data?.hotDeals?.products?.nodes || [],
    },
    {
      id: 'new-arrivals',
      label: '✨ New Arrivals',
      products: data?.newArrivals?.products?.nodes || [],
    },
    {
      id: 'best-selling',
      label: '🏆 Best Selling',
      products: data?.bestSelling?.products?.nodes || [],
    },
    {
      id: 'limited-offer',
      label: '⚡ Limited Offer',
      products: data?.limitedOffer?.products?.nodes || [],
    },
    {
      id: 'trending-products',
      label: '📈 Trending',
      products: data?.trending?.products?.nodes || [],
    },
    {
      id: 'best-rated',
      label: '⭐ Best Rated',
      products: data?.bestRated?.products?.nodes || [],
    },
  ].filter((tab) => tab.products.length > 0);

  if (tabs.length === 0) return null;

  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const currentProducts =
    tabs.find((tab) => tab.id === activeTab)?.products || [];

  return (
    <section className="bg-contrast w-full py-6 md:py-8 lg:py-12 overflow-hidden">
      <div className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Section heading */}
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <Heading size="heading" className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase">
            Featured Collections
          </Heading>
          <Text as="p" className="mt-1 text-primary/80 max-w-xl text-xs sm:text-sm">
            Quickly browse and discover hot products from our top active collections.
          </Text>
        </div>

        {/* Tabs — single scrollable row, always horizontal */}
        <div className="w-full overflow-x-auto hiddenScroll mb-6">
          <div
            style={{display: 'flex', flexDirection: 'row', flexWrap: 'nowrap'}}
            className="gap-2 p-1.5 bg-primary/5 rounded-2xl border border-primary/10 w-max mx-auto"
          >
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{whiteSpace: 'nowrap', flexShrink: 0}}
                  className={`px-4 py-2 rounded-xl text-[10px] sm:text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#D33E13] text-white shadow-sm border border-[#D33E13]'
                      : 'text-primary/70 hover:text-primary hover:bg-primary/10 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Products: 2-col grid on mobile, 4-col on desktop */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5 w-full">
          {currentProducts.slice(0, 8).map((product: any) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>

      </div>
    </section>
  );
}

function ProductSection({
  title,
  subtitle,
  products,
}: {
  title: string;
  subtitle: string;
  products: any[];
}) {
  if (!products || products.length === 0) return null;

  return (
    <Section padding="y" className="bg-contrast w-full overflow-x-hidden border-t border-primary/5 flex flex-col" display="flex">
      <div className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 items-center text-center mb-6">
          <Heading size="heading" className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase">
            {title}
          </Heading>
          <Text as="p" className="text-primary/80 max-w-xl text-xs sm:text-sm font-medium">
            {subtitle}
          </Text>
        </div>

        {/* Products Layout: Horizontal swimlane on mobile, Grid on desktop */}
        <div className="md:hidden swimlane hiddenScroll gap-4 scroll-px-4 px-4 pb-4 -mx-4">
          {products.slice(0, 8).map((product: any) => (
            <ProductCard
              key={product.id}
              product={product}
              className="snap-start w-[calc((100vw-48px)/2)] flex-shrink-0"
            />
          ))}
        </div>
        <Grid layout="products" className="hidden md:grid w-full md:grid-cols-4 pb-0">
          {products.slice(0, 8).map((product: any) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </Grid>
      </div>
    </Section>
  );
}

function FlashSaleCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 4,
    minutes: 34,
    seconds: 12,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Reset to 6 hours when finished
          return { hours: 5, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <Section padding="y" className="w-full bg-contrast">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#F59E0B]/10 p-8 md:p-12 lg:p-16 shadow-xl border border-primary/10">
          
          {/* Decorative blur elements */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#F59E0B]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left side: Sale Info */}
            <div className="text-center lg:text-left max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-[#D33E13] bg-[#D33E13]/15 border border-[#D33E13]/30 mb-4">
                <span className="w-2 h-2 rounded-full bg-[#D33E13] animate-pulse" />
                Summer Special
              </span>
              <Heading size="heading" className="text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-tight">
                SUMMER CRUSH <br className="hidden sm:inline" /> MEGA SALE!
              </Heading>
              <Text as="p" className="mt-4 text-gray-300 text-sm sm:text-base font-medium max-w-lg leading-relaxed">
                Beat the heat with our hottest discounts of the season! Save big on premium gadgets, car accessories, and fitness gear before stock runs out.
              </Text>

              {/* Progress bar */}
              <div className="mt-6">
                <div className="flex justify-between text-xs text-gray-300 font-bold mb-1.5 uppercase">
                  <span>🔥 Selling Fast</span>
                  <span>87% Claimed</span>
                </div>
                <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-[#D33E13] to-amber-500 h-full w-[87%] rounded-full animate-pulse" />
                </div>
              </div>
            </div>

            {/* Right side: Countdown & CTA */}
            <div className="flex flex-col items-center gap-6 bg-white/5 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-white/10 w-full max-w-md shadow-lg">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-200">
                Offer Ends In:
              </span>

              {/* Timer Clocks */}
              <div className="flex items-center gap-3 sm:gap-4 justify-center">
                <div className="flex flex-col items-center">
                  <div className="bg-[#0f172a]/95 text-white w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-2xl text-xl sm:text-2xl font-black border border-white/10 shadow-inner">
                    {formatNumber(timeLeft.hours)}
                  </div>
                  <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider mt-1.5">Hrs</span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-[#D33E13] -mt-4">:</span>
                <div className="flex flex-col items-center">
                  <div className="bg-[#0f172a]/95 text-white w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-2xl text-xl sm:text-2xl font-black border border-white/10 shadow-inner">
                    {formatNumber(timeLeft.minutes)}
                  </div>
                  <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider mt-1.5">Min</span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-[#D33E13] -mt-4">:</span>
                <div className="flex flex-col items-center">
                  <div className="bg-[#0f172a]/95 text-[#D33E13] w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-2xl text-xl sm:text-2xl font-black border border-[#D33E13]/25 shadow-inner animate-pulse">
                    {formatNumber(timeLeft.seconds)}
                  </div>
                  <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider mt-1.5">Sec</span>
                </div>
              </div>

              {/* Action Button */}
              <Link to="/collections/hot-deals" className="w-full">
                <Button className="w-full py-4 bg-[#D33E13] text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg hover:bg-orange-600 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2">
                  Shop Summer Deals Now &rarr;
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </div>
    </Section>
  );
}

function TestimonialsSection() {
  const reviews = [
    {
      name: "Muhammad Ali",
      rating: 5,
      date: "2 days ago",
      text: "Outstanding service! Ordered the Ab Roller and received it within 24 hours. The COD option gave me peace of mind, and the quality is absolutely top-notch.",
      city: "Lahore"
    },
    {
      name: "Sara Khan",
      rating: 5,
      date: "1 week ago",
      text: "The Fitness Belt works wonders! Delivery was super fast, and the customer support team on WhatsApp was incredibly helpful. Highly recommended!",
      city: "Karachi"
    },
    {
      name: "Zainab B.",
      rating: 5,
      date: "3 days ago",
      text: "Ordered a couple of products from their Health & Beauty line. The products were authentic and well-packaged. Will definitely buy again!",
      city: "Islamabad"
    }
  ];

  return (
    <Section padding="y" className="bg-primary/5 w-full overflow-x-hidden border-t border-primary/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 items-center text-center mb-10">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D33E13] bg-[#D33E13]/10 border border-[#D33E13]/30 px-3 py-1.5 rounded-full w-fit mb-1 block">
            Client Reviews
          </span>
          <Heading size="heading" className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase">
            Loved By Our Customers
          </Heading>
          <Text as="p" className="text-primary/80 max-w-xl text-xs sm:text-sm font-medium">
            Hear from some of our 10,000+ satisfied buyers who trust CyberTeleshop for premium quality products.
          </Text>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review, idx) => (
            <div 
              key={idx} 
              className="bg-contrast border border-primary/10 rounded-[2rem] p-6 sm:p-8 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Stars */}
                <div className="flex items-center gap-1 mb-4 text-[#D33E13]">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <svg key={i} className="w-4.5 h-4.5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Review Text */}
                <Text as="p" className="text-primary/95 text-xs sm:text-sm font-medium leading-relaxed italic">
                  "{review.text}"
                </Text>
              </div>

              {/* Reviewer Details */}
              <div className="mt-6 pt-4 border-t border-primary/5 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D33E13]/10 to-orange-500/10 flex items-center justify-center text-sm font-black text-[#D33E13] border border-[#D33E13]/25 uppercase">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-primary flex items-center gap-1.5">
                    {review.name}
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase border border-emerald-600/20">
                      ✓ Verified
                    </span>
                  </h4>
                  <p className="text-[10px] text-primary/70 font-semibold mt-0.5">
                    {review.city} &bull; {review.date}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function shopifyCategorySliderImageLoader({src, width, height, crop}: any) {
  try {
    const url = new URL(src);
    const targetWidth = width ? Math.min(width, 200) : 200;
    url.searchParams.set('width', String(targetWidth));
    const targetHeight = height ? Math.min(height, 200) : 200;
    url.searchParams.set('height', String(targetHeight));
    url.searchParams.set('crop', crop || 'center');
    return url.toString();
  } catch (e) {
    return src;
  }
}

function CategorySlider({
  collections,
}: {
  collections?: HomepageCategoryCollectionsQuery | null;
}) {
  const items = collections?.collections?.nodes?.filter(
    (collection) => !!collection?.image?.url,
  ) ?? [];
  if (items.length === 0) return null;

  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.offsetWidth * 0.8;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <Section padding="y" className="bg-contrast w-full overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Heading size="heading">Shop by category</Heading>
            <Text as="p" className="mt-3 max-w-2xl text-primary/80">
              Discover curated categories with beautiful imagery for every product need.
            </Text>
          </div>
          <div className="flex items-center gap-4.5 justify-between md:justify-end">
            <Button to="/collections/all" variant="inline">
              View all categories
            </Button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll('left')}
                aria-label="Scroll category slider left"
                className="w-9 h-9 rounded-full border border-primary/10 bg-contrast flex items-center justify-center text-primary hover:border-[#D33E13] hover:text-[#D33E13] hover:bg-[#D33E13]/5 transition-all duration-200 cursor-pointer shadow-sm text-sm font-bold"
              >
                ←
              </button>
              <button
                onClick={() => scroll('right')}
                aria-label="Scroll category slider right"
                className="w-9 h-9 rounded-full border border-primary/10 bg-contrast flex items-center justify-center text-primary hover:border-[#D33E13] hover:text-[#D33E13] hover:bg-[#D33E13]/5 transition-all duration-200 cursor-pointer shadow-sm text-sm font-bold"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Categories Slider */}
        <div
          ref={containerRef}
          className="mt-8 flex gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth hiddenScroll"
        >
          {items.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              className="group block w-[calc((100%-32px)/3)] sm:w-[calc((100%-32px)/3)] md:w-[calc((100%-48px)/4)] xl:w-[calc((100%-100px)/6)] flex-shrink-0 snap-start"
            >
              <div className="relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border border-primary/10 bg-primary/5 aspect-square">
                <Image
                  data={collection.image!}
                  alt={collection.image?.altText || collection.title}
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  sizes="(max-width: 32em) 50vw, (max-width: 48em) 33vw, 16vw"
                  width={200}
                  height={200}
                  aspectRatio="1/1"
                  loader={shopifyCategorySliderImageLoader}
                />
              </div>
              <div className="mt-3 text-center px-1">
                <Heading size="copy" className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-primary group-hover:text-[#D33E13] transition-colors duration-200 truncate w-full">
                  {collection.title}
                </Heading>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Section>
  );
}

function FeatureBlocks() {
  return (
    <Section padding="y" divider="top" className="bg-primary/5">
      <div className="mx-auto grid max-w-7xl gap-4 sm:gap-6 px-4 sm:px-6 grid-cols-2 lg:grid-cols-4 lg:px-8">
        <ComparisonCard
          title="💵 COD"
          description="Available nationwide"
        />
        <ComparisonCard
          title="🚚 Fast Delivery"
          description="1-3 Days in major cities"
        />
        <ComparisonCard
          title="🔄 Money-Back"
          description="15 days refund policy"
        />
        <ComparisonCard
          title="🔓 Allow to open"
          description="Check before payment"
        />
      </div>
    </Section>
  );
}

function ComparisonCard({title, description}: {title: string; description: string}) {
  return (
    <div className="rounded-[1.5rem] md:rounded-[2rem] border border-primary/10 bg-contrast/95 p-4 sm:p-6 md:p-8 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
      <Heading size="lead" className="text-copy text-sm sm:text-base md:text-lg">
        {title}
      </Heading>
      <Text as="p" className="mt-2 text-primary/80 text-[10px] sm:text-xs md:text-sm">{description}</Text>
    </div>
  );
}



const HOMEPAGE_SEO_QUERY = `#graphql
  query homepageSeo {
    shop {
      name
      description
    }
    brandMetaobject: metaobjects(type: "brand", first: 1) {
      nodes {
        fields {
          key
          value
          reference {
            ... on MediaImage {
              image {
                url
                altText
                width
                height
              }
            }
            ... on GenericFile {
              url
            }
          }
        }
      }
    }
  }
` as const;

export const CATEGORY_COLLECTIONS_QUERY = `#graphql
  query homepageCategoryCollections($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: 100, sortKey: UPDATED_AT) {
      nodes {
        id
        title
        handle
        image {
          altText
          url
        }
      }
    }
  }
` as const;

// @see: https://shopify.dev/api/storefront/current/queries/products
export const HOMEPAGE_FEATURED_PRODUCTS_QUERY = `#graphql
  query homepageFeaturedProducts($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: 8) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

// @see: https://shopify.dev/api/storefront/current/queries/collections
export const FEATURED_COLLECTIONS_QUERY = `#graphql
  query homepageFeaturedCollections($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(
      first: 4,
      sortKey: UPDATED_AT
    ) {
      nodes {
        id
        title
        handle
        image {
          altText
          width
          height
          url
        }
      }
    }
  }
` as const;

export const COLLECTIONS_SHOWCASE_QUERY = `#graphql
  query collectionsShowcase($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    hotDeals: collection(handle: "hot-deals") {
      title
      handle
      products(first: 8) {
        nodes {
          ...ProductCard
        }
      }
    }
    newArrivals: collection(handle: "new-arrivals") {
      title
      handle
      products(first: 8) {
        nodes {
          ...ProductCard
        }
      }
    }
    bestSelling: collection(handle: "best-selling") {
      title
      handle
      products(first: 8) {
        nodes {
          ...ProductCard
        }
      }
    }
    limitedOffer: collection(handle: "limited-offer") {
      title
      handle
      products(first: 8) {
        nodes {
          ...ProductCard
        }
      }
    }
    trending: collection(handle: "trending-products") {
      title
      handle
      products(first: 8) {
        nodes {
          ...ProductCard
        }
      }
    }
    bestRated: collection(handle: "best-rated") {
      title
      handle
      products(first: 8) {
        nodes {
          ...ProductCard
        }
      }
    }
    fitness: collection(handle: "fitness") {
      title
      handle
      products(first: 8) {
        nodes {
          ...ProductCard
        }
      }
    }
    healthBeauty: collection(handle: "health-beauty") {
      title
      handle
      products(first: 8) {
        nodes {
          ...ProductCard
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

