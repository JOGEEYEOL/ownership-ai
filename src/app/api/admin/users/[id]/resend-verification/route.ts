import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/admin/users/[id]/resend-verification - 이메일 인증 재발송 (관리자 전용)
 *
 * ⚠️ requireAdmin 미들웨어로 보호됨 (DB user_roles 테이블 기반)
 * - role이 'admin'이 아니면 403 Forbidden 반환
 *
 * 이메일 미인증 사용자에게 인증 이메일을 다시 발송합니다.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 1. Admin 권한 체크 (DB 기반)
  const authResult = await requireAdmin(request);
  if (!authResult.success) {
    return authResult.response; // 401 or 403
  }

  const { id: userId } = await params;

  try {
    // 2. 사용자 정보 조회
    const {
      data: { user },
      error: getUserError,
    } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (getUserError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '사용자를 찾을 수 없습니다.',
            details: getUserError?.message,
          },
        },
        { status: 404 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_EMAIL',
            message: '사용자 이메일이 없습니다.',
          },
        },
        { status: 400 }
      );
    }

    // 3. 이미 인증된 사용자인지 확인
    if (user.email_confirmed_at) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_VERIFIED',
            message: '이미 이메일 인증이 완료된 사용자입니다.',
          },
        },
        { status: 400 }
      );
    }

    // 4. 인증 이메일 재발송 (Supabase에서는 resend 사용)
    const origin =
      request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { error: resendError } = await supabaseAdmin.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (resendError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RESEND_VERIFICATION_FAILED',
            message: '인증 이메일 재발송에 실패했습니다.',
            details: resendError.message,
          },
        },
        { status: 500 }
      );
    }

    // 5. 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        message: '인증 이메일이 재발송되었습니다.',
        email: user.email,
      },
    });
  } catch (error) {
    console.error('POST /api/admin/users/[id]/resend-verification error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '인증 이메일 재발송 중 오류가 발생했습니다.',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
