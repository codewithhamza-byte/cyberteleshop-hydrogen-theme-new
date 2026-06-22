import {useEffect, useState} from 'react';

interface ReviewStarsProps {
  productId: string;
  rating?: string | number | null; // From Shopify metafield reviews.rating
  ratingCount?: string | number | null; // From Shopify metafield reviews.rating_count
  onClick?: () => void;
}

export function ReviewStars({
  productId,
  rating: propRating,
  ratingCount: propRatingCount,
  onClick,
}: ReviewStarsProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. If rating and count are passed as props, use them
    let parsedRating: number | null = null;
    let parsedCount: number | null = null;

    if (propRating !== undefined && propRating !== null) {
      try {
        // Shopify reviews.rating value is sometimes a JSON string e.g. {"value":"4.8","scale_min":"1.0","scale_max":"5.0"}
        if (typeof propRating === 'string' && propRating.startsWith('{')) {
          const parsed = JSON.parse(propRating) as any;
          parsedRating = Number(parsed.value || parsed.rating || 0);
        } else {
          parsedRating = Number(propRating);
        }
      } catch (e) {
        parsedRating = Number(propRating);
      }
    }

    if (propRatingCount !== undefined && propRatingCount !== null) {
      parsedCount = Number(propRatingCount);
    }

    if (parsedRating !== null && parsedCount !== null && !isNaN(parsedRating) && !isNaN(parsedCount)) {
      setRating(parsedRating);
      setCount(parsedCount);
      return;
    }

    // 2. If props are missing or invalid, fetch from our secure reviews API proxy
    if (!productId) return;
    
    setLoading(true);
    const cleanId = productId.replace('gid://shopify/Product/', '');
    
    fetch(`/api/reviews?productId=${cleanId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch reviews');
        return res.json();
      })
      .then((data: any) => {
        setRating(data.averageRating || 0);
        setCount(data.ratingCount || 0);
      })
      .catch((err) => {
        console.error('Error fetching reviews for badge:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId, propRating, propRatingCount]);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 animate-pulse">
        <div className="w-16 h-4 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
        <div className="w-8 h-3 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
      </div>
    );
  }

  // Fallback to 0 if not loaded/available
  const activeRating = rating || 0;
  const activeCount = count || 0;

  // Render SVG stars
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= activeRating) {
        // Solid star
        stars.push(
          <svg key={i} className="w-3.5 h-3.5 text-[#C5A880] fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else if (i - 0.5 <= activeRating) {
        // Half star
        stars.push(
          <div key={i} className="relative w-3.5 h-3.5">
            <svg className="absolute top-0 left-0 w-3.5 h-3.5 text-neutral-200 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <div className="absolute top-0 left-0 w-[50%] h-3.5 overflow-hidden">
              <svg className="w-3.5 h-3.5 text-[#C5A880] fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
        );
      } else {
        // Empty star
        stars.push(
          <svg key={i} className="w-3.5 h-3.5 text-neutral-200 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      }
    }
    return stars;
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-1.5 select-none ${
        onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      }`}
    >
      <div className="flex items-center gap-0.5">{renderStars()}</div>
      <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">
        {activeCount > 0 ? `(${activeCount} reviews)` : '(no reviews)'}
      </span>
    </div>
  );
}
