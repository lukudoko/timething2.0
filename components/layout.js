import { Noto_Sans_JP, Outfit, Lexend } from 'next/font/google';
import Head from 'next/head';

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


export default function Layout({ children }) {
  return (
    <div className={`${noto.variable} ${fit.variable}`}>
      <Head>
        <title>timething</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      <main className='font-fit'>{children}</main>
    </div>
  );
}