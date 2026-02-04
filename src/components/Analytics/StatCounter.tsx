"use client";

import Script from "next/script";

export default function StatCounter() {
  return (
    <>
      <Script
        id="statcounter-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            var sc_project=13202600;
            var sc_invisible=1;
            var sc_security="ec5154da";
          `,
        }}
      />
      <Script
        id="statcounter"
        strategy="afterInteractive"
        src="https://www.statcounter.com/counter/counter.js"
        async
      />
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
    </>
  );
}
