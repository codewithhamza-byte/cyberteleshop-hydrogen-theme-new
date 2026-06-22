import {useEffect, useState} from 'react';

interface Review {
  id: number;
  title: string;
  body: string;
  rating: number;
  created_at: string;
  verified: string;
  reviewer: {
    name: string;
    email?: string;
  };
  pictures?: Array<{
    urls: {
      original: string;
      small: string;
      compact: string;
      huge: string;
    };
  }>;
}

interface ReviewsWidgetProps {
  productId: string;
  productTitle: string;
}

export function ReviewsWidget({productId, productTitle}: ReviewsWidgetProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [visibleCount, setVisibleCount] = useState(5);
  
  // Submission Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Form Inputs
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');

  // Fetch reviews from our secure proxy route
  const fetchReviews = () => {
    if (!productId) return;
    setLoading(true);
    const cleanId = productId.replace('gid://shopify/Product/', '');
    
    fetch(`/api/reviews?productId=${cleanId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load reviews');
        return res.json();
      })
      .then((data) => {
        setReviews(data.reviews || []);
        setAvgRating(data.averageRating || 0);
        setTotalCount(data.ratingCount || 0);
      })
      .catch((err) => {
        console.error('Error fetching reviews:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  // Calculate rating breakdown distribution
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const rate = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
    if (breakdown[rate] !== undefined) {
      breakdown[rate]++;
    }
  });

  // Handle Review Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    
    const cleanId = productId.replace('gid://shopify/Product/', '');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: cleanId,
          name: formName,
          email: formEmail,
          rating: formRating,
          title: formTitle,
          body: formBody,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSubmitSuccess(true);
      // Reset form
      setFormRating(5);
      setFormName('');
      setFormEmail('');
      setFormTitle('');
      setFormBody('');

      // Auto close after 3 seconds and refresh reviews
      setTimeout(() => {
        setModalOpen(false);
        setSubmitSuccess(false);
        fetchReviews(); // Reload review list
      }, 3000);

    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarsSvg = (score: number, size = "w-4 h-4") => {
    const stars = [];
    const ratingVal = score || 0;
    for (let i = 1; i <= 5; i++) {
      if (i <= ratingVal) {
        stars.push(
          <svg key={i} className={`${size} text-[#D33E13] fill-current`} viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else if (i - 0.5 <= ratingVal) {
        stars.push(
          <div key={i} className={`relative ${size}`}>
            <svg className={`absolute top-0 left-0 ${size} text-neutral-200 fill-current`} viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <div className="absolute top-0 left-0 w-[50%] overflow-hidden">
              <svg className={`${size} text-[#D33E13] fill-current`} viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
        );
      } else {
        stars.push(
          <svg key={i} className={`${size} text-neutral-200 fill-current`} viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      }
    }
    return stars;
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const split = name.split(' ');
    if (split.length > 1) {
      return (split[0][0] + split[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-10 h-10 border-4 border-[#D33E13] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest animate-pulse">
          Loading product reviews...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* 1. Review Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-neutral-50/50 dark:bg-neutral-900/10 p-6 md:p-8 rounded-3xl border border-neutral-100 dark:border-neutral-800">
        
        {/* Large Score Card */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center gap-2 border-b md:border-b-0 md:border-r border-neutral-200/60 pb-6 md:pb-0 md:pr-8">
          <h3 className="text-5xl md:text-6xl font-black text-neutral-900 tracking-tight leading-none">
            {avgRating}
          </h3>
          <div className="flex gap-1">{renderStarsSvg(avgRating, "w-5 h-5")}</div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Based on {totalCount} reviews
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 px-5 py-3 bg-[#D33E13] hover:bg-[#b0300d] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-200 shadow-md shadow-[#D33E13]/10 hover:-translate-y-0.5"
          >
            Write a Review
          </button>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="md:col-span-8 flex flex-col gap-2.5">
          {([5, 4, 3, 2, 1] as const).map((stars) => {
            const count = breakdown[stars];
            const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3.5 text-xs">
                <span className="w-10 font-bold text-neutral-600 dark:text-neutral-400 whitespace-nowrap text-right">
                  {stars} Star
                </span>
                <div className="flex-1 h-3.5 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-full overflow-hidden relative border border-neutral-200/20">
                  <div
                    style={{width: `${pct}%`}}
                    className="h-full bg-gradient-to-r from-[#D33E13] to-orange-500 rounded-full transition-all duration-500 ease-out"
                  ></div>
                </div>
                <span className="w-12 text-left font-bold text-neutral-500">
                  {count} ({Math.round(pct)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Review List Section */}
      <div className="flex flex-col gap-6">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-neutral-50 border border-dashed border-neutral-200/60 rounded-3xl p-6">
            <span className="text-4xl mb-4">💬</span>
            <h4 className="font-extrabold text-neutral-900 uppercase tracking-tight mb-1 text-sm">
              No Reviews Yet
            </h4>
            <p className="text-xs text-neutral-500 max-w-xs mb-4">
              Be the first to share your thoughts and experience with other shoppers!
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2.5 bg-neutral-950 text-white hover:bg-neutral-800 font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-150"
            >
              Write First Review
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-6">
              {reviews.slice(0, visibleCount).map((review) => (
                <div
                  key={review.id}
                  className="flex flex-col gap-4 p-5 md:p-6 bg-white border border-neutral-200/60 rounded-3xl shadow-sm hover:shadow-md transition duration-200"
                >
                  {/* Review Header (Author, stars, date) */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    
                    {/* User info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center font-black text-xs text-neutral-700 border border-neutral-200/60 shadow-sm shrink-0">
                        {getInitials(review.reviewer?.name || 'User')}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-neutral-900">
                            {review.reviewer?.name || 'Anonymous'}
                          </span>
                          {review.verified !== 'nothing' && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-green-50 text-green-700 border border-green-200/40 tracking-wider">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-400 font-bold">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Star rating */}
                    <div className="flex gap-0.5">{renderStarsSvg(review.rating, "w-3.5 h-3.5")}</div>
                  </div>

                  {/* Review Content */}
                  <div className="flex flex-col gap-1.5 pl-0 sm:pl-13">
                    {review.title && (
                      <h4 className="font-extrabold text-neutral-900 text-sm md:text-base leading-snug">
                        {review.title}
                      </h4>
                    )}
                    <p className="text-xs md:text-sm text-neutral-600 leading-relaxed font-medium">
                      {review.body}
                    </p>

                    {/* Review Images */}
                    {review.pictures && review.pictures.length > 0 && (
                      <div className="flex flex-wrap gap-2.5 mt-3">
                        {review.pictures.map((pic, idx) => (
                          <a
                            key={idx}
                            href={pic.urls.original}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-16 h-16 rounded-xl overflow-hidden border border-neutral-200 hover:scale-105 transition duration-150"
                          >
                            <img
                              src={pic.urls.small || pic.urls.compact}
                              alt="User uploaded attachment"
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Trigger */}
            {reviews.length > visibleCount && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 5)}
                  className="px-6 py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-150"
                >
                  Load More Reviews
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. Review Submission Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl relative border border-neutral-100 max-h-[90vh] overflow-y-auto animate-fadeIn">
            
            {/* Close Button */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {submitSuccess ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-4 animate-scaleUp">
                <span className="text-6xl animate-bounce">🎉</span>
                <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tight">
                  Review Submitted!
                </h3>
                <p className="text-sm text-neutral-500 max-w-sm">
                  Thank you! Your feedback has been sent to Judge.me and will be processed shortly.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-neutral-900 uppercase tracking-tight">
                    Write a review
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium">
                    Share your experience about {productTitle}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Rating Selector */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-neutral-500 tracking-wider mb-2">
                      Review Rating *
                    </label>
                    <div className="flex gap-1.5 items-center">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isHighlighted = hoverRating !== null ? star <= hoverRating : star <= formRating;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFormRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="p-0.5 focus:outline-none transition-transform hover:scale-110"
                          >
                            <svg
                              className={`w-8 h-8 ${
                                isHighlighted ? 'text-[#D33E13]' : 'text-neutral-200'
                              } fill-current`}
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        );
                      })}
                      <span className="text-xs font-extrabold text-neutral-600 ml-2">
                        {formRating} / 5
                      </span>
                    </div>
                  </div>

                  {/* Name & Email Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-black uppercase text-neutral-500 tracking-wider mb-1">
                        Your Name *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. John Doe"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full border border-neutral-200 focus:border-[#D33E13] rounded-xl px-4 py-3 text-sm focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase text-neutral-500 tracking-wider mb-1">
                        Email Address *
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="john@example.com"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full border border-neutral-200 focus:border-[#D33E13] rounded-xl px-4 py-3 text-sm focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-neutral-500 tracking-wider mb-1">
                      Review Title
                    </label>
                    <input
                      type="text"
                      placeholder="Summarize your experience"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full border border-neutral-200 focus:border-[#D33E13] rounded-xl px-4 py-3 text-sm focus:outline-none transition"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-neutral-500 tracking-wider mb-1">
                      Review Body *
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Write your comments here..."
                      value={formBody}
                      onChange={(e) => setFormBody(e.target.value)}
                      className="w-full border border-neutral-200 focus:border-[#D33E13] rounded-xl px-4 py-3 text-sm focus:outline-none transition"
                    ></textarea>
                  </div>

                  {submitError && (
                    <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
                      ⚠️ {submitError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#D33E13] hover:bg-[#b0300d] disabled:bg-neutral-300 text-white font-extrabold py-3.5 rounded-xl transition duration-200 mt-2 text-xs uppercase tracking-wider shadow-lg shadow-[#D33E13]/10 flex items-center justify-center gap-2"
                  >
                    {submitting && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
