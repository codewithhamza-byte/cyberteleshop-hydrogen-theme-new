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
  const {featuredProducts, featuredCollections} =
    useLoaderData<typeof loader>();

  return (
    <>
      <LandingHero />
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
    <section className="relative w-screen overflow-hidden">
      <div className="relative left-1/2 right-1/2 mx-[calc(50%-50vw)] w-screen">
        <img
          src="https://www.cyberteleshop.com/cdn/shop/files/blue_gradient_electronic_sales_promotion_banner_72_x_25_in.webp?v=1747654973&width=2000"
          alt="Electronic sales promotion banner"
          className="block w-full object-cover"
          style={{ minHeight: '360px' }}
          loading="eager"
        />
      </div>
    </section>
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
    <div className="rounded-[2rem] border border-primary/10 bg-contrast/95 p-8 shadow-sm">
      <Heading size="lead" className="text-copy">
        {title}
      </Heading>
      <Text className="mt-3 text-primary/80">{description}</Text>
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
          <Text className="text-sm text-primary/70">
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
          <Text size="lead" className="text-primary/80">
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
      <Text className="mt-2 text-primary/80">{detail}</Text>
    </div>
  );
}

function StatLabel({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-3xl bg-contrast/95 p-5">
      <Text className="font-semibold text-primary">{label}</Text>
      <Text className="mt-2 text-primary/80">{value}</Text>
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
