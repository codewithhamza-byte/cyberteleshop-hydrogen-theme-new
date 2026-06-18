import {useState, useEffect, useRef} from 'react';
import {useNavigate, useParams} from '@remix-run/react';
import {Image} from '@shopify/hydrogen';
import {Link} from '~/components/Link';
import {Money} from '~/components/Money';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_SEARCHES = [
  'Treadmill',
  'Ab Roller',
  'Massager',
  'Bedsheet Holder',
  'Waist Removing Belt',
];

const POPULAR_CATEGORIES = [
  { name: 'Fitness', handle: 'fitness' },
  { name: 'Electronics', handle: 'electronics' },
  { name: 'Health & Beauty', handle: 'health-beauty' },
  { name: 'Car Accessories', handle: 'car-accessories' },
];

export function SearchModal({isOpen, onClose}: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<{ products: any[]; collections: any[] }>({
    products: [],
    collections: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const params = useParams();

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setSearchTerm('');
      setSuggestions({ products: [], collections: [] });
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch predictive suggestions on search query change (debounced)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions({ products: [], collections: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const localePrefix = params.locale ? `/${params.locale}` : '';
        const res = await fetch(`${localePrefix}/api/predictive-search?q=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        setSuggestions({
          products: data.products || [],
          collections: data.collections || [],
        });
      } catch (err) {
        console.error('Error fetching search suggestions', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, params.locale]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    onClose();
    const searchPath = params.locale ? `/${params.locale}/search` : '/search';
    navigate(`${searchPath}?q=${encodeURIComponent(searchTerm)}`);
  };

  const handleSearchItemClick = () => {
    onClose();
  };

  const handlePopularSearchClick = (query: string) => {
    setSearchTerm(query);
    inputRef.current?.focus();
  };

  // Truncate to 5 words helper
  const truncateTitle = (title: string, count: number = 5) => {
    if (!title) return '';
    const words = title.split(/\s+/);
    if (words.length <= count) return title;
    return words.slice(0, count).join(' ') + '...';
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex justify-center items-start pt-16 md:pt-28 px-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white/95 backdrop-blur-lg w-full max-w-2xl rounded-3xl shadow-2xl border border-primary/5 overflow-hidden flex flex-col max-h-[75vh] md:max-h-[80vh] transform transition-all animate-in slide-in-from-top-4 duration-300"
      >
        {/* Search Field Header */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 px-5 py-4 border-b border-primary/5">
          <svg className="w-5 h-5 text-primary/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for products, categories..."
            className="flex-grow text-base md:text-lg text-primary placeholder-primary/45 focus:outline-none bg-transparent font-medium border-0 p-0 focus:ring-0"
          />
          {isLoading && (
            <span className="w-5 h-5 border-2 border-[#D33E13] border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
          {searchTerm && !isLoading && (
            <button 
              type="button" 
              onClick={() => setSearchTerm('')} 
              className="p-1 hover:bg-primary/5 rounded-full text-primary/40 hover:text-primary transition"
              title="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button 
            type="button" 
            onClick={onClose}
            className="text-xs font-extrabold uppercase tracking-wider text-primary/50 hover:text-primary px-2 py-1 rounded hover:bg-primary/5 transition"
            title="Close modal"
          >
            Close
          </button>
        </form>

        {/* Results / Recommendations Body */}
        <div className="p-5 overflow-y-auto hiddenScroll flex flex-col gap-6">
          {!searchTerm.trim() ? (
            <>
              {/* Popular Searches */}
              <div className="flex flex-col gap-2.5">
                <h4 className="text-[10px] uppercase font-extrabold tracking-widest text-primary/40">
                  Popular Searches
                </h4>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((query) => (
                    <button
                      key={query}
                      onClick={() => handlePopularSearchClick(query)}
                      className="px-3.5 py-2 rounded-full border border-primary/5 bg-primary/5 text-xs font-bold text-primary hover:border-[#D33E13]/20 hover:text-[#D33E13] hover:bg-[#D33E13]/5 transition duration-200"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>

              {/* Browse Categories */}
              <div className="flex flex-col gap-2.5">
                <h4 className="text-[10px] uppercase font-extrabold tracking-widest text-primary/40">
                  Browse Categories
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {POPULAR_CATEGORIES.map((cat) => (
                    <Link
                      key={cat.handle}
                      to={`/collections/${cat.handle}`}
                      onClick={handleSearchItemClick}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-primary/5 bg-primary/5 hover:bg-[#D33E13]/5 hover:border-[#D33E13]/10 hover:text-[#D33E13] text-sm font-bold text-primary transition duration-200 group"
                    >
                      <span>{cat.name}</span>
                      <span className="text-primary/30 group-hover:text-[#D33E13] group-hover:translate-x-0.5 transition-all">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {suggestions.collections.length === 0 && suggestions.products.length === 0 && !isLoading ? (
                <div className="text-center py-8 text-primary/65">
                  No suggestions found for &ldquo;<span className="font-bold text-primary">{searchTerm}</span>&rdquo;.
                </div>
              ) : (
                <>
                  {/* Suggested Collections */}
                  {suggestions.collections.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <h4 className="text-[10px] uppercase font-extrabold tracking-widest text-primary/40">
                        Suggested Collections
                      </h4>
                      <div className="flex flex-col gap-1.5">
                        {suggestions.collections.map((collection) => (
                          <Link
                            key={collection.id}
                            to={`/collections/${collection.handle}`}
                            onClick={handleSearchItemClick}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-[#D33E13]/5 hover:text-[#D33E13] text-sm font-bold text-primary transition duration-150"
                          >
                            <span>🛍️ {collection.title}</span>
                            <span className="text-xs font-semibold text-primary/40">Category</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Products */}
                  {suggestions.products.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <h4 className="text-[10px] uppercase font-extrabold tracking-widest text-primary/40">
                        Suggested Products
                      </h4>
                      <div className="flex flex-col gap-1">
                        {suggestions.products.map((product) => {
                          const image = product.variants?.nodes?.[0]?.image;
                          const price = product.priceRange?.minVariantPrice;

                          return (
                            <Link
                              key={product.id}
                              to={`/products/${product.handle}`}
                              onClick={handleSearchItemClick}
                              className="flex items-center gap-3.5 p-2 rounded-2xl hover:bg-[#D33E13]/5 transition duration-200 group"
                            >
                              {image ? (
                                <Image
                                  data={image}
                                  alt={product.title}
                                  className="w-12 h-12 rounded-xl object-cover bg-primary/5 flex-shrink-0"
                                  width={48}
                                  height={48}
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-primary/5 flex-shrink-0" />
                              )}
                              <div className="flex-grow min-w-0">
                                <h5 className="font-bold text-xs sm:text-sm text-primary group-hover:text-[#D33E13] transition-colors truncate">
                                  {truncateTitle(product.title)}
                                </h5>
                                {price && (
                                  <span className="text-xs text-[#D33E13] font-bold mt-0.5 block">
                                    <Money withoutTrailingZeros data={price} />
                                  </span>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Search Footer info */}
        {searchTerm.trim() && (
          <button
            type="submit"
            onClick={handleSearchSubmit}
            className="w-full bg-[#D33E13] hover:bg-[#b0300d] text-white py-4 text-xs font-black uppercase tracking-widest text-center transition duration-200 flex items-center justify-center gap-2"
          >
            <span>See all results for &ldquo;{searchTerm}&rdquo;</span>
            <span>→</span>
          </button>
        )}
      </div>
    </div>
  );
}
