import { Outfit } from 'next/font/google';
import Head from 'next/head';
import DayNightTheme from '@/components/DayNight';


const fit = Outfit({
  weight: "variable",
  subsets: ['latin'],
  variable: '--outfit',
  display: 'swap',
  adjustFontFallback: false,
});

export default function Layout({ children }) {
  return (
    <div className={`${fit.variable}`}>
      <Head>
        <title>timething</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      <DayNightTheme />
      <main className='font-fit'>{children}</main>
    </div>
  );
}