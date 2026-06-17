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
import {routeHeaders, CACHE_SHORT} from '~/data/cache';
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
        'Cache-Control': CACHE_SHORT,
      },
    },
  );
}

async function loadCriticalData({context, request}: LoaderFunctionArgs) {
  const {shop} = await context.storefront.query(HOMEPAGE_SEO_QUERY);

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
    })
    .catch((error) => {
      console.error(error);
      return null;
    });

  const featuredCollections = context.storefront
    .query(FEATURED_COLLECTIONS_QUERY, {
      variables: {
        country,
        language,
      },
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
    })
    .catch((error) => {
      console.error(error);
      return null;
    });

  return {
    featuredProducts,
    featuredCollections,
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
    featuredCollections,
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
      <WhyChooseSection />

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

      {featuredCollections && (
        <Suspense>
          <Await resolve={featuredCollections}>
            {(response) => {
              if (
                !response ||
                !response.collections ||
                !response.collections.nodes
              ) {
                return null;
              }

              return (
                <FeaturedCollections
                  collections={response.collections}
                  title="Shop by Collection"
                />
              );
            }}
          </Await>
        </Suspense>
      )}
    </>
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

        {/* Products Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
          {currentProducts.slice(0, 8).map((product: any) => (
            <ProductCard key={product.id} product={product} />
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

        <nav
          aria-label="Category navigation"
          className="mt-6 flex items-center gap-3 overflow-x-auto pb-4 text-sm font-semibold text-primary hiddenScroll"
        >
          {items.map((collection) => (
            <Link
              key={`${collection.id}-nav`}
              to={`/collections/${collection.handle}`}
              className="inline-flex whitespace-nowrap rounded-full border border-primary/10 bg-contrast/90 px-4 py-2 transition duration-200 hover:border-primary hover:bg-primary/10"
            >
              {collection.title}
            </Link>
          ))}
        </nav>

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
      <div className="mx-auto grid max-w-7xl gap-6 px-6 lg:grid-cols-4 lg:px-8">
        <ComparisonCard
          title="💵 COD"
          description="Available nationwide"
        />
        <ComparisonCard
          title="🚚 Fast Delivery"
          description="1-3 Days in major cities"
        />
        <ComparisonCard
          title="🔄 Money-Back Guarantee"
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
    <div className="rounded-[2rem] border border-primary/10 bg-contrast/95 p-8 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
      <Heading size="lead" className="text-copy">
        {title}
      </Heading>
      <Text as="p" className="mt-3 text-primary/80">{description}</Text>
    </div>
  );
}

function WhyChooseSection() {
  return (
    <Section padding="y" className="bg-contrast">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="flex flex-col justify-center gap-6">
          <Text
            color="subtle"
            size="fine"
            className="uppercase tracking-[0.24em] text-primary/80"
          >
            Why Choose Our Store
          </Text>
          <Heading size="heading" className="max-w-xl">
            Trusted shopping with flexible payment and fast delivery.
          </Heading>
          <div className="grid gap-4 text-primary/80">
            <FeatureRow label="💵 COD" detail="Pay cash on delivery, available nationwide." />
            <FeatureRow label="🚚 Fast Delivery" detail="1-3 days in major metro cities." />
            <FeatureRow label="🔄 Money-Back Guarantee" detail="15 days refund policy for peace of mind." />
            <FeatureRow label="🔓 Allow to open" detail="Inspect your order before you pay." />
          </div>
          <Text as="p" className="text-sm text-primary/70">
            <a
              href="https://www.cyberteleshop.com/privacy.html"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary transition hover:text-notice"
            >
              Privacy Policy
            </a>
          </Text>
        </div>

        <div className="rounded-[2rem] border border-primary/10 bg-primary/5 p-8 shadow-sm">
          <Text as="p" size="lead" className="text-primary/80">
            Our store combines speed, transparency, and trusted buyer protection so your customers feel confident each step of the way.
          </Text>
          <div className="mt-8 grid gap-4">
            <StatLabel label="COD" value="Nationwide availability" />
            <StatLabel label="Shipping" value="1-3 days in major cities" />
            <StatLabel label="Returns" value="15-day money-back policy" />
            <StatLabel label="Inspection" value="Open before payment" />
          </div>
        </div>
      </div>
    </Section>
  );
}

function FeatureRow({label, detail}: {label: string; detail: string}) {
  return (
    <div className="rounded-3xl border border-primary/10 bg-contrast/90 p-5">
      <Heading size="copy" className="text-copy">
        {label}
      </Heading>
      <Text as="p" className="mt-2 text-primary/80">{detail}</Text>
    </div>
  );
}

function StatLabel({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-3xl bg-contrast/95 p-5">
      <Text as="p" className="font-semibold text-primary">{label}</Text>
      <Text as="p" className="mt-2 text-primary/80">{value}</Text>
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

