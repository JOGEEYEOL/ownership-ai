'use client';

import React from 'react';

interface ContactPerson {
  name?: string;
  position?: string;
  email: string;
}

interface FooterProps {
  companyName?: string;
  description?: string;
  phone?: string;
  contacts?: ContactPerson[];
}

export const Footer: React.FC<FooterProps> = ({
  companyName = 'Ownership AI',
  description = '컨설턴트를 위한 스마트한 고객 관리 플랫폼',
  phone = '',
  contacts = [],
}) => {
  return (
    <footer className="bg-[var(--primary-dark)] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-[var(--text-highlight)]">{companyName}</h3>
            <p className="text-gray-300">{description}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">문의하기</h4>
            <div className="space-y-2 text-gray-300">
              {phone && <p>전화: {phone}</p>}
              {contacts.map((contact, index) => (
                <p key={index}>
                  {contact.name && (
                    <span>
                      {contact.name}
                      {contact.position && ` (${contact.position})`}
                      {' · '}
                    </span>
                  )}
                  <a
                    href={`mailto:${contact.email}`}
                    className="hover:text-white transition-colors"
                  >
                    {contact.email}
                  </a>
                </p>
              ))}
              {!phone && contacts.length === 0 && <p>이메일: contact@ownership-ai.com</p>}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">시작하기</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <a href="/auth/login" className="hover:text-white transition-colors">
                  로그인
                </a>
              </li>
              <li>
                <a href="/auth/signup" className="hover:text-white transition-colors">
                  회원가입
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-white transition-colors">
                  개인정보 처리방침
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white transition-colors">
                  이용약관
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
