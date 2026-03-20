'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Sparkles,
  MessageSquareText,
  Users,
  BarChart3,
  FileText,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SimpleRichTextEditor } from '@/components/editor/SimpleRichTextEditor';

// ─── Types ───────────────────────────────────────
interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  order: number;
  isActive: boolean;
}

interface TrustMetric {
  value: string;
  label: string;
}

interface SiteSetting {
  key: string;
  value: string;
}

// ─── Settings Form Schema ────────────────────────
const settingsSchema = z.object({
  heroBadge: z.string(),
  footerCompanyName: z.string(),
  footerDescription: z.string(),
  privacyPolicy: z.string(),
  termsOfService: z.string(),
  trustMetrics: z.array(
    z.object({
      value: z.string().min(1, '값을 입력해주세요'),
      label: z.string().min(1, '라벨을 입력해주세요'),
    })
  ),
});

type SettingsForm = z.infer<typeof settingsSchema>;

// ─── Component ───────────────────────────────────
export default function LandingSettingsPage() {
  const queryClient = useQueryClient();

  // ─── Settings Form ─────────────────────────────
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isDirty },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      heroBadge: '',
      footerCompanyName: '',
      footerDescription: '',
      privacyPolicy: '',
      termsOfService: '',
      trustMetrics: [{ value: '', label: '' }],
    },
  });

  // 설정 불러오기
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (data.success) {
          const map = new Map<string, string>(data.data.map((s: SiteSetting) => [s.key, s.value]));

          let trustMetrics: TrustMetric[] = [{ value: '', label: '' }];
          try {
            const parsed = JSON.parse(map.get('landing_trust_metrics') || '[]');
            if (Array.isArray(parsed) && parsed.length > 0) trustMetrics = parsed;
          } catch {
            /* keep default */
          }

          reset({
            heroBadge: map.get('landing_hero_badge') || '',
            footerCompanyName: map.get('landing_footer_company_name') || '',
            footerDescription: map.get('landing_footer_description') || '',
            privacyPolicy: map.get('legal_privacy_policy') || '',
            termsOfService: map.get('legal_terms_of_service') || '',
            trustMetrics,
          });
        }
      } catch {
        toast.error('설정을 불러오는데 실패했습니다.');
      } finally {
        setIsSettingsLoading(false);
      }
    };
    fetchSettings();
  }, [reset]);

  // 설정 저장
  const onSubmitSettings = async (formData: SettingsForm) => {
    setIsSaving(true);
    try {
      const validMetrics = formData.trustMetrics.filter(m => m.value && m.label);

      const settings = [
        { key: 'landing_hero_badge', value: formData.heroBadge },
        { key: 'landing_footer_company_name', value: formData.footerCompanyName },
        { key: 'landing_footer_description', value: formData.footerDescription },
        { key: 'legal_privacy_policy', value: formData.privacyPolicy },
        { key: 'legal_terms_of_service', value: formData.termsOfService },
        { key: 'landing_trust_metrics', value: JSON.stringify(validMetrics) },
      ];

      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('설정이 저장되었습니다.');
        // dirty 상태 초기화
        const map = new Map<string, string>(data.data.map((s: SiteSetting) => [s.key, s.value]));
        let trustMetrics: TrustMetric[] = [{ value: '', label: '' }];
        try {
          const parsed = JSON.parse(map.get('landing_trust_metrics') || '[]');
          if (Array.isArray(parsed) && parsed.length > 0) trustMetrics = parsed;
        } catch {
          /* keep default */
        }

        reset({
          heroBadge: map.get('landing_hero_badge') || '',
          footerCompanyName: map.get('landing_footer_company_name') || '',
          footerDescription: map.get('landing_footer_description') || '',
          privacyPolicy: map.get('legal_privacy_policy') || '',
          termsOfService: map.get('legal_terms_of_service') || '',
          trustMetrics,
        });
      } else {
        throw new Error(data.error?.message || '저장 실패');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── FAQ CRUD ──────────────────────────────────
  const [isFaqDialogOpen, setIsFaqDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', isActive: true });

  const { data: faqsData, isLoading: faqsLoading } = useQuery<{ success: boolean; data: FAQ[] }>({
    queryKey: ['admin-landing-faqs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings/landing-faqs');
      if (!res.ok) throw new Error('FAQ 조회 실패');
      return res.json();
    },
  });

  const createFaqMutation = useMutation({
    mutationFn: async (body: { question: string; answer: string; isActive: boolean }) => {
      const res = await fetch('/api/admin/settings/landing-faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message || 'FAQ 생성 실패');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-faqs'] });
      toast.success('FAQ가 생성되었습니다.');
      closeFaqDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateFaqMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FAQ> }) => {
      const res = await fetch(`/api/admin/settings/landing-faqs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message || 'FAQ 수정 실패');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-faqs'] });
      toast.success('FAQ가 수정되었습니다.');
      closeFaqDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteFaqMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/settings/landing-faqs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error?.message || 'FAQ 삭제 실패');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-faqs'] });
      toast.success('FAQ가 삭제되었습니다.');
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openAddFaqDialog = () => {
    setEditingFaq(null);
    setFaqForm({ question: '', answer: '', isActive: true });
    setIsFaqDialogOpen(true);
  };

  const openEditFaqDialog = (faq: FAQ) => {
    setEditingFaq(faq);
    setFaqForm({ question: faq.question, answer: faq.answer, isActive: faq.isActive });
    setIsFaqDialogOpen(true);
  };

  const closeFaqDialog = () => {
    setIsFaqDialogOpen(false);
    setEditingFaq(null);
    setFaqForm({ question: '', answer: '', isActive: true });
  };

  const handleSaveFaq = () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      toast.error('질문과 답변을 모두 입력해주세요.');
      return;
    }
    if (editingFaq) {
      updateFaqMutation.mutate({ id: editingFaq.id, data: faqForm });
    } else {
      createFaqMutation.mutate(faqForm);
    }
  };

  // ─── Testimonial CRUD ─────────────────────────
  const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({
    name: '',
    role: '',
    company: '',
    content: '',
    isActive: true,
  });

  const { data: testimonialsData, isLoading: testimonialsLoading } = useQuery<{
    success: boolean;
    data: Testimonial[];
  }>({
    queryKey: ['admin-landing-testimonials'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings/landing-testimonials');
      if (!res.ok) throw new Error('후기 조회 실패');
      return res.json();
    },
  });

  const createTestimonialMutation = useMutation({
    mutationFn: async (body: Omit<typeof testimonialForm, 'isActive'> & { isActive: boolean }) => {
      const res = await fetch('/api/admin/settings/landing-testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message || '후기 생성 실패');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-testimonials'] });
      toast.success('후기가 생성되었습니다.');
      closeTestimonialDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateTestimonialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Testimonial> }) => {
      const res = await fetch(`/api/admin/settings/landing-testimonials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message || '후기 수정 실패');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-testimonials'] });
      toast.success('후기가 수정되었습니다.');
      closeTestimonialDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTestimonialMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/settings/landing-testimonials/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error((await res.json()).error?.message || '후기 삭제 실패');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-testimonials'] });
      toast.success('후기가 삭제되었습니다.');
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openAddTestimonialDialog = () => {
    setEditingTestimonial(null);
    setTestimonialForm({ name: '', role: '', company: '', content: '', isActive: true });
    setIsTestimonialDialogOpen(true);
  };

  const openEditTestimonialDialog = (t: Testimonial) => {
    setEditingTestimonial(t);
    setTestimonialForm({
      name: t.name,
      role: t.role,
      company: t.company,
      content: t.content,
      isActive: t.isActive,
    });
    setIsTestimonialDialogOpen(true);
  };

  const closeTestimonialDialog = () => {
    setIsTestimonialDialogOpen(false);
    setEditingTestimonial(null);
    setTestimonialForm({ name: '', role: '', company: '', content: '', isActive: true });
  };

  const handleSaveTestimonial = () => {
    if (!testimonialForm.name.trim() || !testimonialForm.content.trim()) {
      toast.error('이름과 후기 내용을 입력해주세요.');
      return;
    }
    if (editingTestimonial) {
      updateTestimonialMutation.mutate({ id: editingTestimonial.id, data: testimonialForm });
    } else {
      createTestimonialMutation.mutate(testimonialForm);
    }
  };

  // ─── Delete Confirm ───────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'faq' | 'testimonial';
    id: string;
    name: string;
  } | null>(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'faq') {
      deleteFaqMutation.mutate(deleteTarget.id);
    } else {
      deleteTestimonialMutation.mutate(deleteTarget.id);
    }
  };

  // ─── Render ───────────────────────────────────
  const faqs = faqsData?.data || [];
  const testimonials = testimonialsData?.data || [];

  if (isSettingsLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">랜딩페이지 관리</h1>
          <p className="text-gray-600 mt-2">
            랜딩페이지의 텍스트, FAQ, 후기, 약관 등을 관리합니다.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">랜딩페이지 관리</h1>
          <p className="text-gray-600 mt-2">
            랜딩페이지의 텍스트, FAQ, 후기, 약관 등을 관리합니다.
          </p>
        </div>
        <Button
          onClick={handleSubmit(onSubmitSettings)}
          disabled={!isDirty || isSaving}
          className="bg-[#0052CC] hover:bg-[#003d99]"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              설정 저장
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmitSettings)}>
        <Accordion type="multiple" defaultValue={['hero']} className="space-y-4">
          {/* ─── Hero 설정 ──────────────────── */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <AccordionItem value="hero" className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Sparkles className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold text-gray-900">Hero 설정</h2>
                    <p className="text-sm text-gray-500 font-normal">
                      메인 히어로 섹션의 배지 텍스트를 관리합니다.
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">배지 텍스트</CardTitle>
                    <CardDescription>히어로 섹션 하단에 표시되는 안내 문구입니다.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input
                      {...register('heroBadge')}
                      placeholder="베타 서비스 운영 중"
                      className="max-w-md"
                    />
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </div>

          {/* ─── 신뢰 지표 ─────────────────── */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <AccordionItem value="trust" className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold text-gray-900">신뢰 지표</h2>
                    <p className="text-sm text-gray-500 font-normal">
                      후기 섹션 하단의 수치 지표를 관리합니다.
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">지표 목록</CardTitle>
                    <CardDescription>
                      수치와 라벨을 입력하세요. (예: 100+ / 베타 테스터)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Controller
                      name="trustMetrics"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-3">
                          {field.value.map((metric, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                value={metric.value}
                                onChange={e => {
                                  const updated = [...field.value];
                                  updated[index] = { ...updated[index], value: e.target.value };
                                  field.onChange(updated);
                                }}
                                placeholder="100+"
                                className="w-32"
                              />
                              <Input
                                value={metric.label}
                                onChange={e => {
                                  const updated = [...field.value];
                                  updated[index] = { ...updated[index], label: e.target.value };
                                  field.onChange(updated);
                                }}
                                placeholder="베타 테스터"
                                className="flex-1"
                              />
                              {field.value.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const updated = field.value.filter((_, i) => i !== index);
                                    field.onChange(updated);
                                  }}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              field.onChange([...field.value, { value: '', label: '' }])
                            }
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            지표 추가
                          </Button>
                        </div>
                      )}
                    />
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </div>

          {/* ─── FAQ 관리 ──────────────────── */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <AccordionItem value="faq" className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <MessageSquareText className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold text-gray-900">FAQ 관리</h2>
                    <p className="text-sm text-gray-500 font-normal">
                      자주 묻는 질문을 추가/수정/삭제합니다. {faqs.length}개 항목
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="flex justify-end mb-4">
                  <Button onClick={openAddFaqDialog} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    FAQ 추가
                  </Button>
                </div>
                {faqsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : faqs.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">등록된 FAQ가 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {faqs.map(faq => (
                      <Card key={faq.id} className={!faq.isActive ? 'opacity-50' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{faq.question}</p>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {faq.answer}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditFaqDialog(faq)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() =>
                                  setDeleteTarget({ type: 'faq', id: faq.id, name: faq.question })
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </div>

          {/* ─── 후기 관리 ─────────────────── */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <AccordionItem value="testimonials" className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Users className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold text-gray-900">후기 관리</h2>
                    <p className="text-sm text-gray-500 font-normal">
                      베타 테스터 후기를 관리합니다. {testimonials.length}개 항목
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="flex justify-end mb-4">
                  <Button onClick={openAddTestimonialDialog} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    후기 추가
                  </Button>
                </div>
                {testimonialsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : testimonials.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">등록된 후기가 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {testimonials.map(t => (
                      <Card key={t.id} className={!t.isActive ? 'opacity-50' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">
                                {t.name}{' '}
                                <span className="text-sm text-gray-500 font-normal">
                                  {t.role} · {t.company}
                                </span>
                              </p>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{t.content}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditTestimonialDialog(t)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'testimonial',
                                    id: t.id,
                                    name: t.name,
                                  })
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </div>

          {/* ─── 약관 관리 ─────────────────── */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <AccordionItem value="legal" className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold text-gray-900">약관 관리</h2>
                    <p className="text-sm text-gray-500 font-normal">
                      개인정보 처리방침 및 이용약관 내용을 관리합니다.
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">개인정보 처리방침</CardTitle>
                    <CardDescription>/privacy 페이지에 표시될 내용입니다.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Controller
                      name="privacyPolicy"
                      control={control}
                      render={({ field }) => (
                        <SimpleRichTextEditor
                          content={field.value || ''}
                          onChange={field.onChange}
                          placeholder="개인정보 처리방침 내용을 입력하세요..."
                          minHeight="200px"
                        />
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">이용약관</CardTitle>
                    <CardDescription>/terms 페이지에 표시될 내용입니다.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Controller
                      name="termsOfService"
                      control={control}
                      render={({ field }) => (
                        <SimpleRichTextEditor
                          content={field.value || ''}
                          onChange={field.onChange}
                          placeholder="이용약관 내용을 입력하세요..."
                          minHeight="200px"
                        />
                      )}
                    />
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </div>

          {/* ─── Footer 설정 ───────────────── */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <AccordionItem value="footer" className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Globe className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold text-gray-900">Footer 설정</h2>
                    <p className="text-sm text-gray-500 font-normal">
                      푸터에 표시되는 회사 정보를 관리합니다.
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">회사명</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      {...register('footerCompanyName')}
                      placeholder="Ownership AI"
                      className="max-w-md"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">설명</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      {...register('footerDescription')}
                      placeholder="컨설턴트를 위한 스마트한 고객 관리 플랫폼"
                      className="max-w-lg"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">문의하기 (전화번호, 담당자)</CardTitle>
                    <CardDescription>
                      Footer의 문의하기 영역은 플로팅 버튼의 연락처 설정과 동일한 데이터를
                      사용합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <a
                      href="/admin/settings/contact"
                      className="inline-flex items-center gap-2 text-[#0052CC] hover:underline text-sm font-medium"
                    >
                      연락처 설정 페이지에서 수정
                      <span aria-hidden>→</span>
                    </a>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </div>
        </Accordion>
      </form>

      {/* ─── FAQ Dialog ────────────────────── */}
      <Dialog open={isFaqDialogOpen} onOpenChange={setIsFaqDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFaq ? 'FAQ 수정' : 'FAQ 추가'}</DialogTitle>
            <DialogDescription>
              {editingFaq ? 'FAQ 내용을 수정합니다.' : '새로운 FAQ를 추가합니다.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>질문</Label>
              <Input
                value={faqForm.question}
                onChange={e => setFaqForm(prev => ({ ...prev, question: e.target.value }))}
                placeholder="질문을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>답변</Label>
              <Textarea
                value={faqForm.answer}
                onChange={e => setFaqForm(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="답변을 입력하세요"
                rows={4}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>활성화</Label>
              <Switch
                checked={faqForm.isActive}
                onCheckedChange={checked => setFaqForm(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeFaqDialog}>
              취소
            </Button>
            <Button
              onClick={handleSaveFaq}
              disabled={createFaqMutation.isPending || updateFaqMutation.isPending}
            >
              {(createFaqMutation.isPending || updateFaqMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Testimonial Dialog ────────────── */}
      <Dialog open={isTestimonialDialogOpen} onOpenChange={setIsTestimonialDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTestimonial ? '후기 수정' : '후기 추가'}</DialogTitle>
            <DialogDescription>
              {editingTestimonial ? '후기 내용을 수정합니다.' : '새로운 후기를 추가합니다.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>이름</Label>
                <Input
                  value={testimonialForm.name}
                  onChange={e => setTestimonialForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="홍길동"
                />
              </div>
              <div className="space-y-2">
                <Label>직함</Label>
                <Input
                  value={testimonialForm.role}
                  onChange={e => setTestimonialForm(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="경영컨설턴트"
                />
              </div>
              <div className="space-y-2">
                <Label>회사</Label>
                <Input
                  value={testimonialForm.company}
                  onChange={e => setTestimonialForm(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="비전컨설팅"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>후기 내용</Label>
              <Textarea
                value={testimonialForm.content}
                onChange={e => setTestimonialForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="후기 내용을 입력하세요"
                rows={4}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>활성화</Label>
              <Switch
                checked={testimonialForm.isActive}
                onCheckedChange={checked =>
                  setTestimonialForm(prev => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeTestimonialDialog}>
              취소
            </Button>
            <Button
              onClick={handleSaveTestimonial}
              disabled={createTestimonialMutation.isPending || updateTestimonialMutation.isPending}
            >
              {(createTestimonialMutation.isPending || updateTestimonialMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirm ────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === 'faq' ? 'FAQ 삭제' : '후기 삭제'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.name}&quot;을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteFaqMutation.isPending || deleteTestimonialMutation.isPending}
            >
              {(deleteFaqMutation.isPending || deleteTestimonialMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
