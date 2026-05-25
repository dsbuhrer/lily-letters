import { Mail } from 'lucide-react';

export default function CheckoutEmailNotice() {
  return (
    <div className="checkout-callout flex gap-3 p-4 bg-wine/5 border border-gold/25 border-l-4 border-l-gold">
      <Mail size={18} strokeWidth={1.5} className="text-gold flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="font-body text-sm font-medium text-wine text-balance">
          Use the email you check daily — your download and receipt go here.
        </p>
        <details className="mt-2 group">
          <summary className="font-body text-xs text-gold cursor-pointer list-none hover:text-wine transition-colors [&::-webkit-details-marker]:hidden">
            <span className="underline underline-offset-2">Why this matters</span>
          </summary>
          <p className="font-body text-xs text-[#2d2020]/70 leading-relaxed mt-2 text-balance">
            <span className="font-medium text-[#2d2020]/85">Important:</span> Use your best
            email — the one you open every day. Your PDF with Canva template links and order
            receipt are delivered only to this address. A typo or old inbox means you may not
            find your purchase.
          </p>
        </details>
      </div>
    </div>
  );
}
