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
        'landing_hero_title_1',
        'landing_hero_title_2',
        'landing_hero_subtitle',
        'landing_hero_cta_primary',
        'landing_hero_cta_secondary',
        'landing_footer_company_name',
        'landing_footer_description',
        'landing_trust_metrics',
        'landing_testimonial_layout',
        'landing_testimonial_columns',
        'landing_problem_title',
        'landing_problem_subtitle',
        'landing_problems',
        'landing_solution_title',
        'landing_solution_subtitle',
        'landing_solutions',
        'landing_features_title',
        'landing_features_subtitle',
        'landing_features',
        'landing_impact_title',
        'landing_impact_subtitle',
        'landing_impacts',
        'landing_testimonial_title',
        'landing_testimonial_subtitle',
        'landing_faq_title',
        'landing_faq_subtitle',
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

  // 섹션 데이터 파싱
  const parseJson = <T,>(key: string): T | undefined => {
    try {
      const raw = settingsMap.get(key);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? (parsed as T) : undefined;
    } catch {
      return undefined;
    }
  };

  const problems =
    parseJson<{ title: string; description: string; icon?: string }[]>('landing_problems');
  const solutions =
    parseJson<{ title: string; description: string; icon?: string }[]>('landing_solutions');
  const features =
    parseJson<{ title: string; description: string; icon?: string }[]>('landing_features');
  const impacts =
    parseJson<
      { title: string; description: string; metric: string; metricLabel: string; icon?: string }[]
    >('landing_impacts');

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
      <HeroSection
        title1={settingsMap.get('landing_hero_title_1')}
        title2={settingsMap.get('landing_hero_title_2')}
        subtitle={settingsMap.get('landing_hero_subtitle')}
        ctaPrimary={settingsMap.get('landing_hero_cta_primary')}
        ctaSecondary={settingsMap.get('landing_hero_cta_secondary')}
        badgeText={settingsMap.get('landing_hero_badge')}
      />
      <ProblemSection
        items={problems}
        sectionTitle={settingsMap.get('landing_problem_title')}
        sectionSubtitle={settingsMap.get('landing_problem_subtitle')}
      />
      <SolutionSection
        items={solutions}
        sectionTitle={settingsMap.get('landing_solution_title')}
        sectionSubtitle={settingsMap.get('landing_solution_subtitle')}
      />
      <FeaturesSection
        items={features}
        sectionTitle={settingsMap.get('landing_features_title')}
        sectionSubtitle={settingsMap.get('landing_features_subtitle')}
      />
      <ImpactSection
        items={impacts}
        sectionTitle={settingsMap.get('landing_impact_title')}
        sectionSubtitle={settingsMap.get('landing_impact_subtitle')}
      />
      <SocialProofSection
        testimonials={testimonialsRes.data || []}
        trustMetrics={trustMetrics}
        layout={(settingsMap.get('landing_testimonial_layout') as 'grid' | 'slide') || 'grid'}
        columns={parseInt(settingsMap.get('landing_testimonial_columns') || '3', 10)}
        sectionTitle={settingsMap.get('landing_testimonial_title')}
        sectionSubtitle={settingsMap.get('landing_testimonial_subtitle')}
      />
      <FAQSection
        faqs={faqsRes.data || []}
        sectionTitle={settingsMap.get('landing_faq_title')}
        sectionSubtitle={settingsMap.get('landing_faq_subtitle')}
      />
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
