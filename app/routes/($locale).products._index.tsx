import {
  json,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {useLoaderData, Link} from '@remix-run/react';
import invariant from 'tiny-invariant';
import {
  Pagination,
  getPaginationVariables,
  getSeoMeta,
} from '@shopify/hydrogen';

import {PageHeader, Section} from '~/components/Text';
import {ProductCard} from '~/components/ProductCard';
import {Grid} from '~/components/Grid';
import {PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import {getImageLoadingPriority} from '~/lib/const';
import {seoPayload} from '~/lib/seo.server';
import {routeHeaders} from '~/data/cache';

const PAGE_BY = 8;

export const headers = routeHeaders;

export async function loader({
  request,
  context: {storefront},
}: LoaderFunctionArgs) {
  const variables = getPaginationVariables(request, {pageBy: PAGE_BY});

  const data = await storefront.query(ALL_PRODUCTS_QUERY, {
    variables: {
      ...variables,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  });

  invariant(data, 'No data returned from Shopify API');

  const seo = seoPayload.collection({
    url: request.url,
    collection: {
      id: 'all-products',
      title: 'All Products',
      handle: 'products',
      descriptionHtml: 'All the store products',
      description: 'All the store products',
      seo: {
        title: 'All Products',
        description: 'All the store products',
      },
      metafields: [],
      products: data.products,
      updatedAt: '',
    },
  });

  return json({
    products: data.products,
    collections: data.collections?.nodes || [],
    seo,
  });
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function AllProducts() {
  const {products, collections} = useLoaderData<typeof loader>();

  return (
    <>
      {/* Premium Hero Banner */}
      <div className="relative w-full overflow-hidden bg-gray-900 py-14 md:py-20 px-4 md:px-8 mb-8 border-b border-gray-100 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#D33E13]/10" />

        <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-gray-300/80 mb-3.5 font-bold uppercase tracking-wider">
            <Link to="/" className="hover:text-[#D33E13] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white font-extrabold">Shop</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase mb-3">
            All Products
          </h1>

          <p className="max-w-2xl text-xs md:text-sm text-gray-200/90 leading-relaxed font-medium">
            Discover our premium collections, handpicked items, and brand new additions designed for performance.
          </p>

          {/* Quick Switcher capsule row */}
          {collections && collections.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-2.5 max-w-4xl">
              <Link
                to="/products"
                className="px-4.5 py-2 rounded-full text-xs font-extrabold transition-all duration-200 shadow-sm border bg-[#D33E13] border-[#D33E13] text-white scale-105"
              >
                All Products
              </Link>
              {collections.map((c: any) => (
                <Link
                  key={c.handle}
                  to={`/collections/${c.handle}`}
                  className="px-4.5 py-2 rounded-full text-xs font-extrabold transition-all duration-200 shadow-sm border bg-white/10 hover:bg-white/20 text-white border-white/10"
                >
                  {c.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <Section className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        <Pagination connection={products}>
          {({nodes, isLoading, NextLink, PreviousLink}) => {
            const itemsMarkup = nodes.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                loading={getImageLoadingPriority(i)}
              />
            ));

             return (
              <>
                <div className="flex items-center justify-center mb-8">
                  <PreviousLink className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full border border-gray-200 bg-white text-xs font-extrabold text-gray-700 hover:text-[#D33E13] hover:border-[#D33E13] hover:bg-[#D33E13]/5 transition-all duration-200 shadow-sm cursor-pointer">
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-[#D33E13] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>←</span> Previous Page
                      </>
                    )}
                  </PreviousLink>
                </div>
                <Grid data-test="product-grid">{itemsMarkup}</Grid>
                <div className="flex items-center justify-center mt-8">
                  <NextLink className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#D33E13] hover:bg-[#b0300d] text-xs font-extrabold text-white transition-all duration-200 shadow-md shadow-[#D33E13]/10 hover:shadow-lg cursor-pointer">
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Next Page <span>→</span>
                      </>
                    )}
                  </NextLink>
                </div>
              </>
            );
          }}
        </Pagination>
      </Section>
    </>
  );
}

const ALL_PRODUCTS_QUERY = `#graphql
  query AllProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        ...ProductCard
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
    collections(first: 100) {
      nodes {
        id
        title
        handle
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;
