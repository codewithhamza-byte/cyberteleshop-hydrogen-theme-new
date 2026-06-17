import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {Suspense, useState, useRef} from 'react';
import {Await, useLoaderData} from '@remix-run/react';
import {getSeoMeta, Image} from '@shopify/hydrogen';
import {ProductCard} from '~/components/ProductCard';

import {Button} from '~/components/Button';
import {FeaturedCollections} from '~/components/FeaturedCollections';
import {ProductSwimlane} from '~/components/ProductSwimlane';
import {Heading, Section, Text} from '~/components/Text';
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
  const {shop} = await context.storefront.query(HOMEPAGE_SEO_QUERY, {
    cache: context.storefront.CacheLong(),
  });

  return {
    shop,
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
    featuredProducts,
    categoryCollections,
    showcaseCollections,
  } = useLoaderData<typeof loader>();

  return (
    <>
      <LandingHero />
      {showcaseCollections && (
        <Suspense>
          <Await resolve={showcaseCollections}>
            {(response) => <CollectionShowcase data={response} />}
          </Await>
        </Suspense>
      )}
      {categoryCollections && (
        <Suspense>
          <Await resolve={categoryCollections}>
            {(response) => <CategorySlider collections={response} />}
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
    <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white overflow-hidden rounded-[2.5rem] my-12 mx-4 md:mx-8 lg:mx-16 border border-gray-800 shadow-2xl relative py-12 md:py-16">
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

function LandingHero() {
  return (
    <section className="w-full bg-contrast overflow-hidden border-b border-primary/5">
      <Link to="/collections/all" className="block relative group w-full">
        <Image
          data={{
            url: 'https://www.cyberteleshop.com/cdn/shop/files/blue_gradient_electronic_sales_promotion_banner_72_x_25_in.webp?v=1747654973',
            altText: 'CyberTeleshop Premium Electronic Sales Banner',
            width: 2000,
            height: 694,
          }}
          className="w-full h-[160px] sm:h-auto object-cover object-[65%] sm:object-center block select-none"
          sizes="100vw"
          loading="eager"
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
    <Section padding="y" className="bg-contrast">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col gap-6 items-center text-center mb-8">
          <div>
            <Heading size="heading" className="text-3xl font-extrabold tracking-tight uppercase">
              Featured Collections
            </Heading>
            <Text as="p" className="mt-2 text-primary/80 max-w-xl">
              Quickly browse and discover hot products from our top active collections.
            </Text>
          </div>

          {/* Tabs header */}
          <div className="flex w-full md:w-auto overflow-x-auto md:overflow-x-visible whitespace-nowrap justify-start md:justify-center gap-1.5 md:gap-2 p-1.5 bg-primary/5 rounded-2xl md:rounded-full border border-primary/10 max-w-full md:max-w-4xl scrollbar-none">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-block px-4 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-full text-[10px] md:text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#D33E13] text-white shadow-sm scale-102 border border-[#D33E13]'
                      : 'text-primary/70 hover:text-primary hover:bg-primary/5 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Grid / Slider */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory hiddenScroll pb-4 md:grid md:grid-cols-4 md:gap-6 md:pb-0">
          {currentProducts.slice(0, 8).map((product: any) => (
            <div key={product.id} className="w-[70vw] sm:w-[45vw] md:w-auto flex-shrink-0 snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
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
    <Section padding="y" className="bg-contrast">
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
              className="group block w-[calc((100%-16px)/2)] sm:w-[calc((100%-32px)/3)] md:w-[calc((100%-48px)/4)] xl:w-[calc((100%-100px)/6)] flex-shrink-0 snap-start"
            >
              <div className="relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border border-primary/10 bg-primary/5 aspect-square">
                <Image
                  data={collection.image!}
                  alt={collection.image?.altText || collection.title}
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  sizes="(max-width: 32em) 50vw, (max-width: 48em) 33vw, 16vw"
                  aspectRatio="1/1"
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
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

