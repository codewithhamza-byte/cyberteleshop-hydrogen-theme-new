import {
  json,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {flattenConnection, getSeoMeta, Image} from '@shopify/hydrogen';

import {PageHeader, Section} from '~/components/Text';
import {Link} from '~/components/Link';
import {Grid} from '~/components/Grid';
import {getImageLoadingPriority, PAGINATION_SIZE} from '~/lib/const';
import {seoPayload} from '~/lib/seo.server';
import {routeHeaders} from '~/data/cache';
import type {ArticleFragment} from 'storefrontapi.generated';

const BLOG_HANDLE = 'Journal';

export const headers = routeHeaders;

export const loader = async ({
  request,
  context: {storefront},
}: LoaderFunctionArgs) => {
  const {language, country} = storefront.i18n;
  const {blog} = await storefront.query(BLOGS_QUERY, {
    variables: {
      blogHandle: BLOG_HANDLE,
      pageBy: PAGINATION_SIZE,
      language,
    },
  });

  if (!blog?.articles) {
    throw new Response('Not found', {status: 404});
  }

  const articles = flattenConnection(blog.articles).map((article) => {
    const {publishedAt} = article!;
    return {
      ...article,
      publishedAt: new Intl.DateTimeFormat(`${language}-${country}`, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(publishedAt!)),
    };
  });

  const seo = seoPayload.blog({blog, url: request.url});

  return json({articles, seo});
};

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Journals() {
  const {articles} = useLoaderData<typeof loader>();

  return (
    <>
      {/* Premium Hero Banner */}
      <div className="relative w-full overflow-hidden bg-gray-900 py-14 md:py-20 px-4 md:px-8 mb-8 border-b border-gray-100 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#D33E13]/10" />

        <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-gray-300/80 mb-3.5 font-bold uppercase tracking-wider">
            <Link to="/" className="hover:text-[#D33E13] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white font-extrabold">Blog</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase mb-3">
            Articles & Updates
          </h1>

          <p className="max-w-2xl text-xs md:text-sm text-gray-200/90 leading-relaxed font-medium">
            Stay updated with the latest in tech, gadgets guides, smart living tips, and electronic reviews.
          </p>
        </div>
      </div>

      <Section className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        <Grid as="ol" layout="blog">
          {articles.map((article, i) => (
            <ArticleCard
              blogHandle={BLOG_HANDLE.toLowerCase()}
              article={article}
              key={article.id}
              loading={getImageLoadingPriority(i, 2)}
            />
          ))}
        </Grid>
      </Section>
    </>
  );
}

function ArticleCard({
  blogHandle,
  article,
  loading,
}: {
  blogHandle: string;
  article: any;
  loading?: HTMLImageElement['loading'];
}) {
  return (
    <li key={article.id} className="group flex flex-col h-full bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
      <Link to={`/${blogHandle}/${article.handle}`} className="flex flex-col h-full">
        {article.image ? (
          <div className="relative aspect-[3/2] overflow-hidden bg-gray-50 z-0">
            <Image
              alt={article.image.altText || article.title}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              data={article.image}
              aspectRatio="3/2"
              loading={loading}
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>
        ) : (
          <div className="aspect-[3/2] bg-gradient-to-br from-[#1e293b] to-[#0f172a] flex items-center justify-center">
            <span className="text-white/20 text-3xl">📰</span>
          </div>
        )}
        <div className="flex-grow p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-3">
              <span>{article.publishedAt}</span>
              {article.author?.name && (
                <>
                  <span>&middot;</span>
                  <span>By {article.author.name}</span>
                </>
              )}
            </div>
            <h2 className="text-lg md:text-xl font-black text-gray-900 group-hover:text-[#D33E13] transition-colors leading-snug line-clamp-2 uppercase">
              {article.title}
            </h2>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#D33E13] group-hover:underline">
            Read Article <span>&rarr;</span>
          </div>
        </div>
      </Link>
    </li>
  );
}

const BLOGS_QUERY = `#graphql
query Blog(
  $language: LanguageCode
  $blogHandle: String!
  $pageBy: Int!
  $cursor: String
) @inContext(language: $language) {
  blog(handle: $blogHandle) {
    title
    seo {
      title
      description
    }
    articles(first: $pageBy, after: $cursor) {
      edges {
        node {
          ...Article
        }
      }
    }
  }
}

fragment Article on Article {
  author: authorV2 {
    name
  }
  contentHtml
  handle
  id
  image {
    id
    altText
    url
    width
    height
  }
  publishedAt
  title
}
`;
