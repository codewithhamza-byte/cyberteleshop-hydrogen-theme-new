import {useLoaderData} from '@remix-run/react';
import invariant from 'tiny-invariant';
import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  json,
} from '@shopify/remix-oxygen';
import {CartForm, type CartQueryDataReturn, Analytics} from '@shopify/hydrogen';

import {isLocalPath} from '~/lib/utils';
import {Cart} from '~/components/Cart';
import {Link} from '~/components/Link';

export async function action({request, context}: ActionFunctionArgs) {
  const {cart} = context;

  const formData = await request.formData();

  const {action, inputs} = CartForm.getFormInput(formData);
  invariant(action, 'No cartAction defined');

  let status = 200;
  let result: CartQueryDataReturn;

  switch (action) {
    case CartForm.ACTIONS.LinesAdd:
      result = await cart.addLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds);
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate:
      const formDiscountCode = inputs.discountCode;

      // User inputted discount code
      const discountCodes = (
        formDiscountCode ? [formDiscountCode] : []
      ) as string[];

      // Combine discount codes already applied on cart
      discountCodes.push(...inputs.discountCodes);

      result = await cart.updateDiscountCodes(discountCodes);
      break;
    case CartForm.ACTIONS.BuyerIdentityUpdate:
      result = await cart.updateBuyerIdentity({
        ...inputs.buyerIdentity,
      });
      break;
    default:
      invariant(false, `${action} cart action is not defined`);
  }

  /**
   * The Cart ID may change after each mutation. We need to update it each time in the session.
   */
  const cartId = result.cart.id;
  const headers = cart.setCartId(result.cart.id);

  const redirectTo = formData.get('redirectTo') ?? null;
  if (typeof redirectTo === 'string' && isLocalPath(redirectTo)) {
    status = 303;
    headers.set('Location', redirectTo);
  }

  const {cart: cartResult, errors, userErrors} = result;

  return json(
    {
      cart: cartResult,
      userErrors,
      errors,
    },
    {status, headers},
  );
}

export async function loader({context}: LoaderFunctionArgs) {
  const {cart} = context;
  return json(await cart.get());
}

export default function CartRoute() {
  const cart = useLoaderData<typeof loader>();
  const cartHasItems = !!cart && cart.totalQuantity > 0;

  // Calculate free shipping progress (Threshold: PKR 5,000 / USD 150)
  const subtotal = cart?.cost?.subtotalAmount?.amount ? parseFloat(cart.cost.subtotalAmount.amount) : 0;
  const currencyCode = cart?.cost?.subtotalAmount?.currencyCode || 'PKR';
  const threshold = currencyCode === 'PKR' ? 5000 : 150;
  const amountLeft = Math.max(0, threshold - subtotal);
  const progressPercent = Math.min(100, (subtotal / threshold) * 100);

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
          <Link to="/" className="hover:text-gray-600 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-600">Shopping Cart</span>
        </nav>

        {/* Page Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-baseline justify-between border-b border-gray-150 pb-6 gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
              Shopping Cart
            </h1>
            <p className="mt-2 text-xs md:text-sm text-gray-500 font-medium">
              {cartHasItems ? (
                <>Review your selected items ({cart.totalQuantity} {cart.totalQuantity === 1 ? 'item' : 'items'}) before completing checkout.</>
              ) : (
                <>Your cart is currently empty.</>
              )}
            </p>
          </div>
          {cartHasItems && (
            <Link 
              to="/" 
              className="text-[#D33E13] hover:underline font-bold text-xs md:text-sm flex items-center gap-1.5"
            >
              &larr; Continue Shopping
            </Link>
          )}
        </div>

        {/* Free Shipping Progress Indicator */}
        {cartHasItems && (
          <div className="mb-10 bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex-1">
              <h3 className="font-extrabold text-sm md:text-base text-gray-900 flex items-center gap-2">
                <span>🚚</span>
                {amountLeft > 0 ? (
                  <>
                    Add <span className="text-[#D33E13] font-black">Rs. {Math.round(amountLeft).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span> more for <span className="text-green-600">Free Shipping</span>!
                  </>
                ) : (
                  <span className="text-green-600">Congratulations! You've unlocked Free Shipping on this order!</span>
                )}
              </h3>
              <div className="mt-3 w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#D33E13] h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider md:text-right">
              Shipping Threshold: Rs. 5,000
            </div>
          </div>
        )}

        {/* Cart Details Layout Grid */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-10 shadow-sm">
          <Cart layout="page" cart={cart} />
        </div>

        {/* Cart Trust Badges & Customer Support Card */}
        {cartHasItems && (
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-widest mb-4">Guaranteed & Secure Ordering</h4>
                <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                  We use state-of-the-art secure standard SSL encryption to protect your card details, account operations, and financial transactions. Pay with confidence via Cash on Delivery or digital methods.
                </p>
              </div>
              <div className="flex items-center gap-5 mt-6 flex-wrap opacity-80">
                <span className="text-[10px] font-black border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 text-gray-500 tracking-wider">CASH ON DELIVERY</span>
                <span className="text-[10px] font-black border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 text-gray-500 tracking-wider">EASY RETURNS (15 DAYS)</span>
                <span className="text-[10px] font-black border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 text-gray-500 tracking-wider">100% SECURE SSL</span>
              </div>
            </div>

            <div className="bg-gradient-to-tr from-gray-950 to-gray-900 text-white border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest">Need Assistance?</span>
                <h4 className="text-lg font-extrabold mt-1.5 mb-2">We are here to help you</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Have questions about shipping rates, sizes, product details, or custom order quantities? Reach out directly.
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <a 
                  href="https://wa.me/923146257174" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-center py-2.5 rounded-xl text-xs md:text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#25D366]/10"
                >
                  💬 WhatsApp Support
                </a>
                <a 
                  href="mailto:support@cyberteleshop.com"
                  className="w-full bg-white/10 hover:bg-white/15 text-white font-bold text-center py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center"
                >
                  Email: support@cyberteleshop.com
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
      <Analytics.CartView />
    </div>
  );
}
