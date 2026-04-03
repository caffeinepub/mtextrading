import { useEffect, useState } from "react";

const PROMOS = [
  {
    title: "100% First Deposit Bonus",
    subtitle: "Deposit $100, trade with $200. Withdraw anytime you want.",
    cta: "Get Started",
    gradientStyle: { background: "linear-gradient(135deg, #2563eb, #4338ca)" },
    icon: "💰",
    type: "deposit",
  },
  {
    title: "Refer a Friend — Both Earn 100%",
    subtitle:
      "You and your friend both get 100% cashback on their first 3 deposits.",
    cta: "Invite Now",
    gradientStyle: { background: "linear-gradient(135deg, #10b981, #0d9488)" },
    icon: "🤝",
    type: "referral",
  },
  {
    title: "100% Bonus on First 3 Deposits",
    subtitle: "Every deposit you make — your first 3 — gets matched 100%.",
    cta: "Deposit Now",
    gradientStyle: { background: "linear-gradient(135deg, #7c3aed, #7e22ce)" },
    icon: "🎯",
    type: "deposit",
  },
  {
    title: "Zero Commission Trading",
    subtitle: "Keep 100% of your profits. No hidden fees on any trade.",
    cta: "Start Trading",
    gradientStyle: { background: "linear-gradient(135deg, #f97316, #dc2626)" },
    icon: "📈",
    type: "trade",
  },
  {
    title: "Copy Top Traders",
    subtitle: "Follow the best performers and earn automatically.",
    cta: "Explore",
    gradientStyle: { background: "linear-gradient(135deg, #0ea5e9, #2563eb)" },
    icon: "👥",
    type: "hub",
  },
  {
    title: "AI Trading Bots",
    subtitle: "Let automation work for you 24/7 with smart trading bots.",
    cta: "Activate Bot",
    gradientStyle: { background: "linear-gradient(135deg, #06b6d4, #0d9488)" },
    icon: "🤖",
    type: "hub",
  },
  {
    title: "VIP Account Benefits",
    subtitle:
      "Deposit $10,000+ to unlock premium spreads & a personal account manager.",
    cta: "Go VIP",
    gradientStyle: { background: "linear-gradient(135deg, #eab308, #d97706)" },
    icon: "👑",
    type: "deposit",
  },
  {
    title: "Free Demo Account",
    subtitle: "Practice with $10,000 virtual funds. No deposit required.",
    cta: "Try Demo",
    gradientStyle: { background: "linear-gradient(135deg, #ec4899, #e11d48)" },
    icon: "🎮",
    type: "demo",
  },
];

interface PromoCarouselProps {
  variant: "large" | "slim";
  onSlideClick?: (slideIndex: number) => void;
}

export default function PromoCarousel({
  variant,
  onSlideClick,
}: PromoCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % PROMOS.length);
        setAnimating(false);
      }, 200);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const slide = PROMOS[current];

  const handleClick = () => {
    onSlideClick?.(current);
  };

  const goTo = (index: number) => {
    if (index === current) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 150);
  };

  const dotKeys = PROMOS.map((_, i) => `dot-${i}`);

  if (variant === "large") {
    return (
      <div className="w-full select-none">
        <button
          type="button"
          onClick={handleClick}
          className="relative w-full rounded-2xl overflow-hidden text-left"
          style={{
            ...slide.gradientStyle,
            minHeight: "160px",
            transition: "background 0.4s ease",
            border: "none",
            padding: 0,
            cursor: "pointer",
            display: "block",
          }}
          data-ocid="promo.carousel.card"
          aria-label={`Promo: ${slide.title}`}
        >
          {/* Background decoration */}
          <div
            style={{
              position: "absolute",
              top: "-20px",
              right: "-20px",
              width: "140px",
              height: "140px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-30px",
              right: "60px",
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              pointerEvents: "none",
            }}
          />

          <div
            className="relative flex items-center justify-between"
            style={{
              padding: "24px 24px 40px 24px",
              opacity: animating ? 0 : 1,
              transform: animating ? "translateY(4px)" : "translateY(0)",
              transition: "opacity 0.2s ease, transform 0.2s ease",
            }}
          >
            <div className="flex-1 pr-4">
              <p
                className="text-white font-black leading-tight mb-2"
                style={{ fontSize: "clamp(1rem, 3vw, 1.35rem)" }}
              >
                {slide.title}
              </p>
              <p
                className="text-white mb-4"
                style={{ fontSize: "0.8rem", opacity: 0.85 }}
              >
                {slide.subtitle}
              </p>
              <span
                className="inline-block px-4 py-2 rounded-full text-xs font-bold"
                style={{
                  background: "rgba(255,255,255,0.95)",
                  color: "#1e1b4b",
                }}
              >
                {slide.cta}
              </span>
            </div>
            <div
              className="flex-shrink-0"
              style={{ fontSize: "clamp(2.5rem, 7vw, 3.5rem)", lineHeight: 1 }}
              aria-hidden="true"
            >
              {slide.icon}
            </div>
          </div>

          {/* Slide indicators inside the card */}
          <div
            className="absolute flex gap-1.5"
            style={{
              bottom: "12px",
              left: 0,
              right: 0,
              justifyContent: "center",
            }}
          >
            {dotKeys.map((key, i) => (
              <button
                type="button"
                key={key}
                data-ocid="promo.carousel.tab"
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                }}
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  width: i === current ? "20px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  background:
                    i === current
                      ? "rgba(255,255,255,0.95)"
                      : "rgba(255,255,255,0.4)",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: "width 0.3s ease, background 0.3s ease",
                }}
              />
            ))}
          </div>
        </button>
      </div>
    );
  }

  // Slim variant
  return (
    <div className="w-full select-none">
      <button
        type="button"
        onClick={handleClick}
        className="relative w-full rounded-2xl overflow-hidden text-left"
        style={{
          ...slide.gradientStyle,
          minHeight: "88px",
          transition: "background 0.4s ease",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "block",
        }}
        data-ocid="promo.carousel.card"
        aria-label={`Promo: ${slide.title}`}
      >
        {/* Background decoration */}
        <div
          style={{
            position: "absolute",
            top: "-15px",
            right: "-15px",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            pointerEvents: "none",
          }}
        />

        <div
          className="relative flex items-center gap-3 px-4 py-3"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? "translateY(3px)" : "translateY(0)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
          }}
        >
          <span
            style={{ fontSize: "1.75rem", flexShrink: 0, lineHeight: 1 }}
            aria-hidden="true"
          >
            {slide.icon}
          </span>
          <div className="flex-1 min-w-0">
            <p
              className="text-white font-bold leading-tight"
              style={{ fontSize: "0.875rem" }}
            >
              {slide.title}
            </p>
            <p
              className="text-white mt-0.5 truncate"
              style={{ fontSize: "0.7rem", opacity: 0.75 }}
            >
              {slide.subtitle}
            </p>
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            {dotKeys.map((key, i) => (
              <button
                type="button"
                key={key}
                data-ocid="promo.carousel.tab"
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                }}
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  width: "5px",
                  height: i === current ? "16px" : "5px",
                  borderRadius: "3px",
                  background:
                    i === current
                      ? "rgba(255,255,255,0.95)"
                      : "rgba(255,255,255,0.35)",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: "height 0.3s ease, background 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>
      </button>
    </div>
  );
}
