import { z } from 'zod';

// ============================================
// EducationVideo (교육 비디오) Schemas
// ============================================

// 비디오 타입 enum
export const VideoType = {
  YOUTUBE: 'youtube',
  VIMEO: 'vimeo',
  FILE: 'file',
} as const;

export type VideoType = (typeof VideoType)[keyof typeof VideoType];

// 비디오 카테고리 enum
export const VideoCategory = {
  OVERVIEW: '개요', // 정부지원사업 개요
  BY_FIELD: '분야별', // 분야별 지원사업
  APPLICATION: '신청서작성', // 신청서 작성 가이드
  SUCCESS_STORY: '성공사례', // 성공 사례
} as const;

export type VideoCategory = (typeof VideoCategory)[keyof typeof VideoCategory];

// 교육 비디오 생성 스키마
export const createEducationVideoSchema = z.object({
  // 기본 정보 (필수)
  title: z.string().min(1, '제목은 필수입니다').max(200, '제목은 200자 이하여야 합니다'),
  description: z.string().max(1000, '설명은 1000자 이하여야 합니다').optional(),
  categoryId: z.string().min(1, '카테고리를 선택해주세요'),

  // 비디오 정보 (필수)
  videoUrl: z.string().url('올바른 URL 형식이 아닙니다'),
  videoType: z
    .enum(['youtube', 'vimeo', 'file'], {
      message: '유효한 비디오 타입을 선택해주세요',
    })
    .default('youtube'),
  thumbnailUrl: z.string().url('올바른 URL 형식이 아닙니다').optional(),
  duration: z.number().int().positive('재생 시간은 양수여야 합니다').optional(), // 초 단위

  // 메타데이터 (선택)
  tags: z.array(z.string()).default([]),
});

// 교육 비디오 수정 스키마 (모든 필드 선택적)
export const updateEducationVideoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  categoryId: z.string().min(1).optional(),
  videoUrl: z.string().url().optional(),
  videoType: z.enum(['youtube', 'vimeo', 'file']).optional(),
  thumbnailUrl: z.string().url().optional(),
  duration: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
});

// 교육 비디오 필터링 스키마 (GET 쿼리 파라미터)
export const educationVideoFilterSchema = z.object({
  // 페이지네이션
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),

  // 정렬
  sortBy: z.enum(['createdAt', 'updatedAt', 'viewCount', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // 필터링
  category: z.enum(['개요', '분야별', '신청서작성', '성공사례']).optional(),
  videoType: z.enum(['youtube', 'vimeo', 'file']).optional(),
  search: z.string().optional(), // 제목, 설명, 태그 검색
});

// ============================================
// KnowHow (노하우) Schemas
// ============================================

// 노하우 카테고리 enum
export const KnowHowCategory = {
  BY_INDUSTRY: '업종별', // 업종별 노하우
  BY_PROGRAM: '사업별', // 사업별 노하우
  TIP: '팁', // 실전 팁
  WARNING: '주의사항', // 주의사항
} as const;

export type KnowHowCategory = (typeof KnowHowCategory)[keyof typeof KnowHowCategory];

// 노하우 생성 스키마
export const createKnowHowSchema = z.object({
  // 기본 정보 (필수)
  title: z.string().min(1, '제목은 필수입니다').max(200, '제목은 200자 이하여야 합니다'),
  content: z.string().min(1, '내용은 필수입니다'), // Markdown 지원
  categoryId: z.string().min(1, '카테고리를 선택해주세요').optional(),
  author: z.string().max(100, '작성자는 100자 이하여야 합니다').optional(),

  // 메타데이터 (선택)
  tags: z.array(z.string()).default([]),

  // 이미지 및 파일 첨부 (선택) - 커뮤니티와 동일한 bucket 사용
  imageUrls: z.array(z.string().url()).optional().default([]),
  fileUrls: z.array(z.string().url()).optional().default([]),
  fileNames: z.array(z.string()).optional().default([]),
});

// 노하우 수정 스키마
export const updateKnowHowSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  author: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
});

// 노하우 필터링 스키마
export const knowHowFilterSchema = z.object({
  // 페이지네이션
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),

  // 정렬
  sortBy: z.enum(['createdAt', 'updatedAt', 'viewCount', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // 필터링
  category: z.string().optional(), // categoryId로 필터링 (backward compatibility를 위해 'category' 유지)
  search: z.string().optional(), // 제목, 내용, 태그 검색
});

// ============================================
// KnowHowCategory (노하우 카테고리) Schemas
// ============================================

// 노하우 카테고리 생성 스키마
export const createKnowHowCategorySchema = z.object({
  name: z
    .string()
    .min(1, '카테고리 이름은 필수입니다')
    .max(50, '카테고리 이름은 50자 이하여야 합니다'),
  description: z.string().max(200, '설명은 200자 이하여야 합니다').optional(),
  order: z.number().int().min(0, '순서는 0 이상이어야 합니다').default(0),
});

// 노하우 카테고리 수정 스키마
export const updateKnowHowCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
  order: z.number().int().min(0).optional(),
});

// ============================================
// KnowHowPost (노하우 게시글) Schemas
// ============================================

// 노하우 게시글 생성 스키마 (일반 회원용)
export const createKnowHowPostSchema = z.object({
  categoryId: z.string().min(1, '카테고리를 선택해주세요'),
  title: z.string().min(1, '제목은 필수입니다').max(200, '제목은 200자 이하여야 합니다'),
  content: z.string().min(1, '내용은 필수입니다'),
  imageUrls: z.array(z.string().url()).default([]),
  fileUrls: z.array(z.string().url()).default([]),
  fileNames: z.array(z.string()).default([]),
});

// 노하우 게시글 수정 스키마 (일반 회원용)
export const updateKnowHowPostSchema = z.object({
  categoryId: z.string().min(1).optional(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  fileUrls: z.array(z.string().url()).optional(),
  fileNames: z.array(z.string()).optional(),
});

// 노하우 게시글 생성 스키마 (관리자용 - 공지/이벤트)
export const createAdminKnowHowPostSchema = z.object({
  categoryId: z.string().min(1, '카테고리를 선택해주세요').optional(), // 공지/이벤트는 선택사항
  title: z.string().min(1, '제목은 필수입니다').max(200, '제목은 200자 이하여야 합니다'),
  content: z.string().min(1, '내용은 필수입니다'),
  imageUrls: z.array(z.string().url()).default([]),
  fileUrls: z.array(z.string().url()).default([]),
  fileNames: z.array(z.string()).default([]),
  isAnnouncement: z.boolean().default(false),
  isEvent: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  startDate: z.string().optional(), // datetime-local 형식 허용
  endDate: z.string().optional(), // datetime-local 형식 허용
});

// 노하우 게시글 수정 스키마 (관리자용)
export const updateAdminKnowHowPostSchema = z.object({
  categoryId: z.string().min(1).optional(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  fileUrls: z.array(z.string().url()).optional(),
  fileNames: z.array(z.string()).optional(),
  isAnnouncement: z.boolean().optional(),
  isEvent: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// 노하우 게시글 필터링 스키마
export const knowHowPostFilterSchema = z.object({
  // 페이지네이션
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),

  // 정렬
  sortBy: z.enum(['createdAt', 'updatedAt', 'viewCount', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // 필터링
  categoryId: z.string().optional(),
  isAnnouncement: z.coerce.boolean().optional(),
  isEvent: z.coerce.boolean().optional(),
  search: z.string().optional(), // 제목, 내용 검색
});

// ============================================
// KnowHowComment (노하우 댓글) Schemas
// ============================================

// 노하우 댓글 생성 스키마
export const createKnowHowCommentSchema = z.object({
  postId: z.string().min(1, '게시글 ID는 필수입니다'),
  content: z.string().min(1, '댓글 내용은 필수입니다').max(1000, '댓글은 1000자 이하여야 합니다'),
});

// 노하우 댓글 수정 스키마
export const updateKnowHowCommentSchema = z.object({
  content: z.string().min(1, '댓글 내용은 필수입니다').max(1000, '댓글은 1000자 이하여야 합니다'),
});

// ============================================
// Resource (자료실) Schemas
// ============================================

// 자료 타입 enum
export const ResourceType = {
  TEMPLATE: 'template', // 템플릿
  CHECKLIST: 'checklist', // 체크리스트
  DOCUMENT: 'document', // 참고 문서
} as const;

export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];

// 자료 생성 스키마
export const createResourceSchema = z.object({
  // 기본 정보 (필수)
  title: z.string().min(1, '제목은 필수입니다').max(200, '제목은 200자 이하여야 합니다'),
  description: z.string().max(1000, '설명은 1000자 이하여야 합니다').nullable().optional(),

  // 자료 타입 (필수)
  type: z.enum(['template', 'checklist', 'document'], {
    message: '자료 유형을 선택해주세요',
  }),

  // 카테고리 연결 (필수)
  categoryId: z.string().min(1, '카테고리를 선택해주세요'),

  // 파일 정보 (필수)
  fileUrl: z.string().url('올바른 URL 형식이 아닙니다'),
  fileName: z.string().min(1, '파일명은 필수입니다'),
  fileSize: z.number().int().positive('파일 크기는 양수여야 합니다').nullable().optional(), // bytes

  // 메타데이터 (선택)
  tags: z.array(z.string()).default([]),

  // 비디오 연결 (선택)
  videoId: z.string().uuid().nullable().optional(), // 연결된 비디오 ID
});

// 자료 수정 스키마
export const updateResourceSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  type: z.enum(['template', 'checklist', 'document']).optional(),
  fileUrl: z.string().url().optional(),
  fileName: z.string().min(1).optional(),
  fileSize: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  videoId: z.string().uuid().nullable().optional(), // 연결된 비디오 ID
  categoryId: z.string().min(1).optional(), // 연결된 카테고리 ID (필수)
});

// 자료 필터링 스키마
export const resourceFilterSchema = z.object({
  // 페이지네이션
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),

  // 정렬
  sortBy: z.enum(['createdAt', 'updatedAt', 'downloadCount', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // 필터링
  categoryId: z.string().optional(), // 카테고리 ID로 필터링
  search: z.string().optional(), // 제목, 설명, 태그 검색
  videoId: z.string().uuid().optional(), // 연결된 비디오 ID로 필터링
});

// ============================================
// ResourceCategory (자료 카테고리) Schemas
// ============================================

// 자료 카테고리 생성 스키마
export const createResourceCategorySchema = z.object({
  name: z
    .string()
    .min(1, '카테고리 이름은 필수입니다')
    .max(50, '카테고리 이름은 50자 이하여야 합니다'),
  description: z.string().max(200, '설명은 200자 이하여야 합니다').optional(),
  order: z.number().int().min(0, '순서는 0 이상이어야 합니다').default(0),
});

// 자료 카테고리 수정 스키마
export const updateResourceCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
  order: z.number().int().min(0).optional(),
});

// ============================================
// TypeScript 타입 export
// ============================================

export type CreateEducationVideoInput = z.infer<typeof createEducationVideoSchema>;
export type UpdateEducationVideoInput = z.infer<typeof updateEducationVideoSchema>;
export type EducationVideoFilterInput = z.infer<typeof educationVideoFilterSchema>;

export type CreateKnowHowInput = z.infer<typeof createKnowHowSchema>;
export type UpdateKnowHowInput = z.infer<typeof updateKnowHowSchema>;
export type KnowHowFilterInput = z.infer<typeof knowHowFilterSchema>;

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type ResourceFilterInput = z.infer<typeof resourceFilterSchema>;

export type CreateKnowHowCategoryInput = z.infer<typeof createKnowHowCategorySchema>;
export type UpdateKnowHowCategoryInput = z.infer<typeof updateKnowHowCategorySchema>;

export type CreateResourceCategoryInput = z.infer<typeof createResourceCategorySchema>;
export type UpdateResourceCategoryInput = z.infer<typeof updateResourceCategorySchema>;

export type CreateKnowHowPostInput = z.infer<typeof createKnowHowPostSchema>;
export type UpdateKnowHowPostInput = z.infer<typeof updateKnowHowPostSchema>;
export type CreateAdminKnowHowPostInput = z.infer<typeof createAdminKnowHowPostSchema>;
export type UpdateAdminKnowHowPostInput = z.infer<typeof updateAdminKnowHowPostSchema>;
export type KnowHowPostFilterInput = z.infer<typeof knowHowPostFilterSchema>;

export type CreateKnowHowCommentInput = z.infer<typeof createKnowHowCommentSchema>;
export type UpdateKnowHowCommentInput = z.infer<typeof updateKnowHowCommentSchema>;
