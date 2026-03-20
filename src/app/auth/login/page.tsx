import React from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { supabaseAdmin } from '@/lib/supabase/admin';

export default async function LoginPage() {
  const { data } = await supabaseAdmin
    .from('site_settings')
    .select('key, value')
    .in('key', ['auth_app_name', 'auth_app_tagline']);

  const map = new Map((data || []).map((s: { key: string; value: string }) => [s.key, s.value]));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--primary-blue)] to-[var(--primary-dark)] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[var(--text-highlight)] mb-2">
            {map.get('auth_app_name') || 'Ownership AI'}
          </h1>
          <p className="text-white/90">
            {map.get('auth_app_tagline') || '컨설턴트를 위한 스마트한 고객 관리'}
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
