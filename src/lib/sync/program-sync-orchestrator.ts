/**
 * @file program-sync-orchestrator.ts
 * @description 다중 API 통합 동기화 오케스트레이터
 * Phase 3: 다중 API 통합 연동 (기업마당, K-Startup, KOCCA)
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import type { IProgramAPIClient, RawProgramData } from '../apis/base-api-client';
import { BizinfoAPIClient } from '../apis/bizinfo-api-client';
import { KStartupAPIClient } from '../apis/kstartup-api-client';
import { KoccaPIMSAPIClient } from '../apis/kocca-pims-api-client';
import { KoccaFinanceAPIClient } from '../apis/kocca-finance-api-client';
// import { SeoulTPAPIClient } from '../apis/seoul-tp-api-client'; // ⚠️ 서울테크노파크 크롤링 금지로 비활성화
// import { GyeonggiTPAPIClient } from '../apis/gyeonggi-tp-api-client'; // ⚠️ 경기테크노파크 크롤링 금지로 비활성화

/**
 * 동기화 결과 타입
 */
interface SyncResult {
  dataSource: string;
  success: boolean;
  count?: number;
  error?: string;
}

/**
 * 동기화 통계 타입
 */
interface SyncStats {
  total: number;
  succeeded: number;
  failed: number;
  programCount: number;
  results: SyncResult[];
}

/**
 * 정부지원사업 데이터 동기화 오케스트레이터
 *
 * 다중 API (기업마당, K-Startup, KOCCA-PIMS, KOCCA-Finance)를 병렬로 호출하고
 * 각 API에서 가져온 데이터를 데이터베이스에 동기화
 *
 * 핵심 기능:
 * - Promise.allSettled를 사용한 병렬 동기화
 * - 부분 실패 허용 (하나의 API 실패해도 나머지는 계속 진행)
 * - 교차 정렬을 위한 registeredAt 필드 매핑
 * - 중복 방지 (dataSource + sourceApiId unique constraint)
 */
export class ProgramSyncOrchestrator {
  private readonly clients: IProgramAPIClient[];
  private readonly initErrors: Array<{ name: string; error: string }>;

  constructor() {
    this.clients = [];
    this.initErrors = [];

    // 각 클라이언트를 개별적으로 생성 (하나의 실패가 전체를 막지 않도록)
    const clientFactories: Array<{ name: string; factory: () => IProgramAPIClient }> = [
      { name: '기업마당', factory: () => new BizinfoAPIClient() },
      { name: 'K-Startup', factory: () => new KStartupAPIClient() },
      { name: 'KOCCA-PIMS', factory: () => new KoccaPIMSAPIClient() },
      { name: 'KOCCA-Finance', factory: () => new KoccaFinanceAPIClient() },
    ];

    for (const { name, factory } of clientFactories) {
      try {
        this.clients.push(factory());
        console.log(`[ProgramSyncOrchestrator] ✅ ${name} client initialized`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[ProgramSyncOrchestrator] ❌ Failed to initialize ${name} client:`, message);
        this.initErrors.push({ name, error: message });
      }
    }

    console.log(
      `[ProgramSyncOrchestrator] Initialized: ${this.clients.length} clients, ${this.initErrors.length} failed`
    );
  }

  /**
   * 모든 API를 병렬로 동기화
   *
   * @returns 동기화 통계
   */
  async syncAll(): Promise<SyncStats> {
    console.log('[ProgramSyncOrchestrator] Starting sync for all APIs...');
    console.log(
      `[ProgramSyncOrchestrator] Active clients: ${this.clients.map(c => c.getDataSource()).join(', ')}`
    );

    if (this.initErrors.length > 0) {
      console.warn(
        `[ProgramSyncOrchestrator] ⚠️ Init failures: ${this.initErrors.map(e => `${e.name}: ${e.error}`).join('; ')}`
      );
    }

    // Promise.allSettled로 병렬 동기화 (부분 실패 허용)
    const results = await Promise.allSettled(
      this.clients.map(client => this.syncFromClient(client))
    );

    // 결과 집계 (성공한 클라이언트)
    const syncResults: SyncResult[] = results.map((result, index) => {
      const dataSource = this.clients[index].getDataSource();

      if (result.status === 'fulfilled') {
        return {
          dataSource,
          success: true,
          count: result.value,
        };
      } else {
        console.error(`[ProgramSyncOrchestrator] ❌ ${dataSource} sync failed:`, result.reason);
        return {
          dataSource,
          success: false,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });

    // 초기화 실패한 클라이언트도 결과에 포함
    for (const initError of this.initErrors) {
      syncResults.push({
        dataSource: initError.name,
        success: false,
        error: `Client init failed: ${initError.error}`,
      });
    }

    const succeeded = syncResults.filter(r => r.success).length;
    const failed = syncResults.filter(r => !r.success).length;
    const programCount = syncResults.reduce((sum, r) => sum + (r.count || 0), 0);

    const stats: SyncStats = {
      total: syncResults.length,
      succeeded,
      failed,
      programCount,
      results: syncResults,
    };

    console.log('[ProgramSyncOrchestrator] Sync completed:', JSON.stringify(stats, null, 2));

    return stats;
  }

  /**
   * 동기화 메타데이터 조회/생성
   *
   * @param dataSource - 데이터 소스 이름
   * @returns 마지막 동기화 시간 (증분 동기화용), 없으면 null (전체 동기화)
   */
  private async getSyncMetadata(dataSource: string): Promise<Date | null> {
    try {
      const { data: metadata } = await supabaseAdmin
        .from('sync_metadata')
        .select('*')
        .eq('dataSource', dataSource)
        .single();

      if (metadata) {
        console.log(
          `[ProgramSyncOrchestrator] 🔄 Incremental sync for ${dataSource} since ${new Date(metadata.lastSyncedAt).toISOString()}`
        );
        return new Date(metadata.lastSyncedAt);
      } else {
        console.log(`[ProgramSyncOrchestrator] 🔄 Full sync for ${dataSource} (first time)`);
        return null;
      }
    } catch (error) {
      console.error(
        `[ProgramSyncOrchestrator] Error fetching sync metadata for ${dataSource}:`,
        error
      );
      return null; // 에러 발생 시 전체 동기화
    }
  }

  /**
   * 동기화 메타데이터 업데이트
   *
   * @param dataSource - 데이터 소스 이름
   * @param success - 동기화 성공 여부
   * @param count - 동기화된 프로그램 개수
   */
  private async updateSyncMetadata(
    dataSource: string,
    success: boolean,
    count: number
  ): Promise<void> {
    try {
      const now = new Date();

      // Get existing metadata to calculate new syncCount
      const { data: existing } = await supabaseAdmin
        .from('sync_metadata')
        .select('syncCount')
        .eq('dataSource', dataSource)
        .single();

      const newSyncCount = existing ? (existing.syncCount || 0) + 1 : 1;

      await supabaseAdmin.from('sync_metadata').upsert(
        {
          dataSource,
          lastSyncedAt: now.toISOString(),
          syncCount: newSyncCount,
          lastResult: success ? 'success' : 'failed',
          updatedAt: now.toISOString(),
        },
        {
          onConflict: 'dataSource',
        }
      );

      console.log(
        `[ProgramSyncOrchestrator] ✅ Updated sync metadata for ${dataSource}: ${count} programs, ${success ? 'success' : 'failed'}`
      );
    } catch (error) {
      console.error(
        `[ProgramSyncOrchestrator] Error updating sync metadata for ${dataSource}:`,
        error
      );
      // 메타데이터 업데이트 실패는 무시 (동기화 자체는 성공했으므로)
    }
  }

  /**
   * 단일 API 클라이언트에서 데이터를 동기화 (증분 동기화 지원)
   *
   * @param client - API 클라이언트
   * @returns 동기화된 프로그램 개수
   */
  private async syncFromClient(client: IProgramAPIClient): Promise<number> {
    const dataSource = client.getDataSource();
    const startTime = Date.now();
    console.log(`[ProgramSyncOrchestrator] Syncing from ${dataSource}...`);

    try {
      // ⭐ 증분 동기화: 마지막 동기화 시간 조회
      const lastSyncedAt = await this.getSyncMetadata(dataSource);

      let totalCount = 0;
      let currentPage = 1;
      const pageSize = 50;
      const maxPages = 100; // 안전장치: 최대 5000건 (50 * 100)
      const maxDurationMs = 50 * 1000; // 50초 타임아웃 (Vercel Free 60초 제한 내)
      let hasMore = true;

      // 페이지네이션으로 순회 (최대 페이지 수 및 시간 제한 적용)
      while (hasMore && currentPage <= maxPages) {
        // 타임아웃 체크
        const elapsed = Date.now() - startTime;
        if (elapsed > maxDurationMs) {
          console.warn(
            `[ProgramSyncOrchestrator] ⏱️ ${dataSource} timeout after ${Math.round(elapsed / 1000)}s, stopping at page ${currentPage} (${totalCount} programs synced)`
          );
          break;
        }
        // ⭐ API에서 프로그램 목록 조회 (증분 동기화 파라미터 전달)
        const rawPrograms = await client.fetchPrograms({
          page: currentPage,
          pageSize,
          registeredAfter: lastSyncedAt || undefined, // null이면 undefined로 변환
        });

        console.log(
          `[ProgramSyncOrchestrator] Fetched ${rawPrograms.length} programs from ${dataSource} (page ${currentPage})`
        );

        // 프로그램이 없으면 종료
        if (rawPrograms.length === 0) {
          hasMore = false;
          break;
        }

        // 각 프로그램을 데이터베이스에 upsert
        for (const raw of rawPrograms) {
          try {
            await this.upsertProgram(client, raw);
            totalCount++;
          } catch (error) {
            console.error(
              `[ProgramSyncOrchestrator] Error upserting program from ${dataSource}:`,
              error
            );
            // 개별 프로그램 upsert 실패는 무시하고 계속 진행
          }
        }

        // 반환된 프로그램 수가 pageSize보다 적으면 마지막 페이지
        if (rawPrograms.length < pageSize) {
          hasMore = false;
        } else {
          currentPage++;
        }
      }

      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(
        `[ProgramSyncOrchestrator] ✅ Successfully synced ${totalCount} programs from ${dataSource} (${currentPage} pages, ${elapsed}s)`
      );

      // ⭐ 동기화 메타데이터 업데이트
      await this.updateSyncMetadata(dataSource, true, totalCount);

      return totalCount;
    } catch (error) {
      console.error(`[ProgramSyncOrchestrator] Error syncing from ${dataSource}:`, error);

      // ⭐ 실패 시에도 메타데이터 업데이트 (재시도 시 전체 동기화 방지)
      await this.updateSyncMetadata(dataSource, false, 0);

      throw error;
    }
  }

  /**
   * HTML 엔티티만 디코딩 (HTML 태그는 유지)
   * KOCCA-Finance에서 사용 - 테이블, 리스트 등 구조 보존
   *
   * @param html - HTML 엔티티가 포함된 HTML 문자열
   * @returns HTML 엔티티가 디코딩된 HTML
   */
  private decodeHtmlEntities(html: string): string {
    return html
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&hellip;/g, '...')
      .replace(/&bull;/g, '•')
      .replace(/&nbsp;/g, ' ')
      .replace(/&middot;/g, '·')
      .replace(/&ndash;/g, '–')
      .replace(/&mdash;/g, '—')
      .replace(/&#(\d+);?/g, (match, code) => String.fromCharCode(parseInt(code))) // 숫자 엔티티 디코딩 (①, ②, •, ■ 등)
      .replace(/&[a-z]+;?/gi, '') // 남은 엔티티 제거
      .replace(/&amp;/g, '&'); // &amp;는 마지막에 처리
  }

  /**
   * KOCCA-Finance HTML 정리 (HTML 엔티티 디코딩 + HTML 태그 제거)
   * ⚠️ 현재 사용하지 않음 - decodeHtmlEntities로 대체
   *
   * @param html - HTML 엔티티가 포함된 문자열
   * @returns 깔끔한 텍스트
   */
  private cleanKoccaFinanceHtml(html: string): string {
    // 1. HTML 엔티티 디코딩 (&lt; → <, &quot; → ", etc.)
    let decoded = html
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');

    // 2. HTML 주석 제거 (<!-- ... -->)
    decoded = decoded.replace(/<!--[\s\S]*?-->/g, '');

    // 3. HTML 태그 제거
    decoded = decoded.replace(/<[^>]*>/g, '');

    // 4. 숫자 형식 HTML 엔티티 제거 (&#9312;, &#9313; 등)
    decoded = decoded.replace(/&#\d+;?/g, '');

    // 5. 이름 있는 HTML 엔티티 정리 (따옴표, 줄임표, 불릿 등)
    decoded = decoded
      .replace(/&nbsp;/g, ' ')
      .replace(/&middot;/g, '·')
      .replace(/&ndash;/g, '–')
      .replace(/&mdash;/g, '—')
      .replace(/&lsquo;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&hellip;/g, '...')
      .replace(/&bull;/g, '•');

    // 6. 남은 모든 HTML 엔티티 제거 (&로 시작하는 패턴)
    decoded = decoded.replace(/&[a-z]+;?/gi, '');

    // 7. 연속된 공백 정리
    decoded = decoded.replace(/\s+/g, ' ').trim();

    return decoded;
  }

  /**
   * 프로그램 데이터를 데이터베이스에 추가 (신규만)
   * ⭐ 기존 데이터는 절대 수정하지 않음 - 신규 데이터만 추가
   * ⭐ 2025년 이후 데이터만 저장 (오래된 데이터 필터링)
   *
   * @param client - API 클라이언트
   * @param raw - 원본 프로그램 데이터
   */
  private async upsertProgram(client: IProgramAPIClient, raw: RawProgramData): Promise<void> {
    const dataSource = client.getDataSource();

    // 원본 ID 추출 (API별 필드명이 다름, 문자열로 변환)
    const sourceApiIdRaw =
      raw.pblancId || // 기업마당
      raw.pbanc_sn || // K-Startup (숫자)
      raw.intcNoSeq || // KOCCA-PIMS
      raw.seq || // KOCCA-Finance (link에서 추출)
      raw.id ||
      raw.announcementId ||
      raw.bizId ||
      raw.noticeId;

    const sourceApiId = sourceApiIdRaw ? String(sourceApiIdRaw) : null;

    if (!sourceApiId) {
      console.warn(`[ProgramSyncOrchestrator] Skipping program without ID from ${dataSource}`, raw);
      return;
    }

    // ⭐ 기존 데이터 존재 여부 확인
    const { data: existing } = await supabaseAdmin
      .from('programs')
      .select('id')
      .eq('dataSource', dataSource)
      .eq('sourceApiId', sourceApiId)
      .single();

    // 이미 존재하면 아무것도 하지 않음 (기존 데이터 보존)
    if (existing) {
      console.log(
        `[ProgramSyncOrchestrator] Program already exists, skipping: ${dataSource}-${sourceApiId}`
      );
      return;
    }

    // 필드 추출 (API별 필드명이 다름)
    const title =
      (raw.pblancNm as string) || // 기업마당
      (raw.biz_pbanc_nm as string) || // K-Startup
      (raw.title as string) ||
      (raw.announcementTitle as string) ||
      '제목 없음';

    // K-Startup의 경우 섹션별로 구조화된 description 생성
    let description: string | null = null;
    if (dataSource === 'K-Startup') {
      const sections: string[] = [];

      // 공고 상세
      if (raw.pbanc_ctnt && typeof raw.pbanc_ctnt === 'string') {
        sections.push(`공고 상세: ${raw.pbanc_ctnt}`);
      }

      // 지원 대상
      if (raw.aply_trgt_ctnt && typeof raw.aply_trgt_ctnt === 'string') {
        sections.push(`지원 대상: ${raw.aply_trgt_ctnt}`);
      }

      // 연령 제한
      if (raw.biz_trgt_age && typeof raw.biz_trgt_age === 'string') {
        sections.push(`연령 제한: ${raw.biz_trgt_age}`);
      }

      // 지원 제한 대상
      if (raw.aply_excl_trgt_ctnt && typeof raw.aply_excl_trgt_ctnt === 'string') {
        sections.push(`지원 제한 대상: ${raw.aply_excl_trgt_ctnt}`);
      }

      // 주관 기관
      if (raw.pbanc_ntrp_nm && typeof raw.pbanc_ntrp_nm === 'string') {
        sections.push(`주관 기관: ${raw.pbanc_ntrp_nm}`);
      }

      // 지원 분야
      if (raw.supt_biz_clsfc && typeof raw.supt_biz_clsfc === 'string') {
        sections.push(`지원 분야: ${raw.supt_biz_clsfc}`);
      }

      description = sections.length > 0 ? sections.join('\n\n') : null;
    } else if (dataSource === 'KOCCA-Finance') {
      // KOCCA-Finance의 경우 HTML 엔티티만 디코딩, HTML 태그는 유지 (구조 보존)
      const rawContent = (raw.content as string) || null;
      if (rawContent) {
        description = this.decodeHtmlEntities(rawContent);
      }
    } else if (dataSource === '서울테크노파크' || dataSource === '경기테크노파크') {
      // 테크노파크의 경우 사업유형, 주관기관 정보를 description에 포함
      const sections: string[] = [];

      if (raw.businessType && typeof raw.businessType === 'string') {
        sections.push(`사업유형: ${raw.businessType}`);
      }
      if (raw.hostOrganization && typeof raw.hostOrganization === 'string') {
        sections.push(`주관기관: ${raw.hostOrganization}`);
      }
      if (raw.applicationPeriod && typeof raw.applicationPeriod === 'string') {
        sections.push(`신청기간: ${raw.applicationPeriod}`);
      }
      if (raw.author && typeof raw.author === 'string') {
        sections.push(`작성자: ${raw.author}`);
      }

      description = sections.length > 0 ? sections.join('\n') : null;
    } else {
      // 기업마당, KOCCA-PIMS 등 다른 API
      description =
        (raw.bsnsSumryCn as string) || // 기업마당
        (raw.description as string) ||
        (raw.content as string) ||
        null;
    }

    const category =
      (raw.pldirSportRealmLclasCodeNm as string) || // 기업마당
      (raw.supt_biz_clsfc as string) || // K-Startup
      (raw.cate as string) || // KOCCA-PIMS
      (raw.businessType as string) || // 테크노파크 (사업유형)
      (raw.category as string) ||
      null;
    const targetAudience = client.parseTargetAudience(raw);
    const targetLocation = client.parseLocation(raw);
    const keywords = client.extractKeywords(raw);
    const budgetRange = (raw.budgetRange as string) || null;
    const deadline = client.parseDeadline(raw); // ⭐ API 클라이언트가 마감일 추출
    const sourceUrl = client.parseSourceUrl(raw); // ⭐ API 클라이언트가 URL 추출
    const attachmentUrl = client.parseAttachmentUrl(raw); // ⭐ API 클라이언트가 첨부파일 URL 추출
    const registeredAt = client.parseRegisteredAt(raw); // ⭐ 교차 정렬용
    const startDate = client.parseStartDate(raw); // ⭐ API 클라이언트가 시작일 추출
    const endDate = deadline; // ⭐ endDate는 deadline과 동일

    // ⭐ 2025년 1월 1일 이전 데이터는 스킵 (오래된 데이터 필터링)
    const cutoffDate = new Date('2025-01-01');
    if (registeredAt < cutoffDate) {
      console.log(
        `[ProgramSyncOrchestrator] ⏭️  Skipping old program (registered: ${registeredAt.toISOString().split('T')[0]}) from ${dataSource}`
      );
      return;
    }

    // ⭐ 신규 프로그램만 생성 (기존 데이터는 위에서 이미 체크하여 리턴됨)
    await supabaseAdmin.from('programs').insert({
      dataSource,
      sourceApiId,
      title,
      description,
      category,
      targetAudience,
      targetLocation,
      keywords,
      budgetRange,
      deadline: deadline?.toISOString(),
      sourceUrl,
      attachmentUrl, // ⭐ 첨부파일 URL (기업마당 API만 제공)
      registeredAt: registeredAt?.toISOString(), // ⭐ 교차 정렬용
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      rawData: raw as object,
      syncStatus: 'active',
    });

    console.log(
      `[ProgramSyncOrchestrator] ✅ New program added: ${dataSource}-${sourceApiId} - ${title}`
    );
  }

  /**
   * 리소스 정리 (Supabase는 연결 해제 불필요)
   */
  async dispose(): Promise<void> {
    // Supabase는 자동으로 연결 관리, 별도 해제 불필요
  }
}
