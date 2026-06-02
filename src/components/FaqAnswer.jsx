import {
  PRINTS_OF_LOVE_COUPON,
  PRINTS_OF_LOVE_REFERRAL_PATH,
  PRINTS_OF_LOVE_REFERRAL_URL,
  hasPrintsOfLovePromo,
  mentionsPrintsOfLove,
} from '../constants/printsOfLove';

const linkClass =
  'text-wine underline underline-offset-2 decoration-gold/40 hover:decoration-gold transition-colors';

function PrintsOfLovePromo() {
  return (
    <div className="space-y-3">
      <p className="font-body text-sm text-ink/75 leading-relaxed">
        Looking to print? I recommend{' '}
        <a
          href={PRINTS_OF_LOVE_REFERRAL_URL}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={linkClass}
        >
          Prints of Love
        </a>{' '}
        for all your professional printing needs. Click my special link below to get started:
      </p>
      <a
        href={PRINTS_OF_LOVE_REFERRAL_URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`inline-block font-body text-sm ${linkClass}`}
      >
        {PRINTS_OF_LOVE_REFERRAL_PATH}
      </a>
      <p className="font-body text-sm text-ink/75 leading-relaxed">
        Use code{' '}
        <strong className="text-wine font-medium tracking-wide">{PRINTS_OF_LOVE_COUPON}</strong> at
        Prints of Love for 10% off your order of $49 or more!
      </p>
    </div>
  );
}

function renderParagraph(part, index) {
  const trimmed = part.trim();
  if (!trimmed) return null;

  if (
    trimmed === PRINTS_OF_LOVE_REFERRAL_URL ||
    trimmed === PRINTS_OF_LOVE_REFERRAL_PATH ||
    trimmed.includes('printsoflove.com/ref/LILYLETTERS')
  ) {
    return (
      <a
        key={index}
        href={PRINTS_OF_LOVE_REFERRAL_URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`block font-body text-sm ${linkClass}`}
      >
        {PRINTS_OF_LOVE_REFERRAL_PATH}
      </a>
    );
  }

  if (trimmed.includes(PRINTS_OF_LOVE_COUPON)) {
    const [before, after] = trimmed.split(PRINTS_OF_LOVE_COUPON);
    return (
      <p key={index} className="font-body text-sm text-ink/75 leading-relaxed">
        {before}
        <strong className="text-wine font-medium tracking-wide">{PRINTS_OF_LOVE_COUPON}</strong>
        {after}
      </p>
    );
  }

  if (mentionsPrintsOfLove(trimmed) && !hasPrintsOfLovePromo(trimmed)) {
    const parts = trimmed.split(/(Prints of Love)/i);
    return (
      <p key={index} className="font-body text-sm text-ink/75 leading-relaxed">
        {parts.map((bit, i) =>
          /^prints of love$/i.test(bit) ? (
            <a
              key={i}
              href={PRINTS_OF_LOVE_REFERRAL_URL}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className={linkClass}
            >
              {bit}
            </a>
          ) : (
            bit
          ),
        )}
      </p>
    );
  }

  return (
    <p key={index} className="font-body text-sm text-ink/75 leading-relaxed">
      {trimmed}
    </p>
  );
}

export default function FaqAnswer({ answer, className = '' }) {
  if (!answer?.trim()) return null;

  const paragraphs = answer.split(/\n\n+/).filter((p) => p.trim());
  const showStandalonePromo =
    mentionsPrintsOfLove(answer) && !hasPrintsOfLovePromo(answer);

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {paragraphs.map((part, index) => renderParagraph(part, index))}
      {showStandalonePromo && (
        <div className="pt-3 mt-1 border-t border-taupe/30">
          <PrintsOfLovePromo />
        </div>
      )}
    </div>
  );
}
