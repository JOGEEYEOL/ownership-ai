import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  updateResourceTypeSchema,
  type UpdateResourceTypeInput,
} from '@/lib/validations/education';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { ZodError } from 'zod';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/admin/education/resource-types/[id] - 자료 유형 상세 조회
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. 유형 조회
    const { data: resourceType, error: typeError } = await supabase
      .from('resource_types')
      .select('*')
      .eq('id', id)
      .single();

    if (typeError || !resourceType) {
      return errorResponse(ErrorCode.NOT_FOUND, '유형을 찾을 수 없습니다', null, 404);
    }

    // 2. 자료 수 조회
    const { count } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .eq('typeId', id);

    const typeWithCount = {
      ...resourceType,
      _count: {
        resources: count || 0,
      },
    };

    // 3. 성공 응답
    return successResponse(typeWithCount);
  } catch (error) {
    console.error('Resource type detail error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '유형 조회 중 오류가 발생했습니다', null, 500);
  }
}

// PATCH /api/admin/education/resource-types/[id] - 자료 유형 수정 (관리자 전용)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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
    const validatedData: UpdateResourceTypeInput = updateResourceTypeSchema.parse(body);

    // 4. 유형 존재 여부 확인
    const { data: existingType } = await supabase
      .from('resource_types')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingType) {
      return errorResponse(ErrorCode.NOT_FOUND, '유형을 찾을 수 없습니다', null, 404);
    }

    // 5. 이름 중복 체크 (다른 유형과 중복되는지)
    if (validatedData.name && validatedData.name !== existingType.name) {
      const { data: duplicateType } = await supabase
        .from('resource_types')
        .select('*')
        .eq('name', validatedData.name)
        .single();

      if (duplicateType) {
        return errorResponse(
          ErrorCode.VALIDATION_ERROR,
          '이미 존재하는 유형 이름입니다',
          null,
          400
        );
      }
    }

    // 6. 유형 수정
    const { data: updatedType, error: updateError } = await supabase
      .from('resource_types')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('유형 수정 실패:', updateError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '유형 수정에 실패했습니다', null, 500);
    }

    // 7. 성공 응답
    return successResponse(updatedType);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '입력 데이터가 유효하지 않습니다',
        error.issues,
        400
      );
    }

    console.error('Resource type update error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '유형 수정 중 오류가 발생했습니다', null, 500);
  }
}

// DELETE /api/admin/education/resource-types/[id] - 자료 유형 삭제 (관리자 전용)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 1. 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(ErrorCode.UNAUTHORIZED, '인증이 필요합니다', null, 401);
    }

    // 2. 유형 존재 여부 확인
    const { data: existingType } = await supabase
      .from('resource_types')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingType) {
      return errorResponse(ErrorCode.NOT_FOUND, '유형을 찾을 수 없습니다', null, 404);
    }

    // 3. 자료 수 확인
    const { count } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .eq('typeId', id);

    // 4. 자료가 있는 유형은 삭제 불가
    if (count && count > 0) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '자료가 있는 유형은 삭제할 수 없습니다',
        { resourceCount: count },
        400
      );
    }

    // 5. 유형 삭제
    const { error: deleteError } = await supabase.from('resource_types').delete().eq('id', id);

    if (deleteError) {
      console.error('유형 삭제 실패:', deleteError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '유형 삭제에 실패했습니다', null, 500);
    }

    // 6. 성공 응답 (204 No Content)
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Resource type delete error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '유형 삭제 중 오류가 발생했습니다', null, 500);
  }
}
