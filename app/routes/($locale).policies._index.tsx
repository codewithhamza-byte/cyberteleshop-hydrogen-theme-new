import {
  json,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import invariant from 'tiny-invariant';
import {getSeoMeta} from '@shopify/hydrogen';

import {PageHeader, Section, Heading} from '~/components/Text';
import {Link} from '~/components/Link';
import {routeHeaders} from '~/data/cache';
import {seoPayload} from '~/lib/seo.server';
import type {NonNullableFields} from '~/lib/type';
import {FALLBACK_POLICIES} from '~/lib/fallbackPolicies';

export const headers = routeHeaders;

export async function loader({
  request,
  context: {storefront},
}: LoaderFunctionArgs) {
  const data = await storefront.query(POLICIES_QUERY);

  invariant(data, 'No data returned from Shopify API');
  let policies = Object.values(
    data.shop as NonNullableFields<typeof data.shop>,
  ).filter(Boolean);

  if (policies.length === 0) {
    policies = Object.values(FALLBACK_POLICIES);
  }

  const seo = seoPayload.policies({policies, url: request.url});

  return json({
    policies,
    seo,
  });
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

const POLICY_DETAILS: Record<string, {icon: string; desc: string; color: string}> = {
  'privacy-policy': {
    icon: '🛡️',
    desc: 'Learn how we collect, use, safeguard, and manage your personal data and account privacy.',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  'refund-policy': {
    icon: '🔄',
    desc: 'Read our guidelines regarding returns, exchange eligibilities, timelines, and refund claims.',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  'terms-of-service': {
    icon: '📜',
    desc: 'Understand the legal terms, rules, and conditions for using our website and ordering goods.',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  'shipping-policy': {
    icon: '🚚',
    desc: 'Find all delivery information, order processing times, shipping zones, and carrier options.',
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
  'subscription-policy': {
    icon: '💳',
    desc: 'Review conditions, billing cycles, updates, and cancellations for subscription plans.',
    color: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  },
};

export default function Policies() {
  const {policies} = useLoaderData<typeof loader>();

  return (
    <>
      <PageHeader heading="Store Policies" />
      <Section padding="x" className="mb-24 mx-auto max-w-7xl">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {policies.map((policy) => {
            if (!policy) return null;
            const details = POLICY_DETAILS[policy.handle] || {
              icon: '📄',
              desc: 'Read the official policy guidelines set by our store.',
              color: 'bg-primary/5 text-primary border-primary/10',
            };

            return (
              <Link
                key={policy.id}
                to={`/policies/${policy.handle}`}
                className="group relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border border-primary/10 bg-contrast/95 p-6 md:p-8 transition duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${details.color} mb-6`}>
                    {details.icon}
                  </div>
                  <Heading size="lead" className="text-lg font-bold tracking-tight text-primary mb-3">
                    {policy.title}
                  </Heading>
                  <p className="text-sm text-primary/70 leading-relaxed">
                    {details.desc}
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#D33E13] group-hover:underline">
                  Read Policy <span>&rarr;</span>
                </div>
              </Link>
            );
          })}
        </div>
      </Section>
    </>
  );
}

const POLICIES_QUERY = `#graphql
  fragment PolicyIndex on ShopPolicy {
    id
    title
    handle
  }

  query PoliciesIndex {
    shop {
      privacyPolicy {
        ...PolicyIndex
      }
      shippingPolicy {
        ...PolicyIndex
      }
      termsOfService {
        ...PolicyIndex
      }
      refundPolicy {
        ...PolicyIndex
      }
      subscriptionPolicy {
        id
        title
        handle
      }
    }
  }
`;
