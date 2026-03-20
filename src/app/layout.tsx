import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ReactQueryProvider } from '@/lib/react-query';
import { Toaster } from '@/components/ui/sonner';
import { pretendard } from '@/lib/fonts';
import { FloatingActionButtonWrapper } from '@/components/common/FloatingActionButtonWrapper';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await supabaseAdmin
    .from('site_settings')
    .select('key, value')
    .in('key', ['site_title', 'site_description']);

  const map = new Map((data || []).map((s: { key: string; value: string }) => [s.key, s.value]));
  const title = map.get('site_title') || 'Ownership AI - 컨설턴트 관리 플랫폼';
  const description =
    map.get('site_description') ||
    '1인 컨설턴트를 위한 고객 정보 관리 및 정부지원사업 매칭 SaaS 플랫폼';

  return {
    title: {
      default: title,
      template: '%s | Ownership AI',
    },
    description,
    keywords: ['컨설턴트', '고객관리', 'CRM', '정부지원사업', '매칭', 'AI 매칭'],
    authors: [{ name: 'Ownership AI' }],
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ownership-ai.vercel.app'),
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      siteName: 'Ownership AI',
      title,
      description,
      images: [
        {
          url: '/opengraph-image.png',
          width: 854,
          height: 548,
          alt: 'Ownership AI',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/twitter-image.png'],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className={`${pretendard.className} antialiased`}>
        <ReactQueryProvider>{children}</ReactQueryProvider>
        <Toaster />
        <FloatingActionButtonWrapper />
      </body>
    </html>
  );
}
