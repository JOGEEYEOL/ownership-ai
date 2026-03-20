'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Heart } from 'lucide-react';
import { Card } from '../common/Card';

const icons = [TrendingUp, Clock, Heart];

interface ImpactItem {
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
}

interface ImpactSectionProps {
  items?: ImpactItem[];
  sectionTitle?: string;
  sectionSubtitle?: string;
}

export const ImpactSection: React.FC<ImpactSectionProps> = ({
  items,
  sectionTitle,
  sectionSubtitle,
}) => {
  const impacts =
    items && items.length > 0
      ? items
      : [
          {
            title: '매출 증대',
            description:
              '놓쳤던 정부지원사업 기회를 잡아 고객 만족도와 매출을 동시에 향상시키세요.',
            metric: '평균 30%',
            metricLabel: '매출 증가',
          },
          {
            title: '시간 절약',
            description:
              '수동 검색과 매칭에 소요되던 시간을 고객 상담과 비즈니스 개발에 집중하세요.',
            metric: '주당 10시간',
            metricLabel: '시간 절약',
          },
          {
            title: '고객 만족',
            description: '적시에 맞춤형 정보를 제공하여 고객과의 신뢰 관계를 강화하세요.',
            metric: '95%',
            metricLabel: '만족도',
          },
        ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl lg:text-4xl font-bold text-[var(--text-primary)] mb-4"
          >
            {sectionTitle || '실제로 경험하는 변화'}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto"
          >
            {sectionSubtitle || '베타 테스터들이 경험한 구체적인 효과'}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {impacts.map((impact, index) => {
            const Icon = icons[index % icons.length];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <Card hover className="h-full p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[var(--primary-blue)] to-[var(--gradient-end)] rounded-full flex items-center justify-center">
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="mb-4">
                    <div className="text-4xl font-bold text-[var(--primary-blue)] mb-2">
                      {impact.metric}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)] font-medium">
                      {impact.metricLabel}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                    {impact.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {impact.description}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
