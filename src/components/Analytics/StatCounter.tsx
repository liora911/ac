"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    sc_project?: number;
    sc_invisible?: number;
    sc_security?: string;
  }
}

export default function StatCounter() {
  const pathname = usePathname();

  useEffect(() => {
    window.sc_project = 13202600;
    window.sc_invisible = 1;
    window.sc_security = "ec5154da";

    const existingScript = document.getElementById("statcounter-script");
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.src = "https://www.statcounter.com/counter/counter.js";
    script.async = true;
    script.id = "statcounter-script";
    document.body.appendChild(script);
  }, [pathname]);

  return (
    <noscript>
      <div className="statcounter">
        <a
          title="hit counter"
          href="https://statcounter.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            className="statcounter"
            src="https://c.statcounter.com/13202600/0/ec5154da/1/"
            alt="hit counter"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </a>
      </div>
    </noscript>
  );
}
