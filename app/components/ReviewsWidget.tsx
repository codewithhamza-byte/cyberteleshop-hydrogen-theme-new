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
  const [formImages, setFormImages] = useState<string[]>([]); // array of base64 data strings
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Filters State
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

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
      .then((data: any) => {
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
          images: formImages, // Include uploaded review images
        }),
      });

      const data = (await res.json()) as any;
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
      setFormImages([]);
      setUploadError(null);

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

  // Handle selected image file changes (validation + base64 encoding)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    if (formImages.length + files.length > 3) {
      setUploadError('You can upload a maximum of 3 images.');
      return;
    }

    const promises = files.map((file) => {
      if (!file.type.startsWith('image/')) {
        return Promise.reject(new Error(`${file.name} is not an image.`));
      }
      if (file.size > 5 * 1024 * 1024) {
        return Promise.reject(new Error(`${file.name} exceeds 5MB size limit.`));
      }

      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises)
      .then((newBase64s) => {
        setFormImages((prev) => [...prev, ...newBase64s]);
      })
      .catch((err: any) => {
        setUploadError(err.message || 'Error processing files.');
      });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const renderStarsSvg = (score: number, size = "w-4 h-4") => {
    const stars = [];
    const ratingVal = score || 0;
    for (let i = 1; i <= 5; i++) {
      if (i <= ratingVal) {
        stars.push(
          <svg key={i} className={`${size} text-[#C5A880] fill-current`} viewBox="0 0 20 20">
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
              <svg className={`${size} text-[#C5A880] fill-current`} viewBox="0 0 20 20">
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
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 border-2 border-[#C5A880] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest animate-pulse">
          Loading reviews...
        </p>
      </div>
    );
  }

  // Extract all review pictures for the top gallery
  const allPictures = reviews.reduce((acc, review) => {
    if (review.pictures && review.pictures.length > 0) {
      review.pictures.forEach((pic) => {
        acc.push({
          reviewId: review.id,
          thumbnail: pic.urls.small || pic.urls.compact || pic.urls.original,
          original: pic.urls.original,
          reviewer: review.reviewer?.name || 'Customer',
        });
      });
    }
    return acc;
  }, [] as Array<{reviewId: number; thumbnail: string; original: string; reviewer: string}>);

  // Filter options
  const filterOptions = [
    { value: null, label: 'All Reviews', count: totalCount },
    { value: 5, label: '5 ★', count: breakdown[5] },
    { value: 4, label: '4 ★', count: breakdown[4] },
    { value: 3, label: '3 ★', count: breakdown[3] },
    { value: 2, label: '2 ★', count: breakdown[2] },
    { value: 1, label: '1 ★', count: breakdown[1] },
  ];

  const filteredReviews = selectedRating
    ? reviews.filter((r) => Math.round(r.rating) === selectedRating)
    : reviews;

  const handleGalleryClick = (reviewId: number) => {
    // Scroll to the specific review card
    const element = document.getElementById(`review-${reviewId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Brief glowing/highlight effect
      element.classList.add('bg-stone-50/80', 'transition-all', 'duration-500');
      setTimeout(() => {
        element.classList.remove('bg-stone-50/80');
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col gap-10 font-sans text-stone-800">
      {/* 1. Review Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#FAF9F6] p-6 md:p-10 border border-stone-200/60 rounded-none shadow-sm">
        
        {/* Large Score Card */}
        <div className="md:col-span-5 flex flex-col items-center justify-center text-center gap-3 border-b md:border-b-0 md:border-r border-stone-200/60 pb-8 md:pb-0 md:pr-10">
          <h3 className="text-6xl font-light text-stone-900 tracking-tight leading-none">
            {avgRating}
          </h3>
          <div className="flex gap-1">{renderStarsSvg(avgRating, "w-5 h-5")}</div>
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">
            {totalCount} reviews
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-3 px-8 py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-[10px] uppercase tracking-widest rounded-none transition duration-300"
          >
            Write a Review
          </button>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="md:col-span-7 flex flex-col gap-3.5">
          {([5, 4, 3, 2, 1] as const).map((stars) => {
            const count = breakdown[stars];
            const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-4 text-[10px] tracking-wider uppercase">
                <span className="w-12 font-medium text-stone-500 text-right whitespace-nowrap">
                  {stars} Star
                </span>
                <div className="flex-1 h-[2px] bg-stone-200/60 overflow-hidden relative">
                  <div
                    style={{width: `${pct}%`}}
                    className="h-full bg-[#C5A880] transition-all duration-500 ease-out"
                  ></div>
                </div>
                <span className="w-16 text-left font-semibold text-stone-400">
                  {count} ({Math.round(pct)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Aggregated Customer Photo Gallery */}
      {allPictures.length > 0 && (
        <div className="flex flex-col gap-4 border-b border-stone-150 pb-8">
          <h4 className="text-[10px] font-semibold uppercase text-stone-400 tracking-widest">
            Customer Photos ({allPictures.length})
          </h4>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-200">
            {allPictures.map((pic, idx) => (
              <button
                key={idx}
                onClick={() => handleGalleryClick(pic.reviewId)}
                className="relative w-14 h-14 rounded-full overflow-hidden border border-stone-200 hover:border-[#C5A880] transition duration-300 shrink-0 group"
              >
                <img
                  src={pic.thumbnail}
                  alt={`Uploaded by ${pic.reviewer}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition duration-300"></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Review Filter Pills */}
      {reviews.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2 border-b border-stone-150">
          {filterOptions.map((opt) => (
            <button
              key={opt.value ?? 'all'}
              onClick={() => {
                setSelectedRating(opt.value);
                setVisibleCount(5);
              }}
              className={`px-5 py-1.5 text-[10px] font-semibold uppercase tracking-widest rounded-full transition duration-300 border ${
                selectedRating === opt.value
                  ? 'bg-stone-900 border-stone-900 text-white shadow-sm'
                  : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-500 hover:text-stone-850 hover:border-stone-450'
              }`}
            >
              {opt.label} ({opt.count})
            </button>
          ))}
        </div>
      )}

      {/* 4. Review List Section (Minimalist Vertical Feed) */}
      <div className="flex flex-col gap-8 divide-y divide-stone-100">
        {filteredReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-stone-200 rounded-none p-8 bg-stone-50/50">
            <span className="text-2xl mb-3 text-stone-300">💬</span>
            <h4 className="font-semibold text-stone-850 uppercase tracking-widest text-[11px] mb-2">
              No matching reviews
            </h4>
            <p className="text-xs text-stone-400 max-w-xs mb-4 leading-relaxed font-light">
              Try selecting a different rating filter or be the first to write a review.
            </p>
            {selectedRating !== null && (
              <button
                onClick={() => setSelectedRating(null)}
                className="px-6 py-2.5 bg-stone-900 text-white hover:bg-stone-800 font-semibold text-[10px] uppercase tracking-widest rounded-none transition duration-150"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col divide-y divide-stone-150">
              {filteredReviews.slice(0, visibleCount).map((review) => (
                <div
                  key={review.id}
                  id={`review-${review.id}`}
                  className="py-8 first:pt-0 last:pb-0 flex flex-col md:flex-row gap-6 md:gap-8 items-start transition-colors duration-300"
                >
                  {/* Left Column: Author Metadata */}
                  <div className="w-full md:w-1/4 shrink-0 flex flex-row md:flex-col gap-4 justify-between md:justify-start">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center font-semibold text-[11px] text-stone-600 border border-stone-200/50 shadow-inner">
                        {getInitials(review.reviewer?.name || 'User')}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-stone-850 text-xs sm:text-sm">
                            {review.reviewer?.name || 'Anonymous'}
                          </span>
                        </div>
                        {review.verified !== 'nothing' && (
                          <span className="text-[9px] font-semibold uppercase tracking-widest text-stone-400 mt-0.5">
                            • Verified Buyer
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:items-start items-end justify-center">
                      <div className="flex gap-0.5 mb-1">{renderStarsSvg(review.rating, "w-3 h-3")}</div>
                      <span className="text-[9px] text-stone-400 font-semibold uppercase tracking-widest">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Review Text & Images */}
                  <div className="flex-1 flex flex-col gap-3 min-w-0">
                    {review.title && (
                      <h4 className="font-semibold text-stone-900 text-sm tracking-tight leading-snug">
                        {review.title}
                      </h4>
                    )}
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light whitespace-pre-line">
                      {review.body}
                    </p>

                    {/* Review Images */}
                    {review.pictures && review.pictures.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-2">
                        {review.pictures.map((pic, idx) => (
                          <a
                            key={idx}
                            href={pic.urls.original}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-14 h-14 rounded-none overflow-hidden border border-stone-200/80 hover:border-[#C5A880] transition duration-300"
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
            {filteredReviews.length > visibleCount && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="px-8 py-3.5 border border-stone-200 hover:bg-stone-50 hover:border-stone-400 text-stone-700 font-semibold text-[10px] uppercase tracking-widest rounded-none transition duration-300"
                >
                  Load More Reviews
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 5. Review Submission Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-4">
          <div className="bg-[#FAF9F6] rounded-none max-w-xl w-full p-8 md:p-10 shadow-2xl relative border border-stone-200/80 max-h-[90vh] overflow-y-auto animate-fadeIn">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setModalOpen(false);
                setFormImages([]);
                setUploadError(null);
              }}
              className="absolute top-6 right-6 text-stone-400 hover:text-stone-700 transition-colors focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {submitSuccess ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-5 animate-scaleUp">
                <span className="text-4xl text-[#C5A880] animate-bounce">✓</span>
                <h3 className="text-md font-semibold text-stone-900 uppercase tracking-widest">
                  Review Submitted
                </h3>
                <p className="text-xs text-stone-400 max-w-sm font-light leading-relaxed">
                  Thank you. Your feedback has been sent to Judge.me and will be processed shortly.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                <div>
                  <h3 className="text-lg font-light text-stone-900 uppercase tracking-widest">
                    Write a review
                  </h3>
                  <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold mt-1">
                    Share your experience about {productTitle}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  {/* Rating Selector */}
                  <div>
                    <label className="block text-[9px] font-semibold uppercase text-stone-400 tracking-widest mb-3">
                      Review Rating *
                    </label>
                    <div className="flex gap-2 items-center">
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
                              className={`w-7 h-7 ${
                                isHighlighted ? 'text-[#C5A880]' : 'text-stone-200'
                              } fill-current`}
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        );
                      })}
                      <span className="text-[10px] font-semibold text-stone-500 tracking-widest ml-3">
                        {formRating} / 5
                      </span>
                    </div>
                  </div>

                  {/* Name & Email Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[9px] font-semibold uppercase text-stone-400 tracking-widest mb-1.5">
                        Your Name *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. John Doe"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full border-b border-t-0 border-r-0 border-l-0 border-stone-200 bg-transparent rounded-none px-0 py-2.5 text-stone-850 placeholder-stone-400 focus:border-stone-900 focus:ring-0 text-sm transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold uppercase text-stone-400 tracking-widest mb-1.5">
                        Email Address *
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="john@example.com"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full border-b border-t-0 border-r-0 border-l-0 border-stone-200 bg-transparent rounded-none px-0 py-2.5 text-stone-850 placeholder-stone-400 focus:border-stone-900 focus:ring-0 text-sm transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-[9px] font-semibold uppercase text-stone-400 tracking-widest mb-1.5">
                      Review Title
                    </label>
                    <input
                      type="text"
                      placeholder="Summarize your experience"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full border-b border-t-0 border-r-0 border-l-0 border-stone-200 bg-transparent rounded-none px-0 py-2.5 text-stone-850 placeholder-stone-400 focus:border-stone-900 focus:ring-0 text-sm transition-all duration-300"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <label className="block text-[9px] font-semibold uppercase text-stone-400 tracking-widest mb-1.5">
                      Review Body *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Write your comments here..."
                      value={formBody}
                      onChange={(e) => setFormBody(e.target.value)}
                      className="w-full border border-stone-200 bg-transparent rounded-none px-4 py-3 text-stone-850 placeholder-stone-400 focus:border-stone-900 focus:ring-0 text-sm transition-all duration-300"
                    ></textarea>
                  </div>

                  {/* File Upload Section */}
                  <div>
                    <label className="block text-[9px] font-semibold uppercase text-stone-400 tracking-widest mb-3">
                      Upload Images (Max 3, up to 5MB each)
                    </label>
                    <div className="flex flex-wrap gap-4 items-center">
                      {formImages.map((base64, idx) => (
                        <div key={idx} className="relative w-14 h-14 rounded-full overflow-hidden border border-stone-200 shadow-sm shrink-0 group">
                          <img src={base64} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {formImages.length < 3 && (
                        <label className="w-14 h-14 rounded-full border border-dashed border-stone-300 hover:border-stone-900 flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-stone-50">
                          <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-[7px] text-stone-400 font-semibold uppercase tracking-widest mt-1">Add</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    {uploadError && (
                      <p className="text-[9px] text-red-500 font-semibold tracking-wider mt-2">⚠️ {uploadError}</p>
                    )}
                  </div>

                  {submitError && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-none">
                      ⚠️ {submitError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 text-white font-semibold py-4 rounded-none transition duration-300 mt-2 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    {submitting && (
                      <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin"></div>
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
