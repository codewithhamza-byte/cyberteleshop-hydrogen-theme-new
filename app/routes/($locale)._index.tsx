import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {Suspense} from 'react';
import {Await, useLoaderData} from '@remix-run/react';
import {getSeoMeta, Image} from '@shopify/hydrogen';

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

  return {
    featuredProducts,
    featuredCollections,
    categoryCollections,
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
  } = useLoaderData<typeof loader>();

  return (
    <>
      <LandingHero />
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
    <section className="relative w-full bg-contrast py-12 md:py-20 lg:py-24 overflow-hidden border-b border-primary/5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 grid gap-12 lg:grid-cols-12 items-center">
        {/* Left Content Column */}
        <div className="lg:col-span-6 flex flex-col items-start gap-6 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-notice/20 bg-notice/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-notice">
            <span className="flex h-2 w-2 rounded-full bg-notice animate-ping" />
            <span>Special Promotion - Up to 30% Off</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl md:text-6xl leading-tight">
            Premium Electronics & <span className="text-notice">Smart Gadgets</span>
          </h1>
          <p className="text-lg text-primary/80 max-w-lg leading-relaxed">
            Upgrade your tech with nationwide Cash on Delivery, ultra-fast 1-3 days shipping, and the peace of mind to inspect your package before paying.
          </p>
          <div className="flex flex-wrap gap-4 w-full sm:w-auto">
            <Button to="/collections/all" variant="primary" className="shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
              Shop Now
            </Button>
            <Button to="/collections" variant="secondary" className="hover:bg-primary/5 transition-all duration-300">
              Browse Collections
            </Button>
          </div>
          {/* Trust badges */}
          <div className="mt-6 pt-6 border-t border-primary/10 w-full grid grid-cols-3 gap-4 text-xs font-semibold text-primary/70">
            <div className="flex items-center gap-2">
              <span className="text-lg">💵</span>
              <span>Nationwide COD</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🚚</span>
              <span>1-3 Day Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🔓</span>
              <span>Open Box Check</span>
            </div>
          </div>
        </div>

        {/* Right Visual Column */}
        <div className="lg:col-span-6 relative w-full group">
          <div className="absolute inset-0 bg-gradient-to-tr from-notice/10 to-transparent rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-500 -z-10" />
          <div className="relative overflow-hidden rounded-[2.5rem] border border-primary/10 bg-contrast/95 p-3 shadow-2xl transition duration-500 hover:scale-[1.01]">
            <Image
              data={{
                url: 'https://www.cyberteleshop.com/cdn/shop/files/blue_gradient_electronic_sales_promotion_banner_72_x_25_in.webp?v=1747654973',
                altText: 'CyberTeleshop Premium Electronic Sales Banner',
                width: 2000,
                height: 694,
              }}
              className="w-full h-auto object-cover rounded-[2rem] aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3] block"
              sizes="(max-width: 32em) 100vw, (max-width: 48em) 90vw, 45vw"
              loading="eager"
            />
            {/* Elegant glassmorphic overlay label for premium feel */}
            <div className="absolute bottom-8 left-8 right-8 backdrop-blur-md bg-black/45 border border-white/10 rounded-2xl p-4 text-white flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div>
                <p className="text-xs uppercase tracking-wider opacity-80">Latest Collection</p>
                <p className="font-semibold text-sm">Smartphones, Watch & Audio Gadgets</p>
              </div>
              <span className="text-xs bg-white text-black font-semibold px-2.5 py-1 rounded-full uppercase">30% OFF</span>
            </div>
          </div>
        </div>
      </div>
    </section>
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
          <Button to="/collections/all" variant="inline">
            View all categories
          </Button>
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

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {items.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              className="group block overflow-hidden rounded-[2rem] border border-primary/10 bg-contrast/95 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative overflow-hidden bg-primary/5">
                <Image
                  data={collection.image!}
                  alt={collection.image?.altText || collection.title}
                  className="h-64 w-full object-cover transition duration-300 group-hover:scale-105"
                  sizes="(max-width: 32em) 100vw, (max-width: 48em) 50vw, (max-width: 64em) 33vw, 16vw"
                  aspectRatio="1/1"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent px-4 py-4 text-white">
                  <Heading size="copy" className="text-copy text-lg font-semibold">
                    {collection.title}
                  </Heading>
                </div>
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
    collections(first: 6, sortKey: UPDATED_AT) {
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
