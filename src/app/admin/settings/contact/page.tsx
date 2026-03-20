'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Phone,
  Globe,
  MessageSquare,
  Mail,
  Plus,
  Trash2,
  Save,
  Loader2,
  Building2,
  Link,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SimpleRichTextEditor } from '@/components/editor/SimpleRichTextEditor';

// 폼 스키마
const contactSettingsSchema = z.object({
  phone: z.string().optional(),
  contactSlogan: z.string().optional(), // 문의하기용 슬로건
  contacts: z.array(
    z.object({
      name: z.string().optional(),
      position: z.string().optional(),
      email: z.string().email('올바른 이메일 형식이 아닙니다').or(z.literal('')),
    })
  ),
  homepageUrl: z.string().url('올바른 URL 형식이 아닙니다').or(z.literal('')).optional(),
  kakaoOpenChatUrl: z.string().url('올바른 URL 형식이 아닙니다').or(z.literal('')).optional(),
  companyName: z.string().optional(),
  companySlogan: z.string().optional(), // 회사소개용 슬로건
  companyDescription: z.string().optional(),
  companyServices: z.array(
    z.object({
      value: z.string(),
    })
  ),
});

type ContactSettingsForm = z.infer<typeof contactSettingsSchema>;

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  description: string;
}

interface ContactPerson {
  name?: string;
  position?: string;
  email: string;
}

export default function ContactSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<ContactSettingsForm>({
    resolver: zodResolver(contactSettingsSchema),
    defaultValues: {
      phone: '',
      contactSlogan: '',
      contacts: [{ name: '', position: '', email: '' }],
      homepageUrl: '',
      kakaoOpenChatUrl: '',
      companyName: '',
      companySlogan: '',
      companyDescription: '',
      companyServices: [{ value: '' }],
    },
  });

  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({
    control,
    name: 'contacts',
  });

  const {
    fields: serviceFields,
    append: appendService,
    remove: removeService,
  } = useFieldArray({
    control,
    name: 'companyServices',
  });

  // 설정 데이터 불러오기
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        const data = await response.json();

        if (data.success) {
          const settings: SiteSetting[] = data.data;
          const settingsMap = new Map<string, string>(settings.map(s => [s.key, s.value]));

          // 담당자 파싱
          const contactsJson = settingsMap.get('contact_emails');
          let parsedContacts: ContactPerson[] = [];

          if (contactsJson) {
            try {
              const parsed = JSON.parse(contactsJson);
              if (Array.isArray(parsed)) {
                parsedContacts = parsed.map((item: string | ContactPerson) => {
                  if (typeof item === 'string') {
                    return { name: '', position: '', email: item };
                  }
                  return item;
                });
              }
            } catch {
              parsedContacts = [];
            }
          }

          // 서비스 목록 파싱
          const servicesJson = settingsMap.get('company_services');
          let parsedServices: { value: string }[] = [];

          if (servicesJson) {
            try {
              const parsed = JSON.parse(servicesJson);
              if (Array.isArray(parsed)) {
                parsedServices = parsed.map((item: string) => ({ value: item }));
              }
            } catch {
              parsedServices = [];
            }
          }

          reset({
            phone: settingsMap.get('contact_phone') || '',
            contactSlogan: settingsMap.get('contact_slogan') || '',
            contacts:
              parsedContacts.length > 0 ? parsedContacts : [{ name: '', position: '', email: '' }],
            homepageUrl: settingsMap.get('homepage_url') || '',
            kakaoOpenChatUrl: settingsMap.get('kakao_openchat_url') || '',
            companyName: settingsMap.get('company_name') || '',
            companySlogan: settingsMap.get('company_slogan') || '',
            companyDescription: settingsMap.get('company_description') || '',
            companyServices: parsedServices.length > 0 ? parsedServices : [{ value: '' }],
          });
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast.error('설정을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [reset]);

  // 설정 저장
  const onSubmit = async (formData: ContactSettingsForm) => {
    setIsSaving(true);

    try {
      // 이메일이 있는 담당자만 필터링
      const validContacts = formData.contacts.filter(c => c.email && c.email.trim() !== '');
      // 값이 있는 서비스만 필터링
      const validServices = formData.companyServices
        .filter(s => s.value && s.value.trim() !== '')
        .map(s => s.value);

      const settings = [
        { key: 'contact_phone', value: formData.phone || '' },
        { key: 'contact_slogan', value: formData.contactSlogan || '' },
        { key: 'contact_emails', value: JSON.stringify(validContacts) },
        { key: 'homepage_url', value: formData.homepageUrl || '' },
        { key: 'kakao_openchat_url', value: formData.kakaoOpenChatUrl || '' },
        { key: 'company_name', value: formData.companyName || '' },
        { key: 'company_slogan', value: formData.companySlogan || '' },
        { key: 'company_description', value: formData.companyDescription || '' },
        { key: 'company_services', value: JSON.stringify(validServices) },
      ];

      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('설정이 저장되었습니다.');
        // 폼 dirty 상태 초기화
        const settingsMap = new Map<string, string>(
          data.data.map((s: SiteSetting) => [s.key, s.value])
        );
        const contactsJson = settingsMap.get('contact_emails');
        let parsedContacts: ContactPerson[] = [];

        if (contactsJson) {
          try {
            parsedContacts = JSON.parse(contactsJson);
          } catch {
            parsedContacts = [];
          }
        }

        const servicesJson = settingsMap.get('company_services');
        let parsedServices: { value: string }[] = [];

        if (servicesJson) {
          try {
            const parsed = JSON.parse(servicesJson);
            if (Array.isArray(parsed)) {
              parsedServices = parsed.map((item: string) => ({ value: item }));
            }
          } catch {
            parsedServices = [];
          }
        }

        reset({
          phone: settingsMap.get('contact_phone') ?? '',
          contactSlogan: settingsMap.get('contact_slogan') ?? '',
          contacts:
            parsedContacts.length > 0 ? parsedContacts : [{ name: '', position: '', email: '' }],
          homepageUrl: settingsMap.get('homepage_url') ?? '',
          kakaoOpenChatUrl: settingsMap.get('kakao_openchat_url') ?? '',
          companyName: settingsMap.get('company_name') ?? '',
          companySlogan: settingsMap.get('company_slogan') ?? '',
          companyDescription: settingsMap.get('company_description') ?? '',
          companyServices: parsedServices.length > 0 ? parsedServices : [{ value: '' }],
        });
      } else {
        throw new Error(data.error?.message || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error(error instanceof Error ? error.message : '설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">연락처 및 회사 소개 설정</h1>
          <p className="text-gray-600 mt-2">
            플로팅 버튼에 표시될 연락처 및 회사 정보를 관리합니다.
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
          <h1 className="text-3xl font-bold text-gray-900">연락처 및 회사 소개 설정</h1>
          <p className="text-gray-600 mt-2">
            플로팅 버튼에 표시될 연락처 및 회사 정보를 관리합니다.
          </p>
        </div>
        <Button
          onClick={handleSubmit(onSubmit)}
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
              저장
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Accordion type="multiple" defaultValue={[]} className="space-y-4">
          {/* 회사 소개 섹션 */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <AccordionItem value="company" className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Building2 className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold text-gray-900">회사 소개</h2>
                    <p className="text-sm text-gray-500 font-normal">
                      플로팅 버튼의 &quot;회사 소개&quot; 메뉴에서 표시됩니다.
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                {/* 회사명 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">회사명</CardTitle>
                    <CardDescription>회사 소개 팝업에 표시될 회사명입니다.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input
                      {...register('companyName')}
                      placeholder="주식회사 오너십"
                      className="max-w-md"
                    />
                  </CardContent>
                </Card>

                {/* 슬로건 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">슬로건</CardTitle>
                    <CardDescription>
                      회사의 한 줄 소개입니다. 문의하기 팝업과 회사 소개 팝업에 모두 표시됩니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input
                      {...register('companySlogan')}
                      placeholder="정부지원사업 전문 컨설팅 파트너"
                      className="max-w-lg"
                    />
                  </CardContent>
                </Card>

                {/* 회사 소개 문구 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">회사 소개 문구</CardTitle>
                    <CardDescription>
                      회사에 대한 상세 소개 문구입니다. 굵게, 기울임, 정렬 등을 지정할 수 있습니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Controller
                      name="companyDescription"
                      control={control}
                      render={({ field }) => (
                        <SimpleRichTextEditor
                          content={field.value || ''}
                          onChange={field.onChange}
                          placeholder="안녕하세요, 저희 회사는..."
                          minHeight="120px"
                        />
                      )}
                    />
                  </CardContent>
                </Card>

                {/* 주요 서비스 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">주요 서비스</CardTitle>
                    <CardDescription>
                      회사의 주요 서비스 목록입니다. 여러 개 등록 가능합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {serviceFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <Input
                          {...register(`companyServices.${index}.value`)}
                          placeholder="예: 정부지원사업 컨설팅"
                          className="flex-1"
                        />
                        {serviceFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeService(index)}
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
                      onClick={() => appendService({ value: '' })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      서비스 추가
                    </Button>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </div>

          {/* 연락처 정보 섹션 */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <AccordionItem value="contact" className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold text-gray-900">연락처 정보</h2>
                    <p className="text-sm text-gray-500 font-normal">
                      플로팅 버튼의 &quot;문의하기&quot; 메뉴에서 표시됩니다.
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                {/* 문의하기 슬로건 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">문의하기 슬로건</CardTitle>
                    <CardDescription>
                      문의하기 팝업 상단에 표시될 슬로건입니다. (회사 소개 슬로건과 별도 관리)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input
                      {...register('contactSlogan')}
                      placeholder="고객님의 성공을 함께 만들어갑니다"
                      className="max-w-lg"
                    />
                  </CardContent>
                </Card>

                {/* 전화번호 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      대표 전화번호
                    </CardTitle>
                    <CardDescription>문의하기 팝업에 표시될 대표 전화번호입니다.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input {...register('phone')} placeholder="02-1234-5678" className="max-w-md" />
                  </CardContent>
                </Card>

                {/* 담당자 목록 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      담당자 연락처
                    </CardTitle>
                    <CardDescription>
                      문의하기 팝업에 표시될 담당자 정보입니다. 여러 명 등록 가능합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {contactFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="p-4 border border-gray-200 rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            담당자 {index + 1}
                          </span>
                          {contactFields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeContact(index)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              삭제
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">이름</label>
                            <Input {...register(`contacts.${index}.name`)} placeholder="홍길동" />
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">직급</label>
                            <Input {...register(`contacts.${index}.position`)} placeholder="팀장" />
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">이메일 *</label>
                            <Input
                              {...register(`contacts.${index}.email`)}
                              placeholder="example@company.com"
                              type="email"
                            />
                            {errors.contacts?.[index]?.email && (
                              <p className="text-sm text-red-500 mt-1">
                                {errors.contacts[index]?.email?.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendContact({ name: '', position: '', email: '' })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      담당자 추가
                    </Button>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </div>

          {/* 외부 링크 섹션 */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <AccordionItem value="links" className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Link className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold text-gray-900">외부 링크</h2>
                    <p className="text-sm text-gray-500 font-normal">
                      플로팅 버튼에서 바로 이동할 수 있는 링크입니다.
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                {/* 홈페이지 URL */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-500" />
                      홈페이지 URL
                    </CardTitle>
                    <CardDescription>
                      플로팅 버튼에서 &quot;홈페이지&quot; 클릭 시 이동할 URL입니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input
                      {...register('homepageUrl')}
                      placeholder="https://example.com"
                      className="max-w-lg"
                    />
                    {errors.homepageUrl && (
                      <p className="text-sm text-red-500 mt-1">{errors.homepageUrl.message}</p>
                    )}
                  </CardContent>
                </Card>

                {/* 카카오톡 오픈채팅 URL */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-yellow-500" />
                      카카오톡 오픈채팅방 URL
                    </CardTitle>
                    <CardDescription>
                      플로팅 버튼에서 &quot;카카오톡 오픈채팅&quot; 클릭 시 이동할 URL입니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input
                      {...register('kakaoOpenChatUrl')}
                      placeholder="https://open.kakao.com/o/..."
                      className="max-w-lg"
                    />
                    {errors.kakaoOpenChatUrl && (
                      <p className="text-sm text-red-500 mt-1">{errors.kakaoOpenChatUrl.message}</p>
                    )}
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </div>
        </Accordion>
      </form>
    </div>
  );
}
