import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/admin/users/[id]/reset-password - 비밀번호 재설정 이메일 발송 (관리자 전용)
 *
 * ⚠️ requireAdmin 미들웨어로 보호됨 (DB user_roles 테이블 기반)
 * - role이 'admin'이 아니면 403 Forbidden 반환
 *
 * 사용자에게 비밀번호 재설정 링크가 포함된 이메일을 발송합니다.
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

    // 3. 비밀번호 재설정 이메일 발송
    const origin =
      request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${origin}/auth/callback`,
    });

    if (resetError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RESET_PASSWORD_FAILED',
            message: '비밀번호 재설정 이메일 발송에 실패했습니다.',
            details: resetError.message,
          },
        },
        { status: 500 }
      );
    }

    // 4. 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        message: '비밀번호 재설정 이메일이 발송되었습니다.',
        email: user.email,
      },
    });
  } catch (error) {
    console.error('POST /api/admin/users/[id]/reset-password error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '비밀번호 재설정 처리 중 오류가 발생했습니다.',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
