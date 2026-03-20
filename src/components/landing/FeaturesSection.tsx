'use client';

import React from 'react';
import { Users, Target, BarChart, Bell, FileText, Zap } from 'lucide-react';
import { FeatureCard } from './FeatureCard';
import { getIconByName } from '@/lib/icon-map';

const defaultIcons = [Users, Target, BarChart, Bell, FileText, Zap];

interface FeatureItem {
  title: string;
  description: string;
  icon?: string;
}

interface FeaturesSectionProps {
  items?: FeatureItem[];
  sectionTitle?: string;
  sectionSubtitle?: string;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({
  items,
  sectionTitle,
  sectionSubtitle,
}) => {
  const features =
    items && items.length > 0
      ? items
      : [
          {
            title: '고객 정보 관리',
            description: '고객의 업종, 지역, 관심사를 체계적으로 관리하고 한눈에 파악하세요',
          },
          {
            title: '자동 매칭',
            description: '고객에게 딱 맞는 정부지원사업을 자동으로 찾아 추천해드립니다',
          },
          {
            title: '성과 분석',
            description: '매칭 결과와 고객 반응을 실시간으로 분석하고 개선하세요',
          },
          {
            title: '자동 알림',
            description: '새로운 지원사업 공고를 자동으로 모니터링하고 알려드립니다',
          },
          {
            title: '문서 관리',
            description: '제안서, 계약서 등 고객 관련 문서를 안전하게 보관하세요',
          },
          {
            title: '빠른 실행',
            description: '클릭 몇 번으로 고객에게 이메일과 SMS를 발송할 수 있습니다',
          },
        ];

  return (
    <section className="py-20 bg-[var(--bg-gray-50)]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-[var(--text-primary)] mb-4">
            {sectionTitle || '핵심 기능'}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            {sectionSubtitle || '컨설턴트가 정말 필요한 기능만 담았습니다'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
              ? getIconByName(feature.icon, defaultIcons[index % defaultIcons.length])
              : defaultIcons[index % defaultIcons.length];
            return (
              <FeatureCard
                key={index}
                icon={Icon}
                title={feature.title}
                description={feature.description}
                index={index}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};
