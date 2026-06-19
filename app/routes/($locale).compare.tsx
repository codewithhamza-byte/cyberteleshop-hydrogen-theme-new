import {useEffect, useState} from 'react';
import {json, type MetaArgs, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useFetcher, Link} from '@remix-run/react';
import {getSeoMeta, Money, Image, Analytics} from '@shopify/hydrogen';
import {PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import {routeHeaders} from '~/data/cache';
import {JudgemePreviewBadge} from '@judgeme/shopify-hydrogen';
import {AddToCartButton} from '~/components/AddToCartButton';
import {isDiscounted} from '~/lib/utils';
import type {Product, MoneyV2} from '@shopify/hydrogen/storefront-api-types';

export const headers = routeHeaders;

export async function loader({request, context: {storefront}}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const ids = url.searchParams.getAll('id');

  if (ids.length === 0) {
    return json({products: []});
  }

  try {
    const {nodes} = await storefront.query(COMPARE_PRODUCTS_QUERY, {
      variables: {
        ids,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
      },
    });

    const products = (nodes || []).filter(Boolean);
    return json({products});
  } catch (error) {
    console.error('Error fetching compare products:', error);
    return json({products: []});
  }
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta({
    title: 'Compare Products',
    description: 'Compare features, prices, and availability of your selected products.',
  });
};

export default function Compare() {
  const fetcher = useFetcher<typeof loader>();
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Load compare IDs from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('compare') || '[]') as string[];
    setCompareIds(stored);

    if (stored.length > 0) {
      const searchParams = new URLSearchParams();
      stored.forEach((id) => searchParams.append('id', id));
      fetcher.load(`/compare?${searchParams.toString()}`);
    }
  }, []);

  // Update products state when fetcher returns data
  useEffect(() => {
    if (fetcher.data?.products) {
      setProducts(fetcher.data.products);
    }
  }, [fetcher.data]);

  // Handle removing a product from compare list
  const handleRemove = (productId: string) => {
    const updatedIds = compareIds.filter((id) => id !== productId);
    setCompareIds(updatedIds);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    localStorage.setItem('compare', JSON.stringify(updatedIds));

    // Custom toast notification if available
    if (typeof window !== 'undefined' && (window as any).showToast) {
      (window as any).showToast('Removed from compare list');
    }
    // Update count badge in header
    window.dispatchEvent(new Event('compare-updated'));
  };

  const handleClearAll = () => {
    setCompareIds([]);
    setProducts([]);
    localStorage.setItem('compare', JSON.stringify([]));
    if (typeof window !== 'undefined' && (window as any).showToast) {
      (window as any).showToast('Compare list cleared');
    }
    window.dispatchEvent(new Event('compare-updated'));
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
            <span className="text-white font-extrabold">Compare</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase mb-3">
            Compare Products
          </h1>

          <p className="max-w-2xl text-xs md:text-sm text-gray-200/90 leading-relaxed font-medium">
            Analyze your chosen items side-by-side to make the best purchasing decision.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-24">
        {compareIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-gray-50 border border-dashed border-gray-200 rounded-[2.5rem] p-6 max-w-2xl mx-auto mt-8">
            <span className="text-5xl mb-6">⚖️</span>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">
              No Products to Compare
            </h2>
            <p className="text-sm text-gray-500 mb-8 max-w-md">
              Tap the compare icon on any product details page to add items here for a side-by-side comparison.
            </p>
            <Link
              to="/collections/all"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#D33E13] hover:bg-[#b8330d] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-200 shadow-lg shadow-[#D33E13]/20 hover:-translate-y-0.5"
            >
              Discover Products &rarr;
            </Link>
          </div>
        ) : isLoading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-[#D33E13] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Loading comparison details...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Action Buttons */}
            <div className="flex justify-end">
              <button
                onClick={handleClearAll}
                className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all duration-200 shadow-sm"
              >
                Clear All Items
              </button>
            </div>

            {/* Comparison Matrix Table */}
            <div className="w-full overflow-x-auto border border-neutral-200/60 rounded-3xl bg-white shadow-lg shadow-neutral-100">
              <table className="w-full border-collapse min-w-[700px] table-fixed">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50">
                    <th className="w-1/4 p-6 text-left text-xs font-black uppercase text-neutral-400 tracking-wider">
                      Product Specs
                    </th>
                    {products.map((product) => {
                      const firstVariant = product.variants?.nodes?.[0];
                      const {price, compareAtPrice} = firstVariant || {};

                      return (
                        <th key={product.id} className="p-6 text-left relative align-top border-l border-neutral-100">
                          {/* Remove button */}
                          <button
                            onClick={() => handleRemove(product.id)}
                            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white hover:bg-red-50 border border-neutral-200 text-neutral-400 hover:text-red-500 flex items-center justify-center transition-all shadow-sm"
                            title="Remove"
                          >
                            &times;
                          </button>

                          {/* Image & Title */}
                          <div className="flex flex-col gap-4 pr-6">
                            <Link to={`/products/${product.handle}`} className="block aspect-square w-full overflow-hidden rounded-2xl bg-neutral-50 border border-neutral-100 group">
                              {firstVariant?.image && (
                                <Image
                                  data={firstVariant.image}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                  width={200}
                                  height={200}
                                />
                              )}
                            </Link>
                            <Link to={`/products/${product.handle}`}>
                              <h3 className="font-extrabold text-sm text-neutral-900 line-clamp-2 hover:text-[#D33E13] transition-colors leading-snug">
                                {product.title}
                              </h3>
                            </Link>
                          </div>
                        </th>
                      );
                    })}
                    {/* Fill empty columns if less than 4 */}
                    {Array.from({length: Math.max(0, 3 - products.length)}).map((_, i) => (
                      <th key={`empty-th-${i}`} className="p-6 border-l border-neutral-100 bg-neutral-50/10" />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Price */}
                  <tr className="border-b border-neutral-100 hover:bg-neutral-50/30">
                    <td className="p-5 text-xs font-black uppercase text-neutral-500">Price</td>
                    {products.map((product) => {
                      const firstVariant = product.variants?.nodes?.[0];
                      const price = firstVariant?.price;
                      const compareAtPrice = firstVariant?.compareAtPrice;

                      return (
                        <td key={product.id} className="p-5 border-l border-neutral-100 font-extrabold text-sm text-[#D33E13]">
                          {price && <Money data={price} withoutTrailingZeros />}
                          {compareAtPrice && isDiscounted(price as MoneyV2, compareAtPrice as MoneyV2) && (
                            <span className="text-xs text-neutral-400 line-through font-bold ml-2">
                              <Money data={compareAtPrice} withoutTrailingZeros />
                            </span>
                          )}
                        </td>
                      );
                    })}
                    {Array.from({length: Math.max(0, 3 - products.length)}).map((_, i) => (
                      <td key={`empty-price-${i}`} className="p-5 border-l border-neutral-100 bg-neutral-50/10" />
                    ))}
                  </tr>

                  {/* Row 2: Ratings */}
                  <tr className="border-b border-neutral-100 hover:bg-neutral-50/30">
                    <td className="p-5 text-xs font-black uppercase text-neutral-500">Reviews</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-5 border-l border-neutral-100">
                        <JudgemePreviewBadge id={product.id} template="product" />
                      </td>
                    ))}
                    {Array.from({length: Math.max(0, 3 - products.length)}).map((_, i) => (
                      <td key={`empty-reviews-${i}`} className="p-5 border-l border-neutral-100 bg-neutral-50/10" />
                    ))}
                  </tr>

                  {/* Row 3: Product Type */}
                  <tr className="border-b border-neutral-100 hover:bg-neutral-50/30">
                    <td className="p-5 text-xs font-black uppercase text-neutral-500">Type</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-5 border-l border-neutral-100 text-xs font-bold text-neutral-700">
                        {product.productType || 'N/A'}
                      </td>
                    ))}
                    {Array.from({length: Math.max(0, 3 - products.length)}).map((_, i) => (
                      <td key={`empty-type-${i}`} className="p-5 border-l border-neutral-100 bg-neutral-50/10" />
                    ))}
                  </tr>

                  {/* Row 4: Availability */}
                  <tr className="border-b border-neutral-100 hover:bg-neutral-50/30">
                    <td className="p-5 text-xs font-black uppercase text-neutral-500">Availability</td>
                    {products.map((product) => {
                      const firstVariant = product.variants?.nodes?.[0];
                      const available = firstVariant?.availableForSale;

                      return (
                        <td key={product.id} className="p-5 border-l border-neutral-100">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            available ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                          }`}>
                            {available ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                      );
                    })}
                    {Array.from({length: Math.max(0, 3 - products.length)}).map((_, i) => (
                      <td key={`empty-avail-${i}`} className="p-5 border-l border-neutral-100 bg-neutral-50/10" />
                    ))}
                  </tr>

                  {/* Row 5: Action Button */}
                  <tr className="hover:bg-neutral-50/30">
                    <td className="p-5 text-xs font-black uppercase text-neutral-500">Action</td>
                    {products.map((product) => {
                      const firstVariant = product.variants?.nodes?.[0];
                      const available = firstVariant?.availableForSale;

                      return (
                        <td key={product.id} className="p-5 border-l border-neutral-100 align-middle">
                          {available && firstVariant?.id ? (
                            <AddToCartButton
                              lines={[{merchandiseId: firstVariant.id, quantity: 1}]}
                              className="inline-flex w-full justify-center items-center px-4 py-3 bg-[#D33E13] hover:bg-[#b8330d] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-200 shadow-md shadow-[#D33E13]/10"
                            >
                              Add to Cart
                            </AddToCartButton>
                          ) : (
                            <button
                              disabled
                              className="w-full px-4 py-3 bg-neutral-100 text-neutral-400 font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-not-allowed text-center"
                            >
                              Sold Out
                            </button>
                          )}
                        </td>
                      );
                    })}
                    {Array.from({length: Math.max(0, 3 - products.length)}).map((_, i) => (
                      <td key={`empty-action-${i}`} className="p-5 border-l border-neutral-100 bg-neutral-50/10" />
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      <Analytics.CustomView
        type="custom_compare_viewed"
        data={{
          compareLength: compareIds.length,
          compareIds,
        }}
      />
    </>
  );
}

const COMPARE_PRODUCTS_QUERY = `#graphql
  query CompareProducts($ids: [ID!]!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on Product {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;
