export default function DocumentHeader({ logo }) {
  return (
    <div className="mb-5 shrink-0">
      <div className="flex items-center justify-between gap-4">
        {/* Logo on the left */}
        <div className="h-9 flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="Logo" className="h-9 object-contain" />
        </div>

        {/* Brand Stripe on the right: Two black slashes + Green bar */}
        <BrandStripe />
      </div>
    </div>
  );
}

function BrandStripe() {
  return (
    <svg width="340" height="14" viewBox="0 0 340 14" className="shrink-0">
      {/* Two black parallelograms */}
      <polygon points="0,14 9,14 16,0 7,0" fill="#191919" />
      <polygon points="13,14 22,14 29,0 20,0" fill="#191919" />
      {/* Green solid bar extending to the right edge */}
      <polygon points="27,14 340,14 340,0 34,0" fill="#1B7B51" />
    </svg>
  );
}