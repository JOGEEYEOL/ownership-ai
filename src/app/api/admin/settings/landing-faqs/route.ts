import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

const createFaqSchema = z.object({
  question: z.string().min(1, '질문을 입력해주세요'),
  answer: z.string().min(1, '답변을 입력해주세요'),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/settings/landing-faqs - FAQ 목록 조회
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (!authResult.success) return authResult.response;

  try {
    const { data, error } = await supabaseAdmin
      .from('landing_faqs')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DB_ERROR', message: 'FAQ 조회 실패', details: error.message },
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
          message: 'FAQ 조회 중 오류 발생',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/landing-faqs - FAQ 생성
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (!authResult.success) return authResult.response;

  try {
    const body = await request.json();
    const validation = createFaqSchema.safeParse(body);

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

    // order 미지정 시 마지막에 추가
    if (validation.data.order === undefined) {
      const { data: lastFaq } = await supabaseAdmin
        .from('landing_faqs')
        .select('order')
        .order('order', { ascending: false })
        .limit(1)
        .single();
      validation.data.order = (lastFaq?.order ?? 0) + 1;
    }

    const { data, error } = await supabaseAdmin
      .from('landing_faqs')
      .insert(validation.data)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DB_ERROR', message: 'FAQ 생성 실패', details: error.message },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'FAQ 생성 중 오류 발생',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
