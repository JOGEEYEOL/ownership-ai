'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';

interface HeroSectionProps {
  badgeText?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ badgeText = '베타 서비스 운영 중' }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--primary-blue)] to-[var(--gradient-end)]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-6">
            <span className="text-[var(--text-highlight)]">컨설턴트를 위한</span>
            <br />
            <span className="text-white">스마트한 고객 관리</span>
          </h1>

          <p className="text-xl lg:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            정부지원사업을 자동으로 매칭하고, 고객에게 딱 맞는 기회를 추천하세요
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              variant="secondary"
              onClick={() => (window.location.href = '/auth/signup')}
              className="group"
            >
              무료로 시작하기
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => (window.location.href = '/auth/login')}
              className="bg-white/20 backdrop-blur-sm border-white/50 text-white hover:bg-white/30 hover:border-white transition-all"
            >
              로그인
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-12 text-blue-100 text-sm"
          >
            {badgeText}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-white rounded-full flex items-start justify-center p-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-2 bg-white rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
};
