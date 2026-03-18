import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createResourceSchema, resourceFilterSchema } from '@/lib/validations/education';
import { requireEducationAccess } from '@/lib/auth/roles';
import { z } from 'zod';

/**
 * GET /api/education/resources - 자료 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 인증 및 교육 센터 접근 권한 체크
    const authResult = await requireEducationAccess(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const filters = resourceFilterSchema.parse(searchParams);

    const { page, limit, sortBy, sortOrder, search, videoId, categoryId } = filters;
    const supabase = await createClient();

    // 카테고리 정보를 포함하여 조회
    let query = supabase
      .from('resources')
      .select('*, category:resource_categories(id, name), resourceType:resource_types(id, name)', {
        count: 'exact',
      });

    // WHERE 조건
    if (categoryId) {
      query = query.eq('categoryId', categoryId);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (videoId) {
      query = query.eq('videoId', videoId);
    }

    // 정렬 (Supabase 테이블이 camelCase이므로 그대로 사용)
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: resources, error: resourcesError, count } = await query;

    if (resourcesError) {
      console.error('자료 목록 조회 실패:', resourcesError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch resources list',
          },
        },
        { status: 500 }
      );
    }

    // Supabase 테이블이 이미 camelCase이므로 변환 불필요
    return NextResponse.json({
      success: true,
      data: resources || [],
      metadata: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/education/resources error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
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
          message: 'Failed to fetch resources list',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/education/resources - 자료 생성
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 및 교육 센터 접근 권한 체크
    const authResult = await requireEducationAccess(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();
    const validated = createResourceSchema.parse(body);
    const supabase = await createClient();

    const { data: resource, error: createError } = await supabase
      .from('resources')
      .insert({
        title: validated.title,
        description: validated.description,
        typeId: validated.typeId,
        categoryId: validated.categoryId,
        fileUrl: validated.fileUrl,
        fileName: validated.fileName,
        fileSize: validated.fileSize,
        tags: validated.tags || [],
        videoId: validated.videoId || null,
      })
      .select('*, category:resource_categories(id, name), resourceType:resource_types(id, name)')
      .single();

    if (createError) {
      console.error('자료 생성 실패:', createError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DB_ERROR',
            message: createError.message || 'Failed to create resource',
            details: createError,
          },
        },
        { status: 500 }
      );
    }

    // Supabase 테이블이 이미 camelCase이므로 변환 불필요
    return NextResponse.json(
      {
        success: true,
        data: resource,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/education/resources error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
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
          message: 'Failed to create resource',
        },
      },
      { status: 500 }
    );
  }
}
