# plan.md — Screen Intelligence Agent

> **단계:** SDLC / Implementation Plan → Build → Evaluation  
> **버전:** 1.1 (Build Ready · agents.md 연계 · Mock Provider & Fixture · 2단계 원장 완비)  
> **기준일:** 2026-10-14, Asia/Seoul  
> **근거 문서:** [`맥락.md`](./맥락.md) v1.1 → [`intent.md`](./intent.md) v0.51 (D-01~D-50) → [`spec.md`](./spec.md) v1.2 (SP-01~15) → [`agents.md`](./agents.md) v1.0  
> **목적:** `INT → SP → agents.md → WP/TASK → 코드 → T → KPI → AC → G0~G5`를 빌드와 실제 평가까지 추적하는 실행 계약.  
> **현재 상태:** **Build Ready (G0 문서 게이트 통과)**. Mock Provider 및 Docker PostgreSQL 16 기반으로 외부 키 없이 로컬/CI 빌드 착수 가능.

---

## 0. 문서 우선순위·변경 통제

1. `맥락.md` = 문제·제품 철학, `intent.md` = 확정 사용자 정책, `spec.md` = 기술 계약/수용 기준, **`agents.md` = Multi-Node 에이전트 아키텍처/프롬프트/Fallback**, **`plan.md` = 구현 순서/담당 코드/증거**. 의견 충돌은 최신 확정 D-결정 → INT/AC → SP → agents.md → 본 계획 순으로 해석한다.
2. 새 요청 **CR-FE-001**: HTML5 시맨틱 마크업, Tailwind CSS, JavaScript/JSX 프론트엔드. `spec.md` v1.2의 SP-01/CI 규칙에 동기화됨. **TypeScript 신규 파일을 기본으로 생성하지 않는다.** JS 타입 안전성은 JSDoc+`jsconfig.json(checkJs=true)`+ESLint+계약 테스트로 보완한다.
3. 이전 `맥락.md`의 “후보 부족 시 영드 자동 확장” 예시는 폐기하고 **D-25(사용자 요청 시에만 확장)** 적용. 후보 부족 시 연도 자동 확장도 금지(D-22).
4. 계획의 `TASK-*` / 코드 경로 / 테스트·평가 증거는 실제 구현 후 변경 가능하지만, 상위 `INT-*`, `AC-*`, `KPI-*`의 의미를 임의 변경하지 않는다. 스펙 변경이 필요하면 `docs/decision_log.md`에 `CR-*`를 등록하고 영향 매트릭스를 갱신한다.
5. 문서 내 가중치·예산·TTL·지연 목표는 **설정된 초기 가설**이며 테스트로 검증한다. 공급자 데이터 접근 권한은 계약 완료 전 **미확정/disabled**로 표현하며, 로컬 및 CI 테스트는 `PROVIDER_MODE=mock` 기반 Fixture로 100% 통과시킨다 (`SP-03.4`).
6. `P0`는 첫 배포 필수, `P1`은 첫 배포 후 다음 이터레이션, `P2`는 장기 확장. `P1` 항목도 P0 보안의 결함을 정당화하지 못한다.

## 1. 구현 목표·제품 계약(변경 불가)

| 항목 | 빌드 규칙 | 출처 |
|---|---|---|
| 검색 | 자연어; 연도 미지정 시 현재 한국 기준 최근 3개 연도; 명시 연도는 세계 최초 공개연도 | INT-22,25 / SP-02 |
| 세부 장르 | 범위가 넓을 때 **최대 4개 선택지**(전체 버튼 별도); 직접 관련 작품만 정규 추천 | INT-27 / SP-02 |
| 기본 랭킹 | 영화 TOP 10 + 미국 드라마 TOP 10을 **독립 섹션**에서 P-GSEI로 정렬 | INT-09,20 |
| 확장 | 관련 장르/전 연도/영드·유럽 드라마는 명시 요청·클릭 때만; 영드·유럽은 별도 TOP 10 | INT-26~30 |
| 점수 | **재미·관객 만족 40 / 대중 인기·화제성 40 / 전문가 10 / 개인 취향 10**; 결측은 0 대체 금지 | INT-06,16,38 / SP-05 |
| 한국 이용 | 구독·무료·대여·구매 + **현재 국내 상영 확인 극장** 포함; 원문 링크·시각·검증 상태 표기 | INT-01,05,08,21 |
| 예정/평가대기 | 미공개 예정작은 별도(점수 없음); 공개됐지만 A/P 모두 결측이면 평가 대기 별도 | INT-18,23,24 |
| 시청·찜 | 추천 카드 개별 체크, 시즌 단위 시청, 현재 스냅샷 유지·다음 검색 제외; 찜/관심 없음/되돌리기/개인 별점 | INT-10~15,35~40 |
| 상세 | 시즌별 공개 연월·품질 추세, 원작/스핀오프·공개연도, 한국어 YouTube 전체 줄거리 요약 우선·스포일러 잠금 | INT-02~04,07,17~19 |
| 성능·비용 | 영화/드라마 완료 분야 즉시 출력; 공통 공개 캐시 24h 이내, 국내 현재 제공여부 별도 TTL; 유료 요청 1건=1회 | INT-20,34,41~45 |
| 접근 | Google OIDC + 관리자가 승인한 `sub`만 접근; 사용자별 상태 격리, 공용 캐시에는 PII 없음 | INT-31~33,45 |

**Non-goals(P0):** 시청 이력 일괄 업로드, 무허가 평점·포스터 크롤링, 구매/예매 대행, 공개 가입, 개인 OTT 구독 프로필, 추천 결과를 타 사용자에게 개인 데이터와 함께 공유, 자동 알림, 외부 MCP 공개 배포.

## 2. 선택 기술 스택·버전 운영

| 계층 | 채택 기술 | 채택 이유/실행 조건 | 검증 지점 |
|---|---|---|---|
| Frontend | **Next.js App Router + React(JavaScript/JSX)** | 시맨틱 HTML 렌더링·라우팅·서버 BFF·모바일 대응; 기본 프로젝트 생성 시 TypeScript **No** | `npm run build`, `checkJs`, E2E |
| UI styling | **Tailwind CSS v4**, CSS 변수, `globals.css` | 디자인 토큰 일원화. `@import "tailwindcss";`/`@tailwindcss/postcss` | DOM·반응형·대비 테스트 |
| UI primitives | 접근성 있는 Headless/Radix 컴포넌트(최소 채택), lucide-react, Recharts | 키보드/ARIA, 시즌 추세 차트. shadcn 컴포넌트 사용 시 **JS 버전만** | Playwright+axe |
| Frontend type guard | JSDoc + `jsconfig.json` (`allowJs`,`checkJs`,`noEmit`) | JS 요구와 런타임/API 타입 검증 균형; JS 계약 schema 검증 | `npm run check` |
| Frontend auth | Auth.js(Next.js Google provider) + HttpOnly 세션 | 로그인 UI 및 BFF; Google `sub` 신뢰 검증은 서버에서도 별도 수행 | T-AUTH, E2E |
| API backend | Python 3.11+ + FastAPI + Pydantic v2 | OpenAPI·API 계약·SSE 및 Google Gen AI SDK (google-genai) 연결 | pytest+contract |
| Orchestrator | **LangGraph 경량 4단계** + asyncio | Parse → Discover → Verify/Score → per-section Publish; 과도한 개별 LLM 에이전트 금지 | T-RUN, KPI-14~16 |
| LLM | **Google Gemini API** (`google-genai` SDK, `gemini-2.5-flash`/`pro`) + strict `response_schema` | 입력 의도/근거 있는 추천 이유·고난도 분류에서만 사용; 모델 ID와 단가 환경변수 | T-RUN, 비용원장 |
| Scoring | 순수 Python + NumPy(필요 시), Decimal 정밀 변환 테스트 | 외부 프레임워크/LLM과 분리된 결정적 P-GSEI 계산 | T-SCORE, KPI-06~08 |
| DB/migrations | PostgreSQL + SQLAlchemy 2 + Alembic | 사용자 원자 전이, `FOR UPDATE`, 부분 유니크 인덱스, 캐시/원장 | T-STATE/T-COST |
| Background execution | **DB 작업큐 + 독립 Python worker** (MVP) | API 요청 수명과 분리; 프로세스 재시작 시 회복; Redis는 확장 후 | T-RUN/E2E |
| Live UI updates | Server-Sent Events + GET 폴링 폴백 | 섹션 선완료 노출. 호스팅 SSE 제한 발견 시 폴링 유지 | EVAL-03, KPI-14 |
| Logs/Eval | JSON 로그 + OpenTelemetry/Langfuse(선택 도입) + pytest/Playwright/axe | 성능/비용·평가 근거 수집, 식별정보 최소화 | KPI report |
| Hosting | Vercel(Frontend) + 장시간 작업 지원 Python API/worker 호스팅 + 관리형 PostgreSQL | 계약/요금/SSE 지원 확인 후 운영지 선정; 브라우저 직통 Gemini API 불가 | G5 |
| CI/CD | GitHub Actions | 변경마다 lint/check/unit/contracts/E2E-stub/보안/평가 리포트 | G2~G5 |

**버전 정책:** `package-lock.json`/`uv.lock`(또는 핀 된 `requirements` lock)을 커밋한다. `latest`는 초기 설치에만 허용, CI/프로덕션은 lock 기반 재현 설치. Next.js·Tailwind·Auth.js·LangGraph·Google Gen AI SDK(`google-genai`)의 최신 안정판과 호환성은 **빌드 시작 시 공식 릴리스에서 재확인**한다. 공식 참고: https://nextjs.org/docs/app/getting-started/installation · https://tailwindcss.com/docs/installation/framework-guides/nextjs · https://authjs.dev/getting-started/providers/google · https://docs.langchain.com/oss/python/langgraph/overview · https://ai.google.dev/gemini-api/docs/structured-output

### 2.1 프론트엔드 핵심 구현 원칙

- **HTML5:** `<main>`, `<section>`, `<article>`, `<nav>`, `<fieldset>/<legend>`, `<button>`, `<time datetime>`, `<details>`, 제목 계층을 JSX로 출력. 클릭 영역을 의미 없는 `div`로 만들지 않음.
- **Tailwind:** CSS-first 테마 토큰 `--color-*`, spacing, light/dark 대비, 스마트폰 360px/태블릿 768px/데스크톱 1280px를 검증. 디자인 토큰은 `src/app/globals.css` 소유.
- **JavaScript:** `*.js/*.jsx` + `jsconfig.json`; `use client`는 체크박스·검색폼·스트리밍 리스너 등 상호작용 컴포넌트에만. 서버 쿠키·토큰 처리는 Server/BFF 전용.
- **데이터 전달:** BFF에서 인증 세션 확인 → 단기 내부 서명 사용자 컨텍스트 또는 검증 가능한 서비스 인증으로 FastAPI 전달 → FastAPI는 `sub` 승인·사용자 범위를 다시 검증. 단순 브라우저 헤더 `X-User-Id`를 신뢰하지 않음.
- **상태:** `run_id` 스냅샷(불변)과 `current_user_state`(가변 오버레이)를 분리. 현 카드 체크 후 카드 삭제·순위 재정렬 금지.
- **스포일러 잠금:** 영상 타이틀·썸네일·직접 링크를 잠금 상태 JSON/DOM/alt/메타태그에 포함하지 않음. Reveal API 호출 시에만 획득.
- **접근성:** 키보드 탐색, `aria-live="polite"` 진행 상황, 폼 오류 메시지, 포커스 관리, 색상에만 의존하지 않는 상태; Lighthouse 점수보다 **axe Critical/Serious 0건**이 릴리스 기준.

## 3. 사용자 화면 IA 및 컴포넌트 계획

| URL (Next.js App Router) | 페이지/핵심 HTML | 요구사항 | 핵심 컴포넌트 | P |
|---|---|---|---|---|
| `/login` | Google 로그인·승인 오류 | INT-31~33 | `GoogleSignIn`, `ApprovalState` | P0 |
| `/search` | `<main><form>` 자연어·연도·세부 장르 최대 4개, 검색 옵션 | INT-22,25,27~30 | `QueryForm`, `SubgenreChoices`, `SearchScope` | P0 |
| `/recommendations/[runId]` | 영화·미드 별도 `<section>`, SSE 상태·정렬/신뢰도·평가 대기·예정작 | INT-09,16,18,20,23,24 | `SectionStatus`, `RankedMediaCard`, `ScoreBreakdown`, `EvidenceBadge` | P0 |
| `/media/[mediaId]` | 시즌 `<table>`, 추세 `<figure>`, 관계작, 한국 시청 경로, 스포일러 잠금 영상 | INT-02~04,07,17~19,49,50 | `SeasonTimeline`, `TrendChart`, `FranchiseLinks`, `SpoilerGuardVideo` | P0 |
| `/wishlist` | `<main>` 찜 목록·해제 | INT-13~15,37 | `WishlistGrid` | P0 |
| `/my/usage` | 일별 잔량·월 예산 상태, 갱신·차감 설명 | INT-41~44 | `UsageSummary` | P0 |
| `/my/privacy` | 삭제 요청 접수 및 보호 안내 | INT-54 | `DeletionRequestForm` | P0(최소) |
| `/my/export` | 개인정보 내보내기·자기 데이터 삭제 UI | INT-54 | `ExportDownload`, `DeleteAccountDialog` | P1 |

### 3.1 추천 카드 UI 필수 데이터

`순위 → 포스터(허가된 경우) → 한글명/원제/공개연도 → 장르/국가 → P-GSEI 및 A/P/C/T 내역 → 데이터 신뢰도·coverage·결측 → 국내 구독/무료/대여/구매/극장 링크 + 시청상태 확인시각 → 작품 선택 → 봤음/되돌리기/찜/관심없음/별점(봤음 이후)`.

- 시즌 카드에서는 최신 공개 시즌/연월 표시, 시청 체크는 **해당 시즌만**, `시즌별 시청 관리` 펼침 제공. 영화는 영화 단위 체크.
- `<a>`는 실제 검증된 작품별 링크만 활성화; 근거 없는 링크는 `확인 필요`로 대체. 한국어 자막·더빙은 `지원/미지원/미확인`.
- 신작 `AWAITING_RATING`과 `UPCOMING`은 별도 영역. 예정작에는 점수·현재 시청 가능 배지 금지.
- 공개 연도와 한국 개봉 연도를 다른 `<time>` 레이블로 표시.
- GSEI 카드 정렬과 상태 카드 표시는 독립; `봤음` 후 화면은 동일 스냅샷에 시청 배지만 변화.
- 완료 섹션부터 열고 다른 섹션은 skeleton/`검색 중`. 장애 시 다른 섹션은 재지우지 않음.

### 3.2 프랜차이즈·유튜브 상세

- 관계작마다 `유형(스핀오프/프리퀄/후속/리메이크) + **세계 최초 공개연도** + 권장 시청 순서 + 근거 출처` 출력.
- 한국어 **전체 줄거리 요약 영상** 우선; 기본 `스포일러 포함 가능` 가림/명시적 펼치기. 매칭되지 않으면 검증된 공식 예고편만 보조 표기.
- 2개 이상 시즌의 동일 출처 지표를 비교할 수 있을 때만 상승/하락/유지 차트; 비교 불가면 미산정으로 표시.

## 4. 저장소·코드 경로(구현 기준)

```text
./                                     # 프로젝트 루트
├── docs/
│   ├── 맥락.md  intent.md  spec.md  agents.md  plan.md  decision_log.md
│   └── provider-licenses.md
├── frontend/                         # Next.js JavaScript / JSX
│   ├── package.json  package-lock.json  jsconfig.json
│   ├── postcss.config.mjs  next.config.mjs  .env.example
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css  layout.jsx  page.jsx
│   │   │   ├── (auth)/login/page.jsx
│   │   │   ├── (app)/search/page.jsx
│   │   │   ├── (app)/recommendations/[runId]/page.jsx
│   │   │   ├── (app)/media/[mediaId]/page.jsx
│   │   │   ├── (app)/wishlist/page.jsx
│   │   │   ├── (app)/my/usage/page.jsx
│   │   │   ├── (app)/my/privacy/page.jsx
│   │   │   ├── api/auth/[...nextauth]/route.js
│   │   │   └── api/bff/[...path]/route.js
│   │   ├── components/{search,recommendation,media,watch,layout,ui}/
│   │   ├── lib/{api-client.js,api-schemas.js,auth.js,events.js,format.js}
│   │   └── hooks/{useRunStream.js,useWatchActions.js}
│   └── tests/{components,e2e,a11y}/
├── backend/
│   ├── pyproject.toml  uv.lock  alembic.ini  .env.example
│   ├── app/
│   │   ├── main.py
│   │   ├── api/v1/{recommendations,media,watch,wishlist,ratings,usage}.py
│   │   ├── auth/{tokens,approvals,admin_cli}.py
│   │   ├── agents/{query_parser,graph,discover,validate,publish}.py
│   │   ├── providers/{base,identity,ratings,popularity,ott_kr,theater_kr,youtube}.py
│   │   ├── providers/fixtures/{titles,ratings,availability,youtube}.json
│   │   ├── core/{identity,eligibility,scoring,season_trends,spoiler_policy,security}.py
│   │   ├── services/{watch_state,run_store,cache,quota,details}.py
│   │   ├── db/{models,session}.py
│   │   ├── worker/{runner,lease,recovery}.py
│   │   └── schemas/{query,media,evidence,response}.py
│   ├── migrations/versions/
│   ├── tests/{unit,integration,contracts,security,providers}/
│   └── scripts/{seed_fixture,admin_approve,admin_revoke,bootstrap_admin}.py
├── evaluation/
│   ├── golden_dataset/{GS-QRY-100,GS-TITLE-150,GS-STATE-100,GS-VIDEO-50,GS-FAULT-50,GS-SEO-40}/
│   ├── compute_kpis.py  run_evaluation.py  validate_traceability.py
│   └── manifests/
├── config/{evaluation_thresholds.yaml,provider_permissions.yaml,system_limits.yaml}
├── reports/evaluation/            # <git_sha>/... 빌드 때 생성
├── .github/workflows/{ci.yml,staging.yml,release.yml}
├── docker-compose.yml  .gitignore  .env.example  Makefile
└── README.md
```

**경로 소유권:** `core/`은 순수 함수·DB 접근 금지, `providers/`는 라이선스/증거 생성, `services/`는 트랜잭션, `agents/`는 흐름만 담당. UI의 개인 액션/LLM/예산은 **항상 서버 검사**. Python backend는 내부 인증을 우회하는 공개 라우트를 만들지 않는다.

## 5. 개발 실행 순서: 파트별 Vertical Slice

| 순서 | 이름 | 선행 조건 | 눈에 보이는 동작 | 완료 증빙 |
|---|---|---|---|---|
| **S0** | 범위/공급자/기반 | G0, 라이선스 실사 착수 | 로컬 DB·fixture·로그인 셸, 서비스 사용권 목록 | G0/G1, `provider_compliance.md` |
| **S1** | 검증 가능한 추천 코어 | S0 핵심 모델, 허가된 공급자 또는 테스트 Fixture | 질문→연도·장르 분류→영화/미드 후보 검증→점수/순위 JSON | G2, `T-DATA/T-SCORE` |
| **S2** | 시청 상태 + 비용/동시성 | S0 인증/DB, S1 코어 | 봤음/찜/관심 없음/별점 저장·undo·격리·예산 차단 | G2, `T-STATE/T-COST` |
| **S3** | 검색 결과 UI/병렬 출력 | S1+S2 | HTML/Tailwind/JS 검색 → 먼저 끝난 섹션 카드 → 체크 후 현재 카드 유지 | G3, Playwright/Stream |
| **S4** | 상세/스포일러/편성 | S3 + 상세 외부 소스 허가 | 시즌 추세/프랜차이즈(공개연도)/스포일러 가린 한국어 요약 링크 | G3/G4, `T-DETAIL` |
| **S5** | E2E 성능/배포/운영 | S4 + 실제 API 키/호스팅 | 승인 계정만 실제 서비스 이용, 장애·예산·백업/복구 확인 | G4/G5, 최종 KPI 보고서 |

**병렬 개발 가능:** S1 `WP-03`의 라이선스/어댑터, `WP-04`의 순수 계산 엔진, S2 `WP-05`의 state machine, S3 `WP-07`의 mock UI는 각각 fixture·스키마를 공유하며 병렬 착수. **단, 실제 추천 공개 전 G1 필수 공급자 검증**은 우회 불가.

## 6. 빌드 작업 백로그 (`TASK-001~TASK-042`)

**작업 완료(DoD) 공통:** 코드는 상기 경로에 반영, 해당 `T-*` 통과, 연결 KPI 증거 생성, 비밀/PII 유출 없음, 리뷰 및 관련 스키마/마이그레이션 업데이트. `T-*`가 없는 비기능 작업은 `T-ARCH`/`T-E2E`로 확인한다. 모든 작업은 아래 표의 의존이 만족된 뒤 merge 가능. `fixture pass`와 `live pass`는 분리해 기록한다.

| Task | WP / P | 구현 결과 및 핵심 파일 | 의존 | 대표 T 범위 | Gate / 판정 지표 |
|---|---|---|---|---|---|
| TASK-001 | WP-01 / P0 | 모노레포, README, `.env.example`, lock/권한 문서 | G0 | T-ARCH-001 | G0·G1 / KPI-28 |
| TASK-002 | WP-01 / P0 | Pydantic ↔ JS Schema 계약, 오류 모델, Mock Fixture 스키마 및 더미(`providers/fixtures/`) | 001 | T-ARCH-002 | G2 / KPI-01,20 |
| TASK-003 | WP-01 / P0 | Docker Compose PostgreSQL 16 스키마·Alembic·seed/rollback, `backend/app/db` (SQLite 배제) | 001 | T-ARCH-003 | G2 / KPI-05,11 |
| TASK-004 | WP-02 / P0 | Google OIDC/Auth.js·쿠키·CSRF, `frontend/src/lib/auth.js`, `backend/app/auth` | 001,002 | T-AUTH-001 | G3 / KPI-11 |
| TASK-005 | WP-02 / P0 | Google `sub` 승인 CLI·최초 관리자 부트스트랩(`scripts/bootstrap_admin.py`)·승인 감사로그 | 003,004 | T-AUTH-002~003 | G3 / KPI-11 |
| TASK-006 | WP-02 / P0 | BFF→API 내부 서명 JWT(`INTERNAL_AUTH_SECRET`)·SSE 프록시 패스스루·교차계정 차단·삭제 최소경로 | 004,005 | T-AUTH-004~006 | G3 / KPI-11,19 |
| TASK-007 | WP-03 / P0 | EXT-01~08 사용권·API 접근 실사 + feature flag/provider 계약 | 001 | T-DATA-001 | **G1** / KPI-28 |
| TASK-008 | WP-03 / P0 | Discovery+Canonical ID+세계 최초 연도·장르 direct 분류 | 002,003,007 | T-DATA-002,006,008 | G2,G4 / KPI-02,03,05 |
| TASK-009 | WP-03 / P0 | 권한 있는 관객·인기·평론 데이터 수집; `EvidenceFact` 생성 | 007,008 | T-DATA-003 | G1,G3 / KPI-20,28 |
| TASK-010 | WP-03 / P0 | 한국 구독·무료·대여·구매·극장 현재 상태·작품별 링크 검증 | 007,008 | T-DATA-004~005 | G3 / KPI-04,17 |
| TASK-011 | WP-03 / P0 | 예정작·평가대기·언어지원 3상태 및 공급자 partial failure | 008,009,010 | T-DATA-007 | G2,G3 / KPI-08,24 |
| TASK-012 | WP-04 / P0 | 순수 Python P-GSEI 40/40/10/10; 원본 척도/기간 보존 | 002; fixture 가능 | T-SCORE-001~002 | G2 / KPI-06,07 |
| TASK-013 | WP-04 / P0 | Bayesian(µ/m 조건부), 결측 재가중, coverage·신뢰도 | 012 | T-SCORE-003~005 | G2 / KPI-08,20,24 |
| TASK-014 | WP-04 / P0 | 동일입력 순위 재현, 접전 정렬, 시즌 평가 추세 | 012,013 | T-SCORE-007~010 | G2,G4 / KPI-06,23 |
| TASK-015 | WP-04 / P0 | 개인 별점 T축 조정만; 작품·시즌 스코어 혼용 방지 | 012,016 | T-SCORE-006 | G2 / KPI-07 |
| TASK-016 | WP-05 / P0 | 유저 작품/시즌 watch·wishlist·exclude·rating DB 제약과 `version` | 003,005 | T-STATE-001~002 | G2 / KPI-09,11 |
| TASK-017 | WP-05 / P0 | watched + 자동 찜 해제 + undo 원자 전이, 스냅샷 불변 | 016 | T-STATE-003~006 | G2,G3 / KPI-10,21 |
| TASK-018 | WP-05 / P0 | `관심 없음` 전체 시리즈·찜 undo·별점 보존/복원 | 016,017 | T-STATE-007~010 | G2 / KPI-09,10 |
| TASK-019 | WP-05 / P0 | 멱등 키·낙관적 경합·전이/세션 격리·상태 오버레이 | 016~018 | T-STATE-011~012 | G2,G3 / KPI-09,10,11 |
| TASK-020 | WP-06 / P0 | 자연어 쿼리 규칙 파서·장르 옵션 최대 4·한국시간 기준 연도 | 002,008 | T-RUN-002,004 | G4 / KPI-01,02 |
| TASK-021 | WP-06 / P0 | LangGraph 4단계, durable worker·분야별 독립 fork·partial failure | 011,013,019,035 | T-RUN-001,007 | G3 / KPI-14,16 |
| TASK-022 | WP-06 / P0 | Run DB 스냅샷·SSE seq/replay·polling fallback | 021 | T-RUN-009~010 | G3 / KPI-14,21 |
| TASK-023 | WP-06 / P0 | 사용자 선택 확장(EU/전연도/인접), 재랭크 없는 별도 섹션 | 020~022 | T-RUN-003~005 | G3 / KPI-01,14 |
| TASK-024 | WP-06 / P0/P1 | 공통 공개 캐시 24h·가용성 TTL 재검증·수동 refresh (P1: 취소) | 011,022 | T-RUN-006,008 | G3 / KPI-17,19 |
| TASK-025 | WP-07 / P0 | Next.js JS/JSX·Tailwind v4·HTML5 공통 레이아웃/디자인 토큰 | 001,002 | T-UI-003 | G4 / KPI-25 |
| TASK-026 | WP-07 / P0 | Google 로그인 UI + BFF 인증·403 승인 상태 | 004~006,025 | T-UI-004 | G3 / KPI-11,25 |
| TASK-027 | WP-07 / P0 | 자연어 입력·세부 장르 4개·검색범위/연도·비용 사전표시 | 020,025 | T-UI-001,005 | G4 / KPI-01,25 |
| TASK-028 | WP-07 / P0 | SSE 독립 섹션, 영화/미드 TOP 10 카드·점수/신뢰도/근거/편성 | 021~023,025 | T-UI-006~008 | G3,G4 / KPI-14,20,25 |
| TASK-029 | WP-07 / P0 | 봤음·undo·찜·관심 없음·별점·사용량/캐시 표시·관심 목록 | 017~019,028,035 | T-UI-002,009~010 | G3,G4 / KPI-09,10,25 |
| TASK-030 | WP-07 / P0 | 반응형·키보드·axe·오류/로딩/빈상태·모바일 스모크 | 026~029 | T-UI-011~012 | G4 / KPI-25 |
| TASK-031 | WP-08 / P0 | 시즌 공개 연월/국내 제공 경고·동일 출처 점수 추세 차트 | 010,014,028 | T-DETAIL-004~005 | G4 / KPI-23 |
| TASK-032 | WP-08 / P0 | 공식 원작·스핀오프/프리퀄 관계와 공개연도·권장 순서 | 008,031 | T-DETAIL-002 | G4 / KPI-20 |
| TASK-033 | WP-08 / P0 | 검증된 YouTube 한국어 요약→공식 예고편 대체, 잠금·reveal | 007,028 | T-DETAIL-001,003,007 | G3,G4 / KPI-12,13 |
| TASK-034 | WP-08 / P0/P1 | 안전한 작품·시즌 맥락·스포일러 검수; P1 명시적 AI 상세분석 | 031~033,035 | T-DETAIL-006,008 | G3,G4 / KPI-12,27 |
| TASK-035 | WP-09 / P0 | 월 예산·일일 10회 2단계 비동기 예약/차감(DB 잠금 분리)·멱등·Gemini API 호출 전 차단 | 003,005 | T-COST-001~004 | G2 / KPI-18,22 |
| TASK-036 | WP-09 / P0 | 호출·토큰·실비 정산/미확정 청구/한도 UI 원본 로그 | 021,035 | T-COST-006~008 | G2,G5 / KPI-18,22 |
| TASK-037 | WP-09 / P0 | 공용 캐시 PII schema 검사·개인화 DB 경계·관측 데이터 마스킹 | 003,019,024 | T-COST-005 | G3 / KPI-19 |
| TASK-038 | WP-10 / P0 | 6개 골든셋 + EVAL-01~15 + 요구사항 추적 검증기 | 012~037 | T-E2E-001~004 | G2~G4 / KPI-01~28 |
| TASK-039 | WP-10 / P0 | 공급자 권리·CSRF/SSRF·승인철회·스포일러 보안 합격 | 006,007,033,037 | T-E2E-005~006 | G1,G3 / KPI-11,12,28 |
| TASK-040 | WP-10 / P0 | API/worker/DB 스테이징, SSE/폴링, 강제중단/복구/마이그레이션 | 021,022,036,039 | T-E2E-007~008 | G3,G5 / KPI-14~17 |
| TASK-041 | WP-10 / P0 | p95/관련성/유용성/접근성 + 모든 KPI 증거·게이트 판정 | 038~040 | T-E2E-009~010 | G4 / KPI-01~28 |
| TASK-042 | WP-10 / P0 | 운영 배포·비밀·예산 보호·백업복구·롤백 모의연습 | 041 | T-E2E-011~012 | G5 / KPI-11,18,28 |

### 6.1 주요 크리티컬 패스

- **사용자 안전 경로:** `001 → 003 → 004 → 005 → 006 → 016 → 017 → 019 → 029 → 039 → 042`.
- **추천 경로:** `001 → 007(EXT 합법성) → 008 → 010 → 011 → 013 → 021 → 022 → 028 → 040`.
- **비용 차단 경로:** `003 → 005 → 035 → 021 → 036 → 042`. **TASK-035는 첫 Gemini API 실호출 이전 선완료**.
- **검증 경로:** `002 → 012 → 038 → 041 → 042`.

### 6.2 작업 완료 증거 레코드(모든 TASK 동일 계약)

각 TASK의 PR/커밋은 아래 필드를 `reports/evaluation/<git_sha>/task_status.json`에 기입한다(민감정보 제외).

```json
{
  "task_id": "TASK-012",
  "wp_id": "WP-04",
  "linked_intent": ["INT-06"],
  "linked_acceptance": ["AC-05"],
  "linked_spec": ["SP-05"],
  "linked_tests": ["T-SCORE-001"],
  "linked_kpi": ["KPI-07"],
  "gate": "G2",
  "status": "not_started",
  "commit_sha": null,
  "evidence_paths": []
}
```

허용 상태: `not_started|in_progress|blocked|test_passed|test_failed|deferred`. **문서에 표기된 테스트 ID만으로 통과를 인정하지 않는다.** JUnit 테스트 결과와 정확한 커밋 SHA가 반드시 있어야 한다.

## 7. 프론트엔드·API 연결 계약

### 7.1 클라이언트 동작 흐름

```text
GET /search  → Google 세션/승인 검증
    └─ POST /api/bff/recommendations (query/options)
       └─ API POST /api/v1/recommendations → 202 {run_id, quota}
          ├─ GET events SSE (또는 2s 폴링)
          │    ├─ MOVIE completed    → 영화 TOP 10 섹션 확정
          │    └─ US_SERIES completed→ 미드 TOP 10 섹션 확정
          └─ 카드 버튼 PUT watch/wishlist/exclude/rating (state overlay)
               └─ 완료 run 순위/카드 목록 변경 금지
CLICK /media/{id} → GET basic + season/related (무료)
CLICK YouTube 펼치기 → POST /youtube/reveal (잠금 해제)
CLICK AI 상세분석 → 비용 안내 후 POST /ai-analysis (P1)
```

### 7.2 필수 API 동작 및 예외

- API 경로/입출력은 `spec.md` **SP-07**을 그대로 구현; `POST /api/v1/media/{media_id}/youtube/reveal`은 SP-12 보충 계약으로 추가.
- 서버 오류 `401/403/409/422/429/503`를 각각 로그인/승인거부/충돌 재조회/근거 불충분/일일·월예산 차단/일시공급자 오류로 UI 분기.
- 조회는 `run_id` 스냅샷 버전 불변. 최신 watch/wishlist 등 사용자 상태는 GET에서 별도 오버레이.
- 인증된 BFF가 SSE를 프록시할 때 연결 끊김·Vercel 제한을 확인; 실패하면 동일 API의 상태 GET로 폴링. SSE를 비밀이 담긴 브라우저 URL로 직접 보내지 않음.
- Gemini API 호출 전에 API에서 사용자 승인·일일 한도·전체 월 예산·idempotency를 검증하고 예약. 성공적인 **실제 호출 시작** 시에만 유료 1회 차감; 무료 캐시 조회 0회.
- 호출 시 모델은 `GEMINI_MODEL_FAST`, 인증 키는 `GEMINI_API_KEY`, 내부 BFF/API 검증은 `INTERNAL_AUTH_SECRET` 등 서버 환경으로 전달. 로그에 키, OAuth 토큰, full prompt의 민감부분을 기록하지 않는다.

### 7.3 필수 환경변수 범주 (`.env.example`은 빈 예시값만)

| 환경 | 이름 예시 | 메모 |
|---|---|---|
| Frontend | `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `BACKEND_INTERNAL_URL` | 브라우저 공개 환경변수에 API 키 금지 |
| Backend | `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL_FAST`, `INTERNAL_AUTH_SECRET` | 최소권한 Secret, 배포시 회전 가능 |
| Usage | `USER_DAILY_PAID_REQUEST_LIMIT`, `SERVICE_MONTHLY_GEMINI_BUDGET_USD`, `DEFAULT_RESERVATION_USD`, `MAX_PARALLEL_PAID_RUNS` | 제안 초기값 10건/일, $30/월, $0.50, 2건 (미승인 실제 예산) |
| Data | `ENABLE_LICENSED_RATING_PROVIDER`, `ENABLE_KR_AVAILABILITY`, `ENABLE_KR_THEATER`, `YOUTUBE_API_KEY` | 권한 확인 전 프로덕션 disable |
| Telemetry | `LANGFUSE_*`(옵션), `LOG_LEVEL`, `OTEL_EXPORTER_*` | 개인별 원문 프롬프트 최소화 |

## 8. 빌드 게이트(G0~G5)·완료 조건

| Gate | 진입 시점 | 필수 합격 조건 | 평가 증거 |
|---|---|---|---|
| **G0** 문서 동결 | TASK-001 시작 | 54 INT/59 AC 전체 RTM 매핑, 최신 D-결정·JS/JSX 충돌 해소, 주요 의존 명세 | `requirements_trace.csv`, `docs/decision_log.md` |
| **G1** 권한/보안 | 실제 Provider/Gemini API 호출 전 | EXT-01/04/05 최소 합법 경로, 공급자별 재배포/캐시 허가 확인, 승인된 Google 서명/서버 검증 설계 | `provider_compliance.md`, KPI-28=100% |
| **G2** 코어 빌드 | S1/S2 | 결정적 점수·상태·원장 단위 테스트 100%, 비정상 공개연도·허위점수·경합 위반 0 | KPI-03,05~10,18,22,24 |
| **G3** 통합 빌드 | S3/S4 | 실세션·SSE 장애격리, KR 검증/만료, 스포일러 잠금, 캐시 PII 0, 스냅샷 불변 | KPI-04,11,12,14,17,19,21 |
| **G4** UAT/성능 | S5 | 골든셋·수동 스포일러 검수, p95, 장르 정확도, 영상 매칭, 유용성, 접근성 | KPI-01,02,13,15,16,20,23,25,26,27 |
| **G5** 운영/릴리스 | 스테이징 이후 | 배포 헬스, 백업 복구, 시크릿/권한 철회, 비용 잠금, CI 회귀, 롤백 리허설 | 릴리스 결정서 + KPI-28 지속 |

**Hard stop(0건 원칙):** 사용자 간 기록 노출(KPI-11), 기본 스포일러 유출(KPI-12), 공용 캐시 PII(KPI-19), 잘못된 공개 전 평점(KPI-24), 금지된 데이터 이용(KPI-28), 인증 없는 유료 API 호출(KPI-18). 성능 KPI-16은 외부 공급자 지연을 구분 보고하되 미달 시 **실측 원인과 정책 변경 승인** 없이 PASS 표기 금지.

## 9. 빌드 후 평가 인덱스·측정/증거

### 9.1 단일 진실 공급원

- 지표 정의·산식·n·목표 값은 **`spec.md` SP-14의 KPI-01~28**이 기준. 본 계획에서 임의로 목표를 바꾸지 않는다.
- `config/evaluation_thresholds.yaml`은 KPI ID, threshold, `comparison_operator`, `required_sample_n`, dataset_id, gate를 기계 판독 가능하게 보존. `evaluation/compute_kpis.py`가 측정/판정하고 `validate_traceability.py`가 누락을 차단.
- **평가 결과 상태:** `PASS | FAIL | BLOCKED | NOT_RUN | WAIVED`; `NOT_RUN`, `BLOCKED`는 PASS가 아니다. WAIVED는 비핵심 SHOULD 조건에만 사유·승인·만료 포함; **하드 게이트의 WAIVED 금지**.

### 9.2 KPI 영역과 자동 평가 파이프라인

| 품질 영역 | 지표 ID | 실행 데이터/도구 | 합격을 결정하는 핵심 |
|---|---|---|---|
| 자연어·직접 관련 장르 | KPI-01,02,26 | GS-QRY-100 / 50 human-label queries, pytest, 블라인드 UAT | 파싱 ≥98%, 직접 장르 ≥95%, 추천 적합 ≥95% |
| 공개 연도·동명이작 | KPI-03,05,24 | GS-TITLE-150·경계 50쌍, fixture | 연도 100%, 잘못된 병합/미공개 점수 0 |
| 국내 제공·근거/캐시 | KPI-04,17,20,28 | KR 경로 100·극장 30·TTL 40, 계약 체크 | 근거 정확 ≥99%, 미확인/만료 current 0, 필수 근거 100%, 합법 사용 100% |
| 점수 재현·가중치·결측 | KPI-06,07,08,23 | 100 scoring fixture 반복 10회, 시즌 40 | 재현 100%, 가중치 위반/허위 보완 0, 트렌드 100% |
| 개인 상태/사용자 격리 | KPI-09,10,11,19,21 | GS-STATE-100 + 2사용자 테스트 + leak scan | 시청 제외/undo 100%, 격리·PII·스냅샷 훼손 0 |
| 영상·스포일러 | KPI-12,13 | GS-VIDEO-50 + 수동 검수 50, DOM/API/alt 검사 | 누출 0, 매칭 ≥98% |
| 독립 섹션·속도 | KPI-14,15,16 | fault injection 30 + 부하 100회, k6/Locust | 섹션 독립 100%, warm p95≤5초, cold p95≤15초 목표 |
| 월예산·일일 횟수 | KPI-18,22 | 100 concurrent requests·월말/KST 경계 | 무검증 호출 0, 차감·캐시0 규칙 100% |
| 웹 접근성·사용 가치 | KPI-25,27 | Playwright+axe 20, 사람 블라인드 30 | 심각 접근성 0, 이유 유용도 ≥85% |

### 9.3 Golden Dataset 파일 형식

- `GS-QRY-100`: JSONL `query`, `reference_intent`, `section`, `expected_years`, `expected_genres`, `expected_subgenre_count`.
- `GS-TITLE-150`: JSONL `media_id`, `media_type`, `original_title`, `first_release`, `kr_release`, `identity_group`, `eligibility`, `expected_bucket`, `evidence_ids`.
- `GS-STATE-100`: JSONL `initial_state`, `events`, `expected_state`, `expected_next_run_exclusion`, `expected_wishlist`.
- `GS-VIDEO-50`: JSONL `video_id_fake`, `media_key`, `spoiler_flag`, `title_should_be_locked`, `expected_match`.
- `GS-FAULT-50`: JSONL `fault_type`, `source`, `timeout`, `expected_section_state`, `expected_charge_count`.
- `GS-SEO-40`: JSONL `series_id`, `seasons`, `same_provider`, `expected_trend`, `expected_nonconsecutive_warning`.

Fixtures는 **합성/허가 데이터**로만 저장하고 실제 평점 제공자의 무단 데이터셋 복제 금지. Live smoke는 데이터를 복제 커밋하지 않고 근거 URL·시각·권한 정책 코드만 저장.

### 9.4 평가 아티팩트(빌드마다 생성)

```text
reports/evaluation/<git_sha>/
├── manifest.json              # SHA, 모델·프롬프트·scoring·dataset 버전, 실행환경·시간
├── task_status.json           # TASK 진행/통과·실패·커밋·증빙
├── requirements_trace.csv     # INT/AC/SP/WP/TASK/T/KPI/G 상태 연결
├── test_results.xml           # pytest + Playwright JUnit
├── kpi_results.json           # KPI-01~28 값, 합격선, n, 상태, 증거
├── provider_compliance.md     # EXT-01~08 접근·수집·캐시·표시 권한
├── security_findings.md       # JWT/OIDC, SSRF, 개인정보, 비밀 점검
├── performance_results.json  # warm/cold 100회 p50,p95/p99, 장치·지역
└── release_decision.md        # G0~G5, blocker, GO/NO-GO, 재검 날짜
```

**필수 `kpi_results.json` 구조:** `kpi_id`, `numerator`, `denominator`, `observed`, `target`, `sample_n`, `dataset_version`, `commit_sha`, `environment`, `measurement_start/end`, `status`, `evidence_paths`. 오프라인 통과와 라이브 검증 통과를 **별도 구분**.

## 10. CI/CD 및 로컬 실행 절차

### 10.1 로컬 환경 부트스트랩 (Windows, WSL 불필요)

```powershell
# 사전조건: Git, Node.js (Next.js가 지원하는 LTS), npm, Python 3.11+, Docker Desktop 또는 원격 Postgres
cd screen-intelligence

# 프론트엔드: 기존 프로젝트가 없다면 JavaScript/JSX 선택으로 Next.js App Router 생성
npx create-next-app@latest frontend
# CLI 질문: TypeScript=No, ESLint=Yes, Tailwind=Yes, App Router=Yes, src/=Yes
cd frontend
npm ci
npm run dev

# 백엔드 (별도 터미널)
cd ../backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 모의 테스트 (외부 키 없이 실행 가능)
pytest -q
```

*실제 빌드 시에는 `create-next-app`이 의도한 디렉터리에 파일을 생성했는지 확인하고, 처음 생성 직후 `npm install`→lock 생성→이후 `npm ci`를 사용한다. 위 명령은 **구현 후 목표 절차**이며 현재 저장소에 앱 코드가 생성되어 있다는 뜻이 아니다.*

### 10.2 프론트엔드 `package.json` 목표 scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "check": "tsc -p jsconfig.json --noEmit",
    "test:e2e": "playwright test",
    "test:a11y": "playwright test tests/a11y"
  }
}
```

`typescript` 패키지는 **코드 작성 언어를 TS로 바꾸기 위한 것이 아니라** JavaScript/JSDoc 정적 분석기 `tsc`를 제공하기 위한 devDependency이다. `jsconfig.json`에 `allowJs:true`, `checkJs:true`, `noEmit:true`, `jsx:"preserve"`를 넣는다.

### 10.3 GitHub Actions 품질 경로

```text
PR → markdown/RTM lint → secret scan/license scan → JS eslint/checkJs → Python ruff/mypy
   → pytest unit/contract/state/scoring → Alembic migration test
   → stub provider E2E + axe + golden-regression
   → emit JUnit/KPI JSON/trace CSV → G2/G3 merge gate

main → deploy staging → OIDC approved/unapproved → live provider smoke (if licensed)
     → SSE/polling fault test → security/perf/UAT → G4 → operator-approved G5 deploy
```

- Live provider 테스트에서 재현 불가한 외부 장애는 `BLOCKED`, 가짜 성공 표기 금지. 라이선스 미확정 소스는 `DISABLED` 표시 및 서비스 범위 축소 승인 전 G1 불합격.
- `main` 배포 전 DB migration 백업·feature flag·이전 컨테이너 태그/웹 배포 rollback 마련.
- 로그에서 실사용자의 Google 이메일/검색 전문, 쿠키/API 키, 스포일러 영상 제목/썸네일이 평문으로 남지 않는지 정적·E2E 검사.

## 11. 검증 체크리스트: 배포 전 종단 시나리오

`spec.md` 부록 C.1의 **EVAL-01~15 모두**를 실험 ID로 사용한다. 별도로 다음 매뉴얼 UAT를 수행한다.

1. `2026 첩보 미드/영화` 입력 → 4개 이하 하위 장르 선택 → 정규 MOVIE/US_SERIES만 병렬 출력.
2. 2025 세계 최초 개봉/2026 국내 첫 개봉 작품은 2026 정규 영화 섹션 제외, 국내 개봉연도만 별도 표기.
3. 시청한 시즌 하나 `봤음` → 현재 스냅샷 유지 → 다음 신규 검색에서 그 시즌만 제외 → `되돌리기`·기존 찜 복원.
4. 동일 작품 `관심 없음` → 현재 카드 유지 → 다음 run 전체 시리즈 제외 → 스핀오프는 별개.
5. 개인 5점 별점 → T축에만 반영 → `봤음` 되돌리기 시 비활성/재완료 시 재활성.
6. 최신 시즌만 한국 제공 → 추천 유지하되 이전 시즌별 `미제공/미확인`과 선행 시즌 경고 표시.
7. 완료된 영화 섹션은 드라마 외부 공급자 지연/실패와 무관하게 그대로 표시.
8. 유튜브 전체 요약 영상이 있더라도 가림 상태 DOM/JSON에 제목·썸네일·직접 URL 없어야 함; 펼치기 후에만 링크 표시.
9. 국내 극장 작품별 예매 링크가 실제 확인된 경우만 연결. 극장 미확인 작품을 과거 개봉 이력으로 현재 상영 표기 금지.
10. 공개 예정작·평가 대기작을 정규 10위 이내로 강제 채우지 않고 별도 카드에 표시.
11. 일일 한도 소진/월 예산 한계/사용자 승인 철회/동시 경합 시 유료 호출 0건. 캐시는 무료 열람 가능.
12. PC·모바일 동일 Google 계정의 시청/찜 데이터는 동기화하되 승인 계정 B에는 A 개인 데이터가 전혀 노출되지 않음.

## 12. 외부 의존성·위험·해제 조건

| ID | 위험 | 필수 대응 | 소유 TASK / 게이트 |
|---|---|---|---|
| EXT-01~03 | 작품·평점 메타데이터 재사용/재표시 권한 없음 | 라이선스 표 작성; 무허가 소스 비활성, 미검증 지표 null | TASK-007/009 · G1 |
| EXT-04 | 한국 OTT별 작품 제공 실측 불가 | 국가·작품·시점 근거가 확인된 경로만 current 표시 | TASK-010/024 · G1/G3 |
| EXT-05 | 극장 상영/예매 실시간성 부족 | 현재 상영 검증 실패 시 `unknown`, 극장 경로는 정규 추천 증거로 사용하지 않음 | TASK-010 · G1/G3 |
| EXT-06 | 화제성 소스 없음 | P축 null, coverage/Low 표시; 없는 인기값 창작 금지 | TASK-009/013 · G2 |
| EXT-07 | YouTube API 쿼터·스포일러 노출 | 상세 클릭에 한해 조회, videoId 검사, reveal 서버 게이트 | TASK-033 · G3/G4 |
| OPS-01 | 배포 호스트 SSE/worker 제한 | worker 독립, 짧은 SSE 제한이면 GET 폴링 폴백; 실측 보고 | TASK-040 · G5 |
| OPS-02 | Gemini 모델/단가 변동 | 모델/토큰 단가 환경 설정, 실비 원장+예약; 사용량 미확정 pending | TASK-035/036 · G2/G5 |
| OPS-03 | 예산 상한 제안 값 미승인 | 기본값은 환경변수 실험값만, 운영자 승인 전 production 비용 집행 금지 | TASK-035 · G1 |
| OPS-04 | 인기도 cohort 표본 부족 | 같은 지역·기간·유형 기준만 비교, 임의 합성 금지 | TASK-009/013 · G2 |
| OPS-05 | 품질·속도 임계 미달 | G4 불합격, trace와 원인분리 후 최적화/합의된 목표 조정 | TASK-041 · G4 |
| SEC-01 | OAuth 신원 위조/승인 철회 우회 | Google `sub` 서버검증, 짧은 BFF 증명, 토큰 재검증 | TASK-004~006 · G3 |
| SEC-02 | 사용자 상태·캐시 간 교차 오염 | 사용자 스코프·public cache PII 0·fixture 테스트 | TASK-019/037 · G3 |
| DATA-01 | 관심없음/봤음 undo 경쟁 | version/operation_id/idempotency, 마이그레이션 테스트 | TASK-017~019 · G2 |
| UX-01 | 너무 긴 초기 응답·복잡한 질문 | 파서 규칙 우선, 최대 4개 장르, 상세 지연, 분야 선완료 | TASK-020~030 · G4 |

## 13. 완료(Definition of Done)와 첫 릴리스 범위

**P0 릴리스 GO:** G0~G5 증거가 존재하고 모두 해당 단계의 PASS; 출시 데이터 제공/사용권 문서 실제 확인; 한국에서 볼 수 있는 작품만 정규 랭킹; 40/40/10/10 정확; 시청·찜·관심없음·별점·승인/예산이 원자적으로 작동; 유튜브/프랜차이즈·시즌 경고/스포일러 보호; 영화·미드 선완료 UI 및 모바일 접근성; API/DB 비밀·백업 복구/롤백 검증.

**P1 차기 이터레이션:** 미완료 섹션 취소, 내 기록 셀프 내보내기·완전 삭제 화면, 데이터 신뢰도 고급 필터, 사용자 명시적 AI 심층 분석, 고도화된 취향 학습. **P2:** 신규 시즌 알림, 외부 MCP 퍼블릭 연동, 공개 회원가입. P0 보안/개인 데이터 삭제 요청의 최소 처리 경로는 P1로 미루지 않는다.

**최종 평가 판정 예:** `PASS`(모든 필수 게이트 합격), `NO-GO`(Blocker 1건 이상), `CONDITIONAL/INTERNAL ONLY`(합법 fixture 데모는 가능하나 실제 공급자 미확보 등으로 공개 서비스 불가). `NOT_RUN`은 성공이 아님.

## 부록 A. `intent.md` → `spec.md` → `plan.md` 전수 추적표

> 생성 규칙: `spec.md` 부록 C의 INT-01~54/AC-01~59를 그대로 가져오고, 해당 `T-*`를 아래 `TASK-*` 코드 구현으로 연결한다. CI `evaluation/validate_traceability.py`가 **54개 INT·59개 AC·모든 대표 T** 누락 0건을 검사해야 한다. `KPI`/`G`도 `spec.md` 값을 변경하지 않는다.

| INT | AC | SP | WP | TASK(구현) | T(검증) | KPI | Gate |
|---|---|---|---|---|---|---|---|
| INT-01 | AC-03 | SP-03 / 04 | WP-03 | TASK-007 | `T-DATA-001` | KPI-04 | G1,G3 |
| INT-02 | AC-07 | SP-12 | WP-08 | TASK-033 | `T-DETAIL-001` | KPI-13 | G4 |
| INT-03 | AC-07, AC-12 | SP-12 | WP-08 | TASK-033 | `T-DETAIL-001,003` | KPI-13, KPI-20 | G4 |
| INT-04 | AC-08 | SP-12 | WP-08 | TASK-033 | `T-DETAIL-003` | KPI-12 | G3 |
| INT-05 | AC-04 | SP-04 | WP-03 | TASK-008 | `T-DATA-002` | KPI-04 | G3 |
| INT-06 | AC-04, AC-05 | SP-05 | WP-04 | TASK-012 | `T-SCORE-001` | KPI-06, KPI-07 | G2 |
| INT-07 | AC-09 | SP-12 | WP-08 | TASK-031 | `T-DETAIL-004` | KPI-15 | G4 |
| INT-08 | AC-13 | SP-03 | WP-03 | TASK-009 | `T-DATA-003` | KPI-20 | G3 |
| INT-09 | AC-05, AC-14 | SP-05 / 11 | WP-04,06 | TASK-012 | `T-SCORE-002` | KPI-06 | G2 |
| INT-10 | AC-06, AC-11, AC-15 | SP-06 | WP-05 | TASK-016 | `T-STATE-001` | KPI-09 | G2 |
| INT-11 | AC-16 | SP-06 | WP-05 | TASK-016 | `T-STATE-002` | KPI-09 | G2 |
| INT-12 | AC-17 | SP-06 / 07 | WP-05,06 | TASK-017 | `T-STATE-003` | KPI-21 | G3 |
| INT-13 | AC-18 | SP-06 | WP-05 | TASK-017 | `T-STATE-004` | KPI-10 | G2 |
| INT-14 | AC-19 | SP-06 | WP-05 | TASK-017 | `T-STATE-005` | KPI-10 | G2 |
| INT-15 | AC-20 | SP-06 | WP-05 | TASK-017 | `T-STATE-006` | KPI-10 | G2 |
| INT-16 | AC-12, AC-21 | SP-05 | WP-04 | TASK-013 | `T-SCORE-003` | KPI-08, KPI-20 | G2 |
| INT-17 | AC-22 | SP-04 / 12 | WP-08 | TASK-031 | `T-DETAIL-005` | KPI-23 | G4 |
| INT-18 | AC-23 | SP-04 / 05 | WP-04 | TASK-013 | `T-SCORE-004` | KPI-08 | G2 |
| INT-19 | AC-24 | SP-04 / 12 | WP-03 | TASK-010 | `T-DATA-004` | KPI-04 | G3 |
| INT-20 | AC-10, AC-25 | SP-07 / 11 | WP-06 | TASK-021 | `T-RUN-001` | KPI-14, KPI-15, KPI-16 | G3,G4 |
| INT-21 | AC-26 | SP-03 / 04 | WP-03 | TASK-010 | `T-DATA-005` | KPI-04, KPI-17 | G3 |
| INT-22 | AC-01, AC-27 | SP-02 | WP-03 | TASK-008 | `T-DATA-006` | KPI-03 | G2 |
| INT-23 | AC-28 | SP-04 | WP-04 | TASK-013 | `T-SCORE-005` | KPI-24 | G2 |
| INT-24 | AC-29 | SP-04 | WP-03 | TASK-011 | `T-DATA-007` | KPI-24 | G2 |
| INT-25 | AC-30 | SP-02 | WP-07 | TASK-027 | `T-UI-001` | KPI-01 | G4 |
| INT-26 | AC-31 | SP-02 / 11 | WP-06 | TASK-020 | `T-RUN-002` | KPI-26 | G4 |
| INT-27 | AC-02, AC-32 | SP-02 | WP-03 | TASK-008 | `T-DATA-008` | KPI-02 | G4 |
| INT-28 | AC-33 | SP-02 / 11 | WP-06 | TASK-023 | `T-RUN-003` | KPI-14 | G3 |
| INT-29 | AC-34 | SP-02 / 11 | WP-06 | TASK-023 | `T-RUN-004` | KPI-01 | G4 |
| INT-30 | AC-35 | SP-05 / 11 | WP-06 | TASK-023 | `T-RUN-005` | KPI-06 | G2 |
| INT-31 | AC-36 | SP-08 | WP-02 | TASK-004 | `T-AUTH-001` | KPI-11 | G3 |
| INT-32 | AC-37 | SP-08 | WP-02 | TASK-005 | `T-AUTH-002` | KPI-11 | G3 |
| INT-33 | AC-38 | SP-08 | WP-02 | TASK-005 | `T-AUTH-003` | KPI-11 | G3 |
| INT-34 | AC-39 | SP-10 | WP-06 | TASK-024 | `T-RUN-006` | KPI-17 | G3 |
| INT-35 | AC-40 | SP-06 | WP-05 | TASK-018 | `T-STATE-007` | KPI-09 | G2 |
| INT-36 | AC-41 | SP-06 | WP-05 | TASK-018 | `T-STATE-008` | KPI-09 | G2 |
| INT-37 | AC-42 | SP-06 | WP-05 | TASK-018 | `T-STATE-009` | KPI-10 | G2 |
| INT-38 | AC-43 | SP-05 / 06 | WP-04,05 | TASK-015 | `T-SCORE-006` | KPI-07 | G2 |
| INT-39 | AC-44 | SP-06 / 07 | WP-07 | TASK-029 | `T-UI-002` | KPI-25 | G4 |
| INT-40 | AC-45 | SP-06 | WP-05 | TASK-018 | `T-STATE-010` | KPI-10 | G2 |
| INT-41 | AC-46 | SP-13 | WP-09 | TASK-035 | `T-COST-001` | KPI-18 | G2 |
| INT-42 | AC-47 | SP-13 | WP-09 | TASK-035 | `T-COST-002` | KPI-18 | G2 |
| INT-43 | AC-48 | SP-13 | WP-09 | TASK-035 | `T-COST-003` | KPI-22 | G2 |
| INT-44 | AC-49 | SP-07 / 13 | WP-09 | TASK-035 | `T-COST-004` | KPI-22 | G2 |
| INT-45 | AC-50 | SP-09 / 10 | WP-09 | TASK-037 | `T-COST-005` | KPI-19 | G3 |
| INT-46 | AC-51 | SP-03 / 10 | WP-06 | TASK-021 | `T-RUN-007` | KPI-14, KPI-20 | G3 |
| INT-47 | AC-52 | SP-02 / 11 | WP-06 | TASK-024 | `T-RUN-008` | KPI-26 | G4 |
| INT-48 | AC-53 | SP-04 | WP-04 | TASK-014 | `T-SCORE-007` | KPI-05 | G2 |
| INT-49 | AC-54 | SP-03 | WP-08 | TASK-034 | `T-DETAIL-006` | KPI-04 | G3 |
| INT-50 | AC-55 | SP-12 | WP-08 | TASK-033 | `T-DETAIL-007` | KPI-13 | G4 |
| INT-51 | AC-56 | SP-05 | WP-04 | TASK-014 | `T-SCORE-008` | KPI-06, KPI-08 | G2 |
| INT-52 | AC-57 | SP-07 / 11 | WP-06 | TASK-022 | `T-RUN-009` | KPI-14 | G3 |
| INT-53 | AC-58 | SP-08 | WP-02 | TASK-006 | `T-AUTH-004` | KPI-11 | G3 |
| INT-54 | AC-59 | SP-08 | WP-02 | TASK-006 | `T-AUTH-005` | KPI-11, KPI-19 | G3 |

### A.1 `spec.md` 명세 영역(SP-01~SP-15) 책임 작업 매핑

| Spec | 구현 책임 TASK | 검증 단계 |
|---|---|---|
| SP-01 구성/실행 환경 | TASK-001~003, TASK-025, TASK-040 | G0,G2,G5 |
| SP-02 입력/연도/장르 | TASK-008, TASK-020, TASK-027 | G2,G4 |
| SP-03 외부 데이터/근거 | TASK-007~011 | G1,G3 |
| SP-04 식별/공개/자격 | TASK-008, TASK-010~011, TASK-013 | G2,G3 |
| SP-05 P-GSEI/추세 | TASK-012~015, TASK-031 | G2,G4 |
| SP-06 사용자 상태 머신 | TASK-016~019, TASK-029 | G2,G3 |
| SP-07 API/SSE | TASK-002, TASK-021~024, TASK-028 | G3 |
| SP-08 인증/개인정보 | TASK-004~006, TASK-037, TASK-039 | G1,G3 |
| SP-09 DB/마이그레이션 | TASK-003, TASK-016, TASK-035 | G2,G5 |
| SP-10 캐시/최신성 | TASK-010, TASK-024, TASK-037 | G3 |
| SP-11 실행/독립 출력 | TASK-020~024, TASK-028, TASK-040 | G3,G4 |
| SP-12 시즌/스핀오프/영상 | TASK-031~034 | G3,G4 |
| SP-13 예산/원장 | TASK-035~036 | G2,G5 |
| SP-14 평가/KPI | TASK-038, TASK-041 | G4 |
| SP-15 빌드/CI 인수인계 | TASK-001~003, TASK-038~042 | G0~G5 |

## 부록 B. G0~G5 평가 인덱스 전수 점검표

> **정식 지표 정의·샘플 기준은 `spec.md` SP-14**. 아래는 plan의 태스크·게이트 연결만 보여준다. 지표마다 실측 `observed`/`sample_n`이 없으면 NOT_RUN이다.

| KPI | 인덱스 | 목표(초기) | 소유 TASK | 검증 게이트 |
|---|---|---|---|---|
| KPI-01 | 의도 파싱 | ≥98% | TASK-020/027 | G4 |
| KPI-02 | 장르 정밀도 | ≥95% | TASK-008/020 | G4 |
| KPI-03 | 세계 공개연도 | 100% | TASK-008 | G2 |
| KPI-04 | 한국 시청처 근거 | ≥99%; 미검증 0 | TASK-010 | G3 |
| KPI-05 | 작품 병합 오류 | 0건 | TASK-008 | G2 |
| KPI-06 | 순위 재현성 | 100% | TASK-012/014 | G2 |
| KPI-07 | 가중치 40/40/10/10 | 위반 0건 | TASK-012/015 | G2 |
| KPI-08 | 결측 데이터 무결성 | 0건 | TASK-013 | G2 |
| KPI-09 | 시청 제외 | 100% | TASK-016~019 | G2 |
| KPI-10 | 찜/undo 원자성 | 100% | TASK-017~019 | G2 |
| KPI-11 | 사용자 데이터 격리 | 0건 | TASK-004~006/019 | G3 |
| KPI-12 | 스포일러 누출 | 0건 | TASK-033/034 | G3 |
| KPI-13 | 유튜브 일치 | ≥98% | TASK-033 | G4 |
| KPI-14 | 영화·미드 장애 독립 | 100% | TASK-021/022 | G3 |
| KPI-15 | 캐시 첫 섹션 p95 | ≤5초 | TASK-024/028/041 | G4 |
| KPI-16 | 콜드 첫 섹션 p95 | ≤15초 목표 | TASK-021/041 | G4 |
| KPI-17 | OTT/극장 TTL 위반 | 0건 | TASK-010/024 | G3 |
| KPI-18 | 예산 우회 API 호출 | 0건 | TASK-035 | G2 |
| KPI-19 | 공용캐시 PII | 0건 | TASK-037 | G3 |
| KPI-20 | 근거 완전성 | 필수 100%, 선택≥95% | TASK-009/028 | G4 |
| KPI-21 | 완료 스냅샷 불변 | 0건 | TASK-017/022 | G3 |
| KPI-22 | 유료 횟수 차감 정확성 | 100% | TASK-035/036 | G2 |
| KPI-23 | 시즌 추세 정확성 | 100% | TASK-014/031 | G4 |
| KPI-24 | 미공개작 점수/배지 | 0건 | TASK-011/013 | G2 |
| KPI-25 | 기본 접근성 | Critical/Serious 0 | TASK-025~030 | G4 |
| KPI-26 | 추천 적합도@10 | ≥95% | TASK-020/023/041 | G4 |
| KPI-27 | 추천 이유 유용성 | ≥85% | TASK-034/041 | G4 |
| KPI-28 | 합법 데이터 이용 | 100% | TASK-007/039 | G1 |

### B.1 `spec.md` 골든 종단 사례 EVAL-01~EVAL-15 실행 책임

| 검증 시나리오 | 주 평가 내용 | 책임 TASK | 연결 KPI |
|---|---|---|---|
| EVAL-01 | 세계 최초 공개연도 vs 한국 개봉연도 | TASK-008, TASK-020 | KPI-03 |
| EVAL-02 | 국내 극장+OTT 중복 후보 1건과 경로 복수 | TASK-008, TASK-010 | KPI-04,05 |
| EVAL-03 | 드라마 장애에도 영화 섹션 스냅샷 보존 | TASK-021, TASK-022 | KPI-14,21 |
| EVAL-04 | 관객만 있을 때 coverage=0.40, 나머지 결측 | TASK-013 | KPI-07,08 |
| EVAL-05 | 미공개 한국 일정 미확정 예정작 가드 | TASK-011, TASK-013 | KPI-24 |
| EVAL-06 | 다른 사용자의 시청/제외 이력 분리 | TASK-016, TASK-019 | KPI-09,11 |
| EVAL-07 | 시청 undo와 중간 찜 변경 경합 | TASK-017~019 | KPI-10 |
| EVAL-08 | 별점 비활성 보존/다시 봤음 시 복원 | TASK-015, TASK-018 | KPI-07,10 |
| EVAL-09 | 첩보 세부 장르 최대 4개와 인접 장르 제외 | TASK-020, TASK-027 | KPI-01,02 |
| EVAL-10 | 잠금 영상 제목/썸네일/URL 누출 0 | TASK-033 | KPI-12,13 |
| EVAL-11 | 공용캐시 무료, 개인 데이터 PII 분리 | TASK-024, TASK-035, TASK-037 | KPI-19,22 |
| EVAL-12 | 월 예산 직전 동시 요청 한도·원장 | TASK-035~036 | KPI-18,22 |
| EVAL-13 | 미드 TOP 7, 자동 영드 확장 금지 | TASK-023 | KPI-01,14 |
| EVAL-14 | 최신 시즌 추천 유지 + 선행 시즌 경고 | TASK-010, TASK-031 | KPI-04,23 |
| EVAL-15 | 한국시간 기준 3개 연도 경계 | TASK-020 | KPI-01,03 |

## 부록 C. 후속 build 작업 시작 명령

1. `G0`: 기존 문서/RTM 누락 검사 → 상위 정책 불일치 0 → PR 리뷰.
2. `G1`: `docs/provider-licenses.md`에 EXT별 법적 데이터 이용/캐시 조건 및 승인 날짜를 기록 → 무허가 연결 production disable.
3. `TASK-001~003`부터 코드 생성; 각 TASK PR은 해당 `T-*` 테스트와 **실제 증거파일**까지 묶어 제출.
4. 각 vertical slice 완료 후 `evaluation/run_evaluation.py --gate Gx` 실행. G2/G3/G4 목표 미달이면 원인·수정·회귀 재실행.
5. **G5 승인** 시점에만 실제 배포를 GO 처리. API 키/권한/외부 데이터가 없으면 fixture 데모까지만 수행한다.

---

**문서 완료 판정:** `plan.md`는 Build의 **설계/작업계획**이지 Build 완료 사실이 아니다. 이후 동일 경로에서 작업 상태·실측 지표·커밋·출처 승인을 갱신하고, 평가 보고서로 릴리스 여부를 판정한다.
