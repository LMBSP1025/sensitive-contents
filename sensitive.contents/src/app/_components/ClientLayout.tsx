'use client';

import { ThemeSwitcher } from "../_components/theme-switcher";
import Script from 'next/script';
import { SessionProvider } from "next-auth/react";
import cn from "classnames";

export default function ClientLayout({
  children,
  inter,
}: {
  children: React.ReactNode;
  inter: any;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#000000" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
        <meta name="theme-color" content="#000" />
        <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
      </head>
      <body className={cn(inter.className, "dark:bg-slate-900 dark:text-slate-400")}>
        <SessionProvider>
          <ThemeSwitcher />
          <div className="min-h-screen">{children}</div>
          <Script
            id="fb-sdk"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                window.fbAsyncInit = function() {
                  FB.init({
                    appId: '${process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID}',
                    cookie: true,
                    xfbml: true,
                    version: 'v18.0'
                  });
                };

                (function(d, s, id) {
                  var js, fjs = d.getElementsByTagName(s)[0];
                  if (d.getElementById(id)) return;
                  js = d.createElement(s);
                  js.id = id;
                  js.src = "https://connect.facebook.net/ko_KR/sdk.js";
                  fjs.parentNode.insertBefore(js, fjs);
                }(document, 'script', 'facebook-jssdk'));
              `
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
