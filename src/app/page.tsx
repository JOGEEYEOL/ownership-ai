import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { SolutionSection } from '@/components/landing/SolutionSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { ImpactSection } from '@/components/landing/ImpactSection';
import { SocialProofSection } from '@/components/landing/SocialProofSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { FinalCTASection } from '@/components/landing/FinalCTASection';
import { InvitationForm } from '@/components/landing/InvitationForm';
import { Footer } from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <ImpactSection />
      <SocialProofSection />
      <FAQSection />
      {/* TODO: 메일링 시스템 도입 후 복원 */}
      {/* <FinalCTASection /> */}
      {/* <InvitationForm /> */}
      <Footer />
    </main>
  );
}
