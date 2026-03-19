/**
 * @file /api/programs/sync/route.ts
 * @description 정부지원사업 데이터 수동 동기화 API
 * Phase 3: 다중 API 통합 연동
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProgramSyncOrchestrator } from '@/lib/sync/program-sync-orchestrator';
import { createErrorResponse, logError } from '@/lib/utils/error-handler';

// Vercel Serverless Function 최대 실행 시간 (초)
export const maxDuration = 300;

/**
 * POST /api/programs/sync
 *
 * 정부지원사업 데이터를 수동으로 동기화
 *
 * 기능:
 * - 6개 데이터 소스에서 데이터 수집:
 *   - 기업마당 (공공데이터포털 API)
 *   - K-Startup (공공데이터포털 API)
 *   - KOCCA-PIMS (한국콘텐츠진흥원 공모전)
 *   - KOCCA-Finance (한국콘텐츠진흥원 투자/융자)
 *   - 서울테크노파크 (웹 크롤링)
 *   - 경기테크노파크 (웹 크롤링)
 * - 병렬 동기화 (Promise.allSettled)
 * - 부분 실패 허용
 * - 동기화 결과 및 통계 반환
 *
 * 응답:
 * - success: true
 * - data: { total, succeeded, failed, programCount, results }
 * - metadata: null
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  try {
    console.log('[POST /api/programs/sync] Starting manual sync...');

    // ProgramSyncOrchestrator 인스턴스 생성
    const orchestrator = new ProgramSyncOrchestrator();

    try {
      // 모든 API 동기화 실행
      const stats = await orchestrator.syncAll();

      console.log('[POST /api/programs/sync] Sync completed:', stats);

      // 성공 응답
      return NextResponse.json(
        {
          success: true,
          data: stats,
          metadata: null,
        },
        { status: 200 }
      );
    } finally {
      await orchestrator.dispose();
    }
  } catch (error) {
    // 에러 로깅 (심각도별 자동 분류)
    logError(error, { context: 'POST /api/programs/sync', operation: 'sync' });

    // 표준 에러 응답 생성
    const errorResponse = createErrorResponse(error);

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
