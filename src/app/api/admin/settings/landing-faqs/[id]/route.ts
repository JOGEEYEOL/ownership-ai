import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

const updateFaqSchema = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/**
 * PATCH /api/admin/settings/landing-faqs/[id] - FAQ 수정
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (!authResult.success) return authResult.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const validation = updateFaqSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력값이 올바르지 않습니다.',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('landing_faqs')
      .update({ ...validation.data, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DB_ERROR', message: 'FAQ 수정 실패', details: error.message },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'FAQ 수정 중 오류 발생',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/settings/landing-faqs/[id] - FAQ 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (!authResult.success) return authResult.response;

  try {
    const { id } = await params;
    const { error } = await supabaseAdmin.from('landing_faqs').delete().eq('id', id);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DB_ERROR', message: 'FAQ 삭제 실패', details: error.message },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'FAQ가 삭제되었습니다.' });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'FAQ 삭제 중 오류 발생',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
