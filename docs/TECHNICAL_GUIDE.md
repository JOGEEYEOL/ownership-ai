# Ownership AI - 기술 문서

> **개발자를 위한 아키텍처, API, 데이터베이스 가이드**

---

## 목차

1. [기술 스택](#1-기술-스택)
2. [프로젝트 구조](#2-프로젝트-구조)
3. [인증 및 권한](#3-인증-및-권한)
4. [데이터베이스 스키마](#4-데이터베이스-스키마)
5. [API 레퍼런스](#5-api-레퍼런스)
6. [프론트엔드 아키텍처](#6-프론트엔드-아키텍처)
7. [외부 API 연동](#7-외부-api-연동)
8. [개발 환경 설정](#8-개발-환경-설정)
9. [성능 최적화](#9-성능-최적화)
10. [테스트](#10-테스트)
11. [배포](#11-배포)

---

## 1. 기술 스택

### Core

| 기술        | 버전 | 용도                              |
| ----------- | ---- | --------------------------------- |
| Next.js     | 15   | App Router 기반 풀스택 프레임워크 |
| React       | 19.2 | UI 라이브러리                     |
| TypeScript  | 5    | 타입 안전성                       |
| Supabase    | -    | PostgreSQL DB + Auth + Storage    |
| TailwindCSS | 4    | 유틸리티 기반 스타일링            |

### 상태 관리 & 폼

| 기술                    | 용도                 |
| ----------------------- | -------------------- |
| @tanstack/react-query 5 | 서버 상태 관리, 캐싱 |
| react-hook-form 7       | 폼 관리              |
| zod 4                   | 런타임 검증          |

### UI 컴포넌트

| 기술                | 용도               |
| ------------------- | ------------------ |
| shadcn/ui (Radix)   | 기본 UI 컴포넌트   |
| Lucide React        | 아이콘             |
| Framer Motion       | 애니메이션         |
| Sonner              | 토스트 알림        |
| TipTap              | 리치 텍스트 에디터 |
| Recharts            | 차트               |
| @react-pdf/renderer | PDF 생성           |

### 개발 도구

| 기술                  | 용도        |
| --------------------- | ----------- |
| ESLint 9              | 린팅        |
| Prettier 3            | 코드 포매팅 |
| Husky + lint-staged   | 커밋 훅     |
| Playwright            | E2E 테스트  |
| @next/bundle-analyzer | 번들 분석   |

---

## 2. 프로젝트 구조

```
src/
├── app/                          # Next.js App Router
│   ├── (auth-pages)/             # 인증 관련 레이아웃 그룹
│   ├── admin/                    # 관리자 페이지
│   │   ├── education/            # 교육 콘텐츠 관리
│   │   │   ├── videos/           # 영상 관리
│   │   │   ├── resources/        # 자료실 관리
│   │   │   └── knowhow/          # 노하우 관리
│   │   ├── settings/             # 시스템 설정
│   │   └── users/                # 사용자 관리
│   ├── api/                      # API 라우트
│   │   ├── admin/                # 관리자 전용 API
│   │   ├── analytics/            # 분석 API
│   │   ├── auth/                 # 인증 API
│   │   ├── customers/            # 고객 API
│   │   ├── education/            # 교육 API
│   │   ├── matching/             # 매칭 API
│   │   └── programs/             # 프로그램 API
│   ├── auth/                     # 인증 페이지
│   ├── customers/                # 고객 관리 페이지
│   ├── dashboard/                # 대시보드
│   ├── education/                # 교육 센터
│   └── programs/                 # 프로그램 조회
│
├── components/                   # 컴포넌트 (Feature-Based)
│   ├── admin/                    # 관리자 컴포넌트
│   ├── auth/                     # 인증 컴포넌트
│   ├── common/                   # 공통 컴포넌트
│   ├── customers/                # 고객 관리
│   ├── dashboard/                # 대시보드
│   ├── editor/                   # 에디터
│   ├── education/                # 교육 센터
│   ├── landing/                  # 랜딩 페이지
│   ├── layout/                   # 레이아웃
│   ├── matching/                 # 매칭
│   ├── programs/                 # 프로그램
│   └── ui/                       # shadcn/ui 기본 컴포넌트
│
├── hooks/                        # 커스텀 훅
│   ├── useAuth.ts
│   ├── useCustomers.ts
│   ├── useEducation.ts
│   └── useRoles.ts
│
├── lib/                          # 유틸리티 & 설정
│   ├── auth/                     # 인증/권한 헬퍼
│   │   ├── requireAdmin.ts       # 관리자 미들웨어
│   │   └── roles.ts              # 역할/권한 정의
│   ├── hooks/                    # 라이브러리 훅
│   ├── supabase/                 # Supabase 클라이언트
│   │   ├── admin.ts              # Service Role 클라이언트
│   │   ├── client.ts             # 브라우저 클라이언트
│   │   └── server.ts             # 서버 클라이언트
│   ├── utils/                    # 유틸리티 함수
│   ├── validations/              # Zod 검증 스키마
│   ├── fonts.ts                  # 폰트 설정
│   └── react-query.tsx           # React Query 설정
│
└── types/                        # TypeScript 타입 정의
```

### 핵심 설계 원칙

- **Feature-Based 구조**: 컴포넌트를 기술 유형이 아닌 비즈니스 도메인별로 분류
- **Server Components 우선**: 가능한 한 서버 컴포넌트 사용, 클라이언트 상태가 필요한 경우만 `'use client'`
- **코드 재사용**: `GenericCategoryManager` 패턴으로 유사한 CRUD 관리 UI 통합

---

## 3. 인증 및 권한

### 3.1 인증 흐름

```
[사용자] → Supabase Auth (이메일/비밀번호)
         → Session Cookie (SSR 지원)
         → createClient() / createServerClient()
```

### 3.2 Supabase 클라이언트 종류

| 클라이언트              | 파일                     | 용도                                   |
| ----------------------- | ------------------------ | -------------------------------------- |
| `createClient()`        | `lib/supabase/server.ts` | 서버 컴포넌트/API 라우트 (사용자 권한) |
| `createBrowserClient()` | `lib/supabase/client.ts` | 클라이언트 컴포넌트                    |
| `supabaseAdmin`         | `lib/supabase/admin.ts`  | Service Role (RLS 우회, 관리자 전용)   |

### 3.3 권한 체크 패턴

```typescript
// API 라우트에서 관리자 권한 체크
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (!authResult.success) {
    return authResult.response; // 401 또는 403
  }
  // authResult.user 사용 가능
}
```

```typescript
// API 라우트에서 교육 센터 접근 체크
import { requireEducationAccess } from '@/lib/auth/roles';

export async function GET(request: NextRequest) {
  const authResult = await requireEducationAccess(request);
  if (!authResult.success) {
    return authResult.response;
  }
}
```

### 3.4 역할 시스템

**테이블 구조**:

```
roles (역할 정의)
  ├── id (UUID, PK)
  ├── name (unique)
  ├── displayName (한글명)
  ├── permissions (JSON)
  ├── isSystem (시스템 역할 삭제 불가)
  └── order

user_roles (사용자-역할 매핑)
  ├── userId (FK → auth.users)
  ├── roleId (FK → roles)
  └── @@unique([userId, roleId])
```

**권한 목록**:

| 권한 키               | 설명             |
| --------------------- | ---------------- |
| `admin_panel`         | 관리자 패널 접근 |
| `user_management`     | 사용자 관리      |
| `role_management`     | 역할 관리        |
| `education_center`    | 교육 센터 접근   |
| `customer_management` | 고객 관리        |
| `program_sync`        | 프로그램 동기화  |
| `matching`            | AI 매칭 실행     |
| `resources`           | 자료실 관리      |

### 3.5 클라이언트 권한 확인 훅

```typescript
import { useIsAdmin, useHasPermission } from '@/hooks/useRoles';

function MyComponent() {
  const isAdmin = useIsAdmin();
  const canManageUsers = useHasPermission('user_management');
}
```

---

## 4. 데이터베이스 스키마

### 4.1 네이밍 컨벤션

| 대상        | 규칙                   | 예시                                 |
| ----------- | ---------------------- | ------------------------------------ |
| 테이블명    | `snake_case`           | `education_videos`, `resource_types` |
| 컬럼명      | `camelCase`            | `userId`, `categoryId`, `createdAt`  |
| FK 제약조건 | PostgreSQL 자동 소문자 | `resources_typeid_fkey`              |

### 4.2 주요 테이블

#### 고객 관리

```sql
-- customers: 고객 정보
customers (
  id text PK DEFAULT gen_random_uuid()::text,
  "userId" text FK → auth.users,
  "businessNumber" text NOT NULL,     -- 사업자번호 (10자리)
  "businessType" text NOT NULL,       -- INDIVIDUAL / CORPORATE
  name text NOT NULL,                 -- 기업명
  industry text NOT NULL,             -- 업종
  location text NOT NULL,             -- 소재지
  keywords text[] DEFAULT '{}',       -- 키워드 배열
  budget integer,
  "contactEmail" text,
  "contactPhone" text,
  notes text,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
)

-- customer_watchlist: 관심 프로그램
customer_watchlist (
  id text PK,
  "customerId" text FK → customers,
  "programId" text FK → programs,
  "addedAt" timestamptz,
  notes text,
  UNIQUE("customerId", "programId")
)

-- customer_projects: 사업 진행 관리
customer_projects (
  id text PK,
  "customerId" text FK → customers,
  title text NOT NULL,
  status text DEFAULT 'planning',     -- planning/in_progress/completed/paused
  "relatedPrograms" text[],
  "createdAt" timestamptz,
  "updatedAt" timestamptz
)
```

#### 프로그램

```sql
-- programs: 정부지원사업
programs (
  id text PK,
  "dataSource" text NOT NULL,         -- msme, kstartup 등
  "sourceApiId" text NOT NULL,        -- 외부 API 원본 ID
  title text NOT NULL,
  description text,
  category text,
  "targetAudience" text[],
  "targetLocation" text[],
  keywords text[],
  deadline timestamptz,
  "sourceUrl" text,
  "attachmentUrl" text,
  "rawData" jsonb,                    -- 원본 API 응답 보관
  "syncStatus" text,
  "lastSyncedAt" timestamptz,
  UNIQUE("dataSource", "sourceApiId")
)
```

#### 매칭

```sql
-- matching_results: AI 매칭 결과
matching_results (
  id text PK,
  "customerId" text FK → customers,
  "programId" text FK → programs,
  score integer NOT NULL,             -- 0~100
  "matchedIndustry" boolean,
  "matchedLocation" boolean,
  "matchedKeywords" text[],
  "createdAt" timestamptz
)
```

#### 교육 센터

```sql
-- education_videos: 교육 영상
education_videos (
  id text PK,
  title text NOT NULL,
  description text,
  "categoryId" text FK → video_categories,
  category text,                      -- 카테고리명 (조회 편의용)
  "videoUrl" text NOT NULL,
  "videoType" text DEFAULT 'youtube', -- youtube/vimeo/file
  "thumbnailUrl" text,
  duration integer,                   -- 초 단위
  "viewCount" integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  "createdAt" timestamptz,
  "updatedAt" timestamptz
)

-- video_categories
video_categories (
  id text PK,
  name text NOT NULL UNIQUE,
  description text,
  "order" integer DEFAULT 0,
  "createdAt" timestamptz,
  "updatedAt" timestamptz
)

-- resources: 교육 자료
resources (
  id text PK,
  title text NOT NULL,
  description text,
  "typeId" text FK → resource_types,  -- 자료 유형
  "categoryId" text FK → resource_categories,
  "fileUrl" text NOT NULL,
  "fileName" text NOT NULL,
  "fileSize" integer,
  "downloadCount" integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  "videoId" text FK → education_videos,  -- 연결된 비디오 (선택)
  "createdAt" timestamptz,
  "updatedAt" timestamptz
)

-- resource_categories
resource_categories (
  id text PK,
  name text NOT NULL UNIQUE,
  description text,
  "order" integer DEFAULT 0,
  "createdAt" timestamptz,
  "updatedAt" timestamptz
)

-- resource_types: 자료 유형
resource_types (
  id text PK,
  name text NOT NULL UNIQUE,
  description text,
  "order" integer DEFAULT 0,
  "createdAt" timestamptz,
  "updatedAt" timestamptz
)

-- knowhow_posts: 노하우 게시글
knowhow_posts (
  id text PK,
  title text NOT NULL,
  content text NOT NULL,
  "authorName" text NOT NULL,
  "userId" text FK → auth.users,
  "categoryId" text FK → knowhow_categories,
  "viewCount" integer DEFAULT 0,
  "isPinned" boolean DEFAULT false,
  "isAnnouncement" boolean DEFAULT false,
  "isEvent" boolean DEFAULT false,
  "startDate" timestamptz,            -- 이벤트 시작일
  "endDate" timestamptz,              -- 이벤트 종료일
  "createdAt" timestamptz,
  "updatedAt" timestamptz
)

-- knowhow_comments: 댓글 (대댓글 지원)
knowhow_comments (
  id text PK,
  content text NOT NULL,
  "authorName" text NOT NULL,
  "userId" text FK → auth.users,
  "postId" text FK → knowhow_posts,
  "parentId" text FK → knowhow_comments (self),  -- 대댓글
  "createdAt" timestamptz,
  "updatedAt" timestamptz
)
```

#### 설정

```sql
-- keyword_categories + keywords: 키워드 관리
-- copy_templates: 커뮤니케이션 템플릿
-- copy_snippets: 단문 스니펫
-- template_variables: 템플릿 변수 정의
-- inquiries: 문의/피드백
```

### 4.3 RLS (Row Level Security)

모든 테이블에 RLS가 활성화되어 있습니다:

- `SELECT`: 인증된 사용자 (`authenticated`) + 익명 사용자 (`anon`) 읽기 허용 (교육 관련 테이블)
- `INSERT/UPDATE/DELETE`: 인증된 사용자만 허용
- 관리자 API는 `supabaseAdmin` (Service Role)으로 RLS 우회

### 4.4 인덱스

주요 인덱스 (30개 이상):

```sql
-- 고객 테이블
idx_customers_userId, idx_customers_industry,
idx_customers_location, idx_customers_createdAt

-- 프로그램 테이블
idx_programs_dataSource_sourceApiId (UNIQUE),
idx_programs_deadline, idx_programs_category

-- 매칭 결과
idx_matching_customerId, idx_matching_programId,
idx_matching_score

-- 교육 콘텐츠
idx_resources_categoryId, idx_resources_typeId,
idx_resources_videoId, idx_resources_downloadCount
idx_education_videos_categoryId, idx_education_videos_viewCount
idx_knowhow_posts_categoryId, idx_knowhow_posts_viewCount
```

---

## 5. API 레퍼런스

### 5.1 응답 형식 (표준)

**성공 응답**:

```typescript
{
  success: true,
  data: T,
  metadata?: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

**에러 응답**:

```typescript
{
  success: false,
  error: {
    code: string,      // 'UNAUTHORIZED', 'NOT_FOUND', 'INVALID_INPUT' 등
    message: string,   // 사용자 표시용 메시지
    details?: unknown  // 상세 정보 (Zod 에러 등)
  }
}
```

### 5.2 HTTP 상태 코드

| 코드 | 용도               |
| ---- | ------------------ |
| 200  | 성공 (GET, PATCH)  |
| 201  | 생성 성공 (POST)   |
| 204  | 삭제 성공 (DELETE) |
| 400  | 유효성 검증 실패   |
| 401  | 인증 필요          |
| 403  | 권한 부족          |
| 404  | 리소스 없음        |
| 409  | 중복/충돌          |
| 500  | 서버 에러          |

### 5.3 주요 API 엔드포인트

#### 고객 API

```
GET    /api/customers              - 목록 조회 (?page=1&limit=20&search=&industry=)
POST   /api/customers              - 고객 등록
GET    /api/customers/:id          - 상세 조회
PUT    /api/customers/:id          - 수정
DELETE /api/customers/:id          - 삭제
POST   /api/customers/bulk         - CSV 대량 등록
GET    /api/customers/bulk/template - CSV 템플릿 다운로드
```

#### 프로그램 API

```
GET    /api/programs               - 목록 조회 (?page=&search=&category=)
GET    /api/programs/:id           - 상세 조회
POST   /api/programs/sync          - 외부 API 동기화
```

#### 매칭 API

```
POST   /api/matching               - 매칭 실행 { customerId }
GET    /api/matching/:id           - 매칭 결과 조회
DELETE /api/matching/:id           - 매칭 결과 삭제
```

#### 교육 API

```
# 비디오
GET    /api/education/videos                    - 목록
GET    /api/education/videos/:id                - 상세
POST   /api/education/videos/:id/view           - 조회수 증가

# 자료실
GET    /api/education/resources                 - 목록 (?categoryId=&search=&videoId=)
POST   /api/education/resources                 - 자료 등록
GET    /api/education/resources/:id             - 상세
PUT    /api/education/resources/:id             - 수정
DELETE /api/education/resources/:id             - 삭제
GET    /api/education/resources/:id/download    - 다운로드 (카운트 증가)

# 노하우
GET    /api/education/knowhow/posts             - 게시글 목록
POST   /api/education/knowhow/posts             - 게시글 작성
GET    /api/education/knowhow/posts/:id         - 게시글 상세
PUT    /api/education/knowhow/posts/:id         - 수정
DELETE /api/education/knowhow/posts/:id         - 삭제
GET    /api/education/knowhow/posts/:id/comments - 댓글 목록
POST   /api/education/knowhow/posts/:id/comments - 댓글 작성
```

#### 관리자 API (`requireAdmin` 미들웨어)

```
# 사용자 관리
GET    /api/admin/users                         - 사용자 목록
POST   /api/admin/users/:id/role                - 역할 부여

# 교육 콘텐츠 관리
POST   /api/admin/education/videos              - 비디오 추가
PUT    /api/admin/education/videos/:id          - 비디오 수정
DELETE /api/admin/education/videos/:id          - 비디오 삭제

# 카테고리/유형 관리 (동일 패턴)
GET/POST   /api/admin/education/resource-types       - 자료 유형 목록/추가
GET/PATCH/DELETE /api/admin/education/resource-types/:id  - 유형 조회/수정/삭제
GET/POST   /api/admin/education/resource-categories  - 자료 카테고리
GET/POST   /api/admin/education/categories           - 비디오 카테고리
GET/POST   /api/admin/education/knowhow-categories   - 노하우 카테고리

# 설정
GET/POST   /api/admin/settings/keywords              - 키워드 관리
GET/POST   /api/admin/settings/keyword-categories     - 키워드 카테고리
```

### 5.4 페이지네이션 패턴

```
GET /api/customers?page=1&limit=20&sortBy=createdAt&sortOrder=desc

Response:
{
  success: true,
  data: [...],
  metadata: {
    total: 150,
    page: 1,
    limit: 20,
    totalPages: 8
  }
}
```

### 5.5 Zod 검증 스키마

검증 스키마 위치: `src/lib/validations/`

```typescript
// education.ts 주요 스키마
createResourceSchema; // 자료 생성
updateResourceSchema; // 자료 수정
resourceFilterSchema; // 자료 필터 쿼리
createResourceTypeSchema; // 자료 유형 생성
createVideoSchema; // 비디오 생성
createKnowHowPostSchema; // 노하우 게시글 생성

// customer.ts
createCustomerSchema; // 고객 생성
updateCustomerSchema; // 고객 수정
customerFilterSchema; // 고객 필터 쿼리
```

---

## 6. 프론트엔드 아키텍처

### 6.1 상태 관리 전략

| 구분          | 도구                  | 용도                     |
| ------------- | --------------------- | ------------------------ |
| **서버 상태** | React Query           | API 데이터, 캐싱, 리패칭 |
| **폼 상태**   | react-hook-form + Zod | 폼 입력, 검증            |
| **UI 상태**   | React useState        | 토글, 모달, 탭           |

### 6.2 React Query 설정

```typescript
// src/lib/react-query.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      gcTime: 10 * 60 * 1000, // 10분
      retry: (failureCount, error) => {
        // 지수 백오프 재시도
      },
    },
  },
});

// 쿼리 키 상수
export const queryKeys = {
  customers: ['customers'],
  programs: ['programs'],
  education: {
    videos: ['education', 'videos'],
    resources: ['education', 'resources'],
    knowhow: ['education', 'knowhow'],
  },
  admin: {
    users: ['admin', 'users'],
    resourceTypes: ['admin', 'resource-types'],
    resourceCategories: ['admin', 'resource-categories'],
  },
};
```

### 6.3 커스텀 훅 패턴

```typescript
// src/hooks/useEducation.ts - 예시
export function useResources(filters) {
  return useQuery({
    queryKey: ['education', 'resources', filters],
    queryFn: () => fetchResources(filters),
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education', 'resources'] });
      toast.success('자료가 등록되었습니다.');
    },
  });
}
```

### 6.4 재사용 컴포넌트 패턴

#### GenericCategoryManager

카테고리/유형 CRUD를 하나의 제네릭 컴포넌트로 관리:

```typescript
// 사용 예시 - ResourceTypeManager.tsx
<GenericCategoryManager
  apiEndpoint="/api/admin/education/resource-types"
  queryKey={['admin', 'resource-types']}
  entityName="자료"        // "자료 유형" 으로 표시
  countFieldName="resources" // 연결된 리소스 수 필드명
/>
```

현재 이 패턴으로 관리하는 항목:

- `VideoCategoryManager` - 비디오 카테고리
- `ResourceCategoryManager` - 자료 카테고리
- `ResourceTypeManager` - 자료 유형
- `KnowHowCategoryManager` - 노하우 카테고리

### 6.5 페이지 레이아웃

```
AppLayout (인증 체크)
├── AppHeader (네비게이션)
├── Main Content (페이지별)
└── FloatingActionButton (관리자 설정)
```

**고객 관리 페이지 특별 레이아웃**:

```
CustomerPage
├── CustomerSidebar (좌측: 고객 목록, 검색, 필터)
└── Dynamic Panel (우측: currentView에 따라 전환)
    ├── CustomerDetailPanel   (기본정보)
    ├── CustomerMatchingPanel (매칭 결과)
    └── CustomerProgressPanel (사업진행현황)
```

---

## 7. 외부 API 연동

### 7.1 프로그램 동기화

```
[중소벤처기업부 API] ──┐
                       ├─→ ProgramSyncOrchestrator ─→ programs 테이블
[K-Startup API] ───────┘
```

**어댑터 패턴**:

```typescript
interface IProgramAPIClient {
  fetchPrograms(): Promise<NormalizedProgram[]>;
}

class MSMEAPIClient implements IProgramAPIClient { ... }
class KStartupAPIClient implements IProgramAPIClient { ... }
```

### 7.2 동기화 전략

- **자동 동기화**: Cron Job (`/api/cron/sync-programs`)
- **수동 동기화**: 관리자 UI에서 실행
- **중복 방지**: `@@unique([dataSource, sourceApiId])`
- **원본 보관**: `rawData` (JSONB) 컬럼에 원본 API 응답 저장
- **에러 처리**: `Promise.allSettled`로 부분 실패 허용

### 7.3 사업자번호 검증

```
POST /api/nts/verify
→ 국세청 API 호출
→ 사업자번호 유효성 검증
```

---

## 8. 개발 환경 설정

### 8.1 필수 환경 변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Next.js
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# External APIs (프로그램 동기화용)
MSME_API_KEY=...
KSTARTUP_API_KEY=...

# NTS (사업자번호 검증)
NTS_API_KEY=...
```

### 8.2 로컬 개발 시작

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 타입 체크
npx tsc --noEmit

# 린팅
npm run lint

# 빌드
npm run build

# 번들 분석
npm run build:analyze
```

### 8.3 코드 품질 도구

```bash
# 커밋 시 자동 실행 (Husky + lint-staged)
# - ESLint --fix
# - Prettier --write
```

---

## 9. 성능 최적화

### 9.1 프론트엔드

| 최적화        | 구현                                              |
| ------------- | ------------------------------------------------- |
| 코드 스플리팅 | 차트 컴포넌트 동적 임포트 (`next/dynamic`)        |
| 폰트 최적화   | Pretendard 로컬 폰트 (`next/font`)                |
| 이미지 최적화 | `next/image` + WebP 자동 변환                     |
| 패키지 최적화 | `optimizePackageImports` (lucide-react, recharts) |
| 캐싱          | React Query staleTime/gcTime 최적화               |
| 정적 자산     | 1년 캐시 헤더                                     |

### 9.2 백엔드

| 최적화       | 구현                                  |
| ------------ | ------------------------------------- |
| DB 인덱스    | 30개 이상 인덱스 (자주 조회되는 컬럼) |
| 커넥션 풀링  | Supabase 내장 풀링                    |
| 페이지네이션 | 커서 기반 + offset 기반               |
| 쿼리 최적화  | SELECT 특정 컬럼, JOIN 최적화         |

### 9.3 빌드 최적화

```javascript
// next.config.ts
{
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
}
```

---

## 10. 테스트

### 10.1 E2E 테스트 (Playwright)

```bash
# 실행
npm run test:e2e

# UI 모드
npm run test:e2e:ui

# 리포트 확인
npm run test:e2e:report
```

**테스트 파일 위치**: `tests/e2e/`

| 파일               | 범위               |
| ------------------ | ------------------ |
| `auth.spec.ts`     | 로그인, 리다이렉트 |
| `home.spec.ts`     | 홈페이지 렌더링    |
| `programs.spec.ts` | 프로그램 페이지    |

### 10.2 CI/CD

GitHub Actions (`.github/workflows/ci.yml`):

```yaml
steps:
  - Lint Check
  - TypeScript Check
  - Production Build
  - E2E Tests (Playwright)
  - Upload Test Report
```

---

## 11. 배포

### 11.1 Vercel 배포

- Git 리모트 `jogeeyeol`에 push 시 자동 배포
- Preview 배포: PR 생성 시
- Production 배포: `main` 브랜치 push 시

### 11.2 Supabase

- Production DB: `gyztfnyelcjupypjxhzk` (supabase-ownership-ai-origin)
- 마이그레이션: Supabase MCP를 통해 적용
- RLS: 모든 테이블 활성화

### 11.3 환경 분리

| 환경          | 용도                 |
| ------------- | -------------------- |
| `development` | 로컬 개발            |
| `preview`     | PR 미리보기 (Vercel) |
| `production`  | 프로덕션             |

---

> **참고**: 이 문서는 프로젝트 Phase 8 기준으로 작성되었습니다. Phase 9 (보안 강화, 프로덕션 배포) 완료 후 업데이트가 필요합니다.
