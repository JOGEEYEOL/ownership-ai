import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

const updateTestimonialSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/**
 * PATCH /api/admin/settings/landing-testimonials/[id] - 후기 수정
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (!authResult.success) return authResult.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const validation = updateTestimonialSchema.safeParse(body);

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
      .from('landing_testimonials')
      .update({ ...validation.data, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DB_ERROR', message: '후기 수정 실패', details: error.message },
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
          message: '후기 수정 중 오류 발생',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/settings/landing-testimonials/[id] - 후기 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (!authResult.success) return authResult.response;

  try {
    const { id } = await params;
    const { error } = await supabaseAdmin.from('landing_testimonials').delete().eq('id', id);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DB_ERROR', message: '후기 삭제 실패', details: error.message },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: '후기가 삭제되었습니다.' });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '후기 삭제 중 오류 발생',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
