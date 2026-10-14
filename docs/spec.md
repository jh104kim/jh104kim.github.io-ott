# spec.md — Screen Intelligence Agent

> **단계:** SDLC / Specification (HOW & VERIFIABLE CONTRACT)  
> **버전:** 1.2 (agents.md 에이전트 아키텍처 연계 · Mock Provider 계약 · BFF 내부 서명 JWT · 2단계 원장 패턴 보완)  
> **작성 기준:** 2026-10-14 (Asia/Seoul)  
> **상위 문서:** [`맥락.md`](./맥락.md) v1.1 · [`intent.md`](./intent.md) v0.51 (D-01~D-50)  
> **연계 문서:** [`agents.md`](./agents.md) v1.0 (에이전트 오케스트레이션 및 프롬프트 규격) → [`plan.md`](./plan.md) v1.1 → build → evaluation  
> **상태:** 요구사항 추적·평가 계약 확정, Build Ready (G0 문서 게이트 통과). 실제 데이터 라이선스·API 접근 권한·성능은 G1~G5 검증 전까지 조건부 분리.  
> **우선순위 규칙:** 상위 목적은 `맥락.md`, 확정된 기능 정책과 예외는 **최신 `intent.md`**, 에이전트 상세 구조는 **`agents.md`**, 구현 계약과 평가법은 본 `spec.md`가 담당한다. 충돌하면 `intent.md`의 D-결정을 우선한다.

---

## 0. 문서 사용법과 추적 ID

이 문서는 개발하면서 수정하는 규범적 계약이다. **모든 중요한 동작은 요구사항(INT) → 명세(SP) → 수용 기준(AC) → 자동 테스트(T) → 운영 지표(KPI) → 빌드 게이트(G)**로 연결한다. 전체 연결표는 **부록 C**에 수록하고, 평가 증거 파일 계약은 **부록 D**에 둔다.

- `INT-01~INT-54` / `AC-01~AC-59`: `intent.md`에 존재하는 **기존 원본 ID**. 번호와 의미를 재정의하지 않는다.
- `SP-01~SP-15`: 본 문서 기술 명세의 소유 구역.
- `T-xxx`: pytest/Playwright/통합 테스트 ID. 모두 자동화 가능한 판정값을 갖는다.
- `KPI-xxx`: 실제 성능/품질 지표 및 계산식. 개발 전 허용기준(임시 목표)을 고정한다.
- `G0~G5`: plan 및 CI/CD에서 판단하는 단계별 합격 게이트.
- `EXT-xx`: 외부 데이터 계약·API 권한 등의 미확정 의존성. 가짜 데이터로 실서비스를 통과시키지 않는다.

**해석 규약:** `MUST`=미준수 시 릴리스 불가, `SHOULD`=권장·이슈 등록 후 예외 허용, `MAY`=후속 선택 기능. 실시간 시청 가능, 검증 출처, 점수 등은 근거가 없으면 항상 `unknown` / `unavailable_to_score`로 보인다.

### 상위 문서와 달라진 확정 결정(의도 우선)

| 초기 `맥락.md` 내용 | 최신 `intent.md` 확정 | 본 명세 채택 |
|---|---|---|
| 후보 부족 시 영드 자동 확장 가능 | D-25: 영드·유럽은 요청하거나 클릭할 때만 | **자동 확장 금지** |
| 시청 체크 즉시 목록 갱신처럼 기술 | D-08: 현재 결과 보존, 신규 검색부터 제외 | **스냅샷 불변 + 상태 오버레이** |
| 전체 추천 TOP N 예시 | D-05/D-26: 영화·미드·확장 영드 각각 독립 TOP 10 | **별도 섹션** |
| OTT 중심 범위 | D-17: 현재 국내 극장 상영 영화 포함 | **극장 검증 포함** |
| GSEI 나머지 20% 불특정 | D-34: 전문가 10%, 취향 10% | **40/40/10/10** |
| 출시 후 모든 세부조사 즉시 반환 가능 | D-16/D-40: 섹션 선완료·심층분석 선택형 | **독립 섹션 확정/상세 지연 로딩** |

---

## SP-01. 범위·실행 환경·구성 요소

### 1.1 구성

```text
[Next.js SPA/SSR + Google OIDC 세션(BFF)]
       | HTTPS / same-origin secured session
       v
[FastAPI REST + SSE]
       ├── Authorization (OAuth sub + allowlist)
       ├── Query parser (규칙 우선 → Google Gemini Structured Outputs 필요할 때만)
       ├── LangGraph lightweight orchestrator (영화/드라마 병렬 분기)
       │      └── Provider adapters: metadata / rating / popularity / KR OTT / KR theater
       ├── Deterministic Verification & P-GSEI Engine (Python)
       ├── Watch/Wishlist/Not-interest/Ratings state service
       ├── Lazy media detail / season / related works / YouTube
       ├── Budget/usage reservation ledger
       └── PostgreSQL (public caches + user private data + run snapshots)
              └── Telemetry/Langfuse (개인 식별정보 제외)
```

**4개 논리 단계 유지:** (1) 입력 해석, (2) 후보/출처 병렬 조회, (3) 검증·개인필터·점수 계산, (4) 섹션별 출력. 각 공급자마다 별도의 LLM Agent를 만들지 않는다. 규칙 기반 처리가 가능한 곳에서는 LLM 호출 0회를 지향한다.

### 1.2 기술 기준

| 항목 | 기준 | 대안/조건 |
|---|---|---|
| Python 백엔드 | Python 3.11+, FastAPI, Pydantic v2 | 동등한 ASGI 기술 허용 |
| Orchestration | LangGraph StateGraph, 비동기 노드/병렬 분기 | 상태가 단순하면 노드 함수로 최소화 |
| LLM | Google Gemini API (`google-genai` SDK, `gemini-2.5-flash` / `gemini-2.5-pro`, `response_schema` strict JSON) | 모델 ID 환경변수 설정 (`GEMINI_API_KEY`, `GEMINI_MODEL_FAST`). 모델명 하드코딩 금지 |
| Web | Next.js App Router + **JavaScript/JSX(HTML 시맨틱 마크업)** + Tailwind CSS v4 + 접근성 기반 UI 컴포넌트 | SSR/BFF로 브라우저 API 비밀 차단; JSDoc `checkJs`로 정적 검사 |
| Database | PostgreSQL 16 + SQLAlchemy 2/Alembic | 로컬 개발도 Docker Compose 기반 PostgreSQL 16 단일 환경 사용 (SQLite 배제; 부분 인덱스 및 FOR UPDATE 정합성 보장) |
| Background tasks | 가벼운 워커 + DB 상태 기반 잡 | 프로세스 내부 BackgroundTasks만으로 영속성 보장하지 않음 |
| Push | SSE (`EventSource`) + GET 폴링 폴백 | 배포 서비스의 장시간 SSE 허용 여부 사전 검증 |
| Observability | 구조화 로그, OpenTelemetry/Langfuse | PII 최소화·로그 보존 기간 설정 |
| 배포 | Vercel(Web) + Python 호스팅(API/worker) + 관리형 PostgreSQL | 호스트·DB 가격은 `plan.md` 비교 선택 |
| 외부 데이터 | 공급자 어댑터 + 라이선스 게이트 | 무단 웹 스크래핑·무허가 평점 재게시 금지 |

**실행 원칙:** 추천 엔진(`core/scoring`, `core/eligibility`, `core/identity`)은 웹 프레임워크와 독립된 순수 Python 함수/패키지로 제공한다. REST 호출뿐 아니라 향후 MCP 어댑터에서도 같은 결과가 나와야 한다.

### 1.3 초기 제공 범위

P0: Google OAuth + 승인 계정, 분야별 검색, 연도·장르·국내 가용성, 평점·GSEI, 극장 포함, 시청/찜/관심없음/별점, 캐시·비용통제, 시즌 및 스핀오프 기본 조회, YouTube 검증 링크·가림, 최소 계정 삭제 요청 경로.  
P1: 취소, 고급 필터, 데이터 내보내기/완전 삭제 UI, 정교한 시즌/개인화 모델, 상세 AI 분석.  
P2: 알림, 공개 작품 공유, 외부 MCP 공개 서비스.  
P0의 세부 구현은 P1 기능이 완성되지 않았다는 이유로 불안전해져서는 안 된다.

## SP-02. 사용자 입력·장르·연도 계약

### 2.1 QueryIntent 자료형

```json
{
  "original_query": "2026년 첩보 미드나 영화 추천해줘",
  "requested_years": [2026],
  "years_origin": "explicit",
  "genres": ["spy"],
  "subgenres": ["intelligence_politics", "action_counterterror"],
  "sections": ["MOVIE", "US_SERIES"],
  "region": "KR",
  "language": "ko-KR",
  "max_per_section": 10,
  "exclude_watched": true,
  "exclude_not_interested": true,
  "allow_adjacent": false,
  "allow_eu_expansion": false,
  "refresh": false
}
```

- `requested_years`: 명시 연도는 그대로 적용. 연도 미지정 시 요청일의 Asia/Seoul 현재 연도 기준 `{Y-2,Y-1,Y}`. `all_years=true`는 사용자가 버튼으로 선택했을 때만.
- `2026`, `26년`, `2026년`은 동일. 미래 연도 입력은 `공개 예정작` 검색도 가능하나 실제 공개 전 순위는 없음.
- 광범위 장르에는 **최대 4개의 세부 장르 옵션** + 별도 `전체` 선택 제공; 이미 구체적인 질문이면 재질문 없음.
- 여러 장르 선택 시 기본 `OR` 검색 후 **각 작품이 선택된 적어도 한 장르와 직접 연관**되어야 한다. `AND` 옵션은 후속 기능.
- 기본 섹션 `[MOVIE, US_SERIES]`. 사용자 요청이 특정 매체/영드면 명시 요청 우선. `EU_SERIES`·`ADJACENT`는 버튼 클릭 또는 최초 명시 요청만.
- 영화는 제작국 불문, 드라마는 공식 주제작 제작국 기준 미국·영국/유럽 분류. 공동 제작(US+GB)의 **기본 소속 섹션은 최초 제작국/주요 원공개 위탁국으로 한 번만** 결정하고, 모호하면 `country_ambiguous`로 보류. 확장 섹션에서는 기존 상위 시리즈와 중복 제시 금지.

### 2.2 연도 판정

- 영화: 공식 출처로 검증된 **전 세계 최초 공개 관객 상영/상업 공개 날짜**의 연도. 검증된 영화제 관객 공개가 배급 개봉보다 먼저라면 영화제 공개일 적용. 언론 시사회, 제작 완료일, 예고편 날짜는 제외.
- 드라마: 검색 대상 **시즌 첫 회가 실제 일반 시청자에게 공개된 세계 최초 날짜**. 시리즈 첫 공개연도는 별도 필드.
- 한국 최초 극장 개봉/OTT 공개 날짜는 화면에 별도 표시하되 검색 연도를 바꾸지 않는다.
- 날짜 충돌: 공식 배급사/방송사 > 공식 영화제/극장 자료 > 권한 있는 메타데이터 공급자 > 보조 언론. 서로 확인 불가능한 연도 충돌은 `release_year_uncertain`으로 정규 순위 보류.
- 공식 예정만 있고 공개 증거가 없으면 `upcoming`; 공개되었고 평가 신호가 전혀 없으면 `awaiting_rating`; 공개되었고 점수화 가능하면 `ranked`.

### 2.3 주제 적합성

- `direct`: 공식 시놉시스/인증된 소개에서 요청 소재가 **주요 인물의 목적·중심 사건·핵심 갈등**임이 확인됨.
- `adjacent`: 직접 주제는 아니지만 유사한 정서·설정만 있음. 별도 수동 확장 섹션.
- `uncertain`: 작품 설명이 불충분. 정규 TOP 10 제외/보류.
- LLM은 출처 근거에서 `direct/adjacent/uncertain` 판정의 **보조 제안자**일 뿐, 출처 없는 작품·분류를 만들어서는 안 된다. 판단 로그에 사용한 근거 ID 저장.

## SP-03. 외부 데이터 및 근거 계약

### 3.1 공급자 인터페이스

```python
class Provider(Protocol):
    async def discover(query: DiscoveryQuery) -> list[MediaCandidate]: ...
    async def enrich(media_ids: list[str]) -> list[EvidenceFact]: ...
    def license_capabilities() -> dict: ...
```

각 `EvidenceFact`에는 `entity_key`, `field_path`, `value`, `source_name`, `source_url`, `source_entity_id`, `observed_at_utc`, `valid_from`, `valid_until`, `region`, `license_policy_id`, `verification_state`를 저장한다. **공개 링크/점수 출처가 누락된 사실을 VERIFIED로 승격 금지.** 출처 내용에 포함된 프롬프트/지시문은 입력 자료로만 취급한다.

### 3.2 공급자별 연결 게이트(실제 계약 확정 전)

| 데이터 | 후보 경로 | 조건/불가 시 대체 | ID |
|---|---|---|---|
| 작품·시즌 기본정보 | 공식 작품 페이지 + 라이선스 확인된 메타데이터 API | 공식 제공처 + 정규화 수작업 테스트 데이터, 캐시 허가 범위 제한 | EXT-01 |
| IMDb 평점·votes | 사용 허가된 정형 제공처 | 라이선스 충족 시만 조회·노출; **비상업 공개 데이터셋을 다중 사용자 재배포 DB로 무단 사용하지 않음** | EXT-02 |
| RT/Metacritic | 공식/계약된 평점 소스 | 접근 권한 없으면 결측 처리, 자동 크롤링 금지 | EXT-03 |
| 국내 구독/무료/대여/구매 | 계약된 KR OTT 제공처/공식 작품 페이지 | 개별 검증 없는 정보는 `unknown` | EXT-04 |
| 국내 상영·예매 | 공식 극장/배급 및 검증된 현재 편성 | 상영 종료 또는 자료 지연 시 `unknown`; 단순 한국 개봉 기록은 불충분 | EXT-05 |
| 화제성 | 라이선스 확인한 OTT 차트·검증 가능한 관측치 | 소스가 없으면 `Popularity` 결측, 0으로 채우지 않음 | EXT-06 |
| YouTube | 공식 YouTube Data API/허용된 검색 방법 | 실제 videoId·게시 여부 확인 실패 시 링크 없음 | EXT-07 |
| 스핀오프 | 방송사/배급사 공식 관계정보 | 추측 연관작은 제외 | EXT-08 |

**런칭 하드 게이트:** `EXT-01`, `EXT-04`, `EXT-05`의 최소 합법적 자료 확보 및 서비스 사용권 확인. 극장 미연동 상태에서도 OTT 경로로 추천은 가능하되, 극장 기반 추천은 비활성화하고 **극장 상영을 검증했다고 표시하지 않음**. 라이선스가 없는 평점·인기도는 데이터 없음으로 표시하고 서비스의 커버리지 한계를 공개한다.

### 3.3 링크 검증

- `KR` 실제 관람 경로의 증거는 허가된 편성 공급자 또는 공식 작품 링크의 **제목/ID·국가·접근 가능 상태·조회시점**으로 구성한다.
- URL 문자열이 존재한다는 사실만으로 `available` 아님. HTTP 200만으로 영화별 실제 편성이나 잔여 극장 상영을 보장하지 않는다.
- 작품별 공식/공급자 검증 링크만 출력; 임의 홈 URL을 영화별 예매 페이지로 가장하지 않는다.
- 허용 스킴 HTTPS, SSRF를 막기 위한 URL 호스트 allowlist 및 리다이렉트 제한. 유효하지 않으면 링크 숨김/`확인 필요`.
- 한국어 자막·더빙은 플랫폼·작품(시즌)·지역 단위로 `yes/no/unknown` 각각 저장. 추천 필수 통과 조건은 아님.

### 3.4 로컬 개발 및 CI용 Mock Provider 및 Fixture 계약

G1(외부 데이터 라이선스 검증) 게이트 통과 전 및 로컬 개발/CI 자동화 파이프라인(G2)을 위해 **외부 API 키 없이 100% 동작하는 표준 Mock Provider**를 필수로 탑재한다.

- **환경변수 스위치:** `PROVIDER_MODE=mock|live` (기본값: `mock`).
- **Fixture 저장소:** `backend/app/providers/fixtures/`
  - `titles.json`: Canonical ID 매핑 및 세계 최초 공개연도, 장르 메타데이터 (EVAL-01~15 검증용 최소 10개 작품 이상)
  - `ratings.json`: 관객 평가(IMDb/RT Audience/TMDB) 및 전문가 평가(Metacritic/RT Critic) 원본 수치 및 표본 수
  - `availability.json`: 한국 내 플랫폼(넷플릭스, 티빙, 웨이브, 쿠팡플레이, 극장 등) 편성 상태, 관람 모드, 링크
  - `youtube.json`: 한국어 전체 줄거리 요약 영상 및 공식 예고편 메타데이터 (스포일러 여부 포함)
- **무의존 검증 보장:** `PROVIDER_MODE=mock` 상태에서 모든 단위 테스트(`pytest -q`), 계약 테스트, Golden Dataset 평가(`GS-*`), E2E 스모크 테스트가 외부 네트워크 호출 0회로 100% 재현 통과해야 한다.

## SP-04. 작품 식별·공개 상태·추천 자격

### 4.1 Canonical Identity

- `media_id`는 내부 UUID, 타입 `movie|series`. 외부 ID는 `(provider, external_id)` 유니크 인덱스.
- 서로 다른 영화/리메이크·국가 버전은 동일 제목이어도 별도 `media_id`.
- 시즌 ID `(series_id, season_number)` 유일; 시즌 제목만으로 병합 금지. 시즌 0(스페셜)은 정규 시즌 추천에서 기본 제외.
- 동명이작은 원제·최초 공개 연도·제작국·외부 ID 2개 이상의 일치(가능 시)를 교차 확인; 불확실하면 `identity_review`.
- 동일 작품이 구독+대여+극장 제공이어도 **작품 1건**으로 점수·순위 1개, availability 리스트에 여러 경로 저장.

### 4.2 공개·가용성 상태

| 값 | 의미 | 정규 TOP 10 |
|---|---|---|
| `announced` / `scheduled` | 공식 발표·예정, 아직 공개 전 | X / 예정작 별도 |
| `delayed` / `cancelled` | 연기/취소 확정 | X / 상태 표기 |
| `released` | 실제 관객 또는 시청자 공개됨 | 다른 게이트 통과 시 O |
| `unknown` | 공개 여부 검증 불가 | X |

한국 시청 경로: `subscription|free|rent|buy|theater|unavailable|unknown`. `available` 판정은 `subscription/free/rent/buy`, 영화의 현재 `theater` 중 하나 이상의 **유효한 출처**가 있을 때만. 한국 이외 서비스는 기본 정규 TOP 제외.

특정 시리즈 신규 시즌이 국내 제공 확인이면 과거 시즌이 미제공/미확인이어도 시리즈 후보는 유지한다. 이전 시즌마다 3상태 `available|unavailable|unknown`과 `선행 시즌 시청 경로 확인 필요` 배지를 제공한다.

### 4.3 세 가지 배타적 출력 버킷

1. `RANKED`: 실제 공개됨 + 지정 연도·직접 장르 적합·유효 KR 경로 + 개인 제외 통과 + 점수 산정 가능.
2. `AWAITING_RATING`: 실제 공개됨 + 지정 연도·직접 장르 적합·유효 KR 경로 + 개인 제외 통과 + 유효 관객/인기 신호 **모두 결측**; 점수·순위 없이 별도.
3. `UPCOMING`: 해당 연도에 공식 세계 최초 공개가 예정되어 있으나 미공개. 한국 예정 정보 `unknown` 허용, **점수·순위/현재 시청 배지 없음**.

`identity_uncertain`, `release_uncertain`, `direct_genre_uncertain`, `KR_availability_unverified`는 정규 순위·평가 대기 신작에도 넣지 않는 `HELD` 내부 상태. 각 범주 변경은 다음 신규 실행에서 반영하고 과거 스냅샷은 유지한다.

## SP-05. P-GSEI 수치 알고리즘 v1.0

### 5.1 평가축과 원본 보존

| 축 | 가중치 | 예시 신호 | 원본 지표는? |
|---|---:|---|---|
| A = Audience | 0.40 | IMDb/허가된 관객 평점·평가자 수, 관객 호감 비율 | 각각 원점수, votes, metric type 유지 |
| P = Popularity | 0.40 | 한국/글로벌 차트·관측된 화제성·조회 성과 | 기간·지역·표본별 기록 |
| C = Critics | 0.10 | 허가된 전문가 평가·긍정률 | 0~100 값 의미 및 표본 구분 |
| T = Taste | 0.10 | 검증된 장르·전개·유머·개인 시청 별점 | 모델 설명/근거 따로 유지 |

관객의 `긍정률(%)`은 평균 평점과 다른 **신호 유형**이다. 단순히 같은 점수인 것처럼 의미를 바꾸지 않고, 각 지표의 `kind`와 계산 경로를 보존한다.

### 5.2 정규화 및 표본 보정(테스트 가능한 권장 구현)

1. 관객 평점은 원형에 맞게 `0~100`으로 변환한다: 예: 10점 척도 `10×rating`, 5점 척도 `20×rating`, 관객 긍정률 `percent`(서로 **뜻이 다른 지표**라는 경고 유지).
2. 정식 평균 평점+투표 수가 있는 경우 **동일 공급자·매체 유형별 관측 데이터**로 계산한 모집단 평균 `µ`와 사전표본 가중치 `m`을 사용하여 Bayesian shrinkage 적용: `Bayes = (v/(v+m))×R + (m/(v+m))×µ`. `µ`, `m`은 데이터셋·모델 버전과 함께 기록; 초기 `m=500` (프로토타입 제안, 평가셋에서 조정). **실측 `µ`를 확보하지 못하면 베이지안 보정하지 않는다.**
3. A축 내부 공급자 합성의 기본 가중치는 `평점 평균 0.6 / 검증된 관객 호감 비율 0.25 / 그 외 사용자 평점 0.15`로 제안한다. 공급자 이용권한/표본이 없으면 **관측된 항목으로만 축 내부 가중치 재정규화**한다. 같은 공급자의 중복 복제 지표는 한 번만 카운트한다.
4. P축은 `동일 작품 유형(movie/series) + 동일 관찰 기간(최근 7일/30일 등) + 동일 지역(KR 우선, 없으면 global 별도)`의 **비교 집합** 내 백분위 지표로 정규화한다. 관측 순위 `r`/전체 `N`이면 예시 `p=100×(N-r)/(N-1)`(`N>1`), `N=1`은 백분위 산정 불가로 별도 보조지표. 지역·기간이 다른 숫자를 그대로 평균하지 않는다. `unknown` 순위는 최하위 0점이 아니다.
5. C축은 접근 권한을 확인한 전문가 평균/긍정 비율 각각을 형식에 맞게 정규화하고 내부 재가중. T축은 **공식 시놉시스 기반** 장르·템포·유머·스릴러 적합성을 평가한다. 근거가 없으면 `T=null`; 특정 속성에 추측 점수 부여 금지.
6. 개인 별점은 사용자가 `watched`인 영화·시즌에 남긴 **활성 점수만** 사용한다. 유사 장르의 활성 표본이 5개 이상일 때만 T 내부 취향 추정치를 최대 ±10점 조정(실험값); 5개 미만이면 기본 텍스트 취향 프로필만 사용. 개별 작품의 별점은 그 작품의 IMDb/A/P/C축에 절대 반영하지 않는다.

### 5.3 결측 처리·산정 자격

- **모든 축을 무조건 0점 또는 임의 평균으로 대체 금지.** `A`, `P` 중 최소 한 축에 실제 관측 신호가 있어야 `RANKED` 후보가 될 수 있다. 둘 다 없으면 전문가 평가만 있더라도 `AWAITING_RATING`(범주명은 평가/인기 신호 부족을 의미). 이는 구현을 위한 최소 신뢰 기준이며 출시 전 비교 테스트 가능.
- 점수 산정 가능 축의 인덱스를 `K`라 할 때 `PGSEI_raw = Σ(w_k×S_k) / Σ(w_k), k∈K`; `w=[.4,.4,.1,.1]`, 관측/근거 있는 축만 포함. `T`가 근거 부족이면 미포함. 미포함 축과 이유를 반드시 같이 보여준다.
- **원칙:** 결측 축은 계산에서 제외할 뿐 보정된 종합점수를 관측 점수로 가장하지 않는다. `coverage = Σ(w_k), k∈K` (예: 관객만 있다면 0.40). 순위가 가능해도 낮은 커버리지임을 드러낸다.
- 데이터 신뢰도는 **점수와 분리**하여 `High / Medium / Low`: `coverage ≥0.85` + 핵심 출처 2개 이상 + 충분한 표본/신선도=High; `coverage≥0.60` + 검증된 출처=Medium; 이외 Low. 표본 충분 기준(초기): 관객 투표수 500 이상, 인기 차트 최근 30일 이내. 해당 기준은 `scoring_version`으로 고정하고 실증 시 재설정.
- 누락된 A/P로 인해 `coverage<0.8`이면 카드에 **`비교 주의 · 지표 부족`** 표시. 그 자체로 점수 임의 감점하지 않음. 사용자에게 신뢰도 필터 제공(P1).
- 작품·시즌 평점 혼합 금지: 요청 시즌의 A/P/C를 우선, 과거 시리즈의 평점은 `series_context`로 별도 표시. 시즌 지표가 없으면 `series_rating_only` 배지 + 해당 사실을 공개하고 시즌 점수를 지어내지 않는다.

### 5.4 정렬 및 표시

1. 섹션별 `PGSEI_raw` 내림차순(`float64` 저장, 계산 버전 포함) → 동점 또는 차이 `≤0.1`점이면 **coverage 높은 순 → 실제 관객 투표수 많은 순 → canon_media_id 오름차순**으로 결정적 정렬. `0.1` 근접치는 `접전` 배지, 임의 승부 해석 금지.
2. 표시 반올림은 소수 첫째 자리(`round-half-up`), **정렬에는 반올림하지 않은 원점수** 사용.
3. 관객과 화제성은 40/40, 전문가/취향 10/10의 축 가중치만 사용. 인기 40%는 외부 관측 신호가 있을 때만 반영.
4. 개인화 결과/순위는 사용자별 저장. **찜·접근 비용·이용 방식·한국어 자막·별점 입력 여부 자체**로 순위를 바꾸지 않음; 별점 데이터가 충분하면 오직 T축 계산에만 기여.
5. 영화/미드/유럽 드라마는 서로 비교·혼합 순위를 만들지 않는다. 가용 작품 부족으로 10개 미만이라도 확인된 수만 출력.
6. `scoring_version`, `cohort_id`, 정규화 µ/m, 축별 관측치, 결측, 산정 시각, 사용자 취향 모델 버전을 `score_explanation`으로 저장. 계산 라이브러리의 동일 입력 동일 출력 요구.

### 5.5 시즌 품질 추세

- 한 시리즈의 시즌별 동일 출처·동일 평가 유형을 정렬하여 표시. 검증된 개별 시즌 평가가 2개 이상일 때만 트렌드 산출.
- `Δ = latest_valid_season_score - previous_valid_season_score` (0~100 정규화 동일 출처). 초기 규칙 `Δ ≥ +5` 상승, `Δ ≤ -5` 하락, 그 외 유지. 다른 평점 소스 사이 단순 점수 비교 금지.
- 시즌 1→3처럼 중간 시즌 데이터가 없으면 `비연속 비교` 표시. 시즌 0 제외, 시즌 자체 자료 부족 시 `추세 미산정`.
- 전작의 순위/P-GSEI가 최신 시즌의 점수인 것처럼 표시하지 않는다.

## SP-06. 사용자 시청·찜·관심없음·별점 상태 머신

### 6.1 상태와 범위

- 영화 watch_status: `unknown|not_watched|watching|watched|dropped` (초기 unknown).
- 드라마 watch_status: **시즌별** 동일 상태. 작품 전체 watched 상태는 현재 공개된 모든 정규 시즌 watched일 때만 파생.
- 사용자 관심 목록: **작품 단위** `wishlist: boolean`; 시청 상태와 독립적이나 `watched` 시 자동 해제.
- `not_interested`: **작품 ID(드라마 전체 시리즈 단위)**. 동일 프랜차이즈의 다른 `media_id`에 전파하지 않음.
- 개인 별점: `1,2,3,4,5` 또는 null, 영화/시즌에 연결하며 `watched` 상태일 때만 활성화. 해제 시 저장값은 보존하되 학습에서 제외.

### 6.2 원자적 전이 계약

| 명령 | 저장 성공 시 | 현재 `run_id` 카드 | **다음 신규 run** |
|---|---|---|---|
| `mark_watched(movie/season)` | 해당 타깃만 watched, 기존 찜이 있으면 원자적 해제, undo 메타정보 저장 | `시청 완료·되돌리기`, 순위 고정 | 해당 영화/시즌 제외 |
| `undo_watched(op_id)` | 직전 상태 복원, **자동 해제 찜만** 조건부 복원, 별점은 보존·비활성 | 현재 카드 유지 | 제외 해제 |
| `toggle_wishlist` | 작품 단위 찜 변경 + 상태 버전 증가 | 즉시 반영, 순위 고정 | 점수/순위 영향 없음 |
| `mark_not_interested` | 작품 제외 + 찜 자동 해제 + 복원 메타정보 | `관심 없음` 상태만 반영 | 전체 드라마 시즌/영화 제외 |
| `undo_not_interested(op_id)` | 제외 해제 + 변경 후 사용자가 찜을 안 건드렸을 때 이전 찜 복원 | 유지 | 새 검색부터 재포함 가능 |
| `set_my_rating` | watched 대상의 1~5/null 저장 | 별점 반영, 순위 고정 | 사용자 T축만 재산정 가능 |

- 모든 명령은 서버 트랜잭션 + 사용자 소유권 확인 + `expected_version` 낙관적 동시성 + `Idempotency-Key`를 사용한다.
- 찜 자동 해제 시 `wishlist_version_after_auto_change` 저장. Undo는 해당 버전이 유지되고 사용자의 후속 수동 찜 변경이 없을 때만 복원한다. 사용자가 수동 변경했다면 가장 최근 명시적 선택 우선.
- 한 시즌의 `watched`를 되돌려도 다른 시즌 watch_status는 바꾸지 않는다.
- 시청 체크 성공 뒤 현재 run의 순위와 항목 구성은 **immutable snapshot**. 화면에는 최신 개인 상태만 오버레이한다. 같은 검색 조건이라도 신규 `run_id`면 필터를 다시 적용한다.
- 저장 실패/경합은 **409 conflict / 오류 토스트**, 낙관적 성공 상태 확정 금지. 필요한 경우 최신 상태를 재조회한다.
- 찜 목록은 사용자별 목록 화면에서 **조회 및 찜 해제** 가능. 과거 작품 검색·일괄 등록 기능은 만들지 않는다.

## SP-07. API 계약과 이벤트

### 7.1 인증과 공통 응답

- 보호된 모든 엔드포인트는 서버가 확인한 사용자 세션 + 승인 계정 검사 필수(공개 `/health` 제외).
- 표준 오류: `{ "error": { "code": "...", "message": "...", "retryable": false, "details": {} }, "request_id": "..." }`.
- 주요 오류 코드: `AUTH_REQUIRED(401)`, `NOT_APPROVED(403)`, `BUDGET_EXHAUSTED(429)`, `DAILY_QUOTA(429)`, `CONFLICT(409)`, `VALIDATION_ERROR(422)`, `SOURCE_UNVERIFIED(422)`, `PROVIDER_TIMEOUT(503)`, `INTERNAL_ERROR(500)`.
- **422 / 429 세부 페이로드 계약:**
  ```json
  // 429 DAILY_QUOTA_EXHAUSTED 예시
  {
    "error": {
      "code": "DAILY_QUOTA_EXHAUSTED",
      "message": "오늘의 무료/유료 검색 한도(10회)를 모두 소진했습니다.",
      "retryable": false,
      "details": { "daily_limit": 10, "daily_used": 10, "reset_at_kst": "2026-10-15T00:00:00+09:00" }
    },
    "request_id": "req_uuid"
  }
  ```
- 타 사용자 `media/watches` 조회는 노출하지 않고 리소스 경계를 404/403으로 보호. 개인 응답 `Cache-Control: private, no-store`.

### 7.2 경로/메서드

| HTTP | 경로 | 주요 입력/출력 | 우선순위 |
|---|---|---|---|
| POST | `/api/v1/recommendations` | `query, sections?, filters?, refresh?, idempotency_key` → `run_id, states, quota` | P0 |
| GET | `/api/v1/recommendations/{run_id}` | 섹션별 `pending/running/completed/failed/cancelled`, 스냅샷 + 최신 개인 상태 | P0 |
| GET | `/api/v1/recommendations/{run_id}/events` | SSE 섹션별 progress/completed/failed | P0 |
| POST | `/api/v1/recommendations/{run_id}/expand` | `kind=ALL_YEARS/ADJACENT/EU_SERIES` → 새 확장 run/section | P0 |
| POST | `/api/v1/recommendations/{run_id}/refresh` | 원본 데이터 강제 재조회 → 새 run_id | P0 |
| POST | `/api/v1/recommendations/{run_id}/sections/{section}/cancel` | 미완료 섹션만 취소 | P1 |
| GET | `/api/v1/media/{media_id}` | 기본 작품 정보·시즌·관계작·품질 추이 (LLM 미호출) | P0 |
| GET | `/api/v1/media/{media_id}/youtube` | 검증된 요약/예고편 메타데이터 (기본 `spoiler_locked: true`) | P0 |
| POST | `/api/v1/media/{media_id}/youtube/reveal` | 명시적 스포일러 경고 확인 후 실제 video_url/제목 반환 | P0 |
| POST | `/api/v1/media/{media_id}/ai-analysis` | 명시적 유료 분석 → 비용 확인·run ID | P1 |
| PUT | `/api/v1/me/watch-status` | `{media_id, season_id?, status, expected_version}` | P0 |
| POST | `/api/v1/me/watch-status/undo` | `{operation_id, expected_version}` | P0 |
| PUT | `/api/v1/me/wishlist/{media_id}` | `{is_wishlisted, expected_version}` | P0 |
| GET | `/api/v1/me/wishlist` | 나중에 보기 목록 | P0 |
| PUT | `/api/v1/me/not-interested/{media_id}` | `{excluded, expected_version}` | P0 |
| PUT | `/api/v1/me/ratings` | `{media_id, season_id?, rating: 1..5/null}` | P0 |
| GET | `/api/v1/me/usage` | 일일 잔량·월 지출·기준일 | P0 |
| GET | `/api/v1/me/export` | 개인 상태 JSON/CSV 내보내기 | P1 |
| POST | `/api/v1/me/deletion-request` | 확인 후 본인 데이터 삭제 요청 | P0 최소 접수/P1 셀프 UI |

**서버 반응 규칙:** 데이터 검색은 `POST 202 Accepted`와 `run_id`를 빠르게 반환; 분야별 검색은 비동기. 클라이언트는 SSE 수신 중 필요 시 `GET run`으로 재동기화. 유료 분석/확장은 실행 전 구체적인 `charge_count=1 or 0`, 잔여한도를 알려주되, 최초 요청에는 성공적으로 승인된 예약 건으로만 차감 처리한다.

### 7.3 SSE 이벤트(표준 계약)

```json
{"event":"section_completed","data":{"run_id":"uuid","seq":5,"section":"MOVIE","status":"completed","snapshot_version":1,"verified_count":7,"checked_at":"2026-10-14T09:00:00Z"}}
```

- 이벤트: `run_created`, `section_started`, `section_completed`, `section_failed`, `section_cancelled`, `run_finished`, `quota_updated`.
- `seq`는 run별 증가, 중복 이벤트는 `seq`로 제거. 재접속 시 `Last-Event-ID` 또는 `GET run`으로 누락 복구.
- `section_completed` 이후 해당 섹션의 **snapshot_version/content/rank 불변**. 시청 등 최신 상태만 별도 overlay 필드로 갱신.
- 종료·장애 감지는 초깃값 `heartbeat ≤15초`(조정 가능). SSE 지원이 어려운 배포 환경에서는 2초 간격 폴링으로 동등한 동작을 제공.

### 7.4 결과 스키마(축약)

```json
{
  "run_id": "uuid",
  "normalized_query": {"years": [2026], "genres": ["spy"], "region": "KR"},
  "sections": {
    "MOVIE": {
      "state": "completed", "snapshot_version": 1,
      "ranked": [{
        "rank": 1, "media_id": "uuid", "title_ko": "예시", "world_first_release_date": "2026-02-01",
        "p_gsei": 87.3, "scoring_version": "1.0", "confidence": "Medium",
        "subscores": {"audience": 90, "popularity": 88, "critics": null, "taste": 77},
        "coverage": 0.90, "missing_metrics": ["critics"],
        "eligibility_evidence_ids": ["ev1", "ev2"],
        "kr_availability": [{"mode": "theater", "status": "verified", "verified_at": "2026-10-14T08:00:00Z", "url": "https://example.invalid/mock"}],
        "current_user_state": {"watch_status": "unknown", "wishlisted": false, "not_interested": false, "my_rating": null}
      }],
      "awaiting_rating": [], "upcoming": [], "finished_at": "2026-10-14T09:00:00Z"
    },
    "US_SERIES": {"state": "running"}
  }
}
```

> 위 JSON은 **스키마 형태 예시(mock)**이며 URL·평점·가상 날짜는 실제 데이터가 아니다. 프로덕션에서는 근거 없는 도메인이나 숫자를 출력하지 않는다.

## SP-08. 인증·승인·개인정보 경계

- Google OAuth/OIDC Authorization Code + PKCE, 최소 scope `openid email profile`; 이메일/비밀번호 수집 및 Google 메일·Drive 권한 금지.
- 서버에서 OIDC ID Token의 서명, `iss`, `aud`, `exp`, `nonce`를 검증하고 Google `sub`를 **불변 외부 ID**로 저장. 이메일 변경은 동일 사용자로 유지.
- 승인 계정은 `approved_users(google_sub, status, approved_by, approved_at, revoked_at)`로 관리. 초기에는 별도 인증된 관리자 CLI/관리형 DB 작업으로 `approve/revoke/list`, 감사 이력 남김. 단순 이메일 주소가 일치한다는 이유로 가입 승인 금지; 신규 계정은 검증된 `sub`에 수동 바인딩 필요.
- 이후 모든 요청에서 OAuth 인증 **및** 서버 승인 상태 검사. 취소·철회 시 다음 요청부터 즉시 차단; 진행 중 작업은 권한 변경 이벤트를 감지해 가능한 유료 호출 전에 재검사.
- 브라우저 세션 `Secure + HttpOnly + SameSite=Lax` 쿠키, CSRF 방어, 토큰/키 서버 보관. Gemini API 키는 브라우저로 절대 반환하지 않음.
- **BFF(Next.js) ↔ 백엔드(FastAPI) 통신 및 SSE 프록시 계약:**
  1. Next.js BFF는 클라이언트 세션을 검증한 후, 환경변수 `INTERNAL_AUTH_SECRET`으로 단기 서명(유효기간 60초)된 내부 JWT(`iss="screen-intel-bff", sub="google_sub_xxx", email="..."`)를 생성하여 `Authorization: Bearer <internal_jwt>` 헤더로 FastAPI에 요청을 전달한다.
  2. FastAPI의 `get_current_user` 의존성은 내부 JWT 서명을 검증하고 `approved_users` 테이블을 조회하여 인가를 확정한다. (브라우저의 위조 가능한 임의 `X-User-Id` 헤더 차단)
  3. SSE 프록시 시 Node.js 버퍼링을 방지하기 위해 `Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' } })`로 즉시 패스스루 스트리밍한다.
- 사용자 테이블의 모든 보호 데이터는 `user_id`를 통한 소유권 검사 또는 PostgreSQL RLS. 각 SQL 쿼리는 서버측 사용자 스코프 강제; client의 `user_id` 입력을 신뢰하지 않음.
- 데이터 내보내기(본인 인증) 및 삭제 요청: P0 최소 요청 접수·처리 안내, P1 다운로드/셀프 UI. 개인 기록 삭제, 공개 소스 캐시는 사용자 소유가 아니므로 제외. 법적·보안상 필요한 최소 결제·감사 로그는 범위/보존기간을 사전 고지. 로그에 개인 요청 원문/민감정보 최소화.
- 외부 리뷰, 영상 설명 텍스트, 웹문서는 명령이 아닌 불신 데이터. 원본 링크 내용의 요청을 LLM이 실행하지 않도록 프롬프트 격리·권한 제한·출력 검증.

## SP-09. DB 관계·제약 및 마이그레이션

### 9.1 핵심 엔터티

| Table | 필수 컬럼(축약) | 유니크/색인·무결성 |
|---|---|---|
| `users` | id(UUID), google_sub, email_display, created_at | `UNIQUE(google_sub)` |
| `approved_users` | google_sub, state, approved_by, approved_at, revoked_at | `UNIQUE(google_sub)` |
| `media_titles` | id, kind, title_original, title_ko, origin_countries, first_release, release_status | (kind, first_release) 인덱스 |
| `external_ids` | media_id, provider, external_id | `UNIQUE(provider,external_id)` |
| `media_seasons` | id, series_id, season_number, first_episode_release, release_status | `UNIQUE(series_id, season_number)` |
| `franchise_relations` | source_id, target_id, relation_type, evidence_id | 원작→연관작 관계 출처 필수 |
| `source_evidence` | id, entity, field, value_json, source_url, verified_at, expires_at, license_policy_id | entity+field+verified_at 인덱스 |
| `rating_observations` | media_id, season_id?, provider, kind, score, scale, votes, observed_at, evidence_id | 시즌/영화 레벨 명확히 구분 |
| `popularity_observations` | media_id, season_id?, geography, window, cohort_id, rank, denominator, observed_at | 동일 기간·지역 인덱스 |
| `availability` | media_id, season_id?, region, platform_id, mode, state, url?, verified_at, expires_at | 경로별 최신성·출처 FK |
| `youtube_assets` | video_id, media_id, season_id?, kind, lang, spoiler_risk, verified_at, source | 실존 videoId 검증 |
| `watch_history` | user_id, media_id, season_id?, status, version, updated_at | 유저+타깃 유일; 영화/시즌 별도 제약 |
| `wishlists` | user_id, media_id, wishlisted, version, last_manual_change_at | `UNIQUE(user_id,media_id)` |
| `not_interested` | user_id, media_id, excluded, version | `UNIQUE(user_id,media_id)` |
| `my_ratings` | user_id, media_id, season_id?, rating, active, updated_at | 1~5 CHECK; watched일 때만 active |
| `state_operations` | operation_id, user_id, target, before_json, after_json, auto_wishlist_version, idempotency_key | undo/원자성·감사 |
| `recommendation_runs` | id, user_id, query_json, state, created_at, scoring_version, filters_version | user_id 인덱스; 개인 스냅샷 |
| `run_sections` | run_id, section, state, snapshot_json, snapshot_version, finished_at | `UNIQUE(run_id,section)` |
| `public_data_cache` | key, provider, payload_json, checked_at, expires_at, license_policy | **사용자 ID/개인 정보 저장 금지** |
| `usage_ledger` | request_id, user_id, day_kst, month_kst, reserved_calls, actual_cost, status | idempotent·예산 원장 |

- `UNIQUE(user_id, media_id, season_id)`는 PostgreSQL의 null 중복 허용을 유의해 **영화/시즌별 부분 유니크 인덱스**를 적용한다. 사용자별 상태를 동명의 다른 작품에 혼용 금지.
- 공개 캐시와 개인 추천 순위는 **논리적으로 분리된 테이블**이며, 공용 직렬화 스키마가 개인 데이터를 받으면 CI에서 실패하도록 테스트.
- 모든 마이그레이션에는 `upgrade`, 필요한 경우 `downgrade`, 백업/복구 절차, 롤백 한계를 기록한다.

## SP-10. 캐시·최신성·부분 실패

| 대상 | TTL 제안(설정가능) | 만료·실패 시 동작 |
|---|---:|---|
| 같은 조건의 비개인화 확정 검색 후보 | **최대 24시간** | refresh 강제 재조회, 개인 필터는 매 요청 새로 적용 |
| KR OTT/VOD 제공처 | **6시간** | 원천 재검증, 실패 시 `unknown`/마지막 확인시점 표시, 과거 confirmed로 현재 available 확정 금지 |
| KR 현재 극장 상영·작품별 예매 | **60분** | 시간 초과 시 현재 상영 판단 보류, 링크 검사 |
| 일반 공개 메타데이터/시즌 과거 정보 | **7일** | 변동 감지/수동 갱신 가능 |
| 평점·표본 수 | **24시간** | 구버전 시점 공개, scoring_version 기록 |
| 글로벌 공개 예정일 | **24시간** | 공식 발표 변경/연기 이력 확인 |
| 유튜브 영상/존재 상태 | **24시간** | 상세 클릭 때 만료 시 재검증 |
| 사용자 시청/찜/별점/승인 | **TTL 없음: 항상 현재 DB** | 인증 후 최신 상태 조회/갱신 |

- TTL은 **운영 초기 제안값**이지 실시간 확인 보장이 아니다. 공급자 제공 조건에 더 엄격한 제한이 있으면 우선.
- 공개 캐시 키: `dataset_type | country | normalized_years | genres | media_type | source_version | language | scoring_version`, PII 금지.
- 사용자별 결과는 별도 `run_id`와 `user_id` 저장. 같은 공개 자료 재사용 시 사용자 필터 및 P-GSEI를 서버에서 다시 적용.
- 매 공급자 `timeout` 초기 3초(장거리 불리하면 5초로 보정), 자동 재시도 최대 1회(일시 네트워크 오류만), 간단한 회로 차단. **타 공급자 완료 결과 독립 유지**.
- 국내 경로가 검증되지 않은 작품은 정규 추천 불가. 어떤 공급자가 실패했는지 별도 `provider_health` 지표로 공개하지 않고 내부 로깅.
- 사용자가 결과 조회/새로고침/추천 버튼을 눌렀을 때 stale-while-revalidate는 **관람 가능 배지에 금지**; 검증된 오래된 결과를 `과거 확인됨`으로만 보여주는 것은 허용.

## SP-11. 실행 오케스트레이션·응답 시간

```text
START → Parse & Authorization & Budget → Fork
                                     ├── Movie: Discover/Enrich concurrently → Validate → Filter → Score → Freeze
                                     └── US series: Discover/Enrich concurrently → Validate → Filter → Score → Freeze
                         → SSE section_completed(each) → run_finished
CLICK(detail) → DB/provider lookup → season trend + franchise + YouTube metadata
CLICK(expand) → NEW extension section (EU/adjacent/all years), original snapshots unchanged
```

- LangGraph State의 중심 키: `run_id`, `normalized_query`, `sections:{section:status}`, `evidence_ids`, `candidate_ids`, `section_results`, `usage_reservation`.
- 최대 병렬 공급자 요청 수와 LangGraph worker pool은 설정으로 제어. 사용자별 동시 유료 검색은 초기 1건, 서비스 전체 최대 2건(초기값), 초과 시 `429/queue` 중 하나로 일관되게 처리(초기: 429, 사용자 재시도 안내).
- 영화/드라마 각 분야는 `pending → running → completed|failed|cancelled`; 한 분야 완료 시 `section_completed` 이벤트와 확정 스냅샷 기록.
- P1 취소: 미완료 섹션만 중단. 이미 시작한 제공자/API 호출의 과금 가능성을 표시하고 `usage_ledger` 정산.
- 상세 화면에서 유튜브/관계작을 불러오는 작업은 **초기 두 분야의 완료 이벤트를 기다리게 하지 않는다**.
- 권장 성능 KPI(고정 fixtures + 제한된 live smoke에서 별도 측정): 캐시 적중 최초 완료 섹션 `p95 ≤ 5초`; 콜드 요청 최초 완료 섹션 `p95 ≤ 15초`; 어느 한 분야 장애 시 다른 분야 완료 `≤ 20초` 목표. 외부 공급자 상태에 따라 실측 미달 가능하므로 G4에서 조사·개선하거나 SLA 문구를 완화한다.

## SP-12. 유튜브·시즌·프랜차이즈·스포일러

### 12.1 지연 조회 계약

- 추천 카드 기본에서는 요약 영상 내용을 가져오지 않음. 상세 열기 시 작품/시즌 키로 영상 검색(캐시 우선).
- YouTube 후보는 videoId·실제 게시 상태, 해당 작품/연도/시즌 일치, 한국어 여부, 유형(`FULL_SUMMARY|REVIEW|OFFICIAL_TRAILER`)을 검증.
- 최우선 `FULL_SUMMARY` 한국어, 없으면 `한국어 요약 미확인`과 검증된 공식 예고편 대체. 조회수 단독으로 선정하지 않음.
- 미시청 콘텐츠의 **제목·썸네일·직접 영상 URL까지** 초기 페이로드에 숨기는 것이 안전하다. 서버 응답도 `spoiler_locked=true`일 때 가림 요약 메타정보만 전송하고, 명시적 `reveal` 클릭 후 videoId·title·thumbnail·url을 요청하는 별도 보호된 조회를 제공할 수 있어야 한다. 초기 구현에는 아래 API를 추가한다.
  - `POST /api/v1/media/{media_id}/youtube/reveal` `{season_id?, acknowledgement:true}` → 확인된 영상 메타데이터 (명시적 사용자 액션)
- 자동재생 금지, 임베드보다 YouTube 이동 링크 우선. 저작권 침해 의심 영상은 제외.

### 12.2 시즌·관계작

- 시즌 메타데이터: 최초 공개 연월(확인된 경우), 시즌 핵심 배경·갈등(반전/결말 미노출), 평가값·votes·출처, 국내 제공 상태·확인 시각.
- 최신 시즌과 직전 유효 시즌의 같은 지표를 비교하여 추세/표본 수 제시. 점수 없으면 `추세 미산정`.
- 관계작 그래프: `original|spinoff|prequel|sequel|remake|shared_universe`. 각 `relation`은 근거 출처 필수, 관련작의 **세계 최초 공개연도**를 카드 및 그래프에 표시.
- 기본 시청 순서: 공식 방영/공개 순서. 이야기 속 시간 순서는 신뢰 가능한 확인 자료가 있을 때만 추가.
- 시즌 1을 보지 않은 사용자에게도 최신 시즌을 추천하되 `처음부터라면 시즌 1부터` 안내. 선행 시즌 국내 제공 없거나 미확인이면 경고 표시.

### 12.3 스포일러 검증

- 레벨 `SAFE_CONTEXT|PLOT_SUMMARY|ENDING` 정의. 검색 카드와 시즌 기본 설명은 `SAFE_CONTEXT`만 허용.
- 미시청 시즌/영화의 `ENDING`은 기본 응답·검색 인덱스·알림 문구·추천 카드 alt 텍스트에도 누출 금지.
- 요약 영상은 제목 자체가 위험할 수 있으므로 `spoiler_locked` 상태와 사용자 reveal 기록을 명시적으로 관리.
- 스포일러 자동 판정만 믿지 않고 골든 케이스에 대한 사람 검수 포함.

## SP-13. API 비용·요청 횟수 한도·원장

### 13.1 권장 초기 설정(운영 환경변수; 임시값)

| 키 | 초기 제안 | 규칙 |
|---|---:|---|
| `USER_DAILY_PAID_REQUEST_LIMIT` | 10건/일 | Asia/Seoul 자정 초기화 |
| `SERVICE_MONTHLY_GEMINI_BUDGET_USD` | $30/월 | KST 달력 월 기준, 서비스 전체 |
| `DEFAULT_RESERVATION_USD` | $0.50/유료 요청 | 실행 전 비용 예상값/최대 모델 호출 수 따라 예약 조정 |
| `MAX_PARALLEL_PAID_RUNS` | 2건 | 서비스 전체 동시성 억제 |
| `GEMINI_MAX_RETRIES` | 1회 | 단순한 일시 오류에 한정 |

> **중요:** 위 값은 제품 운영 가정값이다. 사용자 확정 예산이 아니며 실측 후 `plan.md`의 운영 설정에서 조정한다. 애플리케이션 예산 제어는 API 제공자 계정의 청구 하드캡을 보장하지 않는다. 공급자 대시보드 경보와 한도도 별도 설정한다.

### 13.2 집계·동시성·취소 (2단계 비동기 원장 예약 패턴)

Gemini API 호출은 외부 네트워크 지연을 수반하므로, **DB 트랜잭션 내에서 행을 잠근 채 외부 API 응답을 대기하여 커넥션 풀이 고갈되는 것을 방지하기 위해 2단계 비동기 커밋 패턴을 의무화**한다 (`agents.md §7.3` 연계).

1. **Phase 1 (예약 - 짧은 DB 트랜잭션):** 사용자가 유료 신규 검색/확장/강제 갱신/명시적 AI 상세 분석을 요청하면, 짧은 DB 트랜잭션에서 `(user_id, idempotency_key)` 기반 중복 검사 및 잔여 한도(일일 10건, 월 $30)를 검증한다. 검증 통과 시 `usage_ledger`에 `status='RESERVED'`, `estimated_cost_usd=0.05`를 기록하고 **즉시 트랜잭션을 커밋하여 DB 커넥션을 반환**한다.
2. **Phase 2 (실행 - 트랜잭션 외부 비동기):** DB 잠금이 없는 상태에서 외부 Google Gemini API를 비동기 호출한다. 호출 착수 전 오류, 캐시 적중(0회 과금), 사용자 조기 취소 발생 시 즉시 짧은 트랜잭션으로 `status='RELEASED'`로 롤백하여 일일 한도를 복구한다.
3. **Phase 3 (정산 - 새로운 짧은 DB 트랜잭션):** Gemini 호출이 완료되면 실제 토큰 사용량과 단가를 계산하여 새로운 짧은 트랜잭션에서 `status='SETTLED'`, `actual_cost_usd`를 확정하고 커밋한다. 타임아웃 등으로 미확정 시 `status='RECONCILIATION_PENDING'`으로 보수적 유지한다.
4. **0회 과금 원칙:** 추가 Gemini API 호출이 없는 공통 캐시(24h) 재검색, 순수 규칙 기반 파싱 통과 요청, 작품 상세/시즌 추세/프랜차이즈 열람은 과금 카운트 0회로 처리한다.
5. **한도 초과 차단:** 월 예산 가용액이 부족하거나 일일 한도가 소진되면 Gemini 호출 전에 `429`(`DAILY_QUOTA_EXHAUSTED` 또는 `BUDGET_EXHAUSTED`)로 즉시 차단하고, 캐시 조회 및 상태 관리 화면은 허용한다.
6. 실제 Gemini 사용액과 다른 외부 유료 API 비용은 **별도 ledger**로 수집하여 총 운영비를 혼동하지 않는다.

### 13.3 비용 지표

- `USD_per_paid_run`, `gemini_tokens_prompt/candidates`, `tokens_per_result`, `cache_saved_calls`, `quota_reject_count`, `inflight_reserved_usd`, `uncertain_billing_count`를 수집.
- P-GSEI 지표 생성과 API 비용 통계는 서로 다른 시스템/테이블이며 비용이 추천 점수를 바꿔서는 안 된다.

## SP-14. 평가 인덱스(KPI)·테스트/릴리스 게이트

**목적:** 주관적 '괜찮아 보임'이 아니라 `plan.md`에서 테스트를 계획하고, 빌드 후 동일 조건으로 Pass/Fail 판정한다. 목표는 초깃값이며 샘플 크기·측정 방법을 함께 고정한다.

### 14.1 평가 인덱스 사전

| KPI ID | 인덱스/계산식 | 대상/데이터셋 | 초기 합격선 | 실측 주기 |
|---|---|---|---|---|
| KPI-01 | `IntentParseAccuracy = 정확히 해석한 쿼리 / 전체 골든 쿼리` | 100개 고정 쿼리 | ≥98% | PR/릴리스 |
| KPI-02 | `GenreDirectPrecision = 직접 관련으로 출력한 작품 중 실제 직접 관련 비율` | 사람 라벨 작품 100개 | ≥95% | 릴리스 |
| KPI-03 | `YearEligibilityAccuracy = 세계 최초 연도·시즌 매칭 정답/검증셋` | 경계/국내 연도 차이 50개 | 100% | PR |
| KPI-04 | `KRAvalEvidencePrecision = KR 관람 가능 표시 중 유효한 근거 비율` | 최소 100 경로+극장 30건 | ≥99% (미검증 0 노출) | PR/주간 |
| KPI-05 | `IdentityCollisionRate = 오류 병합/검증한 병합 전체` | 리메이크·동명작 50쌍 | 0건 | PR |
| KPI-06 | `RankReproducibility = 동일 입력 동일 순위&계산 결과` | 고정 100 fixture, 10회 반복 | 100% | PR |
| KPI-07 | `ScoreWeightCompliance = 축 가중치 40/40/10/10 위반 비율` | 계산 fixture | 위반 0건 | PR |
| KPI-08 | `MissingDataIntegrity = 결측을 가짜 0/허위 점수로 출력한 수` | 결측·신작 50개 | 0건 | PR |
| KPI-09 | `WatchExclusionRecall = 제외해야 할 영화/시즌이 다음 run에서 빠진 비율` | 상태 전이 fixture 100개 | 100% | PR |
| KPI-10 | `WishlistUndoConsistency = 연동/undo 상태가 트랜잭션 기대값 일치 비율` | 경합 포함 50개 | 100% | PR |
| KPI-11 | `UserIsolationBreaches = 사용자 간 개인 데이터 누출/쓰기 성공 건` | A/B/비승인 계정 테스트 | **0건** | PR/릴리스 |
| KPI-12 | `SpoilerLeakCount = 기본 화면/잠금 응답 내 금지 스포일러 유출` | 수동 검수 50개 + 정적 검사 | **0건** | 릴리스 |
| KPI-13 | `VideoVerifiedMatchPrecision = 표출 영상의 작품/시즌 매칭 정확도` | 영상 50개 | ≥98% | 릴리스 |
| KPI-14 | `SectionIndependence = 다른 섹션 실패 시 정상 섹션 확정 보존 비율` | fault injection 30개 | 100% | PR |
| KPI-15 | `CachedFirstSectionP95 = 캐시 적중 최초 완료 섹션 노출 시간 p95` | 고정 부하 100회 | ≤5초 | 릴리스 |
| KPI-16 | `ColdFirstSectionP95 = 신규 조회 최초 완료 섹션 노출 시간 p95` | 승인된 실제 공급자+stub 100회 각각 | ≤15초 **목표** | 릴리스 |
| KPI-17 | `AvailabilityFreshnessViolation = 만료 근거를 현재 관람 가능으로 단정한 건수` | TTL 경계 40개 | 0건 | PR |
| KPI-18 | `BudgetOverrunByApp = 앱이 예산/일일 횟수를 확인하지 않고 호출한 건` | 동시 요청 100개 | 0건 | PR |
| KPI-19 | `CachePIILeak = 공개 캐시에 개인 정보 키 또는 실제 개인값 존재` | 공개캐시 정적/통합 검사 | 0건 | PR |
| KPI-20 | `EvidenceCompleteness = 출력 사실 중 근거+확인시각 있는 비율` | 추천 핵심 필드 100개 | 100%(필수), ≥95%(선택) | 릴리스 |
| KPI-21 | `SectionSnapshotStability = 완료 후 카드/순위 변조 건` | watch/찜 변화 50개 | 0건 | PR |
| KPI-22 | `QuotasCountCorrectness = 요청 1건/캐시 0건 규칙 일치 비율` | 유료·무료·중단 100개 | 100% | PR |
| KPI-23 | `SeasonTrendAccuracy = 동일 출처 시즌 추세 판정 정답 비율` | 40개 시리즈 fixture | 100% | PR |
| KPI-24 | `FutureReleaseGuard = 공개 예정작에 점수/현재 관람 가능 배지 표시 건` | 예정작 30개 | 0건 | PR |
| KPI-25 | `AccessibilityBasic = keyboard/ARIA/모바일 주요 흐름 통과율` | Playwright axe-core 20개 | Critical/Serious 0건 | 릴리스 |
| KPI-26 | `RecommendationRelevance@10 = 직접 관련·미시청·KR 가용 작품 비율` | 라벨링 50쿼리 | ≥95% | 릴리스 |
| KPI-27 | `HelpfulReasonsRate = 인간 검수 근거 기반 추천 이유 유용 응답 비율` | 30개 카드 평가(블라인드) | ≥85% | 릴리스 |
| KPI-28 | `LegalDataUsePass = 필수 공급자 모두 서면/약관 검토 통과` | 공급자별 체크리스트 | **100%** | G1/릴리스 |

**지표 운영 규칙:** `0건` 안전·개인정보 지표는 한 건의 위반도 Blocker. 성능 KPI-16은 **라이브 공급자 외부지연**을 분리해 `코드 통합 fixture`와 `실제 외부 smoke`를 각각 보고하고, 무조건 통과라고 주장하지 않는다. 모든 KPI 실측에는 샘플 수 `n`, 커밋 SHA, 데이터셋 버전, 코드 버전, 환경, 기간을 첨부한다.

### 14.2 평가 데이터셋 구성

| Dataset ID | 최소 사례 | 목적 |
|---|---:|---|
| GS-QRY-100 | 100쿼리 | 2자리 연도, 기본 3년, 4개 장르, 직접/인접, 영드 명시, 취소·확장 |
| GS-TITLE-150 | 150작품/시즌 | 2026 신작, 동명작, 리메이크, 영화제/한국 첫 개봉, 극장/OTT 복수경로 |
| GS-STATE-100 | 100상태열 | 봤음, 되돌리기, 찜 원자성, 관심없음, 별점 보존, 버전충돌 |
| GS-VIDEO-50 | 50영상 후보 | 한글 요약, 시즌 매칭, 영상 삭제, 스포일러 제목·썸네일 잠금 |
| GS-FAULT-50 | 50장애·경계 | 외부 공급자 실패, SSE 유실, 예산 동시성, 극장 TTL 만료 |
| GS-SEO-40 | 40시즌 변화 | 동일 출처 Δ 및 시즌별 누락 판정 |

데이터셋은 익명/허가된 fixture와 라이브 테스트를 분리한다. 외부 사이트의 평가 수치/포스터를 대량 재배포하는 fixture를 커밋하지 않는다. 재현 fixture는 합법적 합성 데이터라고 명시한다.

### 14.3 빌드 게이트

| Gate | 전제 / 산출물 | Pass/Fail | Blocker |
|---|---|---|---|
| **G0 — Scope Freeze** | `맥락.md`/`intent.md`/`spec.md` 일관성, INT/AC 매핑 및 승인 기록 | 필수 ID 누락 0, 상충 요구 해결 | 미결 제품 충돌 |
| **G1 — Provider & Security** | EXT 라이선스 목록, OAuth/승인 설계, 데이터 보호 영향 분석 | KPI-28 100%, secret 노출 0 | 무허가 공급자/인증 우회 |
| **G2 — Core Build** | 모델/DB/API + Python 계산 엔진, unit tests | KPI-03/05/06/07/08/09/10/18/22/24 = 합격 | 점수·시청·예산·현재공개 규칙 위반 |
| **G3 — Integrated Build** | OIDC, SSE, 한국 가용성, 영상 가림, 복원 시나리오 | KPI-04/11/12/14/17/19/21 = 합격 | 사용자 누출·스포일러·불가 작품 노출 |
| **G4 — UAT & Performance** | 골든 데이터셋·수동 UX 검수·부하 테스트 | KPI-01/02/13/15/16/20/23/25/26/27 보고·판정 | 필수 정확도 미달/심각 UX 장애 |
| **G5 — Release/Ops** | 실제 배포·로그·알림·백업/복구·롤백 실습 | 헬스체크·권한 철회·예산 잠금·회귀 테스트 통과 | 키 유출/모니터링 부재/복구 불가 |

G0~G4가 통과하기 전 고객용 '완료/실서비스 가능' 표현 금지. 외부 평점 공급자 접근 불가 시 해당 소스를 연결했다고 주장하지 않으며, G1에서 대체 소스와 평가 범위를 재서명한다.

## SP-15. `plan.md`로 넘길 구현 백로그 및 인수인계

### 15.1 독립 빌드 패키지

| Work Package | 핵심 구현 | 의존 | 산출물/대표 T-ID |
|---|---|---|---|
| WP-01 Foundation | 저장소, CI, 구성/비밀, DTO, 핵심 인터페이스 | G0 | `T-ARCH-001` |
| WP-02 Auth/Approval | Google OIDC + 승인 CLI + 세션 + 격리 | WP-01 | `T-AUTH-001~006` |
| WP-03 Data Providers | 후보·평점·한국 OTT·극장·근거 어댑터 | WP-01 + EXT | `T-DATA-001~008` |
| WP-04 Scoring & Ranking | P-GSEI, 결측, confidence, 시즌 추세 | WP-03 | `T-SCORE-001~010` |
| WP-05 User State | 봤음/undo/찜/관심없음/별점 | WP-02 | `T-STATE-001~012` |
| WP-06 Orchestration | LangGraph 병렬 섹션·SSE·캐시 | WP-03/04/05 | `T-RUN-001~010` |
| WP-07 Frontend | 검색, 장르 4개, 분야별 카드, 상태 UI | WP-02/06 | `T-UI-001~012` |
| WP-08 Lazy Detail | 시즌·스핀오프·YouTube·스포일러 잠금 | WP-03/07 | `T-DETAIL-001~008` |
| WP-09 Budget/Observability | 원장, 예약/정산, 한도, 로그 | WP-02/06 | `T-COST-001~008` |
| WP-10 Delivery | E2E, 배포, 운영, 실패 복구, 품질 리포트 | 모두 | `T-E2E-001~012` |

### 15.2 필수 CI 파이프라인

```text
format/lint/typecheck → unit → db migration test → contract test
  → privacy/security/static checks → golden-regression → E2E stub
  → staging deploy + live source smoke → KPI report → G5 approval
```

- PR에는 최소 `pytest`, `ruff`, `mypy`(또는 pyright), `tsc -p jsconfig.json --noEmit`(allowJs/checkJs), `eslint`, Playwright smoke, 라이선스 정책 체크가 통과해야 한다.
- `docs/plan.md`는 Work Package를 날짜가 아닌 **의존·완료 조건** 중심으로 분할하고 개발 후 KPI 리포트 JSON/Markdown을 남긴다.
- 필수 운영 파일 제안: `config/evaluation_thresholds.yaml`, `evaluation/golden_dataset/`, `reports/evaluation/<build_sha>.md`, `docs/decision_log.md`. 계획 단계에서 실제 생성한다.

### 15.3 구현 착수 전 미확정 의존성 및 기본값

| ID | 이슈 | 기본 전략 | 확인 주체/단계 |
|---|---|---|---|
| EXT-01~EXT-08 | 데이터 공급자 권한/계약/비용·캐시 허용 | 어댑터는 설계, 미승인 경로는 production disable | G1 |
| OPS-01 | 백엔드 호스팅/worker·SSE 실지원 | 배포 후보 실측 후 선정 | WP-10 |
| OPS-02 | Gemini 모델 ID·토큰 가격 | 모델 환경변수, 실제 결제 정책 조회 후 산정 | WP-09 |
| OPS-03 | 월 예산 $30 / 일 10건 | **가설적 초기값**, 관리자 설정으로 변경 가능 | G1/G5 |
| OPS-04 | 공급자별 정규화 기준집합 | 허가된 데이터에서 추정, 없으면 해당 축 결측 | WP-04 |
| OPS-05 | 평가 목표 달성 여부 | 샘플/버전 명시, 합격 실패 명확히 보고 | G4 |

---

## 부록 A. 참고 공식 문서 및 검증 조건

- Google Gemini API — Structured Outputs: https://ai.google.dev/gemini-api/docs/structured-output (strict JSON Schema `text.format`; SDK/모델별 지원 확인)
- Google OpenID Connect: https://developers.google.com/identity/openid-connect/openid-connect (`sub`를 고유 계정 키로 사용)
- LangGraph docs: https://docs.langchain.com/oss/python/langgraph/overview (상태·분기·streaming)
- IMDb 데이터 이용 제한: https://www.imdb.com/interfaces/ ; https://help.imdb.com/article/imdb/general-information/can-i-use-imdb-data-in-my-software/G5JTRESSHJBBHTGX
- YouTube API: https://developers.google.com/youtube/v3/docs/search/list ; https://developers.google.com/youtube/v3/docs/videos/list (쿼터·정책 실제 배포 시 확인)
- 공식 출처와 도구·데이터 스키마는 계약/버전 변경될 수 있으므로 `plan.md`의 공급자 검증 항목에서 날짜별로 점검한다.

## 부록 B. 변경 관리

- **v1.1 / CR-FE-001 (2026-10-14):** 사용자의 최신 요청에 따라 프론트엔드를 TypeScript가 아닌 **HTML 시맨틱 마크업 + Tailwind CSS + JavaScript/JSX**로 정합화. Next.js App Router/BFF는 유지하고 JSDoc+`checkJs`, ESLint, Playwright로 타입·행동 검증. INT/AC/KPI/게이트의 의미 및 번호는 변경하지 않음.

- 확정 정책 변경은 **`intent.md` D-결정 업데이트 → 해당 SP / AC / T / KPI / plan 영향 분석 → spec 버전 증가** 순서로 처리한다.
- `맥락.md` 중 초기 설계 예시와 최신 Intent가 다른 부분은 섹션 0에 명시한 판정 우선순위로 해소한다.
- 불명확한 사실은 자동추정하지 않는다. 사용자가 `intent` 추가 결정은 권장안 일괄 위임했으므로 제품 정책 충돌이 아닌 기술적 권장값은 본 초안에 기입하되, 사업적 계약·청구·실제 라이선스 확보는 허가 없이 확정하지 않는다.


## 부록 C. 요구사항-검증 추적 매트릭스 (RTM)

> **범위:** `intent.md` 원본 **INT-01~INT-54 / AC-01~AC-59**를 변경하지 않고, 각 요구사항에 기술 사양과 대표 자동검증을 연결한다. `T-*`는 **예정 테스트 식별자**이며 빌드 완료를 의미하지 않는다. 한 테스트에 여러 AC가 연결될 수 있으며 모든 AC를 아래 표에서 추적한다.

| Intent ID | Spec | 연결된 Acceptance(AC) | 대표 테스트(T) | KPI | Work Package | Gate |
|---|---|---|---|---|---|---|
| INT-01 | SP-03 / 04 | AC-03 | `T-DATA-001` | KPI-04 | WP-03 | G1,G3 |
| INT-02 | SP-12 | AC-07 | `T-DETAIL-001` | KPI-13 | WP-08 | G4 |
| INT-03 | SP-12 | AC-07, AC-12 | `T-DETAIL-002` | KPI-13, KPI-20 | WP-08 | G4 |
| INT-04 | SP-12 | AC-08 | `T-DETAIL-003` | KPI-12 | WP-08 | G3 |
| INT-05 | SP-04 | AC-04 | `T-DATA-002` | KPI-04 | WP-03 | G3 |
| INT-06 | SP-05 | AC-04, AC-05 | `T-SCORE-001` | KPI-06, KPI-07 | WP-04 | G2 |
| INT-07 | SP-12 | AC-09 | `T-DETAIL-004` | KPI-15 | WP-08 | G4 |
| INT-08 | SP-03 | AC-13 | `T-DATA-003` | KPI-20 | WP-03 | G3 |
| INT-09 | SP-05 / 11 | AC-05, AC-14 | `T-SCORE-002` | KPI-06 | WP-04,06 | G2 |
| INT-10 | SP-06 | AC-06, AC-11, AC-15 | `T-STATE-001` | KPI-09 | WP-05 | G2 |
| INT-11 | SP-06 | AC-16 | `T-STATE-002` | KPI-09 | WP-05 | G2 |
| INT-12 | SP-06 / 07 | AC-17 | `T-STATE-003` | KPI-21 | WP-05,06 | G3 |
| INT-13 | SP-06 | AC-18 | `T-STATE-004` | KPI-10 | WP-05 | G2 |
| INT-14 | SP-06 | AC-19 | `T-STATE-005` | KPI-10 | WP-05 | G2 |
| INT-15 | SP-06 | AC-20 | `T-STATE-006` | KPI-10 | WP-05 | G2 |
| INT-16 | SP-05 | AC-12, AC-21 | `T-SCORE-003` | KPI-08, KPI-20 | WP-04 | G2 |
| INT-17 | SP-04 / 12 | AC-22 | `T-DETAIL-005` | KPI-23 | WP-08 | G4 |
| INT-18 | SP-04 / 05 | AC-23 | `T-SCORE-004` | KPI-08 | WP-04 | G2 |
| INT-19 | SP-04 / 12 | AC-24 | `T-DATA-004` | KPI-04 | WP-03 | G3 |
| INT-20 | SP-07 / 11 | AC-10, AC-25 | `T-RUN-001` | KPI-14, KPI-15, KPI-16 | WP-06 | G3,G4 |
| INT-21 | SP-03 / 04 | AC-26 | `T-DATA-005` | KPI-04, KPI-17 | WP-03 | G3 |
| INT-22 | SP-02 | AC-01, AC-27 | `T-DATA-006` | KPI-03 | WP-03 | G2 |
| INT-23 | SP-04 | AC-28 | `T-SCORE-005` | KPI-24 | WP-04 | G2 |
| INT-24 | SP-04 | AC-29 | `T-DATA-007` | KPI-24 | WP-03 | G2 |
| INT-25 | SP-02 | AC-30 | `T-UI-001` | KPI-01 | WP-07 | G4 |
| INT-26 | SP-02 / 11 | AC-31 | `T-RUN-002` | KPI-26 | WP-06 | G4 |
| INT-27 | SP-02 | AC-02, AC-32 | `T-DATA-008` | KPI-02 | WP-03 | G4 |
| INT-28 | SP-02 / 11 | AC-33 | `T-RUN-003` | KPI-14 | WP-06 | G3 |
| INT-29 | SP-02 / 11 | AC-34 | `T-RUN-004` | KPI-01 | WP-06 | G4 |
| INT-30 | SP-05 / 11 | AC-35 | `T-RUN-005` | KPI-06 | WP-06 | G2 |
| INT-31 | SP-08 | AC-36 | `T-AUTH-001` | KPI-11 | WP-02 | G3 |
| INT-32 | SP-08 | AC-37 | `T-AUTH-002` | KPI-11 | WP-02 | G3 |
| INT-33 | SP-08 | AC-38 | `T-AUTH-003` | KPI-11 | WP-02 | G3 |
| INT-34 | SP-10 | AC-39 | `T-RUN-006` | KPI-17 | WP-06 | G3 |
| INT-35 | SP-06 | AC-40 | `T-STATE-007` | KPI-09 | WP-05 | G2 |
| INT-36 | SP-06 | AC-41 | `T-STATE-008` | KPI-09 | WP-05 | G2 |
| INT-37 | SP-06 | AC-42 | `T-STATE-009` | KPI-10 | WP-05 | G2 |
| INT-38 | SP-05 / 06 | AC-43 | `T-SCORE-006` | KPI-07 | WP-04,05 | G2 |
| INT-39 | SP-06 / 07 | AC-44 | `T-UI-002` | KPI-25 | WP-07 | G4 |
| INT-40 | SP-06 | AC-45 | `T-STATE-010` | KPI-10 | WP-05 | G2 |
| INT-41 | SP-13 | AC-46 | `T-COST-001` | KPI-18 | WP-09 | G2 |
| INT-42 | SP-13 | AC-47 | `T-COST-002` | KPI-18 | WP-09 | G2 |
| INT-43 | SP-13 | AC-48 | `T-COST-003` | KPI-22 | WP-09 | G2 |
| INT-44 | SP-07 / 13 | AC-49 | `T-COST-004` | KPI-22 | WP-09 | G2 |
| INT-45 | SP-09 / 10 | AC-50 | `T-COST-005` | KPI-19 | WP-09 | G3 |
| INT-46 | SP-03 / 10 | AC-51 | `T-RUN-007` | KPI-14, KPI-20 | WP-06 | G3 |
| INT-47 | SP-02 / 11 | AC-52 | `T-RUN-008` | KPI-26 | WP-06 | G4 |
| INT-48 | SP-04 | AC-53 | `T-SCORE-007` | KPI-05 | WP-04 | G2 |
| INT-49 | SP-03 | AC-54 | `T-DETAIL-006` | KPI-04 | WP-08 | G3 |
| INT-50 | SP-12 | AC-55 | `T-DETAIL-007` | KPI-13 | WP-08 | G4 |
| INT-51 | SP-05 | AC-56 | `T-SCORE-008` | KPI-06, KPI-08 | WP-04 | G2 |
| INT-52 | SP-07 / 11 | AC-57 | `T-RUN-009` | KPI-14 | WP-06 | G3 |
| INT-53 | SP-08 | AC-58 | `T-AUTH-004` | KPI-11 | WP-02 | G3 |
| INT-54 | SP-08 | AC-59 | `T-AUTH-005` | KPI-11, KPI-19 | WP-02 | G3 |

**커버리지 판정:** INT 54/54, AC 59/59가 적어도 하나의 `T-*`에 연결되어야 G0 통과. `plan.md`는 각 T를 구체 테스트 함수/파일 경로와 1:1 또는 1:N으로 연결하고 테스트 결과 링크를 남긴다. 신규 정책 변경 시 해당 행을 먼저 수정한다.

### C.1 종단 간 핵심 판정 케이스(골든 시나리오)

| 검증 ID | 입력/조건 | 성공 판정 | 대표 KPI |
|---|---|---|---|
| EVAL-01 | `2026 첩보 미드/영화`; 미국 2025/한국 2026 영화 포함 Fixture | 세계 공개연도 2025 영화 정규 추천 0건 | KPI-03 |
| EVAL-02 | 영화 OTT+극장 동시, 영화별 현재 상영 URL 유효 | 카드 1건, 검증된 관람 경로 복수 표기 | KPI-04,05 |
| EVAL-03 | 영화 점수 존재/드라마 출처 장애 | 영화 섹션 완료·고정, 드라마 실패 상태 | KPI-14,21 |
| EVAL-04 | IMDb만 있고 P/C 결측 | 임의 0 대체 없음, coverage=0.40, Low 표기 | KPI-07,08 |
| EVAL-05 | 공개 예정작, 한국 공개 미확인 | `UPCOMING` 별도, 점수·현재관람배지 없음 | KPI-24 |
| EVAL-06 | 유저 A 시즌 2 시청, 유저 B 미시청 | A의 다음 run 시즌 2 제외, B 결과 영향 없음 | KPI-09,11 |
| EVAL-07 | 찜한 작품 `봤음`, 곧 `되돌리기`, 그 사이 수동 찜 변경 | 마지막 수동 선택 유지, 상태 원자적 | KPI-10 |
| EVAL-08 | 4점 개인 별점 후 `봤음` 해제/재완료 | 비활성 보존/활성 복원, 취향 10% 외 가중치 불변 | KPI-07,10 |
| EVAL-09 | 검색 시 장르 `첩보` | 최대 4개 세부 선택, 인접 장르 정규 결과 미포함 | KPI-01,02 |
| EVAL-10 | 늦은 영상 소스, 결말 노출 포함 제목 | 초기 응답·잠금 응답에 제목/썸네일/직접링크 0건 | KPI-12,13 |
| EVAL-11 | 공통 공개 캐시 hit, 다른 사용자 개인값 존재 | 0회 차감, 사용자별 재산정 및 PII 누출 0 | KPI-19,22 |
| EVAL-12 | 동시에 월 예산 직전 다중 신규 검색 | 예약 초과 API 호출 0건, 원장 멱등·정산 일치 | KPI-18,22 |
| EVAL-13 | 미드 TOP 7, 영드 TOP 5 확보 | 별도 사용자 확장 액션 없으면 미드 TOP 7, 영드 섹션 생성 안 됨 | KPI-01,14 |
| EVAL-14 | 시즌 3 최신, 시즌 1/2 국내 불명 | 시즌 3 추천 유지, 선행시즌 경고, 시즌 1부터 시청 안내 | KPI-04,23 |
| EVAL-15 | 공개연도 없는 요청, 월말/연말/새해 경계 | 해당 요청일 KST 연도부터 3개년만 적용 | KPI-01,03 |


## 부록 D. Build 후 평가 산출물 계약

### D.1 계획·코드·평가 증거 연결

`plan.md`는 각 `WP-*`를 작업별 `TASK-*`로 분할하고 각 TASK에 **구현 코드 경로, 테스트 T, KPI, 게이트, 우선순위, 의존 관계, 완료 증빙**을 명시한다. 빌드 단계 CI는 다음을 생성해야 한다.

```text
reports/evaluation/<git_sha>/
  manifest.json            # 빌드/모델/데이터셋/시험 환경과 시각
  requirements_trace.csv   # INT, AC, SP, T, KPI, WP, gate, status
  test_results.xml         # pytest/Playwright JUnit 형식
  kpi_results.json         # 측정값/목표/샘플 수/결과/근거 경로
  provider_compliance.md   # 실제 이용권·라이선스·데이터 범위 검증
  release_decision.md      # G0~G5 판정·Blocker·보완 이력
```

**`kpi_results.json` 계약 예시(수치 전부 예시 데이터):**

```json
{
  "build_sha": "EXAMPLE_SHA",
  "spec_version": "1.0",
  "dataset_version": "GS-QRY-100@v1",
  "environment": "staging",
  "timestamp_utc": "2026-10-14T00:00:00Z",
  "metrics": [
    {"id":"KPI-01","observed":0.99,"operator":">=","threshold":0.98,"n":100,"passed":true,"evidence":"test_results.xml"},
    {"id":"KPI-11","observed":0,"operator":"==","threshold":0,"n":30,"passed":true,"evidence":"security_report.json"}
  ],
  "gate_results": {"G0":"pass","G1":"not_run","G2":"not_run","G3":"not_run","G4":"not_run","G5":"not_run"}
}
```

### D.2 Pass/Fail 집계 기준

- `not_run`, `blocked`, `insufficient_sample`, `unknown`은 **pass로 취급하지 않음**. 필수 게이트는 `pass`가 아니라면 배포 보류.

- 높은 점수도 출처·라이선스 미검증, 권한 우회, 사용자 간 정보 노출, 결말 스포일러 유출이 있으면 **즉시 Fail(하드 게이트)**.

- KPI 표의 목표는 합의 전 임시 엔지니어링 기준이며, 과거 빌드와 비교 시 목표·분모·골든셋·모델 버전 변경 여부를 별도 표시.

- 성능 결과는 캐시 적중/비적중과 공급자 stub/실측을 분리하고, 라이브 서비스의 지연에 따라 사후 목표를 조작하지 않음.

- G1 공급자 승인 전에는 fixture 기반 엔진 시험을 통과해도 `live_ready=false`임을 명시.

### D.3 계획서 생성 규칙

1. `plan.md` 첫 표에 본 문서의 WP-01~WP-10을 반드시 연결하고 각 TASK의 부모 INT/SP 및 테스트·KPI를 명시한다.

2. 우선순위는 보안·권한·데이터 출처·시청 상태 원자성·계산 재현성부터. P1/P2는 P0 하드 게이트를 통과한 뒤 구현.

3. 사용자는 추가 요구사항이 있으면 `intent.md` 버전을 개정하고, RTM/평가 인덱스에 미치는 영향을 먼저 갱신한다.

4. Google Gemini API 연결·OAuth 자격증명·외부 제공처 권한은 준비 여부를 명확히 `EXT-/OPS-`로 남기며 **확보되지 않은 값을 임의 구성하지 않는다**.

