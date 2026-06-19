import {useState} from 'react';
import {json, type MetaArgs, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import {getSeoMeta} from '@shopify/hydrogen';
import {routeHeaders} from '~/data/cache';

export const headers = routeHeaders;

export async function loader({request}: LoaderFunctionArgs) {
  return json({});
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta({
    title: 'Track My Order',
    description: 'Track your shipment and order delivery status at CyberTeleshop.',
  });
};

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [trackingResult, setTrackingResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !emailOrPhone) return;

    setLoading(true);
    setTrackingResult(null); // Clear previous result while loading new search
    
    // Simulate lookup delay
    setTimeout(() => {
      setLoading(false);
      // Generate realistic mock order data
      const cleanedId = orderId.replace('#', '').trim();
      setTrackingResult({
        id: `#${cleanedId}`,
        date: new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}),
        status: 'In Transit',
        carrier: 'Trax / Leopard Courier',
        trackingNumber: `CTS-${cleanedId}-PK`,
        steps: [
          {title: 'Order Confirmed', desc: 'Your order has been received and verified.', date: 'Today, 9:30 AM', completed: true},
          {title: 'Packed & Processed', desc: 'Item packed and prepared for courier handover.', date: 'Today, 2:15 PM', completed: true},
          {title: 'Shipped (In Transit)', desc: 'Handed over to carrier. En route to your destination.', date: 'Today, 5:00 PM', completed: true, active: true},
          {title: 'Out for Delivery', desc: 'Courier agent will contact you shortly.', date: 'Pending', completed: false},
        ],
      });
    }, 1200);
  };

  const getWhatsAppLink = () => {
    const phone = '923004252400'; // Format for international whatsapp API
    const message = `Hi CyberTeleshop, I'd like to track my order.\nOrder ID: ${orderId || '___'}\nName/Phone: ${emailOrPhone || '___'}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

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
            <span className="text-white font-extrabold">Track Order</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase mb-3">
            Track My Order
          </h1>

          <p className="max-w-2xl text-xs md:text-sm text-gray-200/90 leading-relaxed font-medium">
            Enter your order tracking details below or contact our WhatsApp support desk for instant human assistance.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid gap-8 md:grid-cols-12">
          
          {/* Left Column: Track Form */}
          <div className="md:col-span-7 bg-white border border-gray-100 p-6 md:p-8 rounded-[2rem] shadow-sm flex flex-col justify-between">
            <form onSubmit={handleTrackSubmit} className="space-y-5">
              <h2 className="text-lg font-black uppercase text-gray-900 tracking-tight mb-2">
                Order Tracking Look-up
              </h2>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Order ID / Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. #10023"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D33E13] rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-colors duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Email Address or Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. customer@email.com or 03*********"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D33E13] rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-colors duration-200"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-[#D33E13] text-white font-extrabold text-xs uppercase tracking-wider py-4 rounded-xl transition-colors duration-300 flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Searching Order...
                  </>
                ) : (
                  'Track Status'
                )}
              </button>
            </form>
          </div>

          {/* Right Column: WhatsApp Assistance Widget */}
          <div className="md:col-span-5 bg-gradient-to-br from-[#0f172a] to-black text-white p-6 md:p-8 rounded-[2rem] shadow-lg border border-gray-800 flex flex-col justify-between">
            <div>
              <span className="text-3xl mb-4 block">💬</span>
              <h2 className="text-lg font-black uppercase tracking-tight text-white mb-2">
                WhatsApp Live Help
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed mb-6 font-medium">
                Want immediate tracking status? Chat directly with our support desk on WhatsApp. We usually reply within minutes.
              </p>
            </div>

            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-200 shadow-md shadow-emerald-950/20"
            >
              <span>Track via WhatsApp</span> &rarr;
            </a>
          </div>

        </div>

        {/* Skeleton Loader during search */}
        {loading && (
          <div className="mt-8 bg-white border border-gray-100 rounded-[2.5rem] p-6 md:p-8 shadow-sm animate-pulse">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-5 mb-6 gap-4">
              <div className="space-y-2 w-full sm:w-1/3">
                <div className="h-3.5 bg-gray-200 rounded w-16" />
                <div className="h-6 bg-gray-200 rounded w-48" />
              </div>
              <div className="space-y-2 w-full sm:w-1/4 sm:text-right flex flex-col sm:items-end">
                <div className="h-3 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-3 bg-gray-200 rounded w-28" />
              </div>
            </div>

            <div className="relative border-l-2 border-gray-150 ml-4 pl-6 space-y-8 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="relative">
                  <span className="absolute -left-[33px] top-0.5 w-5 h-5 rounded-full border-2 border-gray-200 bg-white" />
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div className="space-y-2 w-full sm:w-2/3">
                      <div className="h-4 bg-gray-200 rounded w-36" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-16 pt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tracking Results Area */}
        {trackingResult && (
          <div className="mt-8 bg-white border border-gray-100 rounded-[2.5rem] p-6 md:p-8 shadow-sm animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-5 mb-6 gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D33E13] bg-[#D33E13]/10 px-2.5 py-1 rounded-full mb-2 block w-fit">
                  {trackingResult.status}
                </span>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                  Order {trackingResult.id}
                </h3>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Carrier & Tracking</p>
                <p className="text-sm font-extrabold text-gray-900">{trackingResult.carrier}</p>
                <p className="text-xs font-semibold text-gray-500">{trackingResult.trackingNumber}</p>
              </div>
            </div>

            {/* Stepper tracking list */}
            <div className="relative border-l-2 border-gray-100 ml-4 pl-6 space-y-6 py-2">
              {trackingResult.steps.map((step: any, idx: number) => (
                <div key={idx} className="relative">
                  {/* Point circle */}
                  <span className={`absolute -left-[33px] top-0.5 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center ${
                    step.active
                      ? 'border-[#D33E13] text-[#D33E13]'
                      : step.completed
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-250'
                  }`}>
                    {step.completed && !step.active && (
                      <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                    )}
                    {step.active && (
                      <span className="w-2 h-2 bg-[#D33E13] rounded-full animate-ping" />
                    )}
                  </span>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-1">
                    <div>
                      <h4 className={`text-sm font-black uppercase tracking-tight ${
                        step.active ? 'text-[#D33E13]' : step.completed ? 'text-gray-950' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed font-medium mt-0.5">
                        {step.desc}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap pt-1">
                      {step.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
