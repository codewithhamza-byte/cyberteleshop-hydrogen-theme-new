import clsx from 'clsx';
import {useRef, useState} from 'react';
import useScroll from 'react-use/esm/useScroll';
import {
  flattenConnection,
  CartForm,
  Image,
  useOptimisticData,
  OptimisticInput,
  type CartReturn,
} from '@shopify/hydrogen';
import {Money} from '~/components/Money';
import type {
  Cart as CartType,
  CartCost,
  CartLine,
  CartLineUpdateInput,
} from '@shopify/hydrogen/storefront-api-types';

import {Button} from '~/components/Button';
import {Text, Heading} from '~/components/Text';
import {Link} from '~/components/Link';
import {IconRemove} from '~/components/Icon';
import {FeaturedProducts} from '~/components/FeaturedProducts';
import {getInputStyleClasses} from '~/lib/utils';

type Layouts = 'page' | 'drawer';

export function Cart({
  layout,
  onClose,
  cart,
}: {
  layout: Layouts;
  onClose?: () => void;
  cart: CartReturn | null;
}) {
  const linesCount = Boolean(cart?.lines?.edges?.length || 0);

  return (
    <>
      <CartEmpty hidden={linesCount} onClose={onClose} layout={layout} />
      <CartDetails cart={cart} layout={layout} />
    </>
  );
}

export function CartDetails({
  layout,
  cart,
}: {
  layout: Layouts;
  cart: CartType | null;
}) {
  const cartHasItems = !!cart && cart.totalQuantity > 0;

  if (layout === 'drawer') {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <CartLines lines={cart?.lines} layout={layout} />
        {cartHasItems && (
          <CartSummary cost={cart.cost} layout={layout}>
            <CartDiscounts discountCodes={cart.discountCodes} />
            <CartCheckoutActions checkoutUrl={cart.checkoutUrl} />
          </CartSummary>
        )}
      </div>
    );
  }

  const container = {
    page: 'w-full pb-12 grid lg:grid-cols-12 items-start gap-8 lg:gap-12',
  };

  return (
    <div className={container[layout]}>
      <CartLines lines={cart?.lines} layout={layout} />
      {cartHasItems && (
        <CartSummary cost={cart.cost} layout={layout}>
          <CartDiscounts discountCodes={cart.discountCodes} />
          <CartCheckoutActions checkoutUrl={cart.checkoutUrl} />
        </CartSummary>
      )}
    </div>
  );
}

/**
 * Discount UI with modern pill design
 */
function CartDiscounts({
  discountCodes,
}: {
  discountCodes: CartType['discountCodes'];
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <div className="space-y-3">
      {/* Applied discount codes */}
      {codes && codes.length > 0 && (
        <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-100">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21l-7-7-7 7V5a2 2 0 012-2h10a2 2 0 012 2v16z"
              />
            </svg>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
              {codes.join(', ')}
            </span>
          </div>
          <UpdateDiscountForm>
            <button
              className="text-emerald-500 hover:text-emerald-700 transition-colors"
              type="submit"
              title="Remove discount"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </UpdateDiscountForm>
        </div>
      )}

      {/* Discount input */}
      <UpdateDiscountForm discountCodes={codes}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21l-7-7-7 7V5a2 2 0 012-2h10a2 2 0 012 2v16z"
              />
            </svg>
            <input
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#D33E13]/30 focus:border-[#D33E13] transition-all duration-200"
              type="text"
              name="discountCode"
              placeholder="Promo code"
            />
          </div>
          <button
            type="submit"
            className="flex-shrink-0 px-4 py-2.5 text-xs font-bold uppercase tracking-wide rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-all duration-200 whitespace-nowrap"
          >
            Apply
          </button>
        </div>
      </UpdateDiscountForm>
    </div>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

function CartLines({
  layout = 'drawer',
  lines: cartLines,
}: {
  layout: Layouts;
  lines: CartType['lines'] | undefined;
}) {
  const currentLines = cartLines ? flattenConnection(cartLines) : [];
  const scrollRef = useRef(null);
  const {y} = useScroll(scrollRef);

  if (layout === 'drawer') {
    return (
      <section
        ref={scrollRef}
        aria-labelledby="cart-contents"
        className={clsx(
          'flex-1 overflow-y-auto overscroll-contain px-5 py-4',
          y > 0 ? 'shadow-inner' : '',
        )}
      >
        {currentLines.length > 0 ? (
          <ul className="space-y-4">
            {currentLines.map((line) => (
              <CartLineItem key={line.id} line={line as CartLine} layout={layout} />
            ))}
          </ul>
        ) : null}
      </section>
    );
  }

  return (
    <section
      ref={scrollRef}
      aria-labelledby="cart-contents"
      className="lg:col-span-8 flex-grow"
    >
      <ul className="grid gap-6 md:gap-10">
        {currentLines.map((line) => (
          <CartLineItem key={line.id} line={line as CartLine} layout={layout} />
        ))}
      </ul>
    </section>
  );
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl: string}) {
  if (!checkoutUrl) return null;

  return (
    <div className="space-y-3 mt-1">
      <a href={checkoutUrl} target="_self" className="block">
        <button
          className="w-full py-3.5 px-6 bg-[#D33E13] hover:bg-[#b83310] text-white font-extrabold text-sm uppercase tracking-widest rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#D33E13]/20 hover:shadow-[#D33E13]/30 hover:-translate-y-0.5 active:translate-y-0"
          type="button"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Checkout Securely
        </button>
      </a>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-4 pt-1">
        <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-medium">
          <svg
            className="w-3 h-3 text-emerald-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Secure Checkout
        </div>
        <div className="w-px h-3 bg-neutral-200" />
        <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-medium">
          <svg
            className="w-3 h-3 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          Cash on Delivery
        </div>
        <div className="w-px h-3 bg-neutral-200" />
        <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-medium">
          <svg
            className="w-3 h-3 text-orange-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          Free Returns
        </div>
      </div>
    </div>
  );
}

function CartSummary({
  cost,
  layout,
  children = null,
}: {
  children?: React.ReactNode;
  cost: CartCost;
  layout: Layouts;
}) {
  if (layout === 'drawer') {
    return (
      <section
        aria-labelledby="summary-heading"
        className="flex-shrink-0 border-t border-neutral-100 bg-neutral-50 px-5 pt-4 pb-5 space-y-4"
      >
        <h2 id="summary-heading" className="sr-only">
          Order summary
        </h2>

        {/* Subtotal row */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500 font-medium">Subtotal</span>
          <span className="text-base font-extrabold text-neutral-800">
            {cost?.subtotalAmount?.amount ? (
              <Money data={cost?.subtotalAmount} />
            ) : (
              '—'
            )}
          </span>
        </div>

        {/* Shipping notice */}
        <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-100">
          <svg
            className="w-4 h-4 text-emerald-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12h12L19 8"
            />
          </svg>
          <p className="text-[11px] text-emerald-700 font-semibold">
            Free shipping on orders over{' '}
            <span className="font-extrabold">Rs. 3,000</span>
          </p>
        </div>

        {children}
      </section>
    );
  }

  return (
    <section
      aria-labelledby="summary-heading"
      className="lg:col-span-4 sticky top-28 grid gap-6 p-6 md:p-8 bg-gray-50/70 border border-gray-100/50 rounded-3xl w-full"
    >
      <h2 id="summary-heading" className="sr-only">
        Order summary
      </h2>
      <dl className="grid">
        <div className="flex items-center justify-between font-medium">
          <Text as="dt">Subtotal</Text>
          <Text as="dd" data-test="subtotal">
            {cost?.subtotalAmount?.amount ? (
              <Money data={cost?.subtotalAmount} />
            ) : (
              '-'
            )}
          </Text>
        </div>
      </dl>
      {children}
    </section>
  );
}

type OptimisticData = {
  action?: string;
  quantity?: number;
};

function CartLineItem({
  line,
  layout = 'drawer',
}: {
  line: CartLine;
  layout?: Layouts;
}) {
  const optimisticData = useOptimisticData<OptimisticData>(line?.id);

  if (!line?.id) return null;

  const {id, quantity, merchandise} = line;

  if (typeof quantity === 'undefined' || !merchandise?.product) return null;

  if (layout === 'drawer') {
    return (
      <li
        key={id}
        className="group relative flex gap-3.5 p-3 rounded-2xl bg-white border border-neutral-100 hover:border-neutral-200 hover:shadow-sm transition-all duration-200"
        style={{
          display: optimisticData?.action === 'remove' ? 'none' : 'flex',
        }}
      >
        {/* Product Image */}
        <div className="flex-shrink-0">
          {merchandise.image && (
            <div className="w-[78px] h-[78px] rounded-xl overflow-hidden bg-neutral-50 border border-neutral-100">
              <Image
                width={78}
                height={78}
                data={merchandise.image}
                className="object-cover object-center w-full h-full"
                alt={merchandise.title}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0 gap-1.5">
          {/* Product name + remove */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {merchandise?.product?.handle ? (
                <Link
                  to={`/products/${merchandise.product.handle}`}
                  className="text-sm font-bold text-neutral-800 hover:text-[#D33E13] transition-colors leading-snug line-clamp-2"
                >
                  {merchandise?.product?.title || ''}
                </Link>
              ) : (
                <span className="text-sm font-bold text-neutral-800 leading-snug line-clamp-2">
                  {merchandise?.product?.title || ''}
                </span>
              )}

              {/* Variants */}
              <div className="flex flex-wrap gap-1 mt-1">
                {(merchandise?.selectedOptions || [])
                  .filter((option) => option.value !== 'Default Title')
                  .map((option) => (
                    <span
                      key={option.name}
                      className="inline-flex text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-500 font-medium"
                    >
                      {option.name}: {option.value}
                    </span>
                  ))}
              </div>
            </div>

            {/* Remove button */}
            <ItemRemoveButton lineId={id} />
          </div>

          {/* Qty + Price row */}
          <div className="flex items-center justify-between mt-auto pt-1">
            <CartLineQuantityAdjust line={line} />
            <span className="text-sm font-extrabold text-neutral-800">
              <CartLinePrice line={line} as="span" />
            </span>
          </div>
        </div>
      </li>
    );
  }

  // Page layout
  return (
    <li
      key={id}
      className="flex gap-4"
      style={{
        display: optimisticData?.action === 'remove' ? 'none' : 'flex',
      }}
    >
      <div className="flex-shrink">
        {merchandise.image && (
          <Image
            width={110}
            height={110}
            data={merchandise.image}
            className="object-cover object-center w-24 h-24 border rounded md:w-28 md:h-28"
            alt={merchandise.title}
          />
        )}
      </div>

      <div className="flex justify-between flex-grow">
        <div className="grid gap-2">
          <Heading as="h3" size="copy">
            {merchandise?.product?.handle ? (
              <Link to={`/products/${merchandise.product.handle}`}>
                {merchandise?.product?.title || ''}
              </Link>
            ) : (
              <Text>{merchandise?.product?.title || ''}</Text>
            )}
          </Heading>

          <div className="grid pb-2">
            {(merchandise?.selectedOptions || [])
              .filter((option) => option.value !== 'Default Title')
              .map((option) => (
                <Text color="subtle" key={option.name}>
                  {option.name}: {option.value}
                </Text>
              ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex justify-start text-copy">
              <CartLineQuantityAdjust line={line} />
            </div>
            <ItemRemoveButton lineId={id} />
          </div>
        </div>
        <Text>
          <CartLinePrice line={line} as="span" />
        </Text>
      </div>
    </li>
  );
}

function ItemRemoveButton({lineId}: {lineId: CartLine['id']}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{
        lineIds: [lineId],
      }}
    >
      <button
        className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
        type="submit"
        title="Remove item"
      >
        <span className="sr-only">Remove</span>
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <OptimisticInput id={lineId} data={{action: 'remove'}} />
    </CartForm>
  );
}

function CartLineQuantityAdjust({line}: {line: CartLine}) {
  const optimisticId = line?.id;
  const optimisticData = useOptimisticData<OptimisticData>(optimisticId);

  if (!line || typeof line?.quantity === 'undefined') return null;

  const optimisticQuantity = optimisticData?.quantity || line.quantity;

  const {id: lineId} = line;
  const prevQuantity = Number(Math.max(0, optimisticQuantity - 1).toFixed(0));
  const nextQuantity = Number((optimisticQuantity + 1).toFixed(0));

  return (
    <>
      <label htmlFor={`quantity-${lineId}`} className="sr-only">
        Quantity, {optimisticQuantity}
      </label>
      <div className="flex items-center gap-1 bg-neutral-100 rounded-xl p-0.5">
        <UpdateCartButton lines={[{id: lineId, quantity: prevQuantity}]}>
          <button
            name="decrease-quantity"
            aria-label="Decrease quantity"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-white transition-all duration-150 disabled:opacity-30 disabled:pointer-events-none"
            value={prevQuantity}
            disabled={optimisticQuantity <= 1}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
            <OptimisticInput
              id={optimisticId}
              data={{quantity: prevQuantity}}
            />
          </button>
        </UpdateCartButton>

        <div
          className="min-w-[20px] text-center text-xs font-extrabold text-neutral-800"
          data-test="item-quantity"
        >
          {optimisticQuantity}
        </div>

        <UpdateCartButton lines={[{id: lineId, quantity: nextQuantity}]}>
          <button
            className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-white transition-all duration-150"
            name="increase-quantity"
            value={nextQuantity}
            aria-label="Increase quantity"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <OptimisticInput
              id={optimisticId}
              data={{quantity: nextQuantity}}
            />
          </button>
        </UpdateCartButton>
      </div>
    </>
  );
}

function UpdateCartButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{
        lines,
      }}
    >
      {children}
    </CartForm>
  );
}

function CartLinePrice({
  line,
  priceType = 'regular',
  ...passthroughProps
}: {
  line: CartLine;
  priceType?: 'regular' | 'compareAt';
  [key: string]: any;
}) {
  if (!line?.cost) return null;

  const moneyV2 =
    priceType === 'regular'
      ? line.cost.totalAmount
      : line.cost.compareAtAmountPerQuantity;

  if (moneyV2 == null) {
    return null;
  }

  return <Money withoutTrailingZeros {...passthroughProps} data={moneyV2} />;
}

export function CartEmpty({
  hidden = false,
  layout = 'drawer',
  onClose,
}: {
  hidden: boolean;
  layout?: Layouts;
  onClose?: () => void;
}) {
  const scrollRef = useRef(null);
  const {y} = useScroll(scrollRef);

  if (layout === 'drawer') {
    return (
      <div
        ref={scrollRef}
        hidden={hidden}
        className="flex flex-col flex-1 items-center justify-center px-6 py-12 text-center"
      >
        {/* Empty bag illustration */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-neutral-50 border-2 border-dashed border-neutral-200 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-neutral-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#D33E13]/10 flex items-center justify-center">
            <span className="text-[#D33E13] font-extrabold text-xs">0</span>
          </div>
        </div>

        <h3 className="text-base font-extrabold text-neutral-800 mb-1">
          Your cart is empty
        </h3>
        <p className="text-sm text-neutral-400 font-medium mb-6 max-w-[220px]">
          Looks like you haven&rsquo;t added anything yet. Let&rsquo;s fix that!
        </p>

        <button
          onClick={onClose}
          className="px-6 py-3 rounded-2xl bg-[#D33E13] hover:bg-[#b83310] text-white font-extrabold text-sm uppercase tracking-wide transition-all duration-200 shadow-lg shadow-[#D33E13]/20 hover:-translate-y-0.5"
        >
          Continue Shopping
        </button>

        {/* Featured products below */}
        <div className="w-full mt-10 text-left">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 mb-4">
            You might like
          </p>
          <FeaturedProducts
            count={4}
            heading="Shop Best Sellers"
            layout={layout}
            onClose={onClose}
            sortKey="BEST_SELLING"
          />
        </div>
      </div>
    );
  }

  const container = {
    page: clsx([
      hidden ? '' : 'grid',
      `pb-12 w-full md:items-start gap-4 md:gap-8 lg:gap-12`,
    ]),
  };

  return (
    <div ref={scrollRef} className={container[layout]} hidden={hidden}>
      <section className="grid gap-6">
        <Text format>
          Looks like you haven&rsquo;t added anything yet, let&rsquo;s get you
          started!
        </Text>
        <div>
          <Button onClick={onClose}>Continue shopping</Button>
        </div>
      </section>
      <section className="grid gap-8 pt-16">
        <FeaturedProducts
          count={4}
          heading="Shop Best Sellers"
          layout={layout}
          onClose={onClose}
          sortKey="BEST_SELLING"
        />
      </section>
    </div>
  );
}
