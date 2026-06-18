import {Image} from '@shopify/hydrogen';

import type {HomepageFeaturedCollectionsQuery} from 'storefrontapi.generated';
import {Heading, Section} from '~/components/Text';
import {Grid} from '~/components/Grid';
import {Link} from '~/components/Link';

type FeaturedCollectionsProps = HomepageFeaturedCollectionsQuery & {
  title?: string;
  [key: string]: any;
};

export function shopifyCollectionImageLoader({src, width, height, crop}: any) {
  try {
    const url = new URL(src);
    const targetWidth = width ? Math.min(width, 400) : 400;
    url.searchParams.set('width', String(targetWidth));
    url.searchParams.set('crop', crop || 'center');
    return url.toString();
  } catch (e) {
    return src;
  }
}

export function FeaturedCollections({
  collections,
  title = 'Collections',
  className,
  ...props
}: FeaturedCollectionsProps) {
  const haveCollections = collections?.nodes?.length > 0;
  if (!haveCollections) return null;

  const collectionsWithImage = collections.nodes.filter((item) => item.image);

  return (
    <Section
      {...props}
      heading={title}
      className={`max-w-7xl mx-auto px-4 md:px-8 my-6 md:my-10 ${className || ''}`}
    >
      <Grid items={collectionsWithImage.length} layout="products" className="lg:grid-cols-4 md:grid-cols-3 gap-4 md:gap-6">
        {collectionsWithImage.map((collection) => {
          return (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              className="group relative block aspect-[4/3] sm:aspect-square md:aspect-[4/3] w-full overflow-hidden rounded-[2rem] bg-gray-100 shadow-md hover:shadow-xl transition-all duration-300 border border-primary/5"
            >
              {/* Image Container */}
              <div className="absolute inset-0 z-0">
                {collection?.image ? (
                  <Image
                    alt={`Image of ${collection.title}`}
                    data={collection.image}
                    sizes="(max-width: 32em) 50vw, (max-width: 48em) 33vw, 25vw"
                    width={400}
                    height={300}
                    aspectRatio="4/3"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loader={shopifyCollectionImageLoader}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1e293b] to-[#0f172a]" />
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/85 via-gray-950/40 to-transparent transition-opacity duration-300" />
              </div>

              {/* Text overlay */}
              <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 sm:p-5">
                <div className="transform transition-transform duration-300 group-hover:-translate-y-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#D33E13] bg-[#D33E13]/10 border border-[#D33E13]/30 px-2.5 py-1 rounded-full w-fit mb-1.5 block">
                    Browse
                  </span>
                  <Heading className="text-sm sm:text-base md:text-lg font-black text-white uppercase tracking-tight line-clamp-1">
                    {collection.title}
                  </Heading>
                  <span className="text-[10px] text-gray-300/80 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1 group-hover:text-white transition-colors duration-200">
                    Shop Collection <span className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </Grid>
    </Section>
  );
}
