import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {Await, Form, useLoaderData} from '@remix-run/react';
import {Suspense} from 'react';
import {
  Pagination,
  getPaginationVariables,
  Analytics,
  getSeoMeta,
} from '@shopify/hydrogen';

import {Heading, PageHeader, Section, Text} from '~/components/Text';
import {Input} from '~/components/Input';
import {Grid} from '~/components/Grid';
import {ProductCard} from '~/components/ProductCard';
import {ProductSwimlane} from '~/components/ProductSwimlane';
import {FeaturedCollections} from '~/components/FeaturedCollections';
import {PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import {getImageLoadingPriority, PAGINATION_SIZE} from '~/lib/const';
import {seoPayload} from '~/lib/seo.server';

import {
  getFeaturedData,
  type FeaturedData,
} from './($locale).featured-products';

export async function loader({
  request,
  context: {storefront},
}: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const searchTerm = searchParams.get('q')!;
  const variables = getPaginationVariables(request, {pageBy: 8});

  const {products} = await storefront.query(SEARCH_QUERY, {
    variables: {
      searchTerm,
      ...variables,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  });

  const shouldGetRecommendations = !searchTerm || products?.nodes?.length === 0;

  const seo = seoPayload.collection({
    url: request.url,
    collection: {
      id: 'search',
      title: 'Search',
      handle: 'search',
      descriptionHtml: 'Search results',
      description: 'Search results',
      seo: {
        title: 'Search',
        description: `Showing ${products.nodes.length} search results for "${searchTerm}"`,
      },
      metafields: [],
      products,
      updatedAt: new Date().toISOString(),
    },
  });

  return defer({
    seo,
    searchTerm,
    products,
    noResultRecommendations: shouldGetRecommendations
      ? getNoResultRecommendations(storefront)
      : Promise.resolve(null),
  });
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Search() {
  const {searchTerm, products, noResultRecommendations} =
    useLoaderData<typeof loader>();
  const noResults = products?.nodes?.length === 0;

  return (
    <>
      {/* Premium Hero Search Banner */}
      <div className="relative w-full overflow-hidden bg-gray-900 py-14 md:py-20 px-4 md:px-8 mb-8 border-b border-gray-100 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#D33E13]/10" />

        <div className="relative max-w-3xl mx-auto flex flex-col items-center text-center">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase mb-6">
            Search Results
          </h1>

          <Form method="get" className="relative flex w-full max-w-md items-center bg-white rounded-full overflow-hidden shadow-lg border border-gray-100 p-1">
            <input
              defaultValue={searchTerm}
              name="q"
              placeholder="Search products, brands..."
              type="search"
              className="flex-grow bg-transparent px-5 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
            />
            <button 
              className="bg-[#D33E13] hover:bg-[#b0300d] text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3.5 rounded-full transition-colors duration-200" 
              type="submit"
            >
              Search
            </button>
          </Form>

          {searchTerm && (
            <p className="mt-4 text-xs md:text-sm text-gray-300 font-medium">
              Showing results for &ldquo;<span className="text-white font-bold">{searchTerm}</span>&rdquo;
            </p>
          )}
        </div>
      </div>

      {!searchTerm || noResults ? (
        <NoResults
          noResults={noResults}
          recommendations={noResultRecommendations}
        />
      ) : (
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
      )}
      <Analytics.SearchView data={{searchTerm, searchResults: products}} />
    </>
  );
}

function NoResults({
  noResults,
  recommendations,
}: {
  noResults: boolean;
  recommendations: Promise<null | FeaturedData>;
}) {
  return (
    <>
      {noResults && (
        <Section padding="x">
          <Text className="opacity-50">
            No results, try a different search.
          </Text>
        </Section>
      )}
      <Suspense>
        <Await
          errorElement="There was a problem loading related products"
          resolve={recommendations}
        >
          {(result) => {
            if (!result) return null;
            const {featuredCollections, featuredProducts} = result;

            return (
              <>
                <FeaturedCollections
                  title="Trending Collections"
                  collections={featuredCollections}
                />
                <ProductSwimlane
                  title="Trending Products"
                  products={featuredProducts}
                />
              </>
            );
          }}
        </Await>
      </Suspense>
    </>
  );
}

export function getNoResultRecommendations(
  storefront: LoaderFunctionArgs['context']['storefront'],
) {
  return getFeaturedData(storefront, {pageBy: PAGINATION_SIZE});
}

const SEARCH_QUERY = `#graphql
  query PaginatedProductsSearch(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $searchTerm: String
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor,
      sortKey: RELEVANCE,
      query: $searchTerm
    ) {
      nodes {
        ...ProductCard
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }

  ${PRODUCT_CARD_FRAGMENT}
` as const;
