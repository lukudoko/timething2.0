import "@/styles/globals.css";
import { Noto_Sans_JP, Outfit } from 'next/font/google';

const noto = Noto_Sans_JP({
  weight: "variable",
  subsets: ['latin'],
  variable: '--font-noto-jp',
  display: 'swap',
  adjustFontFallback: false,
});

const fit = Outfit({
  weight: "variable",
  subsets: ['latin'],
  variable: '--outfit',
  display: 'swap',
  adjustFontFallback: false,
});


export default function App({ Component, pageProps }) {
  return (
    <main className={`${noto.variable} ${fit.variable}`}>
      <Component {...pageProps} />
    </main>
  );
}