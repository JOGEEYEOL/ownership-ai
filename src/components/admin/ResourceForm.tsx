'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Upload, X, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  tags: string[];
  videoId: string | null;
  categoryId: string | null;
}

interface Video {
  id: string;
  title: string;
}

interface ResourceCategory {
  id: string;
  name: string;
}

/**
 * Form Schema
 */
const resourceFormSchema = z.object({
  title: z.string().min(1, { message: '제목을 입력해주세요' }),
  description: z.string().optional(),
  type: z.enum(['template', 'checklist', 'document'], {
    message: '자료 유형을 선택해주세요',
  }),
  categoryId: z.string().min(1, { message: '카테고리를 선택해주세요' }),
  fileUrl: z.string().min(1, { message: '파일을 업로드하거나 URL을 입력해주세요' }),
  fileName: z.string().min(1, { message: '파일명을 입력해주세요' }),
  fileSize: z.string().optional().or(z.literal('')),
  tags: z.string().optional(),
  videoId: z.string().optional().or(z.literal('')),
});

type ResourceFormData = z.infer<typeof resourceFormSchema>;

interface ResourceFormProps {
  mode: 'create' | 'edit';
  resource?: Resource;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResourceForm({ mode, resource }: ResourceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // File upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    url: string;
  } | null>(
    mode === 'edit' && resource
      ? { name: resource.fileName, size: resource.fileSize || 0, url: resource.fileUrl }
      : null
  );
  const [isDragging, setIsDragging] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/admin/education/resource-categories');
        const json = await res.json();
        if (json.success) {
          setCategories(json.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        toast.error('카테고리 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  // Fetch videos for linking
  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch('/api/education/videos?limit=100');
        const json = await res.json();
        if (json.success) {
          setVideos(json.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch videos:', error);
      } finally {
        setIsLoadingVideos(false);
      }
    }
    fetchVideos();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ResourceFormData>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues:
      mode === 'edit' && resource
        ? {
            title: resource.title,
            description: resource.description || '',
            type: resource.type as 'template' | 'checklist' | 'document',
            categoryId: resource.categoryId || '',
            fileUrl: resource.fileUrl,
            fileName: resource.fileName,
            fileSize: resource.fileSize ? String(resource.fileSize) : '',
            tags: resource.tags.join(', '),
            videoId: resource.videoId || '',
          }
        : {
            categoryId: '',
            tags: '',
            videoId: '',
          },
  });

  const categoryId = watch('categoryId');
  const videoId = watch('videoId');

  // File upload handler
  const handleFileUpload = useCallback(
    async (file: File) => {
      // 파일 크기 체크 (50MB 제한)
      const MAX_SIZE = 50 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        toast.error('파일 크기 초과', {
          description: '파일 크기는 50MB를 초과할 수 없습니다.',
        });
        return;
      }

      setIsUploading(true);

      try {
        const supabase = createClient();

        // 고유한 파일명 생성
        const timestamp = Date.now();
        const safeFileName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
        const storagePath = `resources/${timestamp}_${safeFileName}`;

        // Supabase Storage에 업로드
        const { error: uploadError } = await supabase.storage
          .from('resources')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Public URL 가져오기
        const {
          data: { publicUrl },
        } = supabase.storage.from('resources').getPublicUrl(storagePath);

        // 폼 값 업데이트
        setValue('fileUrl', publicUrl);
        setValue('fileName', file.name);
        setValue('fileSize', String(file.size));

        // 제목이 비어있으면 파일명으로 자동 설정
        const currentTitle = watch('title');
        if (!currentTitle) {
          const titleFromFile = file.name.replace(/\.[^/.]+$/, ''); // 확장자 제거
          setValue('title', titleFromFile);
        }

        setUploadedFile({
          name: file.name,
          size: file.size,
          url: publicUrl,
        });

        toast.success('파일 업로드 완료', {
          description: `${file.name} (${formatFileSize(file.size)})`,
        });
      } catch (error) {
        console.error('File upload error:', error);
        toast.error('파일 업로드 실패', {
          description: error instanceof Error ? error.message : '다시 시도해주세요.',
        });
      } finally {
        setIsUploading(false);
      }
    },
    [setValue, watch]
  );

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  // File input handler
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  // Remove uploaded file
  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null);
    setValue('fileUrl', '');
    setValue('fileName', '');
    setValue('fileSize', '');
  }, [setValue]);

  const onSubmit = async (data: ResourceFormData) => {
    setIsSubmitting(true);

    try {
      // Process tags
      const tagsArray = data.tags
        ? data.tags
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean)
        : [];

      // Prepare payload - fileSize를 안전하게 숫자로 변환
      const fileSizeNum = data.fileSize ? parseInt(data.fileSize, 10) : null;
      const payload: Record<string, unknown> = {
        title: data.title,
        type: data.type,
        categoryId: data.categoryId,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        tags: tagsArray,
      };

      // Optional 필드는 값이 있을 때만 추가 (null 대신 undefined로 처리)
      if (data.description) payload.description = data.description;
      if (fileSizeNum && !isNaN(fileSizeNum) && fileSizeNum > 0) payload.fileSize = fileSizeNum;
      if (data.videoId) payload.videoId = data.videoId;

      const url =
        mode === 'create' ? '/api/education/resources' : `/api/education/resources/${resource!.id}`;

      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        // Zod validation 에러일 경우 상세 메시지 표시
        const errorMsg = Array.isArray(result.error?.details)
          ? result.error.details
              .map((d: { path: string[]; message: string }) => `${d.path.join('.')}: ${d.message}`)
              .join(', ')
          : result.error?.message || 'Failed to save resource';
        throw new Error(errorMsg);
      }

      toast.success(mode === 'create' ? '자료가 추가되었습니다.' : '자료가 수정되었습니다.');

      router.push('/admin/education/resources');
      router.refresh();
    } catch (error) {
      console.error('Resource form submit error:', error);
      toast.error(mode === 'create' ? '자료 추가 실패' : '자료 수정 실패', {
        description: error instanceof Error ? error.message : '다시 시도해주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Step 1: File Upload */}
        <div className="space-y-4 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0052CC] text-white text-sm font-semibold">
              1
            </div>
            <h3 className="text-lg font-semibold text-gray-900">파일 업로드</h3>
          </div>

          {/* Drag & Drop Zone */}
          {!uploadedFile ? (
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${isDragging ? 'border-[#0052CC] bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                ${isUploading ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <input
                type="file"
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.hwp,.hwpx,.txt,.zip,.csv"
                disabled={isUploading}
              />

              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-[#0052CC] animate-spin" />
                  <p className="text-gray-600">파일 업로드 중...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-10 h-10 text-gray-400" />
                  <div>
                    <p className="text-gray-700 font-medium">파일을 드래그하여 업로드</p>
                    <p className="text-gray-500 text-sm mt-1">또는 클릭하여 파일 선택</p>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    PDF, Word, Excel, PowerPoint, 한글 등 (최대 50MB)
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                  <p className="text-sm text-gray-600">{formatFileSize(uploadedFile.size)}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="text-gray-500 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Manual URL input (alternative) */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">또는 URL 직접 입력</span>
            </div>
          </div>

          <div>
            <Input
              {...register('fileUrl')}
              placeholder="https://example.com/file.pdf"
              className="mt-1"
            />
            {errors.fileUrl && (
              <p className="text-sm text-red-600 mt-1">{errors.fileUrl.message}</p>
            )}
          </div>

          {/* Hidden inputs for file info */}
          <input type="hidden" {...register('fileName')} />
          <input type="hidden" {...register('fileSize')} />
        </div>

        {/* Step 2: Basic Info */}
        <div className="space-y-4 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0052CC] text-white text-sm font-semibold">
              2
            </div>
            <h3 className="text-lg font-semibold text-gray-900">기본 정보</h3>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="자료 제목을 입력하세요"
              className="mt-1"
            />
            {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="자료에 대한 설명을 입력하세요"
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Type */}
          <div>
            <Label htmlFor="type">자료 유형 *</Label>
            <Select
              value={watch('type') || undefined}
              onValueChange={value =>
                setValue('type', value as 'template' | 'checklist' | 'document', {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="자료 유형을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="template">템플릿</SelectItem>
                <SelectItem value="checklist">체크리스트</SelectItem>
                <SelectItem value="document">문서</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>}
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="categoryId">카테고리 *</Label>
            <Select
              value={categoryId || undefined}
              onValueChange={value => setValue('categoryId', value)}
              disabled={isLoadingCategories}
            >
              <SelectTrigger className="mt-1">
                <SelectValue
                  placeholder={isLoadingCategories ? '로딩 중...' : '카테고리를 선택하세요'}
                />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-red-600 mt-1">{errors.categoryId.message}</p>
            )}
          </div>
        </div>

        {/* Step 3: Additional Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0052CC] text-white text-sm font-semibold">
              3
            </div>
            <h3 className="text-lg font-semibold text-gray-900">추가 정보 (선택)</h3>
          </div>

          {/* Video Link */}
          <div>
            <Label htmlFor="videoId">연결할 비디오</Label>
            <Select
              value={videoId || 'none'}
              onValueChange={value => setValue('videoId', value === 'none' ? '' : value)}
              disabled={isLoadingVideos}
            >
              <SelectTrigger className="mt-1">
                <SelectValue
                  placeholder={isLoadingVideos ? '로딩 중...' : '비디오를 선택하세요 (선택사항)'}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">연결 안함</SelectItem>
                {videos.map(video => (
                  <SelectItem key={video.id} value={video.id}>
                    {video.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              이 자료를 특정 비디오와 연결하면 해당 비디오 페이지에서 다운로드 버튼이 표시됩니다
            </p>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">태그</Label>
            <Input
              id="tags"
              {...register('tags')}
              placeholder="쉼표로 구분하여 입력 (예: 사업계획서, 템플릿, 신청서)"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              쉼표(,)로 구분하여 여러 태그를 입력할 수 있습니다
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button type="submit" className="bg-[#0052CC] hover:bg-[#003d99]" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : mode === 'create' ? (
            '자료 추가'
          ) : (
            '변경사항 저장'
          )}
        </Button>
      </div>
    </form>
  );
}
