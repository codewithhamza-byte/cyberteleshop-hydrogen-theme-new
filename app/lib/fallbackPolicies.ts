export interface FallbackPolicy {
  id: string;
  title: string;
  handle: string;
  body: string;
  url: string;
}

export const FALLBACK_POLICIES: Record<string, FallbackPolicy> = {
  'privacy-policy': {
    id: 'gid://shopify/ShopPolicy/privacy-policy',
    title: 'Privacy Policy',
    handle: 'privacy-policy',
    body: `
      <h2>Privacy Policy</h2>
      <p>Last updated: June 17, 2026</p>
      <p>Your privacy is important to us. It is Cyberteleshop's policy to respect your privacy regarding any information we may collect from you across our website and other storefront assets we own and operate.</p>
      
      <h3>1. Information We Collect</h3>
      <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>
      <ul>
        <li><strong>Personal Data:</strong> Name, shipping address, billing address, phone number, email address, and order transaction details.</li>
        <li><strong>Log Data:</strong> Browser type, IP address, page visits, time spent on pages, and network interaction details.</li>
        <li><strong>Cookies:</strong> Standard shopping session storage cookies to facilitate cart contents, user authentication, and secure checkouts.</li>
      </ul>

      <h3>2. How We Use Information</h3>
      <p>We use the collected information to fulfill orders, ship items, process secure payments, communicate transaction status updates, and provide customized marketing communications (with explicit consent).</p>

      <h3>3. Sharing and Disclosing</h3>
      <p>We do not share any personally identifying information publicly or with third-parties, except when required by law or to facilitate order fulfillment (e.g., sharing delivery addresses with courier partners and shipment carriers).</p>

      <h3>4. Security</h3>
      <p>We protect stored personal data within commercially acceptable means to prevent loss, theft, unauthorized access, copying, disclosure, or modification. All transactional payment pathways utilize 256-bit SSL encryption safeguards.</p>
    `,
    url: 'https://cyberteleshop.com/policies/privacy-policy',
  },
  'refund-policy': {
    id: 'gid://shopify/ShopPolicy/refund-policy',
    title: 'Refund & Return Policy',
    handle: 'refund-policy',
    body: `
      <h2>Refund & Return Policy</h2>
      <p>Last updated: June 17, 2026</p>
      <p>We offer a hassle-free refund and exchange policy to ensure you have the best experience shopping with us.</p>
      
      <h3>1. Eligibility for Returns</h3>
      <p>To be eligible for a return or exchange, your item must meet the following criteria:</p>
      <ul>
        <li>The return must be initiated within 15 days of order delivery.</li>
        <li>The item must be unused, in its original packaging, and in the same condition that you received it.</li>
        <li>Safety wrapping, tags, seals, and branded boxes must remain intact.</li>
      </ul>

      <h3>2. Return & Exchange Process</h3>
      <p>To initiate a return, please contact our support team at <a href="mailto:support@cyberteleshop.com">support@cyberteleshop.com</a> or via our official helpline with your order number and photo/video proof of the product condition. Once approved, you can dispatch the item back to our return hub.</p>

      <h3>3. Refund Timelines</h3>
      <p>Once your returned item is received and inspected, we will notify you of the status. Approved refunds will be processed within 5 to 7 working days back to your original payment method (Bank Transfer, EasyPaisa, JazzCash, or Card credit).</p>

      <h3>4. Damaged or Defective Items</h3>
      <p>If you receive a damaged, broken, or incorrect product, please inform us within 24 hours of delivery. We will immediately arrange a replacement shipment at no additional charge to you.</p>
    `,
    url: 'https://cyberteleshop.com/policies/refund-policy',
  },
  'terms-of-service': {
    id: 'gid://shopify/ShopPolicy/terms-of-service',
    title: 'Terms of Service',
    handle: 'terms-of-service',
    body: `
      <h2>Terms of Service</h2>
      <p>Last updated: June 17, 2026</p>
      <p>Welcome to Cyberteleshop. By accessing or using our storefront, website, and services, you agree to comply with and be bound by the following terms and conditions.</p>

      <h3>1. Account Registration and Use</h3>
      <p>You agree to provide true, accurate, and current information when registering an account, making checkouts, or interacting with our customer care systems. You are solely responsible for maintaining account credential confidentiality.</p>

      <h3>2. Pricing and Billing</h3>
      <p>We reserve the right to modify prices, descriptions, and stock availability of products without prior notice. Standard local taxes, currency translations, and shipping surcharges are calculated transparently during the final checkout stage.</p>

      <h3>3. Product Specifications</h3>
      <p>We attempt to show product colors, media, and features as accurately as possible. However, the final layout might vary slightly based on display screens, browser versions, and manufacturer updates.</p>

      <h3>4. Governing Law</h3>
      <p>These terms and conditions are governed by and construed in accordance with the laws of Pakistan. Any legal dispute arising from transactions on this storefront will fall under the exclusive jurisdiction of local courts.</p>
    `,
    url: 'https://cyberteleshop.com/policies/terms-of-service',
  },
  'shipping-policy': {
    id: 'gid://shopify/ShopPolicy/shipping-policy',
    title: 'Shipping & Delivery Policy',
    handle: 'shipping-policy',
    body: `
      <h2>Shipping & Delivery Policy</h2>
      <p>Last updated: June 17, 2026</p>
      <p>We are dedicated to delivering your orders swiftly and safely nationwide.</p>

      <h3>1. Order Processing Times</h3>
      <p>All orders are processed and verified within 24 to 48 business hours. Orders placed on weekends or public holidays will be dispatched on the next working day.</p>

      <h3>2. Delivery Timelines</h3>
      <ul>
        <li><strong>Major Cities (Lahore, Karachi, Islamabad):</strong> 2 to 4 working days.</li>
        <li><strong>Other Cities & Towns:</strong> 3 to 6 working days.</li>
      </ul>

      <h3>3. Shipping Charges</h3>
      <p>We offer standard flat-rate shipping nationwide. Enjoy <strong>Free Shipping</strong> on all orders with a subtotal value exceeding Rs. 5,000.</p>

      <h3>4. Delivery Methods</h3>
      <p>We partner with premier logistics solutions providers (TCS, Leopard Couriers, M&P, Trax) to ensure secure delivery. Cash on Delivery (COD) is available for all destinations.</p>

      <h3>5. Shipment Tracking</h3>
      <p>As soon as your package is dispatched, we will send you a tracking URL and reference code via SMS and Email to monitor your shipment status in real-time.</p>
    `,
    url: 'https://cyberteleshop.com/policies/shipping-policy',
  },
};
