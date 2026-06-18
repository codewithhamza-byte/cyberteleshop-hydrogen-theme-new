import {useEffect, useState} from 'react';
import {json, type MetaArgs, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useFetcher, Link} from '@remix-run/react';
import {getSeoMeta, Image} from '@shopify/hydrogen';

import {Grid} from '~/components/Grid';
import {ProductCard} from '~/components/ProductCard';
import {PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import {routeHeaders} from '~/data/cache';
import {seoPayload} from '~/lib/seo.server';

export const headers = routeHeaders;

export async function loader({request, context: {storefront}}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const ids = url.searchParams.getAll('id');

  if (ids.length === 0) {
    return json({products: []});
  }

  try {
    const {nodes} = await storefront.query(WISHLIST_PRODUCTS_QUERY, {
      variables: {
        ids,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
      },
    });

    const products = (nodes || []).filter(Boolean);
    return json({products});
  } catch (error) {
    console.error('Error fetching wishlist products:', error);
    return json({products: []});
  }
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta({
    title: 'My Wishlist',
    description: 'View your favorite products saved in your wishlist.',
  });
};

export default function Wishlist() {
  const fetcher = useFetcher<typeof loader>();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Load wishlist IDs from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('wishlist') || '[]') as string[];
    setWishlistIds(stored);

    if (stored.length > 0) {
      const searchParams = new URLSearchParams();
      stored.forEach((id) => searchParams.append('id', id));
      fetcher.load(`/wishlist?${searchParams.toString()}`);
    }
  }, []);

  // Update products state when fetcher returns data
  useEffect(() => {
    if (fetcher.data?.products) {
      setProducts(fetcher.data.products);
    }
  }, [fetcher.data]);

  // Handle removing a product from wishlist
  const handleRemove = (productId: string) => {
    const updatedIds = wishlistIds.filter((id) => id !== productId);
    setWishlistIds(updatedIds);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    localStorage.setItem('wishlist', JSON.stringify(updatedIds));

    // Custom toast notification if available
    if (typeof window !== 'undefined' && (window as any).showToast) {
      (window as any).showToast('Removed from wishlist');
    }
  };

  const isLoading = fetcher.state === 'loading';

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
            <span className="text-white font-extrabold">Wishlist</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase mb-3">
            My Wishlist
          </h1>

          <p className="max-w-2xl text-xs md:text-sm text-gray-200/90 leading-relaxed font-medium">
            Your personal collection of saved items. Add them to your cart before they sell out!
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-24">
        {wishlistIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-gray-50 border border-dashed border-gray-200 rounded-[2.5rem] p-6 max-w-2xl mx-auto mt-8">
            <span className="text-5xl mb-6">❤️</span>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">
              Your Wishlist is Empty
            </h2>
            <p className="text-sm text-gray-500 mb-8 max-w-md">
              Tap the heart icon on any product to save it here and view it later.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#D33E13] hover:bg-[#b8330d] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-200 shadow-lg shadow-[#D33E13]/20 hover:-translate-y-0.5"
            >
              Explore Products &rarr;
            </Link>
          </div>
        ) : isLoading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-[#D33E13] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Loading saved items...</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-8">
            {products.map((product) => (
              <div key={product.id} className="relative group flex flex-col">
                <ProductCard product={product} />
                <button
                  onClick={() => handleRemove(product.id)}
                  className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-md hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors duration-200"
                  title="Remove from Wishlist"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

const WISHLIST_PRODUCTS_QUERY = `#graphql
  query WishlistProducts($ids: [ID!]!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on Product {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;
