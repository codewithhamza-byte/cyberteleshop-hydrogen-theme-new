import {useState, useRef} from 'react';
import {Image} from '@shopify/hydrogen';
import clsx from 'clsx';
import type {MediaFragment} from 'storefrontapi.generated';
import {IconClose} from '~/components/Icon';

/**
 * A client component that defines a media gallery for hosting images, 3D models, and videos of products
 */
export function ProductGallery({
  media,
  className,
}: {
  media: MediaFragment[];
  className?: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePlayIdx, setActivePlayIdx] = useState<number | null>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  if (!media.length) {
    return null;
  }

  const activeMedia = media[activeIdx];

  // Determine media details
  const getMediaDetails = (med: MediaFragment) => {
    const isImage = med.__typename === 'MediaImage';
    const isVideo = med.__typename === 'Video';
    const isExternalVideo = med.__typename === 'ExternalVideo';
    const isModel = med.__typename === 'Model3d';
    
    const imageUrl = med.previewImage?.url;
    const altText = med.alt || 'Product media';

    return {isImage, isVideo, isExternalVideo, isModel, imageUrl, altText};
  };

  const scrollToIdx = (idx: number) => {
    setActiveIdx(idx);
    setActivePlayIdx(null); // Stop playing video when slide changes
    if (mobileScrollRef.current) {
      const width = mobileScrollRef.current.clientWidth;
      mobileScrollRef.current.scrollTo({
        left: width * idx,
        behavior: 'smooth',
      });
    }
  };

  const handlePrev = () => {
    const nextIdx = (activeIdx - 1 + media.length) % media.length;
    scrollToIdx(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = (activeIdx + 1) % media.length;
    scrollToIdx(nextIdx);
  };

  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const index = Math.round(container.scrollLeft / container.clientWidth);
    if (index !== activeIdx && index >= 0 && index < media.length) {
      setActiveIdx(index);
      setActivePlayIdx(null); // Stop playing video when swiped away
    }
  };

  return (
    <div className={clsx('flex flex-col md:flex-row gap-4', className)}>
      {/* Thumbnails list - Desktop (Left Sidebar) */}
      <div className="hidden md:flex flex-col gap-3 w-20 shrink-0 max-h-[600px] overflow-y-auto hiddenScroll">
        {media.map((med, i) => {
          const {imageUrl, altText, isVideo, isExternalVideo, isModel} = getMediaDetails(med);
          const isActive = i === activeIdx;

          return (
            <button
              key={med.id || i}
              onClick={() => scrollToIdx(i)}
              className={clsx(
                'relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 bg-white focus:outline-none',
                isActive ? 'border-[#D33E13] scale-95 shadow-md' : 'border-gray-200 hover:border-gray-400',
              )}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={altText}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                  Media
                </div>
              )}
              {/* Media indicator badge (play or model) */}
              {(isVideo || isExternalVideo) && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <PlayIcon className="w-6 h-6 text-white drop-shadow" />
                </div>
              )}
              {isModel && (
                <div className="absolute bottom-1 right-1 bg-black/60 rounded px-1 text-[9px] text-white">
                  3D
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Active Media Display - Desktop Version */}
      <div className="hidden md:flex relative flex-1 bg-white border border-gray-100 rounded-2xl overflow-hidden aspect-square items-center justify-center group shadow-sm">
        {/* Render active media */}
        <ActiveMediaRenderer media={activeMedia} />

        {/* Expand / Zoom overlay button */}
        <button
          onClick={() => setLightboxOpen(true)}
          className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 group/zoom focus:outline-none"
          title="Zoom image"
        >
          <ZoomIcon className="w-5 h-5 text-[#D33E13]" />
        </button>

        {/* Swipe indicator arrows for mouse hover */}
        {media.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow border border-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white focus:outline-none"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow border border-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white focus:outline-none"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}
      </div>

      {/* Main Active Media Display - Mobile Version (Horizontally Swipeable) */}
      <div className="relative md:hidden flex-1 w-full">
        <div
          ref={mobileScrollRef}
          onScroll={handleMobileScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth hiddenScroll w-full aspect-square bg-white border border-gray-100 rounded-2xl shadow-sm animate-fade-in"
        >
          {media.map((med, i) => {
            const {isImage, isVideo, isExternalVideo, isModel, imageUrl, altText} = getMediaDetails(med);
            const isPlayable = isVideo || isExternalVideo;
            const isPlaying = activePlayIdx === i;

            return (
              <div
                key={med.id || i}
                className="snap-start w-full h-full flex-shrink-0 flex items-center justify-center p-2 relative select-none"
              >
                {isPlayable ? (
                  isPlaying ? (
                    <div className="w-full h-full relative">
                      <ActiveMediaRenderer media={med} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePlayIdx(null);
                        }}
                        className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 focus:outline-none"
                      >
                        <IconClose className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="w-full h-full relative cursor-pointer flex items-center justify-center group"
                      onClick={() => setActivePlayIdx(i)}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={altText}
                          className="w-full h-full object-contain aspect-square rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-xl animate-pulse">
                          Video Preview
                        </div>
                      )}
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black/15 flex items-center justify-center rounded-xl group-hover:bg-black/25 transition-all duration-300">
                        <div className="w-14 h-14 rounded-full bg-white/95 text-[#D33E13] flex items-center justify-center shadow-lg transform group-hover:scale-110 active:scale-95 transition-all duration-200">
                          <PlayIcon className="w-8 h-8 ml-1" />
                        </div>
                      </div>
                    </div>
                  )
                ) : isModel ? (
                  <div 
                    className="w-full h-full relative cursor-pointer flex items-center justify-center group"
                    onClick={() => {
                      setActiveIdx(i);
                      setLightboxOpen(true);
                    }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={altText}
                        className="w-full h-full object-contain aspect-square rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-xl">
                        3D Model
                      </div>
                    )}
                    {/* 3D Icon Overlay */}
                    <div className="absolute inset-0 bg-black/15 flex items-center justify-center rounded-xl group-hover:bg-black/25 transition-all duration-300">
                      <div className="px-4.5 py-2.5 rounded-full bg-white/95 text-[#D33E13] flex items-center gap-2 shadow-lg transform group-hover:scale-105 active:scale-95 transition-all duration-200 text-xs font-black uppercase tracking-wider">
                        <CubeIcon className="w-5 h-5" />
                        View 3D Model
                      </div>
                    </div>
                  </div>
                ) : (
                  <ActiveMediaRenderer media={med} />
                )}
              </div>
            );
          })}
        </div>

        {/* Expand / Zoom overlay button */}
        <button
          onClick={() => setLightboxOpen(true)}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-md border border-gray-100 flex items-center justify-center active:scale-95 transition-all duration-200 focus:outline-none"
          title="Zoom image"
        >
          <ZoomIcon className="w-4 h-4 text-[#D33E13]" />
        </button>

        {/* Floating Page Indicator Dots */}
        {media.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-full z-10">
            {media.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToIdx(i)}
                className={clsx(
                  'w-1.5 h-1.5 rounded-full transition-all duration-300',
                  i === activeIdx ? 'bg-white w-3.5' : 'bg-white/50'
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails list - Mobile (Horizontal bottom) */}
      <div className="flex md:hidden gap-3 overflow-x-auto py-2 px-1 hiddenScroll scroll-smooth">
        {media.map((med, i) => {
          const {imageUrl, altText, isVideo, isExternalVideo, isModel} = getMediaDetails(med);
          const isActive = i === activeIdx;

          return (
            <button
              key={med.id || i}
              onClick={() => scrollToIdx(i)}
              className={clsx(
                'relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 bg-white transition-all duration-200',
                isActive ? 'border-[#D33E13] scale-95 shadow-sm' : 'border-gray-200',
              )}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={altText}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                  Media
                </div>
              )}
              {(isVideo || isExternalVideo) && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <PlayIcon className="w-5 h-5 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox / Zoom Modal Overlay */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fadeIn">
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 z-[110] p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-200"
          >
            <IconClose className="w-6 h-6" />
          </button>

          {/* Left / Right arrows inside Lightbox */}
          {media.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 hover:bg-white/15 text-white transition-all duration-200"
              >
                <ChevronLeftIcon className="w-8 h-8" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 hover:bg-white/15 text-white transition-all duration-200"
              >
                <ChevronRightIcon className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Large Media Content */}
          <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center select-none">
            <ActiveMediaRenderer media={activeMedia} lightbox />
          </div>

          {/* Page indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {activeIdx + 1} / {media.length}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Component to handle rendering the active media based on type
 */
function ActiveMediaRenderer({
  media,
  lightbox = false,
}: {
  media: MediaFragment;
  lightbox?: boolean;
}) {
  const isImage = media.__typename === 'MediaImage';
  const isVideo = media.__typename === 'Video';
  const isExternalVideo = media.__typename === 'ExternalVideo';
  const isModel = media.__typename === 'Model3d';

  if (isImage && media.image) {
    return (
      <Image
        data={media.image}
        loading="eager"
        sizes="(max-width: 48em) 100vw, 50vw"
        className={clsx(
          'object-contain transition-all duration-300 w-full h-full fadeIn',
          lightbox ? 'max-h-[85vh]' : 'aspect-square max-h-[600px]',
        )}
      />
    );
  }

  if (isVideo && media.sources?.length) {
    const source = media.sources[0];
    return (
      <video
        controls
        autoPlay
        muted
        playsInline
        className={clsx(
          'w-full h-full object-contain',
          lightbox ? 'max-h-[85vh]' : 'aspect-square max-h-[600px]',
        )}
        key={media.id}
      >
        <source src={source.url} type={source.mimeType} />
        Your browser does not support the video tag.
      </video>
    );
  }

  if (isExternalVideo && media.embedUrl) {
    return (
      <iframe
        src={media.embedUrl}
        allow="autoplay; encrypted-media"
        allowFullScreen
        className={clsx(
          'w-full h-full border-0',
          lightbox ? 'w-[80vw] h-[60vh]' : 'aspect-square max-h-[600px]',
        )}
        title={media.alt || 'External video'}
        key={media.id}
      />
    );
  }

  if (isModel && media.sources?.length) {
    const source = media.sources[0];
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl w-full h-full">
        <CubeIcon className="w-16 h-16 text-gray-400 mb-2" />
        <span className="text-gray-500 font-medium text-sm">3D Interactive Model</span>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 px-4 py-2 bg-[#D33E13] text-white text-xs rounded-full font-semibold hover:bg-[#b0300d]"
        >
          View Model
        </a>
      </div>
    );
  }

  return (
    <div className="text-gray-400 text-sm">
      Unsupported media type
    </div>
  );
}

// Icons helper components
function PlayIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function ZoomIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}

function ChevronLeftIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

function CubeIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
