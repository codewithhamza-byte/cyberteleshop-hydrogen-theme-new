import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import invariant from 'tiny-invariant';

export async function loader({
  request,
  context: {storefront},
}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const query = searchParams.get('q') ?? '';

  if (!query) {
    return json({
      products: [],
      collections: [],
    });
  }

  const data = await storefront.query(PREDICTIVE_SEARCH_QUERY, {
    variables: {
      query,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  });

  invariant(data, 'No data returned from predictive search query');

  const products = data.predictiveSearch?.products || [];
  const collections = data.predictiveSearch?.collections || [];

  return json({
    products,
    collections,
  });
}

const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch(
    $query: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(query: $query, limit: 5, types: [PRODUCT, COLLECTION]) {
      products {
        id
        title
        handle
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 1) {
          nodes {
            image {
              url
              altText
              width
              height
            }
          }
        }
      }
      collections {
        id
        title
        handle
      }
    }
  }
` as const;

export default function PredictiveSearchApiRoute() {
  return null;
}
