import {useParams, Form, Await, useRouteLoaderData} from '@remix-run/react';
import useWindowScroll from 'react-use/esm/useWindowScroll';
import {Disclosure} from '@headlessui/react';
import {Suspense, useEffect, useMemo, useState, useRef} from 'react';
import {CartForm, Money} from '@shopify/hydrogen';

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
  type ParentEnhancedMenuItem,
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

function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const activeTheme = savedTheme || systemTheme;
    setTheme(activeTheme);
    document.documentElement.classList.toggle('dark', activeTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-[#D33E13] dark:hover:text-white transition-all duration-300 hover:scale-110 flex items-center justify-center"
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
    >
      {theme === 'light' ? (
        <svg className="w-4 h-4 md:w-4.5 md:h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 md:w-4.5 md:h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 10H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      )}
    </button>
  );
}

function AnnouncementBar() {
  const announcements = [
    { text: "⚡ FREE SHIPPING ON ORDERS OVER Rs. 3,000 | CASH ON DELIVERY NATIONWIDE ⚡", badge: "FREE SHIPPING" },
    { text: "✨ GET EXTRA 10% OFF ON YOUR FIRST ORDER - USE CODE: CYBER10 ✨", badge: "10% OFF" },
    { text: "📦 100% SATISFACTION GUARANTEED | EASY 7-DAY RETURNS 📦", badge: "WARRANTY" }
  ];
  const [current, setCurrent] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % announcements.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isHovered, announcements.length]);

  if (isDismissed) return null;

  return (
    <div 
      className="relative bg-gradient-to-r from-[#D33E13] via-[#ff5b2c] to-[#D33E13] text-white py-2 px-4 shadow-sm select-none transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between text-center text-[10px] md:text-xs font-bold uppercase tracking-widest px-8">
        
        {/* Previous Button (visible on hover) */}
        <button
          onClick={() => setCurrent((prev) => (prev - 1 + announcements.length) % announcements.length)}
          className={`absolute left-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          aria-label="Previous announcement"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Text Container with Slide Animation */}
        <div className="flex-1 flex items-center justify-center gap-2 overflow-hidden h-5">
          <span className="bg-white/20 text-[9px] px-1.5 py-0.5 rounded text-white tracking-wider font-extrabold backdrop-blur-sm shadow-sm flex-shrink-0">
            {announcements[current].badge}
          </span>
          <span className="transition-all duration-500 ease-in-out transform inline-block truncate">
            {announcements[current].text}
          </span>
        </div>

        {/* Next Button (visible on hover) */}
        <button
          onClick={() => setCurrent((prev) => (prev + 1) % announcements.length)}
          className={`absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          aria-label="Next announcement"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dismiss Button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition duration-300"
          aria-label="Dismiss announcement"
          title="Dismiss"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

      </div>
    </div>
  );
}

function UtilityBar() {
  return (
    <div className="hidden lg:block bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200/40 dark:border-neutral-800/80 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 py-2.5 px-6 lg:px-8 transition-colors duration-300">
      <div className="mx-auto max-w-7xl flex justify-between items-center">
        {/* Left Side: Contact */}
        <div className="flex items-center gap-4">
          <a href="tel:03004252400" className="flex items-center gap-1.5 hover:text-[#D33E13] transition-colors duration-200">
            <span>📞</span> <span className="font-semibold">0300-4252400</span>
          </a>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <a href="mailto:cyberteleshop@gmail.com" className="flex items-center gap-1.5 hover:text-[#D33E13] transition-colors duration-200">
            <span>✉️</span> <span>cyberteleshop@gmail.com</span>
          </a>
        </div>

        {/* Right Side: Quick Links + Theme Toggle */}
        <div className="flex items-center gap-5">
          <Link to="/pages/contact" className="hover:text-[#D33E13] transition-colors duration-200">
            Contact Us
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <Link to="/pages/track-order" className="hover:text-[#D33E13] transition-colors duration-200">
            Track My Order
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <Link to="/wishlist" className="hover:text-[#D33E13] transition-colors duration-200 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Wishlist
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

export function PageLayout({children, layout}: LayoutProps) {
  const {headerMenu, footerMenu} = layout || {};
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <AnnouncementBar />
        <UtilityBar />
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
        isOpenMenu={isMenuOpen}
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
  const params = useParams();

  const customCollections = [
    { name: "Car Accessories", to: "/collections/car-accessories" },
    { name: "Electronics", to: "/collections/electronics" },
    { name: "Fitness", to: "/collections/fitness" },
    { name: "Health & Beauty", to: "/collections/health-beauty" },
    { name: "Sports", to: "/collections/sports" },
    { name: "Toys", to: "/collections/toys" },
  ];

  return (
    <div className="flex flex-col justify-between h-[calc(100vh-100px)] overflow-y-auto hiddenScroll bg-white dark:bg-neutral-950">
      <div className="px-6 py-4 flex flex-col gap-6">
        
        {/* Search Input in Mobile Drawer */}
        <Form
          method="get"
          action={params.locale ? `/${params.locale}/search` : '/search'}
          onSubmit={onClose}
          className="flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-4 py-2.5 w-full"
        >
          <IconSearch className="text-neutral-400 dark:text-neutral-500 w-4 h-4 flex-shrink-0" />
          <input
            className="bg-transparent border-0 p-0 text-sm text-primary placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-0 w-full outline-none"
            type="search"
            placeholder="Search products..."
            name="q"
          />
        </Form>

        {/* Navigation Accordions/Links */}
        <nav className="flex flex-col gap-4">
          {(menu?.items || []).map((item) => {
            const hasChildren = item.items && item.items.length > 0;
            const isCollections = item.title.toLowerCase() === 'collections';
            const showAccordion = hasChildren || isCollections;

            if (showAccordion) {
              return (
                <Disclosure key={item.id}>
                  {({ open }) => (
                    <div className="border-b border-neutral-100 dark:border-neutral-900 pb-3">
                      <Disclosure.Button className="flex items-center justify-between w-full text-left py-2 text-neutral-800 dark:text-neutral-200">
                        <span className="text-base font-bold uppercase tracking-wider">{item.title}</span>
                        <IconCaret direction={open ? 'up' : 'down'} className="w-5 h-5 text-neutral-500" />
                      </Disclosure.Button>
                      <Disclosure.Panel className="mt-2 pl-4 flex flex-col gap-2.5 transition-all duration-300">
                        {isCollections && item.items.length === 0 ? (
                          // Render custom categories if no children returned
                          customCollections.map((col) => (
                            <Link
                              key={col.to}
                              to={col.to}
                              onClick={onClose}
                              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-[#D33E13] py-1 font-medium transition"
                            >
                              {col.name}
                            </Link>
                          ))
                        ) : (
                          // Render child items
                          (item.items as ChildEnhancedMenuItem[]).map((child) => (
                            <Link
                              key={child.id}
                              to={child.to}
                              target={child.target}
                              onClick={onClose}
                              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-[#D33E13] py-1 font-medium transition"
                            >
                              {child.title}
                            </Link>
                          ))
                        )}
                      </Disclosure.Panel>
                    </div>
                  )}
                </Disclosure>
              );
            }

            return (
              <Link
                key={item.id}
                to={item.to}
                target={item.target}
                onClick={onClose}
                className="text-base font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 border-b border-neutral-100 dark:border-neutral-900 pb-3 py-2 flex items-center justify-between hover:text-[#D33E13] transition"
              >
                <span>{item.title}</span>
                <IconArrow className="w-4 h-4 text-neutral-400" />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Drawer Footer: Contact & Social Info */}
      <div className="p-6 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-900 mt-auto flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h5 className="text-[10px] uppercase font-extrabold tracking-widest text-neutral-400 dark:text-neutral-500">
            Need Help?
          </h5>
          <div className="flex flex-col gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
            <a href="tel:03004252400" className="hover:text-[#D33E13] flex items-center gap-1.5 font-semibold">
              <span>📞</span> 0300-4252400
            </a>
            <a href="mailto:cyberteleshop@gmail.com" className="hover:text-[#D33E13] flex items-center gap-1.5">
              <span>✉️</span> cyberteleshop@gmail.com
            </a>
          </div>
        </div>

        {/* Socials */}
        <div className="flex items-center gap-2">
          <a href="https://www.facebook.com/cyberteleshoplhr/" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 hover:bg-[#D33E13] flex items-center justify-center text-neutral-700 dark:text-white hover:text-white transition-colors duration-200" title="Facebook">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>
          </a>
          <a href="https://www.instagram.com/cybertele/?hl=en" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 hover:bg-[#D33E13] flex items-center justify-center text-neutral-700 dark:text-white hover:text-white transition-colors duration-200" title="Instagram">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="https://www.youtube.com/@cyberteleshop275" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 hover:bg-[#D33E13] flex items-center justify-center text-neutral-700 dark:text-white hover:text-white transition-colors duration-200" title="YouTube">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.507a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.507 9.388.507 9.388.507s7.517 0 9.388-.507a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
        </div>
      </div>
    </div>
  );
}

function MobileHeader({
  title,
  logoSrc,
  isHome,
  openCart,
  openMenu,
  isOpenMenu,
}: {
  title: string;
  logoSrc: string;
  isHome: boolean;
  openCart: () => void;
  openMenu: () => void;
  isOpenMenu: boolean;
}) {
  const params = useParams();
  const {y} = useWindowScroll();
  const scrolled = y > 20;

  return (
    <header
      role="banner"
      className={`sticky top-0 z-40 w-full transition-all duration-300 border-b flex items-center h-16 justify-between gap-3 px-4 lg:hidden ${
        scrolled
          ? 'bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md shadow-md border-neutral-100 dark:border-neutral-800'
          : 'bg-white dark:bg-neutral-950 border-transparent'
      }`}
    >
      <button
        onClick={openMenu}
        className="flex flex-col items-center justify-center h-10 w-10 rounded-full bg-neutral-100/50 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300 transition hover:bg-neutral-200/50 dark:hover:bg-neutral-800/80"
        aria-label="Open menu"
      >
        <div className="flex flex-col gap-1.5 w-5">
          <span className={`h-0.5 w-full bg-current rounded-full transition-all duration-300 ${isOpenMenu ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`h-0.5 w-full bg-current rounded-full transition-all duration-300 ${isOpenMenu ? 'opacity-0' : ''}`} />
          <span className={`h-0.5 w-full bg-current rounded-full transition-all duration-300 ${isOpenMenu ? '-rotate-45 -translate-y-2' : ''}`} />
        </div>
      </button>

      <Link to="/" prefetch="intent" className="flex items-center justify-center">
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
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100/50 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300 transition hover:bg-neutral-200/50 dark:hover:bg-neutral-800/80"
          role="search"
        >
          <button type="submit" className="flex items-center justify-center h-full w-full">
            <IconSearch className="w-4 h-4" />
          </button>
        </Form>

        <ThemeToggle />

        <CartCount isHome={isHome} openCart={openCart} />
      </div>
    </header>
  );
}

function IconCompare(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={props.className || "w-5 h-5"}
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  );
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  chairs: (
    <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M7 12V6a2 2 0 012-2h6a2 2 0 012-2v6M6 12v6a2 2 0 002 2h8a2 2 0 002-2v-6M9 20v2M15 20v2" />
    </svg>
  ),
  tables: (
    <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h18M6 8v12M18 8v12M4 8v12M20 8v12" />
    </svg>
  ),
  sofas: (
    <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10v6a2 2 0 002 2h12a2 2 0 002-2v-6M2 12v4M22 12v4M6 10V8a2 2 0 012-2h8a2 2 0 012 2v2" />
    </svg>
  ),
  armchairs: (
    <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12M4 12V8a2 2 0 012-2h12a2 2 0 012 2v4M5 12v6a2 2 0 002 2h10a2 2 0 002-2v-6M8 20v2M16 20v2" />
    </svg>
  ),
  beds: (
    <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 18V6a1 1 0 011-1h3a1 1 0 011 1v6h8V8a1 1 0 011-1h3a1 1 0 011 1v12M3 14h18" />
    </svg>
  ),
  storage: (
    <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1zM4 12h16M9 8h6M9 16h6" />
    </svg>
  ),
  textiles: (
    <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-1.813-5.096C6.549 14.153 6 12.18 6 10a6 6 0 1112 0c0 2.18-.549 4.153-1.187 5.904L15 21m-6 0h6m-3-11v4" />
    </svg>
  ),
  lighting: (
    <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 10H3m14 4.5a5.5 5.5 0 11-10 0v-2h10v2z" />
    </svg>
  ),
  toys: (
    <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a4 4 0 014 4c0 1.25-.57 2.37-1.47 3.12A7 7 0 0120 16v3H4v-3a7 7 0 015.47-6.88A4 4 0 018 6a4 4 0 014-4z" />
    </svg>
  ),
  decor: (
    <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M8 5h8M9 9h6M7 13h10M6 17h12" />
    </svg>
  )
};

const headerCategories = [
  { name: "Chairs", to: "/collections/chairs", icon: CATEGORY_ICONS.chairs },
  { name: "Tables", to: "/collections/tables", icon: CATEGORY_ICONS.tables },
  { name: "Sofas", to: "/collections/sofas", icon: CATEGORY_ICONS.sofas },
  { name: "Armchairs", to: "/collections/armchairs", icon: CATEGORY_ICONS.armchairs },
  { name: "Beds", to: "/collections/beds", icon: CATEGORY_ICONS.beds },
  { name: "Storage", to: "/collections/storage", icon: CATEGORY_ICONS.storage },
  { name: "Textiles", to: "/collections/textiles", icon: CATEGORY_ICONS.textiles },
  { name: "Lighting", to: "/collections/lighting", icon: CATEGORY_ICONS.lighting },
  { name: "Toys", to: "/collections/toys", icon: CATEGORY_ICONS.toys },
  { name: "Decor", to: "/collections/decor", icon: CATEGORY_ICONS.decor }
];

function SearchBar() {
  const [isFocused, setIsFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const params = useParams();

  // Keyboard shortcut listener: focus search input on Ctrl+K or /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 'k') || e.key === '/') {
        if (document.activeElement !== searchInputRef.current) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Form
      method="get"
      action={params.locale ? `/${params.locale}/search` : '/search'}
      className={`relative flex items-center gap-2 rounded-full border px-4 py-2 transition-all duration-300 flex-grow max-w-2xl ${
        isFocused
          ? 'border-neutral-400 bg-white dark:bg-neutral-900 ring-2 ring-neutral-200/50 dark:ring-neutral-800/40 shadow-sm'
          : 'border-neutral-200 dark:border-neutral-800 bg-[#fbfbfb] dark:bg-neutral-800/30 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
      }`}
    >
      <IconSearch className="text-neutral-400 dark:text-neutral-500 w-4 h-4 flex-shrink-0" />
      <input
        ref={searchInputRef}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="bg-transparent border-0 p-0 text-sm text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-0 w-full outline-none"
        type="search"
        placeholder="Search for products..."
        name="q"
      />
      {!isFocused && (
        <span className="hidden md:inline-flex items-center gap-0.5 text-[9px] font-mono text-neutral-400 dark:text-neutral-500 bg-neutral-200/50 dark:bg-neutral-700/50 px-1.5 py-0.5 rounded">
          <kbd className="font-sans">⌘</kbd>K
        </span>
      )}
    </Form>
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
  const {y} = useWindowScroll();
  const scrolled = y > 20;

  return (
    <header
      role="banner"
      className={`sticky top-0 z-40 w-full transition-all duration-300 border-b hidden lg:block ${
        scrolled
          ? 'bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-sm border-neutral-100 dark:border-neutral-800 py-3'
          : 'bg-white dark:bg-neutral-950 border-transparent py-4'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col gap-4">
        {/* Row 1: Logo + Search + Actions */}
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              className="flex items-center transition duration-300 hover:scale-105"
              to="/"
              prefetch="intent"
            >
              <img
                src={logoSrc}
                alt={title}
                className="h-9 w-auto object-contain filter drop-shadow-sm hover:drop-shadow-md transition-all"
                loading="eager"
              />
            </Link>
          </div>

          {/* Wide Pill Search Bar */}
          <SearchBar />

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Compare Button */}
            <Link
              to="/compare"
              className="relative w-10 h-10 rounded-full bg-neutral-100/50 hover:bg-neutral-200/50 dark:bg-neutral-800/40 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 transition-all duration-200 flex items-center justify-center hover:scale-105"
              title="Compare"
            >
              <IconCompare className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                0
              </span>
            </Link>

            {/* Wishlist Button */}
            <Link
              to="/wishlist"
              className="relative w-10 h-10 rounded-full bg-neutral-100/50 hover:bg-neutral-200/50 dark:bg-neutral-800/40 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 transition-all duration-200 flex items-center justify-center hover:scale-105"
              title="Wishlist"
            >
              <svg className="w-4.5 h-4.5 fill-none stroke-current text-neutral-600 dark:text-neutral-300" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                0
              </span>
            </Link>

            {/* Login / Register */}
            <AccountLink className="flex items-center gap-2 px-4.5 py-2 rounded-full bg-neutral-100/50 hover:bg-neutral-200/50 dark:bg-neutral-800/40 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 transition duration-200 text-xs font-bold hover:scale-105" />

            {/* Cart Badge with dynamic price */}
            <CartCount isHome={isHome} openCart={openCart} />
          </div>
        </div>

        {/* Row 2: Categories Nav + Shipping Badge */}
        <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800/60 pt-3">
          <nav className="flex items-center gap-3.5 xl:gap-5 flex-wrap">
            {headerCategories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.to}
                className="group flex items-center gap-1.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 hover:text-[#D33E13] dark:hover:text-white transition-colors duration-200"
              >
                <span className="text-neutral-400 dark:text-neutral-500 group-hover:text-[#D33E13] dark:group-hover:text-white transition-colors duration-200">
                  {cat.icon}
                </span>
                <span>{cat.name}</span>
              </Link>
            ))}
          </nav>

          <div className="flex-shrink-0">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-[10px] font-extrabold uppercase tracking-wider border border-sky-100/50 dark:border-sky-900/20">
              Free shipping for all orders of $1,300
            </span>
          </div>
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
      <svg
        className="w-4 h-4 text-neutral-500 dark:text-neutral-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <Suspense fallback={<span>Login / Register</span>}>
        <Await resolve={isLoggedIn} errorElement={<span>Login / Register</span>}>
          {(isLoggedIn) => (
            <span>{isLoggedIn ? 'My Account' : 'Login / Register'}</span>
          )}
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
            cost={cart?.cost}
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
  cost,
}: {
  count: number;
  dark: boolean;
  openCart: () => void;
  cost?: any;
}) {
  const isHydrated = useIsHydrated();

  const subtotal = useMemo(() => {
    if (cost?.subtotalAmount) {
      return cost.subtotalAmount;
    }
    return { amount: '0.00', currencyCode: 'USD' };
  }, [cost]);

  const BadgeCounter = useMemo(
    () => (
      <div className="relative flex items-center gap-2 px-4.5 py-2 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 transition duration-200 hover:scale-105 select-none font-bold text-xs uppercase tracking-wider">
        <IconBag className="w-4 h-4 text-white dark:text-neutral-950" />
        <span className="font-mono text-[11px] font-extrabold">
          <Money data={subtotal} />
        </span>
        <span className="absolute -top-1 -right-1 text-[9px] font-black bg-[#D33E13] text-white h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full shadow-md shadow-orange-500/30">
          {count}
        </span>
      </div>
    ),
    [count, subtotal],
  );

  return isHydrated ? (
    <button
      onClick={openCart}
      className="relative flex items-center justify-center focus:ring-0 focus:outline-none"
    >
      {BadgeCounter}
    </button>
  ) : (
    <Link
      to="/cart"
      className="relative flex items-center justify-center focus:ring-0 focus:outline-none"
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
