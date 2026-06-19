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
import {FeaturedProducts} from '~/components/FeaturedProducts';

type Layouts = 'page' | 'drawer';

// Free shipping threshold in PKR
const FREE_SHIPPING_THRESHOLD = 5000;

// ─── Root Cart component ────────────────────────────────────────────────────
export function Cart({
  layout,
  onClose,
  cart,
}: {
  layout: Layouts;
  onClose?: () => void;
  cart: CartReturn | null;
}) {
  const hasItems = Boolean(cart?.lines?.edges?.length || 0);

  if (layout === 'drawer') {
    return (
      // This div must fill the remaining space inside the Drawer flex column
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {hasItems ? (
          <DrawerCartFilled cart={cart as CartType} onClose={onClose} />
        ) : (
          <DrawerCartEmpty onClose={onClose} />
        )}
      </div>
    );
  }

  // Page layout
  return (
    <>
      {!hasItems && <CartEmpty hidden={false} layout={layout} onClose={onClose} />}
      {hasItems && <CartDetails cart={cart} layout={layout} />}
    </>
  );
}

// ─── Drawer: filled cart ────────────────────────────────────────────────────
function DrawerCartFilled({
  cart,
  onClose,
}: {
  cart: CartType;
  onClose?: () => void;
}) {
  const lines = flattenConnection(cart.lines);
  const subtotalAmount = Number(cart.cost?.subtotalAmount?.amount || 0);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotalAmount);
  const pct = Math.min(100, (subtotalAmount / FREE_SHIPPING_THRESHOLD) * 100);
  const qualifies = subtotalAmount >= FREE_SHIPPING_THRESHOLD;

  return (
    <>
      {/* ── Promotions Banner ─────────────────────────────────────── */}
      <CartPromoBanner subtotal={subtotalAmount} />

      {/* ── Free Shipping Progress ────────────────────────────────── */}
      <div className="flex-shrink-0 px-5 py-3 bg-neutral-50 border-b border-neutral-100">
        {qualifies ? (
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-emerald-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-xs font-bold text-emerald-600">
              🎉 You&apos;ve unlocked <span className="font-extrabold">FREE shipping!</span>
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-neutral-500 font-medium">
                Add{' '}
                <span className="font-extrabold text-neutral-700">
                  Rs. {Math.round(remaining).toLocaleString()}
                </span>{' '}
                more for <span className="font-extrabold text-emerald-600">FREE shipping</span>
              </p>
              <span className="text-[10px] text-neutral-400 font-bold">
                {Math.round(pct)}%
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
                style={{width: `${pct}%`}}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Scrollable Cart Lines ──────────────────────────────────── */}
      <CartLinesDrawer lines={cart.lines} />

      {/* ── Sticky Footer: Summary + Checkout ─────────────────────── */}
      <div className="flex-shrink-0 border-t border-neutral-100 bg-white">
        {/* Subtotal */}
        <div className="px-5 pt-4 pb-3 space-y-3 bg-neutral-50 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500 font-medium">Subtotal</span>
            <span className="text-base font-extrabold text-neutral-800">
              {cart.cost?.subtotalAmount?.amount ? (
                <Money data={cart.cost.subtotalAmount} />
              ) : (
                '—'
              )}
            </span>
          </div>

          {/* Discount codes section */}
          <CartDiscounts discountCodes={cart.discountCodes} />
        </div>

        {/* Checkout + trust */}
        <div className="px-5 pt-3 pb-5 space-y-3">
          <CartCheckoutActions checkoutUrl={cart.checkoutUrl} />

          {/* View full cart link */}
          <Link
            to="/cart"
            onClick={onClose}
            className="block text-center text-xs text-neutral-400 hover:text-neutral-600 font-medium transition-colors underline-offset-2 hover:underline"
          >
            View full cart
          </Link>
        </div>
      </div>
    </>
  );
}

// ─── Promotions banner (rotates offers) ────────────────────────────────────
function CartPromoBanner({subtotal}: {subtotal: number}) {
  const promos = [
    {
      icon: '⚡',
      text: 'FREE SHIPPING on orders over Rs. 5,000',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: '🎁',
      text: 'Use code CYBER10 for 10% off your first order!',
      color: 'from-[#D33E13] to-orange-500',
    },
    {
      icon: '🔄',
      text: '7-Day Easy Returns • 100% Satisfaction Guaranteed',
      color: 'from-blue-500 to-indigo-500',
    },
  ];
  const [current, setCurrent] = useState(0);

  return (
    <div
      className={`flex-shrink-0 bg-gradient-to-r ${promos[current].color} text-white px-4 py-2 flex items-center justify-between gap-3 transition-all duration-500 select-none`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm flex-shrink-0">{promos[current].icon}</span>
        <p className="text-[11px] font-bold truncate">{promos[current].text}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {promos.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
              i === current ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Show promo ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Scrollable lines section (drawer) ─────────────────────────────────────
function CartLinesDrawer({lines}: {lines: CartType['lines'] | undefined}) {
  const currentLines = lines ? flattenConnection(lines) : [];
  const scrollRef = useRef<HTMLElement>(null);
  const {y} = useScroll(scrollRef as any);

  return (
    <section
      ref={scrollRef}
      aria-labelledby="cart-contents"
      className={clsx(
        'flex-1 overflow-y-auto overscroll-contain px-4 py-4',
        y > 0 ? 'shadow-inner' : '',
      )}
      style={{WebkitOverflowScrolling: 'touch'}}
    >
      <ul className="space-y-3">
        {currentLines.map((line) => (
          <CartLineItem key={line.id} line={line as CartLine} layout="drawer" />
        ))}
      </ul>
    </section>
  );
}

// ─── Drawer: empty cart ─────────────────────────────────────────────────────
function DrawerCartEmpty({onClose}: {onClose?: () => void}) {
  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      {/* Empty state hero */}
      <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-3xl bg-neutral-50 border-2 border-dashed border-neutral-200 flex items-center justify-center">
            <svg
              className="w-9 h-9 text-neutral-300"
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
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#D33E13]/10 flex items-center justify-center">
            <span className="text-[#D33E13] font-extrabold text-[10px]">0</span>
          </div>
        </div>

        <h3 className="text-base font-extrabold text-neutral-800 mb-1">
          Your cart is empty
        </h3>
        <p className="text-sm text-neutral-400 font-medium mb-5 max-w-[200px]">
          Looks like you haven&rsquo;t added anything yet. Let&rsquo;s fix that!
        </p>

        <button
          onClick={onClose}
          className="px-6 py-3 rounded-2xl bg-[#D33E13] hover:bg-[#b83310] text-white font-extrabold text-sm uppercase tracking-wide transition-all duration-200 shadow-lg shadow-[#D33E13]/20 hover:-translate-y-0.5 active:translate-y-0"
        >
          Continue Shopping
        </button>
      </div>

      {/* Promotions in empty state */}
      <div className="px-5 py-4 space-y-2 border-t border-neutral-100 bg-neutral-50/60">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 mb-3">
          🔥 Active Promotions
        </p>
        {[
          {icon: '⚡', label: 'Free Shipping', desc: 'On orders over Rs. 5,000'},
          {icon: '🎁', label: '10% OFF First Order', desc: 'Use code: CYBER10'},
          {icon: '🔄', label: '7-Day Returns', desc: '100% hassle-free returns'},
          {icon: '🛡️', label: 'Secure Checkout', desc: 'SSL encrypted payments'},
        ].map(({icon, label, desc}) => (
          <div key={label} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white border border-neutral-100">
            <span className="text-lg flex-shrink-0">{icon}</span>
            <div>
              <p className="text-xs font-bold text-neutral-700">{label}</p>
              <p className="text-[10px] text-neutral-400 font-medium">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Best sellers */}
      <div className="px-5 py-4 border-t border-neutral-100">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 mb-4">
          You might like
        </p>
        <FeaturedProducts
          count={4}
          heading="Shop Best Sellers"
          layout="drawer"
          onClose={onClose}
          sortKey="BEST_SELLING"
        />
      </div>
    </div>
  );
}

// ─── Page layout cart (unchanged structure) ─────────────────────────────────
export function CartDetails({
  layout,
  cart,
}: {
  layout: Layouts;
  cart: CartType | null;
}) {
  const cartHasItems = !!cart && cart.totalQuantity > 0;

  return (
    <div className="w-full pb-12 grid lg:grid-cols-12 items-start gap-8 lg:gap-12">
      <section aria-labelledby="cart-contents" className="lg:col-span-8 flex-grow">
        <ul className="grid gap-6 md:gap-10">
          {cart?.lines &&
            flattenConnection(cart.lines).map((line) => (
              <CartLineItem key={line.id} line={line as CartLine} layout="page" />
            ))}
        </ul>
      </section>
      {cartHasItems && (
        <CartSummary cost={cart!.cost} layout={layout}>
          <CartDiscounts discountCodes={cart!.discountCodes} />
          <CartCheckoutActions checkoutUrl={cart!.checkoutUrl} />
        </CartSummary>
      )}
    </div>
  );
}

// ─── Discount UI ────────────────────────────────────────────────────────────
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
    <div className="space-y-2">
      {/* Applied codes */}
      {codes.length > 0 && (
        <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-emerald-50 border border-emerald-100">
          <div className="flex items-center gap-2">
            <svg
              className="w-3.5 h-3.5 text-emerald-600"
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
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
              {codes.join(', ')}
            </span>
          </div>
          <UpdateDiscountForm>
            <button
              type="submit"
              className="text-emerald-400 hover:text-red-500 transition-colors p-0.5"
              title="Remove discount"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </UpdateDiscountForm>
        </div>
      )}

      {/* Input to apply */}
      <UpdateDiscountForm discountCodes={codes}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400"
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
              className="w-full pl-8 pr-2 py-2 text-xs rounded-xl border border-neutral-200 bg-white text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#D33E13]/30 focus:border-[#D33E13] transition-all duration-200"
              type="text"
              name="discountCode"
              placeholder="Promo / discount code"
            />
          </div>
          <button
            type="submit"
            className="flex-shrink-0 px-3 py-2 text-[11px] font-bold uppercase tracking-wide rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 transition-all duration-200 whitespace-nowrap"
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
      inputs={{discountCodes: discountCodes || []}}
    >
      {children}
    </CartForm>
  );
}

// ─── Checkout button + trust badges ────────────────────────────────────────
function CartCheckoutActions({checkoutUrl}: {checkoutUrl: string}) {
  if (!checkoutUrl) return null;

  return (
    <div className="space-y-2.5">
      <a href={checkoutUrl} target="_self" className="block">
        <button
          className="w-full py-3.5 px-6 bg-[#D33E13] hover:bg-[#b83310] text-white font-extrabold text-sm uppercase tracking-widest rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#D33E13]/25 hover:shadow-[#D33E13]/30 hover:-translate-y-0.5 active:translate-y-0"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Checkout Securely
        </button>
      </a>

      {/* Trust badges row */}
      <div className="flex items-center justify-center gap-3 pt-0.5">
        <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-medium">
          <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Secure
        </div>
        <div className="w-px h-3 bg-neutral-200" />
        <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-medium">
          <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          COD Available
        </div>
        <div className="w-px h-3 bg-neutral-200" />
        <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-medium">
          <svg className="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Free Returns
        </div>
      </div>
    </div>
  );
}

// ─── Cart summary (page layout) ─────────────────────────────────────────────
function CartSummary({
  cost,
  layout,
  children = null,
}: {
  children?: React.ReactNode;
  cost: CartCost;
  layout: Layouts;
}) {
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

// ─── Cart line item ─────────────────────────────────────────────────────────
type OptimisticData = {action?: string; quantity?: number};

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

  const isHidden = optimisticData?.action === 'remove';

  if (layout === 'drawer') {
    return (
      <li
        className="flex gap-3 p-2.5 rounded-2xl bg-white border border-neutral-100 hover:border-neutral-200 hover:shadow-sm transition-all duration-200"
        style={{display: isHidden ? 'none' : 'flex'}}
      >
        {/* Image */}
        <div className="flex-shrink-0">
          {merchandise.image && (
            <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-neutral-50 border border-neutral-100">
              <Image
                width={72}
                height={72}
                data={merchandise.image}
                className="object-cover object-center w-full h-full"
                alt={merchandise.title}
              />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col flex-1 min-w-0 gap-1">
          {/* Name + remove */}
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0 flex-1">
              {merchandise?.product?.handle ? (
                <Link
                  to={`/products/${merchandise.product.handle}`}
                  className="text-xs font-bold text-neutral-800 hover:text-[#D33E13] transition-colors leading-snug line-clamp-2 block"
                >
                  {merchandise?.product?.title || ''}
                </Link>
              ) : (
                <span className="text-xs font-bold text-neutral-800 leading-snug line-clamp-2 block">
                  {merchandise?.product?.title || ''}
                </span>
              )}

              {/* Variant pills */}
              <div className="flex flex-wrap gap-1 mt-0.5">
                {(merchandise?.selectedOptions || [])
                  .filter((opt) => opt.value !== 'Default Title')
                  .map((opt) => (
                    <span
                      key={opt.name}
                      className="inline-flex text-[9px] px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-500 font-medium"
                    >
                      {opt.name}: {opt.value}
                    </span>
                  ))}
              </div>
            </div>

            <ItemRemoveButton lineId={id} />
          </div>

          {/* Qty + Price */}
          <div className="flex items-center justify-between mt-auto">
            <CartLineQuantityAdjust line={line} />
            <span className="text-xs font-extrabold text-neutral-800">
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
      className="flex gap-4"
      style={{display: isHidden ? 'none' : 'flex'}}
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
              .filter((opt) => opt.value !== 'Default Title')
              .map((opt) => (
                <Text color="subtle" key={opt.name}>
                  {opt.name}: {opt.value}
                </Text>
              ))}
          </div>
          <div className="flex items-center gap-2">
            <CartLineQuantityAdjust line={line} />
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

// ─── Remove button ──────────────────────────────────────────────────────────
function ItemRemoveButton({lineId}: {lineId: CartLine['id']}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds: [lineId]}}
    >
      <button
        className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
        type="submit"
        title="Remove item"
      >
        <span className="sr-only">Remove</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <OptimisticInput id={lineId} data={{action: 'remove'}} />
    </CartForm>
  );
}

// ─── Quantity stepper ───────────────────────────────────────────────────────
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
      <div className="flex items-center gap-0.5 bg-neutral-100 rounded-xl p-0.5">
        <UpdateCartButton lines={[{id: lineId, quantity: prevQuantity}]}>
          <button
            name="decrease-quantity"
            aria-label="Decrease quantity"
            className="w-6 h-6 flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-white transition-all duration-150 disabled:opacity-30 disabled:pointer-events-none"
            value={prevQuantity}
            disabled={optimisticQuantity <= 1}
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
            <OptimisticInput id={optimisticId} data={{quantity: prevQuantity}} />
          </button>
        </UpdateCartButton>

        <div
          className="min-w-[22px] text-center text-xs font-extrabold text-neutral-800"
          data-test="item-quantity"
        >
          {optimisticQuantity}
        </div>

        <UpdateCartButton lines={[{id: lineId, quantity: nextQuantity}]}>
          <button
            className="w-6 h-6 flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-white transition-all duration-150"
            name="increase-quantity"
            value={nextQuantity}
            aria-label="Increase quantity"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <OptimisticInput id={optimisticId} data={{quantity: nextQuantity}} />
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
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}

// ─── Line price ─────────────────────────────────────────────────────────────
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
  if (moneyV2 == null) return null;
  return <Money withoutTrailingZeros {...passthroughProps} data={moneyV2} />;
}

// ─── CartEmpty (page layout only) ──────────────────────────────────────────
export function CartEmpty({
  hidden = false,
  layout = 'drawer',
  onClose,
}: {
  hidden: boolean;
  layout?: Layouts;
  onClose?: () => void;
}) {
  const container = clsx(
    hidden ? 'hidden' : 'grid',
    'pb-12 w-full md:items-start gap-4 md:gap-8 lg:gap-12',
  );

  return (
    <div className={container}>
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
