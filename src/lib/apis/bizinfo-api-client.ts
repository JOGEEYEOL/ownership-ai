/**
 * @file bizinfo-api-client.ts
 * @description 기업마당 API 클라이언트 (중소벤처기업부)
 * Phase 3: 다중 API 통합 연동
 */

import type { IProgramAPIClient, RawProgramData, SyncParams } from './base-api-client';
import { withRetry } from '@/lib/utils/api-retry';
import { APIError, ErrorCode } from '@/lib/utils/error-handler';

/**
 * 기업마당 API 응답 타입
 */
interface BizinfoResponse {
  jsonArray?: BizinfoProgramData[]; // 실제 응답 형식
  result?: BizinfoProgramData[];
  response?: {
    header?: {
      resultCode?: string;
      resultMsg?: string;
    };
    body?: {
      items?: BizinfoProgramData[];
      totalCount?: number;
      numOfRows?: number;
      pageNo?: number;
    };
  };
  reqErr?: string; // 에러 메시지
}

/**
 * 기업마당 프로그램 데이터 구조
 */
interface BizinfoProgramData {
  pblancId?: string; // 공고 ID (실제 필드명)
  pblancNm?: string; // 공고명 (실제 필드명)
  bsnsSumryCn?: string; // 사업 요약 내용
  pldirSportRealmLclasCodeNm?: string; // 정책지원영역 대분류
  pldirSportRealmMlsfcCodeNm?: string; // 정책지원영역 중분류
  trgetNm?: string; // 대상명
  jrsdInsttNm?: string; // 관할 기관명
  reqstBeginEndDe?: string; // 신청 시작/종료일
  creatPnttm?: string; // 등록일시 (실제 필드명)
  pblancUrl?: string; // 공고 URL
  hashtags?: string; // 해시태그
  flpthNm?: string; // 첨부파일 경로 (file path name)
  [key: string]: unknown;
}

/**
 * 기업마당 지원 분야 코드 (참고용)
 *
 * ⭐ 현재는 searchLclasId 없이 전체 분야를 한 번에 조회
 * 필요 시 개별 분야별 조회도 가능:
 * - 01: 금융
 * - 02: 기술
 * - 03: 인력
 * - 04: 수출
 * - 05: 내수
 * - 06: 창업
 * - 07: 경영
 * - 09: 기타
 */

/**
 * 기업마당 API 클라이언트
 *
 * 중소벤처기업부의 기업마당 API를 통해 정부지원사업 데이터를 조회
 *
 * API 엔드포인트: https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do
 * 파라미터:
 * - crtfcKey: API 키 (필수)
 * - dataType: json (필수)
 * - searchCnt: 조회 건수
 * - pageIndex: 페이지 번호 (1부터 시작)
 * - pageUnit: 페이지당 건수
 *
 * ⭐ searchLclasId 미사용 시 전체 분야의 지원사업을 한 번에 조회 가능
 */
export class BizinfoAPIClient implements IProgramAPIClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    const apiKey = process.env.BIZINFO_API_KEY;
    const baseUrl = process.env.BIZINFO_API_BASE_URL;

    if (!apiKey || !baseUrl) {
      throw new Error(
        'BIZINFO_API_KEY or BIZINFO_API_BASE_URL is not defined in environment variables'
      );
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * 데이터 소스 이름 반환
   */
  getDataSource(): string {
    return '기업마당';
  }

  /**
   * 기업마당 API에서 프로그램 목록 조회
   * ⭐ searchLclasId 미사용으로 모든 분야(01~09)의 지원사업을 한 번에 조회
   *
   * ⚠️ 기업마당 API는 날짜 필터링을 지원하지 않음
   * params.registeredAfter는 무시되고 항상 전체 데이터 조회 (Full Sync)
   *
   * @param params - 페이지네이션 파라미터
   * @returns 원본 프로그램 데이터 배열
   */
  async fetchPrograms(params: SyncParams): Promise<RawProgramData[]> {
    // ⚠️ 증분 동기화 미지원: registeredAfter 무시, 전체 동기화만 가능
    if (params.registeredAfter) {
      console.log(
        `[BizinfoAPI] ⚠️ 기업마당 API does not support date filtering. Performing full sync.`
      );
    }

    console.log(`[BizinfoAPI] Fetching programs: page=${params.page}, pageSize=${params.pageSize}`);

    // RetryStrategy로 API 호출 (Exponential Backoff + Jitter)
    return withRetry(
      async () => {
        // API URL 생성 (searchLclasId 없이 전체 분야 조회)
        const url = `${this.baseUrl}?crtfcKey=${this.apiKey}&dataType=json&searchCnt=${params.pageSize}&pageIndex=${params.page}&pageUnit=${params.pageSize}`;

        // API 호출
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          // HTTP 상태 코드에 따라 적절한 ErrorCode 사용
          let errorCode: ErrorCode;
          if (response.status === 429) {
            errorCode = ErrorCode.RATE_LIMIT_EXCEEDED;
          } else if (response.status === 408 || response.status === 504) {
            errorCode = ErrorCode.API_TIMEOUT;
          } else if (response.status === 503) {
            errorCode = ErrorCode.API_UNAVAILABLE;
          } else {
            errorCode = ErrorCode.EXTERNAL_API_ERROR;
          }

          throw new APIError(
            errorCode,
            `[BizinfoAPI] API error: ${response.status} ${response.statusText}`,
            { statusCode: response.status, statusText: response.statusText },
            response.status
          );
        }

        const data: BizinfoResponse = await response.json();

        // 에러 체크
        if (data.reqErr) {
          throw new APIError(
            ErrorCode.EXTERNAL_API_ERROR,
            `[BizinfoAPI] API error: ${data.reqErr}`,
            { errorMessage: data.reqErr }
          );
        }

        // 응답 데이터 추출 (실제 응답은 jsonArray)
        const programs = data.jsonArray || data.result || data.response?.body?.items || [];

        console.log(`[BizinfoAPI] ✅ Fetched ${programs.length} programs from all categories`);

        return programs as RawProgramData[];
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: (attempt, delay, error) => {
          console.warn(`[BizinfoAPI] ⚠️ Retry attempt ${attempt}, waiting ${delay}ms`, {
            error: error.message,
          });
        },
      }
    );
  }

  /**
   * 키워드 추출 (해시태그 활용)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 키워드 배열
   */
  extractKeywords(raw: RawProgramData): string[] {
    const data = raw as BizinfoProgramData;
    const keywords: string[] = [];

    // 해시태그에서 키워드 추출 (쉼표로 구분됨)
    if (data.hashtags) {
      const hashtagWords = data.hashtags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      keywords.push(...hashtagWords);
    }

    // 정책지원영역을 키워드로 추가
    if (data.pldirSportRealmLclasCodeNm) {
      keywords.push(data.pldirSportRealmLclasCodeNm);
    }
    if (data.pldirSportRealmMlsfcCodeNm) {
      keywords.push(data.pldirSportRealmMlsfcCodeNm);
    }

    // 중복 제거 및 정리
    return Array.from(new Set(keywords)).slice(0, 15);
  }

  /**
   * 대상 지역 추출 (관할 기관명에서 지역 추출)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 지역 배열
   */
  parseLocation(raw: RawProgramData): string[] {
    const data = raw as BizinfoProgramData;
    const locations: string[] = [];

    // 관할 기관명에서 지역 추출 (예: "전라남도", "부산광역시")
    if (data.jrsdInsttNm) {
      // 시/도 이름 추출
      const locationMatch = data.jrsdInsttNm.match(
        /(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/
      );
      if (locationMatch) {
        locations.push(locationMatch[1]);
      }
    }

    // 공고명에서도 지역 추출 시도 (예: "[전남]", "[부산]")
    if (data.pblancNm) {
      const locationMatch = data.pblancNm.match(
        /\[(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)\]/
      );
      if (locationMatch) {
        locations.push(locationMatch[1]);
      }
    }

    // 기본값: 전국
    return locations.length > 0 ? Array.from(new Set(locations)) : ['전국'];
  }

  /**
   * 대상 업종 추출 (대상명 활용)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 업종 배열
   */
  parseTargetAudience(raw: RawProgramData): string[] {
    const data = raw as BizinfoProgramData;
    const audiences: string[] = [];

    // 대상명에서 업종 추출 (예: "중소기업", "사회적기업")
    if (data.trgetNm && typeof data.trgetNm === 'string') {
      const audienceParts = data.trgetNm.split(/[,\/]+/).map((aud: string) => aud.trim());
      audiences.push(...audienceParts);
    }

    // 기본값: 전체
    return audiences.length > 0 ? audiences : ['전체'];
  }

  /**
   * 등록일 추출 (교차 정렬용)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 등록일 (Date 객체)
   */
  parseRegisteredAt(raw: RawProgramData): Date {
    const data = raw as BizinfoProgramData;

    // creatPnttm 필드 파싱 시도 (형식: "2025-11-28 13:23:16")
    if (data.creatPnttm && typeof data.creatPnttm === 'string') {
      const date = new Date(data.creatPnttm);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // 파싱 실패 시 현재 날짜 반환
    console.warn('[BizinfoAPI] Failed to parse creatPnttm, using current date');
    return new Date();
  }

  /**
   * 공고 URL 추출 (pblancUrl 필드 활용)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 공고 URL (없으면 null)
   */
  parseSourceUrl(raw: RawProgramData): string | null {
    const data = raw as BizinfoProgramData;

    if (data.pblancUrl && typeof data.pblancUrl === 'string') {
      const url = data.pblancUrl.trim();
      if (!url) {
        return null;
      }

      // 2026-03-13부터 API가 절대 URL로 응답 형식을 변경했음. 둘 다 처리.
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      return `https://www.bizinfo.go.kr${url}`;
    }

    return null;
  }

  /**
   * 시작일 추출 (reqstBeginEndDe 필드에서 시작일 파싱)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 시작일 (Date 객체 또는 null)
   */
  parseStartDate(raw: RawProgramData): Date | null {
    const data = raw as BizinfoProgramData;

    // reqstBeginEndDe 필드 파싱 시도 (형식: "20251201 ~ 20251231" 또는 "2025-01-01 ~ 2025-12-31")
    if (data.reqstBeginEndDe && typeof data.reqstBeginEndDe === 'string') {
      const parts = data.reqstBeginEndDe.split('~').map(s => s.trim());
      if (parts.length >= 1 && parts[0]) {
        let dateStr = parts[0];

        // YYYYMMDD 형식을 YYYY-MM-DD로 변환
        if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
          dateStr = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        }

        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    return null;
  }

  /**
   * 마감일 추출 (reqstBeginEndDe 필드에서 마감일 파싱)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 마감일 (Date 객체 또는 null)
   */
  parseDeadline(raw: RawProgramData): Date | null {
    const data = raw as BizinfoProgramData;

    // reqstBeginEndDe 필드 파싱 시도 (형식: "20251201 ~ 20251231" 또는 "2025-01-01 ~ 2025-12-31")
    if (data.reqstBeginEndDe && typeof data.reqstBeginEndDe === 'string') {
      const parts = data.reqstBeginEndDe.split('~').map(s => s.trim());
      if (parts.length >= 2 && parts[1]) {
        let dateStr = parts[1];

        // YYYYMMDD 형식을 YYYY-MM-DD로 변환
        if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
          dateStr = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        }

        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    return null;
  }

  /**
   * 첨부파일 URL 추출 (flpthNm 필드 활용)
   *
   * @param raw - 원본 프로그램 데이터
   * @returns 첨부파일 URL (없으면 null)
   */
  parseAttachmentUrl(raw: RawProgramData): string | null {
    const data = raw as BizinfoProgramData;

    if (data.flpthNm && typeof data.flpthNm === 'string') {
      // 여러 개의 첨부파일이 @ 구분자로 연결된 경우 첫 번째만 사용
      const firstFile = data.flpthNm.split('@')[0].trim();

      if (!firstFile) {
        return null;
      }

      // 이미 프로토콜이 있으면 그대로 반환 (http:// 또는 https://)
      if (firstFile.startsWith('http://') || firstFile.startsWith('https://')) {
        return firstFile;
      }
      // 상대 경로인 경우 base URL 추가
      return `https://www.bizinfo.go.kr${firstFile}`;
    }

    return null;
  }
}
