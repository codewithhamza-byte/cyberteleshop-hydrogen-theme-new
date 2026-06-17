import {
  json,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import type {Collection} from '@shopify/hydrogen/storefront-api-types';
import {
  Image,
  Pagination,
  getPaginationVariables,
  getSeoMeta,
} from '@shopify/hydrogen';

import {Grid} from '~/components/Grid';
import {Heading, PageHeader, Section} from '~/components/Text';
import {Link} from '~/components/Link';
import {Button} from '~/components/Button';
import {getImageLoadingPriority} from '~/lib/const';
import {seoPayload} from '~/lib/seo.server';
import {routeHeaders, CACHE_SHORT} from '~/data/cache';

const PAGINATION_SIZE = 4;

export const headers = routeHeaders;

export const loader = async ({
  request,
  context: {storefront},
}: LoaderFunctionArgs) => {
  const variables = getPaginationVariables(request, {pageBy: PAGINATION_SIZE});
  const {collections} = await storefront.query(COLLECTIONS_QUERY, {
    variables: {
      ...variables,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
    cache: storefront.CacheShort(),
  });

  const seo = seoPayload.listCollections({
    collections,
    url: request.url,
  });

  return json(
    {collections, seo},
    {
      headers: {
        'Cache-Control': CACHE_SHORT,
      },
    },
  );
};

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Collections() {
  const {collections} = useLoaderData<typeof loader>();

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
            <span className="text-white font-extrabold">Collections</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase mb-3">
            Our Collections
          </h1>

          <p className="max-w-2xl text-xs md:text-sm text-gray-200/90 leading-relaxed font-medium">
            Explore our curated collections of high-performance gear, apparel, and accessories.
          </p>
        </div>
      </div>

      <Section className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        <Pagination connection={collections}>
          {({nodes, isLoading, PreviousLink, NextLink}) => (
            <>
              <div className="flex items-center justify-center mb-6">
                <Button as={PreviousLink} variant="secondary" width="full">
                  {isLoading ? 'Loading...' : 'Previous collections'}
                </Button>
              </div>
              <Grid
                items={nodes.length === 3 ? 3 : 2}
                data-test="collection-grid"
              >
                {nodes.map((collection, i) => (
                  <CollectionCard
                    collection={collection as Collection}
                    key={collection.id}
                    loading={getImageLoadingPriority(i, 2)}
                  />
                ))}
              </Grid>
              <div className="flex items-center justify-center mt-6">
                <Button as={NextLink} variant="secondary" width="full">
                  {isLoading ? 'Loading...' : 'Next collections'}
                </Button>
              </div>
            </>
          )}
        </Pagination>
      </Section>
    </>
  );
}

function CollectionCard({
  collection,
  loading,
}: {
  collection: Collection;
  loading?: HTMLImageElement['loading'];
}) {
  return (
    <Link
      prefetch="viewport"
      to={`/collections/${collection.handle}`}
      className="group relative block aspect-[3/2] w-full overflow-hidden rounded-[2.5rem] bg-gray-100 shadow-md hover:shadow-xl transition-all duration-300"
    >
      {/* Image Container */}
      <div className="absolute inset-0 z-0">
        {collection?.image ? (
          <Image
            data={collection.image}
            aspectRatio="3/2"
            sizes="(max-width: 32em) 100vw, 45vw"
            loading={loading}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1e293b] to-[#0f172a]" />
        )}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/45 to-transparent transition-opacity duration-300" />
      </div>

      {/* Info Container */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 md:p-8">
        <div className="transform transition-transform duration-300 group-hover:-translate-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D33E13] bg-[#D33E13]/15 border border-[#D33E13]/30 px-3 py-1.5 rounded-full w-fit mb-2 block">
            Explore
          </span>
          <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
            {collection.title}
          </h3>
          {collection.description && (
            <p className="text-xs text-gray-300 line-clamp-1 mt-1 font-medium max-w-sm">
              {collection.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

const COLLECTIONS_QUERY = `#graphql
  query Collections(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        id
        title
        description
        handle
        seo {
          description
          title
        }
        image {
          id
          url
          width
          height
          altText
        }
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
`;
