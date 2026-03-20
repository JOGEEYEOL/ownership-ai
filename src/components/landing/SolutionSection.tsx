'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Zap, Send } from 'lucide-react';

const icons = [Upload, Zap, Send];

interface SolutionItem {
  title: string;
  description: string;
}

interface SolutionSectionProps {
  items?: SolutionItem[];
  sectionTitle?: string;
  sectionSubtitle?: string;
}

export const SolutionSection: React.FC<SolutionSectionProps> = ({
  items,
  sectionTitle,
  sectionSubtitle,
}) => {
  const steps =
    items && items.length > 0
      ? items
      : [
          {
            title: '고객 정보 등록',
            description: '간단한 폼으로 고객의 업종, 지역, 관심사를 입력하세요.',
          },
          {
            title: '자동 매칭',
            description: 'AI가 고객에게 딱 맞는 정부지원사업을 찾아 추천해드립니다.',
          },
          { title: '빠른 알림', description: '클릭 한 번으로 고객에게 이메일과 SMS를 발송하세요.' },
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
            {sectionTitle || '이렇게 간단하게 해결됩니다'}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto"
          >
            {sectionSubtitle || '3단계로 완성되는 스마트한 고객 관리'}
          </motion.p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
            <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--primary-blue)] via-[var(--primary-blue)] to-[var(--gradient-end)] opacity-20" />

            {steps.map((step, index) => {
              const Icon = icons[index % icons.length];
              const number = String(index + 1).padStart(2, '0');
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="relative"
                >
                  <div className="bg-white rounded-xl p-8 text-center relative z-10">
                    <div className="text-6xl font-bold text-[var(--primary-blue)] opacity-20 mb-4">
                      {number}
                    </div>
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[var(--primary-blue)] to-[var(--gradient-end)] rounded-full flex items-center justify-center">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                      {step.title}
                    </h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
