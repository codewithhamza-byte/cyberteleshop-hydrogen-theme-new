import {
  json,
  type MetaArgs,
  type LinksFunction,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {getSeoMeta, Image} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';

import {PageHeader, Section} from '~/components/Text';
import {Link} from '~/components/Link';
import {seoPayload} from '~/lib/seo.server';
import {routeHeaders} from '~/data/cache';

import styles from '../styles/custom-font.css?url';

const BLOG_HANDLE = 'journal';

export const headers = routeHeaders;

export const links: LinksFunction = () => {
  return [{rel: 'stylesheet', href: styles}];
};

export async function loader({request, params, context}: LoaderFunctionArgs) {
  const {language, country} = context.storefront.i18n;

  invariant(params.journalHandle, 'Missing journal handle');

  const {blog} = await context.storefront.query(ARTICLE_QUERY, {
    variables: {
      blogHandle: BLOG_HANDLE,
      articleHandle: params.journalHandle,
      language,
    },
  });

  if (!blog?.articleByHandle) {
    throw new Response(null, {status: 404});
  }

  const article = blog.articleByHandle;

  const formattedDate = new Intl.DateTimeFormat(`${language}-${country}`, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article?.publishedAt!));

  const seo = seoPayload.article({article, url: request.url});

  return json({article, formattedDate, seo});
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Article() {
  const {article, formattedDate} = useLoaderData<typeof loader>();

  const {title, image, contentHtml, author} = article;

  return (
    <>
      {/* Premium Hero Banner */}
      <div className="relative w-full overflow-hidden bg-gray-900 py-14 md:py-20 px-4 md:px-8 mb-8 border-b border-gray-100 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#D33E13]/10" />

        <div className="relative max-w-4xl mx-auto flex flex-col items-center text-center">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-gray-300/80 mb-3.5 font-bold uppercase tracking-wider">
            <Link to="/" className="hover:text-[#D33E13] transition-colors">Home</Link>
            <span>/</span>
            <Link to="/journal" className="hover:text-[#D33E13] transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-white font-extrabold truncate max-w-[150px] sm:max-w-none">{title}</span>
          </div>

          <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase mb-4 leading-tight">
            {title}
          </h1>

          <div className="flex items-center gap-2 text-xs text-gray-300 font-extrabold uppercase tracking-wider">
            <span>{formattedDate}</span>
            {author?.name && (
              <>
                <span>&middot;</span>
                <span>By {author.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Article Content Area */}
      <main className="max-w-4xl mx-auto px-6 pb-24">
        {image && (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[2.5rem] bg-gray-50 mb-10 shadow-md">
            <Image
              data={image}
              className="object-cover w-full h-full"
              sizes="(max-width: 48em) 90vw, 60vw"
              loading="eager"
            />
          </div>
        )}

        <div
          dangerouslySetInnerHTML={{__html: contentHtml}}
          className="prose prose-lg dark:prose-invert max-w-none text-primary/80 leading-relaxed space-y-6"
        />

        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link
            to="/journal"
            className="inline-flex items-center gap-2 px-6 py-3.5 border border-gray-200 hover:border-[#D33E13] hover:text-[#D33E13] hover:bg-[#D33E13]/5 text-gray-700 font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-200"
          >
            &larr; Back to Articles
          </Link>
        </div>
      </main>
    </>
  );
}

const ARTICLE_QUERY = `#graphql
  query ArticleDetails(
    $language: LanguageCode
    $blogHandle: String!
    $articleHandle: String!
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      articleByHandle(handle: $articleHandle) {
        title
        contentHtml
        publishedAt
        author: authorV2 {
          name
        }
        image {
          id
          altText
          url
          width
          height
        }
        seo {
          description
          title
        }
      }
    }
  }
`;
