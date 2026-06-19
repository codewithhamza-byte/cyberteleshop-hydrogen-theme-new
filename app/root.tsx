import {
  defer,
  type LinksFunction,
  type LoaderFunctionArgs,
  type AppLoadContext,
  type MetaArgs,
} from '@shopify/remix-oxygen';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
  useRouteError,
  type ShouldRevalidateFunction,
} from '@remix-run/react';
import {
  useNonce,
  Analytics,
  getShopAnalytics,
  getSeoMeta,
  type SeoConfig,
} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';

import {PageLayout} from '~/components/PageLayout';
import {GenericError} from '~/components/GenericError';
import {NotFound} from '~/components/NotFound';
import {AnalyticsTracker} from '~/components/AnalyticsTracker';
import favicon from '~/assets/favicon.svg';
import {seoPayload} from '~/lib/seo.server';
import styles from '~/styles/app.css?url';

import {DEFAULT_LOCALE, parseMenu} from './lib/utils';
import {useJudgeme} from '@judgeme/shopify-hydrogen';

export type RootLoader = typeof loader;

// This is important to avoid re-fetching root queries on sub-navigations
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') {
    return true;
  }

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) {
    return true;
  }

  return false;
};

/**
 * The link to the main stylesheet is purposely not in this list. Instead, it is added
 * in the Layout function.
 *
 * This is to avoid a development bug where after an edit/save, navigating to another
 * link will cause page rendering error "failed to execute 'insertBefore' on 'Node'".
 *
 * This is a workaround until this is fixed in the foundational library.
 */
export const links: LinksFunction = () => {
  return [
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
};

export async function loader(args: LoaderFunctionArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return defer({
    ...deferredData,
    ...criticalData,
  });
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({request, context}: LoaderFunctionArgs) {
  const [layout] = await Promise.all([
    getLayoutData(context),
    // Add other queries here, so that they are loaded in parallel
  ]);

  const seo = seoPayload.root({shop: layout.shop, url: request.url});

  const {storefront, env} = context;

  const brandNode = (layout as any).brandMetaobject?.nodes?.[0];
  const brandFields: Record<string, any> = {};
  if (brandNode) {
    for (const field of brandNode.fields || []) {
      brandFields[field.key] = field;
    }
  }

  const pixelsNode = (layout as any).pixelsMetaobject?.nodes?.[0];
  const pixelsFields: Record<string, any> = {};
  if (pixelsNode) {
    for (const field of pixelsNode.fields || []) {
      pixelsFields[field.key] = field;
    }
  }

  // Attach logoUrl to layout.shop so that PageLayout can read it
  if (layout.shop) {
    (layout.shop as any).logoUrl = brandFields.logo_url || null;
  }

  const faviconField = brandFields.favicon_url;
  const faviconUrl =
    faviconField?.reference?.image?.url ||
    faviconField?.reference?.url ||
    faviconField?.value ||
    (layout.shop as any).brand?.squareLogo?.image?.url ||
    null;

  const metaPixelId = pixelsFields.meta_pixel_id?.value || (layout.shop as any).metaPixelId?.value || env.PUBLIC_META_PIXEL_ID;
  const googleTagId = pixelsFields.google_tag_id?.value || (layout.shop as any).googleTagId?.value || env.PUBLIC_GOOGLE_TAG_ID || '';
  const tiktokPixelId = pixelsFields.tiktok_pixel_id?.value || (layout.shop as any).tiktokPixelId?.value || env.PUBLIC_TIKTOK_PIXEL_ID || '';
  const snapchatPixelId = pixelsFields.snapchat_pixel_id?.value || (layout.shop as any).snapchatPixelId?.value || env.PUBLIC_SNAPCHAT_PIXEL_ID || '';
  const pinterestPixelId = pixelsFields.pinterest_pixel_id?.value || (layout.shop as any).pinterestPixelId?.value || env.PUBLIC_PINTEREST_PIXEL_ID || '';

  return {
    layout,
    seo,
    faviconUrl,
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN || env.PUBLIC_STORE_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: true,
    },
    selectedLocale: storefront.i18n,
    env: {
      PUBLIC_META_PIXEL_ID: metaPixelId,
      PUBLIC_GOOGLE_TAG_ID: googleTagId,
      PUBLIC_TIKTOK_PIXEL_ID: tiktokPixelId,
      PUBLIC_SNAPCHAT_PIXEL_ID: snapchatPixelId,
      PUBLIC_PINTEREST_PIXEL_ID: pinterestPixelId,
      JUDGEME_SHOP_DOMAIN: env.JUDGEME_SHOP_DOMAIN,
      JUDGEME_PUBLIC_TOKEN: env.JUDGEME_PUBLIC_TOKEN,
      JUDGEME_CDN_HOST: env.JUDGEME_CDN_HOST,
    },
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs) {
  const {cart, customerAccount} = context;

  return {
    isLoggedIn: customerAccount.isLoggedIn(),
    cart: cart.get(),
  };
}

export const meta = ({data}: MetaArgs<typeof loader>) => {
  return getSeoMeta(data!.seo as SeoConfig);
};

function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();
  const data = useRouteLoaderData<typeof loader>('root');
  const locale = data?.selectedLocale ?? DEFAULT_LOCALE;

  useJudgeme({
    shopDomain: data?.env?.JUDGEME_SHOP_DOMAIN || 'cyberteleshop.myshopify.com',
    publicToken: data?.env?.JUDGEME_PUBLIC_TOKEN || 'oka8liRSLfTcXMYhgN1fIwEkmuQ',
    cdnHost: data?.env?.JUDGEME_CDN_HOST || 'https://cdn.judge.me',
    delay: 500,
  });

  return (
    <html lang={locale.language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="msvalidate.01" content="A352E6A0AF9A652267361BBB572B8468" />
        <link rel="stylesheet" href={styles}></link>
        {nonce && (
          <script
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `
                window.cspNonce = "${nonce}";
                const originalCreateElement = document.createElement;
                document.createElement = function(tagName, options) {
                  const element = originalCreateElement.call(document, tagName, options);
                  if (tagName.toLowerCase() === 'script') {
                    element.setAttribute('nonce', "${nonce}");
                  }
                  return element;
                };
              `,
            }}
          />
        )}
        <Meta />
        <Links />
        {data?.faviconUrl && (
          <link rel="icon" type="image/x-icon" href={data.faviconUrl} />
        )}
      </head>
      <body>
        {data ? (
          <Analytics.Provider
            cart={data.cart}
            shop={data.shop}
            consent={data.consent}
          >
            <AnalyticsTracker
              metaPixelId={data.env?.PUBLIC_META_PIXEL_ID}
              googleTagId={data.env?.PUBLIC_GOOGLE_TAG_ID}
              tiktokPixelId={data.env?.PUBLIC_TIKTOK_PIXEL_ID}
              snapchatPixelId={data.env?.PUBLIC_SNAPCHAT_PIXEL_ID}
              pinterestPixelId={data.env?.PUBLIC_PINTEREST_PIXEL_ID}
            />
            <PageLayout
              key={`${locale.language}-${locale.country}`}
              layout={data.layout}
            >
              {children}
            </PageLayout>
          </Analytics.Provider>
        ) : (
          children
        )}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export function ErrorBoundary({error}: {error: Error}) {
  const routeError = useRouteError();
  const isRouteError = isRouteErrorResponse(routeError);

  let title = 'Error';
  let pageType = 'page';

  if (isRouteError) {
    title = 'Not found';
    if (routeError.status === 404) pageType = routeError.data || pageType;
  }

  return (
    <Layout>
      {isRouteError ? (
        <>
          {routeError.status === 404 ? (
            <NotFound type={pageType} />
          ) : (
            <GenericError
              error={{message: `${routeError.status} ${routeError.data}`}}
            />
          )}
        </>
      ) : (
        <GenericError error={error instanceof Error ? error : undefined} />
      )}
    </Layout>
  );
}

const LAYOUT_QUERY = `#graphql
  query layout(
    $language: LanguageCode
    $headerMenuHandle: String!
    $footerMenuHandle: String!
  ) @inContext(language: $language) {
    shop {
      ...Shop
    }
    headerMenu: menu(handle: $headerMenuHandle) {
      ...Menu
    }
    footerMenu: menu(handle: $footerMenuHandle) {
      ...Menu
    }
    brandMetaobject: metaobjects(type: "brand", first: 1) {
      nodes {
        fields {
          key
          value
          reference {
            ... on MediaImage {
              image {
                url
              }
            }
            ... on GenericFile {
              url
            }
          }
        }
      }
    }
    pixelsMetaobject: metaobjects(type: "pixels", first: 1) {
      nodes {
        fields {
          key
          value
        }
      }
    }
  }
  fragment Shop on Shop {
    id
    name
    description
    primaryDomain {
      url
    }
    brand {
      logo {
        image {
          url
        }
      }
      squareLogo {
        image {
          url
        }
      }
    }
    metaPixelId: metafield(namespace: "analytics", key: "meta_pixel_id") {
      value
    }
    googleTagId: metafield(namespace: "analytics", key: "google_tag_id") {
      value
    }
    tiktokPixelId: metafield(namespace: "analytics", key: "tiktok_pixel_id") {
      value
    }
    snapchatPixelId: metafield(namespace: "analytics", key: "snapchat_pixel_id") {
      value
    }
    pinterestPixelId: metafield(namespace: "analytics", key: "pinterest_pixel_id") {
      value
    }
  }
  fragment MenuItem on MenuItem {
    id
    resourceId
    tags
    title
    type
    url
  }
  fragment ChildMenuItem on MenuItem {
    ...MenuItem
  }
  fragment ParentMenuItem on MenuItem {
    ...MenuItem
    items {
      ...ChildMenuItem
    }
  }
  fragment Menu on Menu {
    id
    items {
      ...ParentMenuItem
    }
  }
` as const;

async function getLayoutData({storefront, env}: AppLoadContext) {
  const data = await storefront.query(LAYOUT_QUERY, {
    variables: {
      headerMenuHandle: 'main-menu',
      footerMenuHandle: 'footer',
      language: storefront.i18n.language,
    },
    cache: storefront.CacheShort(),
  });

  invariant(data, 'No data returned from Shopify API');

  /*
    Modify specific links/routes (optional)
    @see: https://shopify.dev/api/storefront/unstable/enums/MenuItemType
    e.g here we map:
      - /blogs/news -> /news
      - /blog/news/blog-post -> /news/blog-post
      - /collections/all -> /products
  */
  const customPrefixes = {BLOG: '', CATALOG: 'products'};

  const headerMenu = data?.headerMenu
    ? parseMenu(
        data.headerMenu,
        data.shop.primaryDomain.url,
        env,
        customPrefixes,
      )
    : undefined;

  const footerMenu = data?.footerMenu
    ? parseMenu(
        data.footerMenu,
        data.shop.primaryDomain.url,
        env,
        customPrefixes,
      )
    : undefined;

  return {
    shop: data.shop,
    brandMetaobject: data.brandMetaobject,
    pixelsMetaobject: data.pixelsMetaobject,
    headerMenu,
    footerMenu,
  };
}
