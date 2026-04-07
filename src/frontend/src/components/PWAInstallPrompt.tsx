import { Download, Monitor, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      const t = localStorage.getItem("mtex_pwa_dismissed");
      if (!t) return false;
      // Re-show after 7 days
      return Date.now() - Number(t) < 7 * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (dismissed) return;

    // Android/Desktop — listen for the browser's install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS — detect via userAgent
    const isIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window.navigator as any).standalone;
    if (isIOS) {
      setTimeout(() => {
        setShowIOSGuide(true);
        setShow(true);
      }, 4000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed]);

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    try {
      localStorage.setItem("mtex_pwa_dismissed", String(Date.now()));
    } catch {}
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  if (!show || dismissed) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <div className="bg-[#0d1b2e] border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/mtex-pwa-icon-192.dim_192x192.png"
              alt="Mtex icon"
              className="w-10 h-10 rounded-xl"
            />
            <div>
              <p className="text-white font-bold text-sm leading-tight">
                Mtextrading
              </p>
              <p className="text-blue-300 text-xs">Add to your device</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white p-1 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 pb-4">
          {!showIOSGuide ? (
            // Android / Desktop install button
            <>
              <p className="text-gray-300 text-xs mb-3">
                Install the Mtextrading app for quick access to your portfolio,
                trades, and markets — right from your home screen.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleInstall}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  <Download size={15} />
                  Install App
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-3 py-2.5 rounded-xl bg-white/10 text-gray-300 text-sm hover:bg-white/20 transition-colors"
                >
                  Not now
                </button>
              </div>
            </>
          ) : (
            // iOS step-by-step guide
            <>
              <p className="text-gray-300 text-xs mb-3">
                Add Mtextrading to your Home Screen for the best experience:
              </p>
              <ol className="space-y-2 mb-3">
                <li className="flex items-start gap-2 text-xs text-gray-200">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold mt-0.5">
                    1
                  </span>
                  <span>
                    Tap the{" "}
                    <span className="font-semibold text-white">
                      Share button
                    </span>{" "}
                    (<span className="text-blue-300">↑</span>) at the bottom of
                    Safari
                  </span>
                </li>
                <li className="flex items-start gap-2 text-xs text-gray-200">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold mt-0.5">
                    2
                  </span>
                  <span>
                    Scroll down and tap{" "}
                    <span className="font-semibold text-white">
                      "Add to Home Screen"
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-2 text-xs text-gray-200">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold mt-0.5">
                    3
                  </span>
                  <span>
                    Tap <span className="font-semibold text-white">"Add"</span>{" "}
                    to confirm
                  </span>
                </li>
              </ol>
              <div className="flex gap-2 mt-1">
                <div className="flex items-center gap-1.5 flex-1 bg-white/5 rounded-xl px-3 py-2">
                  <Smartphone
                    size={13}
                    className="text-blue-300 flex-shrink-0"
                  />
                  <span className="text-gray-400 text-[10px]">
                    iOS: Safari → Share → Add to Home Screen
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-1 bg-white/5 rounded-xl px-3 py-2">
                  <Monitor size={13} className="text-blue-300 flex-shrink-0" />
                  <span className="text-gray-400 text-[10px]">
                    Desktop: address bar install icon
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="mt-3 w-full py-2 rounded-xl bg-white/10 text-gray-300 text-sm hover:bg-white/20 transition-colors"
              >
                Got it
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
