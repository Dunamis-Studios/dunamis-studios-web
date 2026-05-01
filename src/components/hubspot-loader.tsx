"use client";

import * as React from "react";

/**
 * Inject the HubSpot tracking script after the browser is idle so it does
 * not compete with LCP. Lighthouse's `forced-reflow-insight`, the bulk of
 * `largest-contentful-paint` slippage, and most of `errors-in-console`
 * (HubSpot 429s) all originate from this single embed firing on the
 * critical path. Loading it on idle keeps tracking intact while moving
 * its cost to after the page is visually complete.
 *
 * Strategy: requestIdleCallback when available, otherwise a 2 s
 * setTimeout. Either way the script ships within seconds of arrival, so
 * normal HubSpot session/page-view attribution still records.
 */
const HUBSPOT_SCRIPT_SRC = "https://js.hs-scripts.com/20867488.js";

export function HubspotLoader() {
  React.useEffect(() => {
    if (document.getElementById("hs-script-loader")) return;

    let cancelled = false;

    const load = () => {
      if (cancelled) return;
      if (document.getElementById("hs-script-loader")) return;
      const s = document.createElement("script");
      s.id = "hs-script-loader";
      s.src = HUBSPOT_SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(load, { timeout: 4000 });
      return () => {
        cancelled = true;
        if (typeof window.cancelIdleCallback === "function") {
          window.cancelIdleCallback(id);
        }
      };
    }

    const t = window.setTimeout(load, 2000);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  return null;
}
