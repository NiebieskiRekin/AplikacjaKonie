import "./PWABadge.css";

import { useRegisterSW } from "virtual:pwa-register/react";

function PWABadge() {
  // check for updates every hour
  const period = 60 * 60 * 1000;

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (period <= 0) return;
      if (r?.active?.state === "activated") {
        registerPeriodicSync(period, swUrl, r);
      } else if (r?.installing) {
        r.installing.addEventListener("statechange", (e) => {
          const sw = e.target as ServiceWorker;
          if (sw.state === "activated") registerPeriodicSync(period, swUrl, r);
        });
      }
    },
  });

  function close() {
    setNeedRefresh(false);
  }

  return (
    <div className="PWABadge" role="alert" aria-labelledby="toast-message">
      {needRefresh && (
        <div className="PWABadge-toast">
          <div className="PWABadge-message">
            <span id="toast-message">Dostępna jest aktualizacja strony.</span>
          </div>
          <div className="PWABadge-buttons">
            <button
              className="PWABadge-toast-button"
              onClick={() => void updateServiceWorker(true)}
            >
              Zaktualizuj
            </button>
            <button className="PWABadge-toast-button" onClick={() => close()}>
              Zamknij
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PWABadge;

/**
 * This function will register a periodic sync check every hour, you can modify the interval as needed.
 */
function registerPeriodicSync(
  period: number,
  swUrl: string,
  r: ServiceWorkerRegistration
) {
  if (period <= 0) return;

  setInterval(() => {
    if ("onLine" in navigator && !navigator.onLine) return;

    fetch(swUrl, {
      cache: "no-store",
      headers: {
        cache: "no-store",
        "cache-control": "no-cache",
      },
    })
      .then(async (resp) => {
        if (resp?.status === 200) await r.update();
      })
      .catch(() => {});
  }, period);
}
