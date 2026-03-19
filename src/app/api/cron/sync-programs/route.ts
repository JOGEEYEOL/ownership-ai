/**
 * @file /api/cron/sync-programs/route.ts
 * @description Vercel Cron Job 엔드포인트 - 매일 자동 동기화
 * Phase 3: 다중 API 통합 연동
 * - 정부지원사업 데이터 동기화
 * - 만료된 공지사항/이벤트 자동 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProgramSyncOrchestrator } from '@/lib/sync/program-sync-orchestrator';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Vercel Serverless Function 최대 실행 시간 (초)
// Hobby: 최대 60초, Pro: 최대 300초
export const maxDuration = 300;

/**
 * 만료된 공지사항/이벤트 자동 처리
 * - endDate가 현재 시간보다 이전인 공지/이벤트의 isPinned를 false로 변경
 */
async function expireEndedAnnouncements(): Promise<{ updated: number; error: string | null }> {
  try {
    const now = new Date().toISOString();

    // endDate가 지난 공지사항/이벤트 중 아직 isPinned가 true인 것들 업데이트
    const { data, error } = await supabaseAdmin
      .from('knowhow_posts')
      .update({ isPinned: false })
      .or('isAnnouncement.eq.true,isEvent.eq.true')
      .eq('isPinned', true)
      .lt('endDate', now)
      .select('id');

    if (error) {
      console.error('[expireEndedAnnouncements] Error:', error);
      return { updated: 0, error: error.message };
    }

    return { updated: data?.length || 0, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[expireEndedAnnouncements] Exception:', errorMessage);
    return { updated: 0, error: errorMessage };
  }
}

/**
 * GET /api/cron/sync-programs
 *
 * Vercel Cron Job에서 호출되는 엔드포인트
 * 매일 새벽 2시에 자동으로 정부지원사업 데이터를 동기화
 *
 * 보안:
 * - Vercel Cron Secret 검증 필수
 * - Authorization 헤더에 Bearer 토큰 포함
 *
 * 응답:
 * - success: true
 * - data: { total, succeeded, failed, programCount, results }
 * - metadata: null
 */
export async function GET(request: NextRequest) {
  try {
    // Vercel Cron Secret 검증
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[GET /api/cron/sync-programs] CRON_SECRET not configured');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CRON_SECRET_NOT_CONFIGURED',
            message: 'CRON_SECRET environment variable is not configured',
            details: null,
          },
        },
        { status: 500 }
      );
    }

    // Authorization 헤더 검증
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[GET /api/cron/sync-programs] Unauthorized cron request');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or missing authorization token',
            details: null,
          },
        },
        { status: 401 }
      );
    }

    console.log('[GET /api/cron/sync-programs] Starting scheduled sync...');
    console.log('[GET /api/cron/sync-programs] Environment check:', {
      BIZINFO_API_KEY: process.env.BIZINFO_API_KEY
        ? `set (${process.env.BIZINFO_API_KEY.length} chars)`
        : 'MISSING',
      BIZINFO_API_BASE_URL: process.env.BIZINFO_API_BASE_URL ? 'set' : 'MISSING',
      PUBLIC_DATA_API_KEY: process.env.PUBLIC_DATA_API_KEY
        ? `set (${process.env.PUBLIC_DATA_API_KEY.length} chars)`
        : 'MISSING',
      KSTARTUP_API_BASE_URL: process.env.KSTARTUP_API_BASE_URL ? 'set' : 'MISSING',
      KOCCA_PIMS_API_KEY: process.env.KOCCA_PIMS_API_KEY ? 'set' : 'MISSING',
      KOCCA_FIN_API_KEY: process.env.KOCCA_FIN_API_KEY ? 'set' : 'MISSING',
    });

    // ProgramSyncOrchestrator 인스턴스 생성
    const orchestrator = new ProgramSyncOrchestrator();

    try {
      // 1. 모든 API 동기화 실행
      const stats = await orchestrator.syncAll();
      console.log('[GET /api/cron/sync-programs] Sync completed:', JSON.stringify(stats, null, 2));

      // 2. 만료된 공지사항/이벤트 자동 처리
      const expiredResult = await expireEndedAnnouncements();
      console.log('[GET /api/cron/sync-programs] Expired announcements:', expiredResult);

      // 성공 응답
      return NextResponse.json(
        {
          success: true,
          data: {
            ...stats,
            expiredAnnouncements: expiredResult,
          },
          metadata: null,
        },
        { status: 200 }
      );
    } finally {
      await orchestrator.dispose();
    }
  } catch (error) {
    console.error('[GET /api/cron/sync-programs] Error during sync:', error);

    // 에러 응답
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SYNC_ERROR',
          message: error instanceof Error ? error.message : 'Failed to sync programs',
          details: error instanceof Error ? error.stack : null,
        },
      },
      { status: 500 }
    );
  }
}
