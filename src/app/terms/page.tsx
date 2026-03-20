import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';

export default async function TermsPage() {
  const { data } = await supabaseAdmin
    .from('site_settings')
    .select('value')
    .eq('key', 'legal_terms_of_service')
    .single();

  const content = data?.value || '';

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          홈으로 돌아가기
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">이용약관</h1>

        {content ? (
          <div
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <p className="text-gray-500">이용약관이 아직 등록되지 않았습니다.</p>
        )}
      </div>
    </div>
  );
}
