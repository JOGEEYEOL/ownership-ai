import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * Resource Schema (for attached resources)
 */
const resourceSchema = z.object({
  title: z.string().min(1),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  fileSize: z.number().int().positive(),
  categoryId: z.string().min(1),
});

/**
 * Request Schema
 */
const createVideoSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  categoryId: z.string().min(1, { message: '카테고리를 선택해주세요' }),
  videoUrl: z.string().url(),
  videoType: z.enum(['youtube', 'vimeo', 'file']).default('youtube'),
  thumbnailUrl: z.string().url().nullable().optional(),
  duration: z.number().int().positive().nullable().optional(),
  tags: z.array(z.string()).default([]),
  // 첨부자료 (선택)
  resources: z.array(resourceSchema).default([]),
});

/**
 * POST /api/admin/education/videos - 비디오 생성 (관리자 전용)
 */
export async function POST(request: NextRequest) {
  // 1. Admin 권한 체크
  const authResult = await requireAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    // 2. Request body validation
    const body = await request.json();
    const validatedData = createVideoSchema.parse(body);

    // 3. 카테고리 존재 확인 및 이름 가져오기
    const { data: category, error: categoryError } = await supabase
      .from('video_categories')
      .select('name')
      .eq('id', validatedData.categoryId)
      .single();

    if (categoryError || !category) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: '카테고리를 찾을 수 없습니다.',
          },
        },
        { status: 404 }
      );
    }

    // 4. 비디오 생성 (categoryId + category 이름 모두 저장)
    const { data: video, error: createError } = await supabase
      .from('education_videos')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        categoryId: validatedData.categoryId, // FK 연결
        category: category.name, // 카테고리 이름 저장 (조회 편의용)
        videoUrl: validatedData.videoUrl,
        videoType: validatedData.videoType,
        thumbnailUrl: validatedData.thumbnailUrl,
        duration: validatedData.duration,
        tags: validatedData.tags,
      })
      .select()
      .single();

    if (createError) {
      console.error('비디오 생성 실패:', createError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create video',
            details: createError.message,
          },
        },
        { status: 500 }
      );
    }

    // 5. 첨부자료가 있으면 resources 테이블에도 저장 (비디오와 연결)
    let createdResourcesCount = 0;
    if (validatedData.resources.length > 0) {
      // '문서' 유형의 ID 조회
      const { data: documentType } = await supabase
        .from('resource_types')
        .select('id')
        .eq('name', '문서')
        .single();

      const resourcesData = validatedData.resources.map(resource => ({
        title: resource.title,
        fileName: resource.fileName,
        fileUrl: resource.fileUrl,
        fileSize: resource.fileSize,
        categoryId: resource.categoryId,
        videoId: video.id, // 비디오와 연결
        typeId: documentType?.id || null, // resource_types 테이블 참조
        tags: [], // 빈 태그
      }));

      const { data: createdResources, error: resourcesError } = await supabase
        .from('resources')
        .insert(resourcesData)
        .select();

      if (resourcesError) {
        // 자료 생성 실패해도 비디오는 이미 생성되었으므로 경고만 로그
        console.error('첨부자료 생성 실패:', resourcesError);
      } else {
        createdResourcesCount = createdResources?.length || 0;
      }
    }

    // 6. 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: {
          ...video,
          resourcesCreated: createdResourcesCount,
        },
        message:
          createdResourcesCount > 0
            ? `비디오가 추가되었습니다. (첨부자료 ${createdResourcesCount}개)`
            : '비디오가 추가되었습니다.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/admin/education/videos error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid request body',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create video',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
