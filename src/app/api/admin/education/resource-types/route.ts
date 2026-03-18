import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createResourceTypeSchema,
  type CreateResourceTypeInput,
} from '@/lib/validations/education';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { ZodError } from 'zod';

// POST /api/admin/education/resource-types - 자료 유형 생성 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '인증이 필요합니다', null, 401);
    }

    // 2. 요청 바디 파싱
    const body = await request.json();

    // 3. 유효성 검증 (Zod)
    const validatedData: CreateResourceTypeInput = createResourceTypeSchema.parse(body);

    // 4. 중복 이름 체크
    const { data: existingType } = await supabase
      .from('resource_types')
      .select('*')
      .eq('name', validatedData.name)
      .single();

    if (existingType) {
      return errorResponse(ErrorCode.VALIDATION_ERROR, '이미 존재하는 유형 이름입니다', null, 400);
    }

    // 5. 최대 20개 제한 체크
    const { count } = await supabase
      .from('resource_types')
      .select('*', { count: 'exact', head: true });

    if (count && count >= 20) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '유형은 최대 20개까지 생성할 수 있습니다',
        null,
        400
      );
    }

    // 6. 유형 생성
    const { data: resourceType, error: createError } = await supabase
      .from('resource_types')
      .insert({
        name: validatedData.name,
        description: validatedData.description,
        order: validatedData.order ?? 0,
      })
      .select()
      .single();

    if (createError) {
      console.error('유형 생성 실패:', createError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '유형 생성에 실패했습니다', null, 500);
    }

    // 7. 성공 응답
    return successResponse(resourceType, undefined, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '입력 데이터가 유효하지 않습니다',
        error.issues,
        400
      );
    }

    console.error('Resource type creation error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '유형 생성 중 오류가 발생했습니다', null, 500);
  }
}

// GET /api/admin/education/resource-types - 자료 유형 목록 조회
export async function GET() {
  try {
    const supabase = await createClient();

    // 1. 유형 목록 조회 (order 오름차순)
    const { data: types, error: typesError } = await supabase
      .from('resource_types')
      .select('*')
      .order('order', { ascending: true });

    if (typesError) {
      console.error('유형 목록 조회 실패:', typesError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '유형 목록 조회에 실패했습니다', null, 500);
    }

    // 2. 각 유형별 자료 수 조회
    const typesWithCount = await Promise.all(
      (types || []).map(async type => {
        const { count } = await supabase
          .from('resources')
          .select('*', { count: 'exact', head: true })
          .eq('typeId', type.id);

        return {
          ...type,
          _count: {
            resources: count || 0,
          },
        };
      })
    );

    // 3. 성공 응답
    return successResponse(typesWithCount);
  } catch (error) {
    console.error('Resource type list error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      '유형 목록 조회 중 오류가 발생했습니다',
      null,
      500
    );
  }
}
