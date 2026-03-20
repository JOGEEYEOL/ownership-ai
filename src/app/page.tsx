import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { SolutionSection } from '@/components/landing/SolutionSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { ImpactSection } from '@/components/landing/ImpactSection';
import { SocialProofSection } from '@/components/landing/SocialProofSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { Footer } from '@/components/landing/Footer';
import { supabaseAdmin } from '@/lib/supabase/admin';

export default async function HomePage() {
  // DB에서 랜딩페이지 데이터 병렬 조회
  const [settingsRes, faqsRes, testimonialsRes] = await Promise.all([
    supabaseAdmin
      .from('site_settings')
      .select('key, value')
      .in('key', [
        'landing_hero_badge',
        'landing_footer_company_name',
        'landing_footer_description',
        'landing_trust_metrics',
        'contact_phone',
        'contact_emails',
      ]),
    supabaseAdmin
      .from('landing_faqs')
      .select('question, answer')
      .eq('isActive', true)
      .order('order', { ascending: true }),
    supabaseAdmin
      .from('landing_testimonials')
      .select('name, role, company, content')
      .eq('isActive', true)
      .order('order', { ascending: true }),
  ]);

  const settingsMap = new Map(
    (settingsRes.data || []).map((s: { key: string; value: string }) => [s.key, s.value])
  );

  let trustMetrics: { value: string; label: string }[] = [];
  try {
    const parsed = JSON.parse(settingsMap.get('landing_trust_metrics') || '[]');
    if (Array.isArray(parsed)) trustMetrics = parsed;
  } catch {
    /* use default */
  }

  // 연락처 정보 파싱 (플로팅 버튼과 동일한 데이터)
  let contacts: { name?: string; position?: string; email: string }[] = [];
  try {
    const parsed = JSON.parse(settingsMap.get('contact_emails') || '[]');
    if (Array.isArray(parsed)) contacts = parsed;
  } catch {
    /* use default */
  }

  return (
    <main>
      <HeroSection badgeText={settingsMap.get('landing_hero_badge') || '베타 서비스 운영 중'} />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <ImpactSection />
      <SocialProofSection testimonials={testimonialsRes.data || []} trustMetrics={trustMetrics} />
      <FAQSection faqs={faqsRes.data || []} />
      {/* TODO: 메일링 시스템 도입 후 복원 */}
      {/* <FinalCTASection /> */}
      {/* <InvitationForm /> */}
      <Footer
        companyName={settingsMap.get('landing_footer_company_name') || 'Ownership AI'}
        description={
          settingsMap.get('landing_footer_description') ||
          '컨설턴트를 위한 스마트한 고객 관리 플랫폼'
        }
        phone={settingsMap.get('contact_phone') || ''}
        contacts={contacts}
      />
    </main>
  );
}
