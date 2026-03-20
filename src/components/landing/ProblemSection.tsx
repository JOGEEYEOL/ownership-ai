'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, FileX } from 'lucide-react';
import { Card } from '../common/Card';

const icons = [FileX, Clock, AlertCircle];

interface ProblemItem {
  title: string;
  description: string;
}

interface ProblemSectionProps {
  items?: ProblemItem[];
  sectionTitle?: string;
  sectionSubtitle?: string;
}

export const ProblemSection: React.FC<ProblemSectionProps> = ({
  items,
  sectionTitle,
  sectionSubtitle,
}) => {
  const problems =
    items && items.length > 0
      ? items
      : [
          {
            title: '흩어진 고객 정보',
            description:
              '엑셀, 메모장, 이메일에 흩어진 고객 정보로 인해 중요한 기회를 놓치고 계신가요?',
          },
          {
            title: '수동 검색의 비효율',
            description:
              '매번 정부지원사업 공고를 일일이 찾아보고, 고객에게 맞는지 판단하는 데 시간을 낭비하고 있나요?',
          },
          {
            title: '놓치는 매칭 기회',
            description:
              '고객에게 딱 맞는 지원사업이 있었는데, 뒤늦게 발견해서 아쉬워한 경험이 있으신가요?',
          },
        ];

  return (
    <section className="py-20 bg-[var(--bg-gray-50)]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl lg:text-4xl font-bold text-[var(--text-primary)] mb-4"
          >
            {sectionTitle || '이런 어려움을 겪고 계신가요?'}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto"
          >
            {sectionSubtitle || '1인 컨설턴트가 겪는 가장 큰 문제들'}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {problems.map((problem, index) => {
            const Icon = icons[index % icons.length];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card hover className="h-full p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                    <Icon className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                    {problem.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {problem.description}
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
