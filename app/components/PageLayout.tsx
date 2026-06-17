import {useParams, Form, Await, useRouteLoaderData} from '@remix-run/react';
import useWindowScroll from 'react-use/esm/useWindowScroll';
import {Disclosure} from '@headlessui/react';
import {Suspense, useEffect, useMemo} from 'react';
import {CartForm} from '@shopify/hydrogen';

import {type LayoutQuery} from 'storefrontapi.generated';
import {Text, Heading, Section} from '~/components/Text';
import {Link} from '~/components/Link';
import {Cart} from '~/components/Cart';
import {CartLoading} from '~/components/CartLoading';
import {Input} from '~/components/Input';
import {Drawer, useDrawer} from '~/components/Drawer';
import {CountrySelector} from '~/components/CountrySelector';
import {
  IconMenu,
  IconCaret,
  IconLogin,
  IconAccount,
  IconBag,
  IconSearch,
  IconArrow,
} from '~/components/Icon';
import {
  type EnhancedMenu,
  type ChildEnhancedMenuItem,
  useIsHomePath,
} from '~/lib/utils';
import {useIsHydrated} from '~/hooks/useIsHydrated';
import {useCartFetchers} from '~/hooks/useCartFetchers';
import type {RootLoader} from '~/root';

type LayoutProps = {
  children: React.ReactNode;
  layout?: LayoutQuery & {
    headerMenu?: EnhancedMenu | null;
    footerMenu?: EnhancedMenu | null;
  };
};

function AnnouncementBar() {
  return (
    <div className="bg-[#D33E13] text-white text-[10px] md:text-xs font-bold uppercase tracking-widest py-2.5 px-4 text-center select-none flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap shadow-sm">
      <span className="inline-block animate-pulse">⚡</span>
      <span>FREE SHIPPING ON ORDERS OVER Rs. 3,000 | CASH ON DELIVERY NATIONWIDE</span>
      <span className="inline-block animate-pulse">⚡</span>
    </div>
  );
}

export function PageLayout({children, layout}: LayoutProps) {
  const {headerMenu, footerMenu} = layout || {};
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <AnnouncementBar />
        <div className="">
          <a href="#mainContent" className="sr-only">
            Skip to content
          </a>
        </div>
        {headerMenu && layout?.shop.name && (
          <Header title={layout.shop.name} menu={headerMenu} />
        )}
        <main role="main" id="mainContent" className="flex-grow">
          {children}
        </main>
      </div>
      <Footer />
    </>
  );
}

function Header({title, menu}: {title: string; menu?: EnhancedMenu}) {
  const isHome = useIsHomePath();
  const logoSrc =
    'https://www.cyberteleshop.com/cdn/shop/files/nexteaze_logo_2.svg?v=1747654489&width=165';

  const {
    isOpen: isCartOpen,
    openDrawer: openCart,
    closeDrawer: closeCart,
  } = useDrawer();

  const {
    isOpen: isMenuOpen,
    openDrawer: openMenu,
    closeDrawer: closeMenu,
  } = useDrawer();

  const addToCartFetchers = useCartFetchers(CartForm.ACTIONS.LinesAdd);

  // toggle cart drawer when adding to cart
  useEffect(() => {
    if (isCartOpen || !addToCartFetchers.length) return;
    openCart();
  }, [addToCartFetchers, isCartOpen, openCart]);

  return (
    <>
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
      {menu && (
        <MenuDrawer isOpen={isMenuOpen} onClose={closeMenu} menu={menu} />
      )}
      <DesktopHeader
        isHome={isHome}
        title={title}
        logoSrc={logoSrc}
        menu={menu}
        openCart={openCart}
      />
      <MobileHeader
        isHome={isHome}
        title={title}
        logoSrc={logoSrc}
        openCart={openCart}
        openMenu={openMenu}
      />
    </>
  );
}

function CartDrawer({isOpen, onClose}: {isOpen: boolean; onClose: () => void}) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  if (!rootData) return null;

  return (
    <Drawer open={isOpen} onClose={onClose} heading="Cart" openFrom="right">
      <div className="grid">
        <Suspense fallback={<CartLoading />}>
          <Await resolve={rootData?.cart}>
            {(cart) => <Cart layout="drawer" onClose={onClose} cart={cart} />}
          </Await>
        </Suspense>
      </div>
    </Drawer>
  );
}

export function MenuDrawer({
  isOpen,
  onClose,
  menu,
}: {
  isOpen: boolean;
  onClose: () => void;
  menu: EnhancedMenu;
}) {
  return (
    <Drawer open={isOpen} onClose={onClose} openFrom="left" heading="Menu">
      <div className="grid">
        <MenuMobileNav menu={menu} onClose={onClose} />
      </div>
    </Drawer>
  );
}

function MenuMobileNav({
  menu,
  onClose,
}: {
  menu: EnhancedMenu;
  onClose: () => void;
}) {
  return (
    <nav className="grid gap-4 p-6 sm:gap-6 sm:px-12 sm:py-8">
      {/* Top level menu items */}
      {(menu?.items || []).map((item) => (
        <span key={item.id} className="block">
          <Link
            to={item.to}
            target={item.target}
            onClick={onClose}
            className={({isActive}) =>
              isActive ? 'pb-1 border-b -mb-px' : 'pb-1'
            }
          >
            <Text as="span" size="copy">
              {item.title}
            </Text>
          </Link>
        </span>
      ))}
    </nav>
  );
}

function MobileHeader({
  title,
  logoSrc,
  isHome,
  openCart,
  openMenu,
}: {
  title: string;
  logoSrc: string;
  isHome: boolean;
  openCart: () => void;
  openMenu: () => void;
}) {
  const params = useParams();
  const {y} = useWindowScroll();
  const scrolled = y > 20;

  return (
    <header
      role="banner"
      className={`sticky top-0 z-40 w-full transition-all duration-300 border-b flex items-center h-14 justify-between gap-3 px-4 ${
        scrolled
          ? 'bg-contrast/90 dark:bg-neutral-900/90 backdrop-blur-md shadow-sm border-primary/5'
          : 'bg-contrast dark:bg-neutral-900 border-transparent'
      }`}
    >
      <button
        onClick={openMenu}
        className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/5 text-primary transition hover:bg-primary/10"
        aria-label="Open menu"
      >
        <IconMenu className="w-5 h-5" />
      </button>

      <Link to="/" prefetch="intent" className="flex-1 flex items-center justify-center">
        <img
          src={logoSrc}
          alt={title}
          className="h-8 w-auto object-contain transition-transform duration-200 hover:scale-105"
          loading="eager"
        />
      </Link>

      <div className="flex items-center gap-1.5">
        <Form
          method="get"
          action={params.locale ? `/${params.locale}/search` : '/search'}
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary/5 text-primary transition hover:bg-primary/10"
          role="search"
        >
          <button type="submit" className="flex items-center justify-center h-full w-full">
            <IconSearch className="w-4 h-4" />
          </button>
        </Form>

        <CartCount isHome={isHome} openCart={openCart} />
      </div>
    </header>
  );
}

function DesktopHeader({
  isHome,
  logoSrc,
  menu,
  openCart,
  title,
}: {
  isHome: boolean;
  logoSrc: string;
  openCart: () => void;
  menu?: EnhancedMenu;
  title: string;
}) {
  const params = useParams();
  const {y} = useWindowScroll();
  const scrolled = y > 20;

  return (
    <header
      role="banner"
      className={`sticky top-0 z-40 w-full transition-all duration-300 border-b hidden lg:block ${
        scrolled
          ? 'bg-contrast/90 dark:bg-neutral-900/90 backdrop-blur-md shadow-sm border-primary/5 py-3'
          : 'bg-contrast dark:bg-neutral-900 border-transparent py-4'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex items-center justify-between gap-8">
        <div className="flex items-center gap-10">
          <Link
            className="flex items-center transition duration-200 hover:scale-102"
            to="/"
            prefetch="intent"
          >
            <img
              src={logoSrc}
              alt={title}
              className="h-9 w-auto object-contain"
              loading="eager"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
            {(menu?.items || []).map((item) => (
              <Link
                key={item.id}
                to={item.to}
                target={item.target}
                prefetch="intent"
                className={({isActive}) =>
                  `relative py-2 transition duration-200 hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#D33E13] after:transition-all after:duration-300 hover:after:w-full ${
                    isActive ? 'text-[#D33E13] after:w-full font-bold' : ''
                  }`
                }
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Form
            method="get"
            action={params.locale ? `/${params.locale}/search` : '/search'}
            className="flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 hover:bg-primary/10 focus-within:border-[#D33E13] focus-within:ring-1 focus-within:ring-[#D33E13] px-4 py-1.5 transition-all duration-200"
          >
            <IconSearch className="text-primary/70 w-4 h-4" />
            <Input
              className="bg-transparent border-0 p-0 text-sm text-primary placeholder:text-primary/50 focus:ring-0 w-32 xl:w-44 outline-none"
              type="search"
              variant="minisearch"
              placeholder="Search..."
              name="q"
            />
          </Form>

          <AccountLink className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 text-primary hover:text-[#D33E13] transition hover:bg-primary/10 animate-fade-in" />

          <CartCount isHome={isHome} openCart={openCart} />
        </div>
      </div>
    </header>
  );
}

function AccountLink({className}: {className?: string}) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const isLoggedIn = rootData?.isLoggedIn;

  return (
    <Link to="/account" className={className}>
      <Suspense fallback={<IconLogin />}>
        <Await resolve={isLoggedIn} errorElement={<IconLogin />}>
          {(isLoggedIn) => (isLoggedIn ? <IconAccount /> : <IconLogin />)}
        </Await>
      </Suspense>
    </Link>
  );
}

function CartCount({
  isHome,
  openCart,
}: {
  isHome: boolean;
  openCart: () => void;
}) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  if (!rootData) return null;

  return (
    <Suspense fallback={<Badge count={0} dark={isHome} openCart={openCart} />}>
      <Await resolve={rootData?.cart}>
        {(cart) => (
          <Badge
            dark={isHome}
            openCart={openCart}
            count={cart?.totalQuantity || 0}
          />
        )}
      </Await>
    </Suspense>
  );
}

function Badge({
  openCart,
  dark,
  count,
}: {
  count: number;
  dark: boolean;
  openCart: () => void;
}) {
  const isHydrated = useIsHydrated();

  const BadgeCounter = useMemo(
    () => (
      <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 text-primary transition hover:bg-primary/10 hover:text-[#D33E13]">
        <IconBag className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 text-[9px] font-black bg-[#D33E13] text-white h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full shadow-sm animate-bounce">
            {count}
          </span>
        )}
      </div>
    ),
    [count],
  );

  return isHydrated ? (
    <button
      onClick={openCart}
      className="relative flex items-center justify-center focus:ring-0"
    >
      {BadgeCounter}
    </button>
  ) : (
    <Link
      to="/cart"
      className="relative flex items-center justify-center focus:ring-0"
    >
      {BadgeCounter}
    </Link>
  );
}

function Footer() {
  return (
    <footer className="bg-neutral-950 text-neutral-300 border-t border-neutral-900 pt-16 pb-12 px-6 md:px-8 lg:px-12 w-full font-sans">
      <div className="mx-auto max-w-7xl grid gap-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 border-b border-neutral-900 pb-12">
        {/* Column 1: Brand details & Social */}
        <div className="col-span-2 md:col-span-3 lg:col-span-1 flex flex-col gap-6">
          <Link to="/" className="inline-block">
            <Heading size="lead" className="text-xl font-extrabold uppercase tracking-wider text-white">
              Cyber Tele Shop
            </Heading>
          </Link>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-xs">
            Your trusted store for car accessories, gadgets, fitness gear, and electronics. Fast delivery nationwide.
          </p>
          {/* Social Links */}
          <div className="flex items-center gap-3 flex-wrap">
            <a href="https://www.facebook.com/cyberteleshoplhr/" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-[#D33E13] flex items-center justify-center text-white transition-colors duration-200" title="Facebook">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>
            </a>
            <a href="https://www.instagram.com/cybertele/?hl=en" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-[#D33E13] flex items-center justify-center text-white transition-colors duration-200" title="Instagram">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="https://www.youtube.com/@cyberteleshop275" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-[#D33E13] flex items-center justify-center text-white transition-colors duration-200" title="YouTube">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.507a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.507 9.388.507 9.388.507s7.517 0 9.388-.507a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
            <a href="https://www.tiktok.com/@cyberteleshop3?lang=en" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-[#D33E13] flex items-center justify-center text-white transition-colors duration-200" title="TikTok">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.95.83 2.16 1.37 3.44 1.53v3.87c-1.89-.13-3.71-.85-5.17-2.11-.07 3.6-.03 7.2-.06 10.8-.13 2.68-1.54 5.25-3.97 6.46-2.3 1.15-5.15.92-7.23-.57-2.31-1.63-3.48-4.59-2.95-7.39.46-2.58 2.4-4.78 4.97-5.39v3.91c-1.24.41-2.16 1.57-2.14 2.9.01 1.76 1.7 3.1 3.42 2.76 1.34-.23 2.29-1.42 2.28-2.78v-17.7c0-.28 0-.56-.01-.84z"/></svg>
            </a>
            <a href="https://www.pinterest.com/cyberteleshop/" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-[#D33E13] flex items-center justify-center text-white transition-colors duration-200" title="Pinterest">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.42 7.63 11.16-.1-.95-.2-2.4.04-3.43.22-.93 1.4-5.93 1.4-5.93s-.36-.72-.36-1.77c0-1.66.96-2.9 2.16-2.9 1.02 0 1.51.77 1.51 1.68 0 1.03-.65 2.56-.99 3.99-.28 1.19.6 2.16 1.77 2.16 2.12 0 3.76-2.24 3.76-5.47 0-2.86-2.06-4.86-5-4.86-3.4 0-5.4 2.56-5.4 5.2 0 1.03.4 2.13.9 2.73.1.12.11.23.08.35-.09.37-.3.1.3-.41-.1.1-.11-.2-.14-.3-.4-1.67.75-2.9 2.6-2.9 2.07 0 3.67 2.18 3.67 5.34 0 3.32-2.12 6.02-5.07 6.02-1.71 0-3.32-.88-3.87-1.93l-.93 3.56c-.34 1.3-1.27 2.93-1.9 3.96C9.17 23.77 10.55 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"/></svg>
            </a>
          </div>
        </div>

        {/* Column 2: Shop by Categories */}
        <div className="flex flex-col gap-4">
          <Heading size="lead" as="h4" className="text-sm font-extrabold uppercase tracking-wider text-white">
            Shop by Categories
          </Heading>
          <nav className="flex flex-col gap-2.5 text-xs text-neutral-400">
            <Link to="/collections/car-accessories" className="hover:text-white transition-colors duration-200">Car Accessories</Link>
            <Link to="/collections/electronics" className="hover:text-white transition-colors duration-200">Electronics</Link>
            <Link to="/collections/fitness" className="hover:text-white transition-colors duration-200">Fitness</Link>
            <Link to="/collections/health-beauty" className="hover:text-white transition-colors duration-200">Health & Beauty</Link>
            <Link to="/collections/toys" className="hover:text-white transition-colors duration-200">Toys</Link>
            <Link to="/collections/clothing" className="hover:text-white transition-colors duration-200">Clothing</Link>
            <Link to="/collections/spy-devices" className="hover:text-white transition-colors duration-200">Spy Devices</Link>
            <Link to="/collections/treadmill" className="hover:text-white transition-colors duration-200">Treadmill</Link>
            <Link to="/collections/furniture" className="hover:text-white transition-colors duration-200">Furniture</Link>
            <Link to="/collections/sports" className="hover:text-white transition-colors duration-200">Sports</Link>
          </nav>
        </div>

        {/* Column 3: Quick Links */}
        <div className="flex flex-col gap-4">
          <Heading size="lead" as="h4" className="text-sm font-extrabold uppercase tracking-wider text-white">
            Quick Links
          </Heading>
          <nav className="flex flex-col gap-2.5 text-xs text-neutral-400">
            <Link to="/" className="hover:text-white transition-colors duration-200">Home</Link>
            <Link to="/collections/electronics" className="hover:text-white transition-colors duration-200">Electronics</Link>
            <Link to="/collections/fitness" className="hover:text-white transition-colors duration-200">Fitness</Link>
            <Link to="/collections/health-beauty" className="hover:text-white transition-colors duration-200">Health & Beauty</Link>
            <Link to="/collections/sports" className="hover:text-white transition-colors duration-200">Sports</Link>
            <Link to="/collections/steel-racks" className="hover:text-white transition-colors duration-200">Steel Racks</Link>
            <Link to="/collections/clothing" className="hover:text-white transition-colors duration-200">Clothing</Link>
          </nav>
        </div>

        {/* Column 4: Information & Account */}
        <div className="flex flex-col gap-4">
          <Heading size="lead" as="h4" className="text-sm font-extrabold uppercase tracking-wider text-white">
            Information
          </Heading>
          <nav className="flex flex-col gap-2.5 text-xs text-neutral-400">
            <Link to="/pages/contact" className="hover:text-white transition-colors duration-200">Contact Us</Link>
            <Link to="/policies/privacy-policy" className="hover:text-white transition-colors duration-200">Privacy Policy</Link>
            <Link to="/policies/refund-policy" className="hover:text-white transition-colors duration-200">Refund Policy</Link>
            <Link to="/policies/shipping-policy" className="hover:text-white transition-colors duration-200">Shipping Policy</Link>
            <Link to="/policies/terms-of-service" className="hover:text-white transition-colors duration-200">Terms of Service</Link>
            <Link to="/compare" className="hover:text-white transition-colors duration-200">Compare</Link>
            <Link to="/wishlist" className="hover:text-white transition-colors duration-200">Wishlist</Link>
            <Link to="/pages/track-order" className="hover:text-white transition-colors duration-200">Track My Order</Link>
            <div className="border-t border-neutral-900 my-1"></div>
            <Link to="/account" className="hover:text-white transition-colors duration-200 font-semibold text-neutral-300">Orders</Link>
            <Link to="/account/profile" className="hover:text-white transition-colors duration-200 font-semibold text-neutral-300">Profile</Link>
          </nav>
        </div>

        {/* Column 5: Contact & Newsletter */}
        <div className="col-span-2 md:col-span-3 lg:col-span-1 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <Heading size="lead" as="h4" className="text-sm font-extrabold uppercase tracking-wider text-white">
              Contact Us
            </Heading>
            <div className="flex flex-col gap-4 text-xs text-neutral-400">
              <div className="flex gap-2.5 items-start">
                <span className="text-base leading-none">📍</span>
                <span className="leading-relaxed">
                  Shop # 4, Green complex, Qainchi ammar sadhu, Ferozpur road, Lahore
                </span>
              </div>
              <div className="flex gap-2.5 items-center">
                <span className="text-base leading-none">📞</span>
                <a href="tel:0300-4252400" className="hover:text-white transition-colors duration-200">
                  0300-4252400
                </a>
              </div>
              <div className="flex gap-2.5 items-center">
                <span className="text-base leading-none">✉️</span>
                <a href="mailto:cyberteleshop@gmail.com" className="hover:text-white transition-colors duration-200 truncate">
                  cyberteleshop@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-4 border-t border-neutral-900">
            <Heading size="lead" as="h4" className="text-sm font-extrabold uppercase tracking-wider text-white">
              Newsletter
            </Heading>
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 outline-none focus:border-[#D33E13] focus:ring-1 focus:ring-[#D33E13] transition-all duration-200"
              />
              <button
                type="submit"
                className="bg-[#D33E13] text-white text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-xl hover:bg-[#b0300c] transition duration-200"
              >
                Sub
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="mx-auto max-w-7xl pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-xs text-neutral-500 text-center md:text-left">
          &copy; {new Date().getFullYear()} Cyber Tele Shop. All Rights Reserved. Designed By Hamza Tahir
        </div>

        {/* Payment Methods */}
        <div className="flex items-center gap-2.5 text-[10px] font-bold text-neutral-500 tracking-wider flex-wrap justify-center">
          <span className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800">CASH ON DELIVERY</span>
          <span className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800">EASYPAISA</span>
          <span className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800">JAZZCASH</span>
          <span className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800">VISA / MC</span>
        </div>
      </div>
    </footer>
  );
}
