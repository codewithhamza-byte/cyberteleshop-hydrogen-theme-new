import type {AppLoadContext, EntryContext} from '@shopify/remix-oxygen';
import {RemixServer} from '@remix-run/react';
import isbot from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {createContentSecurityPolicy} from '@shopify/hydrogen';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  context: AppLoadContext,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain:
        context.env.PUBLIC_CHECKOUT_DOMAIN || context.env.PUBLIC_STORE_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    scriptSrc: [
      'self',
      'unsafe-inline',
      'https://cdn.shopify.com',
      'https://shopify.com',
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      'https://connect.facebook.net',
      'https://cdn.judge.me',
      'https://judge.me',
      'https://*.judge.me',
      ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:*'] : []),
    ],
    connectSrc: [
      'self',
      'https://cdn.shopify.com',
      'https://shopify.com',
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      'https://connect.facebook.net',
      'https://www.facebook.com',
      'https://cdn.judge.me',
      'https://judge.me',
      'https://*.judge.me',
      ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:*'] : []),
    ],
    imgSrc: [
      'self',
      'https://www.cyberteleshop.com',
      'https://cdn.shopify.com',
      'https://www.facebook.com',
      'https://*.shopifycdn.com',
      'https://cdn.judge.me',
      'https://judge.me',
      'https://*.judge.me',
      'data:',
      '*',
    ],
    frameSrc: [
      'self',
      'https://www.youtube.com',
      'https://youtube.com',
      'https://youtu.be',
      'https://cdn.shopify.com',
      'https://shopify.com',
      'https://judge.me',
      'https://*.judge.me',
    ],
    childSrc: [
      'self',
      'https://www.youtube.com',
      'https://youtube.com',
      'https://youtu.be',
      'https://judge.me',
      'https://*.judge.me',
    ],
    mediaSrc: [
      'self',
      'https://cdn.shopify.com',
      'https://shopify.com',
      'https://*.shopifycdn.com',
      '*',
    ],
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <RemixServer context={remixContext} url={request.url} />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        // eslint-disable-next-line no-console
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
