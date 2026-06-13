import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {Suspense} from 'react';
import {Await, useLoaderData} from '@remix-run/react';
import {getSeoMeta} from '@shopify/hydrogen';

import {Button} from '~/components/Button';
import {FeaturedCollections} from '~/components/FeaturedCollections';
import {ProductSwimlane} from '~/components/ProductSwimlane';
import {Heading, Section, Text} from '~/components/Text';
import {seoPayload} from '~/lib/seo.server';
import {routeHeaders} from '~/data/cache';
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

  return defer({...deferredData, ...criticalData});
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

  return {
    featuredProducts,
    featuredCollections,
  };
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Homepage() {
  const {shop, featuredProducts, featuredCollections} =
    useLoaderData<typeof loader>();

  return (
    <>
      <LandingHero shop={shop} />

      <Section padding="y" divider="top" className="bg-primary/5">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-3 lg:px-8">
          <div className="rounded-3xl border border-primary/10 bg-contrast/95 p-8">
            <Text color="subtle" size="fine" className="uppercase tracking-[0.24em]">
              Minimal + Bold
            </Text>
            <Heading size="lead" className="mt-4">
              A modern store built for every product.
            </Heading>
            <Text className="mt-4 text-primary/80">
              Clean layout, fast shopping, and a polished design system that keeps product detail front and center.
            </Text>
          </div>

          <div className="rounded-3xl border border-primary/10 bg-contrast/95 p-8">
            <Text color="subtle" size="fine" className="uppercase tracking-[0.24em]">
              Responsive everywhere
            </Text>
            <Heading size="lead" className="mt-4">
              Smooth browsing on mobile, tablet, and desktop.
            </Heading>
            <Text className="mt-4 text-primary/80">
              Every section adapts cleanly so shoppers can explore products and collections effortlessly.
            </Text>
          </div>

          <div className="rounded-3xl border border-primary/10 bg-contrast/95 p-8">
            <Text color="subtle" size="fine" className="uppercase tracking-[0.24em]">
              Product first
            </Text>
            <Heading size="lead" className="mt-4">
              Highlight your best sellers.
            </Heading>
            <Text className="mt-4 text-primary/80">
              Dynamic featured product rows and collections make it easy to showcase what matters most.
            </Text>
          </div>
        </div>
      </Section>

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

function LandingHero({shop}: {shop?: {name?: string; description?: string}}) {
  return (
    <section className="bg-contrast text-primary">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <Text color="subtle" size="fine" className="inline-flex rounded-full border border-primary/10 px-3 py-1 uppercase tracking-[0.28em] text-primary/80">
            Modern Shopify storefront
          </Text>

          <Heading as="h1" size="display" className="mt-6 leading-tight text-4xl sm:text-5xl lg:text-6xl">
            {shop?.name ?? 'Cyberteleshop'}
          </Heading>

          <Text size="lead" className="mt-6 max-w-2xl text-primary/80">
            {shop?.description ||
              'A fully responsive and minimal Shopify storefront for modern brands. Explore fresh products, curated collections, and seamless browsing across all devices.'}
          </Text>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button to="/collections/all" variant="primary">
              Browse all products
            </Button>
            <Button to="/search" variant="secondary">
              Search the store
            </Button>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="rounded-[2rem] border border-primary/10 bg-primary/5 p-8 shadow-sm">
            <Heading size="copy" className="text-copy">
              Minimal palette, bold accents
            </Heading>
            <Text className="mt-4 text-primary/80">
              Light charcoal backgrounds with modern orange highlights create an elegant, premium shopping experience.
            </Text>
          </div>
          <div className="rounded-[2rem] border border-primary/10 bg-primary/5 p-8 shadow-sm">
            <Heading size="copy" className="text-copy">
              Clear product storytelling
            </Heading>
            <Text className="mt-4 text-primary/80">
              Use collections and featured products to guide shoppers from discovery to checkout with ease.
            </Text>
          </div>
        </div>
      </div>
    </section>
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
