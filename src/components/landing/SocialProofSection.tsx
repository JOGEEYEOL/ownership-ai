'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { Card } from '../common/Card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
}

interface TrustMetric {
  value: string;
  label: string;
}

interface SocialProofSectionProps {
  testimonials: Testimonial[];
  trustMetrics: TrustMetric[];
  layout?: 'grid' | 'slide';
  columns?: number;
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card hover className="h-full p-8">
      <Quote className="w-10 h-10 text-[var(--primary-blue)] opacity-20 mb-4" />
      <p className="text-[var(--text-secondary)] leading-relaxed mb-6">{testimonial.content}</p>
      <div className="flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=0052cc&color=fff`}
          alt={testimonial.name}
          className="w-12 h-12 rounded-full mr-4"
          loading="lazy"
        />
        <div>
          <div className="font-semibold text-[var(--text-primary)]">{testimonial.name}</div>
          <div className="text-sm text-[var(--text-secondary)]">
            {testimonial.role} · {testimonial.company}
          </div>
        </div>
      </div>
    </Card>
  );
}

const columnClassMap: Record<number, string> = {
  2: 'grid-cols-1 lg:grid-cols-2',
  3: 'grid-cols-1 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

const slideBasisMap: Record<number, string> = {
  2: 'md:basis-1/2',
  3: 'md:basis-1/2 lg:basis-1/3',
  4: 'md:basis-1/2 lg:basis-1/4',
};

export const SocialProofSection: React.FC<SocialProofSectionProps> = ({
  testimonials,
  trustMetrics,
  layout = 'grid',
  columns = 3,
}) => {
  if (testimonials.length === 0) return null;

  const cols = [2, 3, 4].includes(columns) ? columns : 3;

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
            베타 테스터들의 이야기
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto"
          >
            먼저 경험한 컨설턴트들의 생생한 후기
          </motion.p>
        </div>

        {layout === 'slide' ? (
          <div className="max-w-6xl mx-auto">
            <Carousel opts={{ align: 'start', loop: true }} className="w-full">
              <CarouselContent className="-ml-6">
                {testimonials.map(testimonial => (
                  <CarouselItem key={testimonial.name} className={`pl-6 ${slideBasisMap[cols]}`}>
                    <div className="h-full">
                      <TestimonialCard testimonial={testimonial} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-4 mt-8">
                <CarouselPrevious className="static translate-x-0 translate-y-0" />
                <CarouselNext className="static translate-x-0 translate-y-0" />
              </div>
            </Carousel>
          </div>
        ) : (
          <div className={`grid ${columnClassMap[cols]} gap-8 max-w-6xl mx-auto`}>
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <TestimonialCard testimonial={testimonial} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Trust Indicators */}
        {trustMetrics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-16 text-center"
          >
            <div className="inline-flex flex-wrap justify-center items-center gap-8 text-[var(--text-muted)]">
              {trustMetrics.map((metric, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <div className="hidden lg:block w-px h-8 bg-[var(--border-gray)]" />
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[var(--primary-blue)]">
                      {metric.value}
                    </span>
                    <span className="text-sm">{metric.label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};
