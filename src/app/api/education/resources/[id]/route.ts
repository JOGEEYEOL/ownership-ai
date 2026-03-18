import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';
import { updateResourceSchema } from '@/lib/validations/education';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { z } from 'zod';

// GET /api/education/resources/[id] - 자료 상세 조회
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 자료 조회
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (resourceError || !resource) {
      return errorResponse(ErrorCode.NOT_FOUND, '자료를 찾을 수 없습니다', null, 404);
    }

    // Supabase 테이블이 이미 camelCase이므로 변환 불필요
    return successResponse(resource);
  } catch (error) {
    console.error('Resource detail error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '자료 조회 중 오류가 발생했습니다', null, 500);
  }
}

// PATCH /api/education/resources/[id] - 자료 수정 (관리자 전용)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 관리자 권한 체크 (DB user_roles 테이블 기반)
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { id } = await params;

    // 자료 존재 여부 확인
    const { data: existingResource, error: existingError } = await supabaseAdmin
      .from('resources')
      .select('id')
      .eq('id', id)
      .single();

    if (existingError || !existingResource) {
      return errorResponse(ErrorCode.NOT_FOUND, '자료를 찾을 수 없습니다', null, 404);
    }

    // Body 파싱 및 검증
    const body = await request.json();
    const validated = updateResourceSchema.parse(body);

    // 업데이트할 데이터 구성
    const updateData: Record<string, unknown> = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.type !== undefined) updateData.type = validated.type;
    if (validated.categoryId !== undefined) updateData.categoryId = validated.categoryId;
    if (validated.fileUrl !== undefined) updateData.fileUrl = validated.fileUrl;
    if (validated.fileName !== undefined) updateData.fileName = validated.fileName;
    if (validated.fileSize !== undefined) updateData.fileSize = validated.fileSize;
    if (validated.tags !== undefined) updateData.tags = validated.tags;
    if (validated.videoId !== undefined) updateData.videoId = validated.videoId;

    // 자료 수정
    const { data: resource, error: updateError } = await supabaseAdmin
      .from('resources')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Resource update error:', updateError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '자료 수정에 실패했습니다', null, 500);
    }

    return successResponse(resource);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCode.VALIDATION_ERROR,
        '입력값이 올바르지 않습니다',
        error.issues,
        400
      );
    }

    console.error('Resource update error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '자료 수정 중 오류가 발생했습니다', null, 500);
  }
}

// DELETE /api/education/resources/[id] - 자료 삭제 (관리자 전용)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 관리자 권한 체크 (DB user_roles 테이블 기반)
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { id } = await params;

    // 자료 존재 여부 확인
    const { data: existingResource, error: existingError } = await supabaseAdmin
      .from('resources')
      .select('id, fileUrl')
      .eq('id', id)
      .single();

    if (existingError || !existingResource) {
      return errorResponse(ErrorCode.NOT_FOUND, '자료를 찾을 수 없습니다', null, 404);
    }

    // 자료 삭제
    const { error: deleteError } = await supabaseAdmin.from('resources').delete().eq('id', id);

    if (deleteError) {
      console.error('Resource delete error:', deleteError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, '자료 삭제에 실패했습니다', null, 500);
    }

    return successResponse({ message: '자료가 삭제되었습니다' });
  } catch (error) {
    console.error('Resource delete error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '자료 삭제 중 오류가 발생했습니다', null, 500);
  }
}
