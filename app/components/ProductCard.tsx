import clsx from 'clsx';
import {flattenConnection, Image, useMoney} from '@shopify/hydrogen';
import {Money} from '~/components/Money';
import type {MoneyV2, Product} from '@shopify/hydrogen/storefront-api-types';

import type {ProductCardFragment} from 'storefrontapi.generated';
import {Text} from '~/components/Text';
import {Link} from '~/components/Link';
import {Button} from '~/components/Button';
import {AddToCartButton} from '~/components/AddToCartButton';
import {isDiscounted, isNewArrival} from '~/lib/utils';
import {getProductPlaceholder} from '~/lib/placeholders';

export function ProductCard({
  product,
  label,
  className,
  loading,
  onClick,
  quickAdd,
}: {
  product: ProductCardFragment;
  label?: string;
  className?: string;
  loading?: HTMLImageElement['loading'];
  onClick?: () => void;
  quickAdd?: boolean;
}) {
  let cardLabel;

  const cardProduct: Product = product?.variants
    ? (product as Product)
    : getProductPlaceholder();
  if (!cardProduct?.variants?.nodes?.length) return null;

  const firstVariant = flattenConnection(cardProduct.variants)[0];

  if (!firstVariant) return null;
  const {image, price, compareAtPrice} = firstVariant;

  if (label) {
    cardLabel = label;
  } else if (isDiscounted(price as MoneyV2, compareAtPrice as MoneyV2)) {
    cardLabel = 'Sale';
  } else if (isNewArrival(product.publishedAt)) {
    cardLabel = 'New';
  }

  // Dynamic theme colors matching the mockup (rust red, teal, coral)
  const colors = [
    { key: 'rust', bg: 'bg-[#c24b38]', text: 'text-[#c24b38]', lightBg: 'bg-[#c24b38]/10' },
    { key: 'teal', bg: 'bg-[#437a91]', text: 'text-[#437a91]', lightBg: 'bg-[#437a91]/10' },
    { key: 'coral', bg: 'bg-[#ff7a63]', text: 'text-[#ff7a63]', lightBg: 'bg-[#ff7a63]/10' },
  ];
  // Stable color based on product ID
  const charCodeSum = (product.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const cardColor = colors[charCodeSum % colors.length];

  // Fallback for description

  const shortDescription = product.description
    ? (product.description.length > 95 ? product.description.substring(0, 95) + '...' : product.description)
    : 'High-quality electronics and accessories engineered to elevate your daily tech experience.';

  return (
    <div className={clsx("flex flex-col h-full justify-between gap-5 rounded-[2.5rem] border border-primary/5 bg-contrast p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5", className)}>
      <div className="flex flex-col gap-4">
        {/* Product Image Section */}
        <Link
          onClick={onClick}
          to={`/products/${product.handle}`}
          prefetch="viewport"
          className="relative block w-full aspect-square overflow-hidden rounded-[2rem] bg-primary/5 group"
        >
          {/* Category overlay */}
          <div className="absolute top-0 left-0 bg-contrast rounded-br-2xl pr-4 pb-2 pt-3 pl-5 text-[10px] font-bold tracking-wider text-primary/70 uppercase shadow-sm z-10">
            {product.productType || 'Electronics'}
          </div>

          {image && (
            <Image
              className="object-cover w-full h-full aspect-square fadeIn transition duration-500 group-hover:scale-105"
              sizes="(min-width: 64em) 25vw, (min-width: 48em) 30vw, 45vw"
              aspectRatio="1/1"
              data={image}
              alt={image.altText || `Picture of ${product.title}`}
              loading={loading}
            />
          )}

          {cardLabel && (
            <span className={clsx("absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider text-white z-10", cardColor.bg)}>
              {cardLabel}
            </span>
          )}
        </Link>

        {/* Product Details Section */}
        <div className="flex flex-col gap-2">
          {/* Title & Price */}
          <div className="flex flex-col gap-1.5">
            <Link
              onClick={onClick}
              to={`/products/${product.handle}`}
              prefetch="viewport"
              className="w-full"
            >
              <h3 className="font-extrabold text-sm sm:text-base md:text-lg text-primary line-clamp-2 hover:text-[#D33E13] transition-colors min-h-[2.2rem] sm:min-h-[2.5rem]">
                {product.title}
              </h3>
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={clsx("font-black text-xs sm:text-sm md:text-base", cardColor.text)}>
                <Money withoutTrailingZeros data={price!} />
              </span>
              {compareAtPrice && isDiscounted(price as MoneyV2, compareAtPrice as MoneyV2) && (
                <span className="text-[10px] sm:text-xs text-primary/45 line-through font-medium">
                  <Money withoutTrailingZeros data={compareAtPrice as MoneyV2} />
                </span>
              )}
            </div>
          </div>

          {/* Description (Hidden on mobile for card compactness) */}
          <p className="hidden sm:block text-xs text-primary/60 line-clamp-2 leading-relaxed min-h-[2.5rem]">
            {shortDescription}
          </p>

        </div>
      </div>

      {/* Action Button Section */}
      <div className="pt-1">
        {firstVariant.availableForSale ? (
          <AddToCartButton
            lines={[
              {
                quantity: 1,
                merchandiseId: firstVariant.id,
              },
            ]}
            variant="secondary"
            className={clsx(
              "!py-2 sm:!py-3 px-4 sm:px-6 rounded-full text-white font-bold text-center text-xs sm:text-sm w-full flex items-center justify-center gap-1.5 transition duration-300 hover:scale-[1.02] shadow-sm cursor-pointer",
              cardColor.bg,
              "!border-none"
            )}
          >
            <span className="flex items-center justify-center gap-1.5">
              <span>🛒</span>
              <span>Add To Cart</span>
            </span>
          </AddToCartButton>
        ) : (
          <Button
            variant="secondary"
            className="!py-2 sm:!py-3 px-4 sm:px-6 rounded-full bg-primary/10 text-primary/40 font-bold text-center text-xs sm:text-sm w-full flex items-center justify-center gap-1.5 !border-none cursor-not-allowed"
            disabled
          >
            <span>Sold out</span>
          </Button>
        )}
      </div>
    </div>
  );
}

function CompareAtPrice({
  data,
  className,
}: {
  data: MoneyV2;
  className?: string;
}) {
  const {currencyNarrowSymbol, withoutTrailingZerosAndCurrency} =
    useMoney(data);

  const styles = clsx('strike', className);

  return (
    <span className={styles}>
      {currencyNarrowSymbol}
      {withoutTrailingZerosAndCurrency}
    </span>
  );
}
