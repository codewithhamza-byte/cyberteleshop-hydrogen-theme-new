import {json, type LoaderFunctionArgs, type ActionFunctionArgs} from '@shopify/remix-oxygen';

const JUDGEME_SHOP_DOMAIN = 'cyberteleshop.myshopify.com';
const JUDGEME_PRIVATE_TOKEN = 'ppCY50cRnq9JmUKScl8FC3nfOIM';

/**
 * Clean Shopify Product ID (extract number from gid://shopify/Product/123456)
 */
function cleanProductId(id: string): string {
  if (!id) return '';
  return id.replace('gid://shopify/Product/', '');
}

/**
 * GET handler: Fetch reviews from Judge.me for a specific product
 */
export async function loader({request}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const rawProductId = url.searchParams.get('productId');

  if (!rawProductId) {
    return json({reviews: [], averageRating: 0, ratingCount: 0}, {status: 400});
  }

  const productId = cleanProductId(rawProductId);

  try {
    // 1. Fetch internal Judge.me product ID by looking up via external Shopify ID
    const productLookupUrl = `https://judge.me/api/v1/products/-1?shop_domain=${JUDGEME_SHOP_DOMAIN}&api_token=${JUDGEME_PRIVATE_TOKEN}&external_id=${productId}`;
    const productRes = await fetch(productLookupUrl);
    
    if (!productRes.ok) {
      console.error(`Judge.me product lookup failed with status: ${productRes.status}`);
      return json({reviews: [], averageRating: 0, ratingCount: 0});
    }

    const productData = (await productRes.json()) as any;
    const internalId = productData?.product?.id;

    if (!internalId) {
      console.warn(`No Judge.me internal product ID found for external ID: ${productId}`);
      return json({reviews: [], averageRating: 0, ratingCount: 0});
    }

    // 2. Fetch reviews list for this internal ID (get up to 100 reviews)
    const reviewsUrl = `https://judge.me/api/v1/reviews?shop_domain=${JUDGEME_SHOP_DOMAIN}&api_token=${JUDGEME_PRIVATE_TOKEN}&product_id=${internalId}&per_page=100`;
    const reviewsRes = await fetch(reviewsUrl);

    if (!reviewsRes.ok) {
      console.error(`Judge.me reviews fetch failed with status: ${reviewsRes.status}`);
      return json({reviews: [], averageRating: 0, ratingCount: 0});
    }

    const reviewsData = (await reviewsRes.json()) as any;
    const reviews = reviewsData?.reviews || [];

    // Calculate aggregate ratings
    let totalRating = 0;
    const ratingCount = reviews.length;
    
    if (ratingCount > 0) {
      reviews.forEach((r: any) => {
        totalRating += Number(r.rating || 0);
      });
    }
    
    const averageRating = ratingCount > 0 ? parseFloat((totalRating / ratingCount).toFixed(1)) : 0;

    return json({
      reviews,
      averageRating,
      ratingCount,
    });
  } catch (error) {
    console.error('Error in reviews loader proxy:', error);
    return json({reviews: [], averageRating: 0, ratingCount: 0}, {status: 500});
  }
}

/**
 * Upload a Base64 string to Catbox.moe and return the public URL
 */
async function uploadBase64ToCatbox(base64Data: string): Promise<string | null> {
  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      console.error('Invalid base64 string format');
      return null;
    }
    const contentType = matches[2] ? matches[1] : 'image/png';
    const base64Str = matches[2];

    const binaryStr = atob(base64Str);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const blob = new Blob([bytes], {type: contentType});

    let ext = 'png';
    if (contentType === 'image/jpeg' || contentType === 'image/jpg') {
      ext = 'jpg';
    } else if (contentType === 'image/gif') {
      ext = 'gif';
    } else if (contentType === 'image/webp') {
      ext = 'webp';
    }

    const filename = `review_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', blob, filename);

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      console.error(`Catbox upload failed with status: ${res.status}`);
      return null;
    }

    const url = await res.text();
    return url.trim();
  } catch (error) {
    console.error('Error uploading to Catbox:', error);
    return null;
  }
}

/**
 * POST handler: Submit a review to Judge.me
 */
export async function action({request}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({error: 'Method not allowed'}, {status: 405});
  }

  try {
    const body = (await request.json()) as {
      productId?: string;
      name?: string;
      email?: string;
      rating?: string | number;
      title?: string;
      body?: string;
      images?: string[];
    };
    const {
      productId: rawProductId,
      name,
      email,
      rating,
      title,
      body: reviewBody,
      images, // Optional array of base64 data URLs
    } = body;

    if (!rawProductId || !name || !email || !rating || !reviewBody) {
      return json({error: 'Missing required fields'}, {status: 400});
    }

    const productId = cleanProductId(rawProductId);

    // Upload base64 images to Catbox and get public URLs
    const pictureUrls: string[] = [];
    if (images && Array.isArray(images)) {
      for (const base64Img of images) {
        const uploadedUrl = await uploadBase64ToCatbox(base64Img);
        if (uploadedUrl) {
          pictureUrls.push(uploadedUrl);
        }
      }
    }

    const submitUrl = 'https://judge.me/api/v1/reviews';
    const submitRes = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shop_domain: JUDGEME_SHOP_DOMAIN,
        platform: 'shopify',
        api_token: JUDGEME_PRIVATE_TOKEN,
        id: productId, // Accept external product ID for creation
        name,
        email,
        rating: Number(rating),
        title: title || '',
        body: reviewBody,
        picture_urls: pictureUrls, // Include public picture URLs
      }),
    });

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      console.error(`Judge.me review submission failed: ${submitRes.status} - ${errorText}`);
      return json({error: 'Failed to submit review to Judge.me'}, {status: submitRes.status});
    }

    const data = (await submitRes.json()) as any;
    return json({success: true, message: data.message || 'Review submitted successfully.'});
  } catch (error) {
    console.error('Error submitting review:', error);
    return json({error: 'Internal Server Error'}, {status: 500});
  }
}

