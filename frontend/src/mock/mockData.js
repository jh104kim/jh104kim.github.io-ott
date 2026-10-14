export const mockSubgenres = [
  { id: "intel_politics", name: "정보기관·정치첩보", desc: "CIA, MI6 등 국가 정보기관 암투" },
  { id: "action_terror", name: "액션·대테러", desc: "특수부대 및 현장 요원의 테러 저지 액션" },
  { id: "covert_mole", name: "잠입·이중간첩", desc: "적진 침투 및 내부 첩자 추적" },
  { id: "cyber_tech", name: "사이버·기술첩보", desc: "해킹, 감시 도청 및 디지털 정보전" },
];

export const mockMovies = [
  {
    media_id: "m-001",
    rank: 1,
    title_ko: "미션 임파서블: 데드 레코닝",
    title_original: "Mission: Impossible - Dead Reckoning",
    kind: "movie",
    world_first_release_year: 2023,
    kr_release_year: 2023,
    p_gsei_score: 91.5,
    subscores: { audience: 94.0, popularity: 92.0, critics: 88.0, taste: 90.0 },
    coverage: 1.0,
    confidence: "High",
    kr_availability: [
      { platform_name: "티빙", mode: "subscription", is_verified: true },
      { platform_name: "웨이브", mode: "subscription", is_verified: true },
      { platform_name: "쿠팡플레이", mode: "buy", is_verified: true },
    ],
    safe_synopsis: "인류를 위협하는 전지능 AI '엔티티'의 폭주를 막기 위해 에단 헌트와 IMF 팀이 두 개의 열쇠를 추적하는 글로벌 첩보전.",
    why_recommended: "관객 만족도 94점과 대중적 화제성 92점의 조화. 빠른 템포와 정통 아날로그 액션 취향에 완벽 부합.",
    is_close_score: false,
    poster_gradient: "from-blue-600 to-indigo-900",
    watch_status: "not_watched",
    is_wishlisted: true,
    my_rating: null,
    franchise: [
      { title: "미션 임파서블: 폴아웃", year: 2018, relation: "전작" },
      { title: "미션 임파서블: 파이널 레코닝", year: 2025, relation: "후속작" }
    ],
    youtube: {
      video_id: "dQw4w9WgXcQ",
      title: "[결말포함] 데드 레코닝 15분 완전 요약",
      video_kind: "FULL_SUMMARY",
      spoiler_locked: true,
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
  },
  {
    media_id: "m-002",
    rank: 2,
    title_ko: "시카리오: 암살자의 도시",
    title_original: "Sicario",
    kind: "movie",
    world_first_release_year: 2015,
    kr_release_year: 2015,
    p_gsei_score: 89.8,
    subscores: { audience: 88.0, popularity: 90.0, critics: 92.0, taste: 94.0 },
    coverage: 1.0,
    confidence: "High",
    kr_availability: [
      { platform_name: "넷플릭스", mode: "subscription", is_verified: true },
      { platform_name: "왓챠", mode: "subscription", is_verified: true }
    ],
    safe_synopsis: "미 멕시코 국경의 사법 무풍지대에서 마약 카르텔을 소탕하기 위해 투입된 FBI 요원이 마주하는 참혹한 도덕적 딜레마.",
    why_recommended: "진중하고 숨 막히는 긴장감의 걸작. 전개 속도와 현실적인 정치·대테러 첩보 취향 만족.",
    is_close_score: false,
    poster_gradient: "from-amber-700 to-stone-900",
    watch_status: "not_watched",
    is_wishlisted: false,
    my_rating: null,
    franchise: [
      { title: "시카리오: 데이 오브 솔다도", year: 2018, relation: "속편" }
    ],
    youtube: {
      video_id: "7B_Jq0_Z_0",
      title: "시카리오 핵심 줄거리 & 명장면 분석",
      video_kind: "FULL_SUMMARY",
      spoiler_locked: true,
      url: "https://www.youtube.com/watch?v=mock"
    }
  },
  {
    media_id: "m-003",
    rank: 3,
    title_ko: "하얼빈 (국내 극장 개봉작)",
    title_original: "Harbin",
    kind: "movie",
    world_first_release_year: 2024,
    kr_release_year: 2024,
    p_gsei_score: 87.2,
    subscores: { audience: 86.0, popularity: 89.0, critics: 85.0, taste: 88.0 },
    coverage: 0.95,
    confidence: "High",
    kr_availability: [
      { platform_name: "CGV / 메가박스", mode: "theater", is_verified: true }
    ],
    safe_synopsis: "1909년, 하나의 목적을 위해 하얼빈으로 향하는 독립투사들과 이를 쫓는 자들 사이의 숨막히는 추적과 의심.",
    why_recommended: "현재 극장 상영 검증작(D-17). 역사적 첩보 암살 작전의 긴장감과 완성도 높은 연출.",
    is_close_score: true,
    poster_gradient: "from-slate-700 to-zinc-950",
    watch_status: "not_watched",
    is_wishlisted: false,
    my_rating: null,
    franchise: [],
    youtube: {
      video_id: "mock_harbin",
      title: "하얼빈 공식 메인 예고편",
      video_kind: "OFFICIAL_TRAILER",
      spoiler_locked: false,
      url: "https://www.youtube.com/watch?v=mock"
    }
  }
];

export const mockSeries = [
  {
    media_id: "s-001",
    rank: 1,
    title_ko: "슬로 호시스 (시즌 4)",
    title_original: "Slow Horses Season 4",
    kind: "series",
    target_season_number: 4,
    world_first_release_year: 2024,
    p_gsei_score: 93.4,
    subscores: { audience: 96.0, popularity: 91.0, critics: 95.0, taste: 92.0 },
    coverage: 1.0,
    confidence: "High",
    kr_availability: [
      { platform_name: "Apple TV+", mode: "subscription", is_verified: true }
    ],
    safe_synopsis: "MI5의 좌천 부서 '슬라우 하우스'의 괴짜 요원들이 런던을 뒤흔든 폭탄 테러의 배후를 추적하는 냉혹한 스파이 스릴러.",
    why_recommended: "시즌 1부터 4까지 꾸준한 품질 상승(+5점 이상). 블랙 코미디와 진중한 정통 첩보의 압도적 결합.",
    is_close_score: false,
    poster_gradient: "from-emerald-800 to-neutral-950",
    watch_status: "not_watched",
    is_wishlisted: true,
    my_rating: null,
    season_trends: {
      trend_direction: "rising",
      score_delta: 5.2,
      seasons: [
        { season: 1, score: 86, year: "2022.04" },
        { season: 2, score: 89, year: "2022.12" },
        { season: 3, score: 91, year: "2023.11" },
        { season: 4, score: 96, year: "2024.09" }
      ]
    },
    franchise: [],
    youtube: {
      video_id: "slow_horses_summary",
      title: "[스포주의] 슬로 호시스 시즌 1~3 핵심 줄거리 총정리",
      video_kind: "FULL_SUMMARY",
      spoiler_locked: true,
      url: "https://www.youtube.com/watch?v=mock"
    }
  },
  {
    media_id: "s-002",
    rank: 2,
    title_ko: "나이트 에이전트 (시즌 2)",
    title_original: "The Night Agent Season 2",
    kind: "series",
    target_season_number: 2,
    world_first_release_year: 2025,
    p_gsei_score: 88.9,
    subscores: { audience: 89.0, popularity: 93.0, critics: 82.0, taste: 90.0 },
    coverage: 0.95,
    confidence: "High",
    kr_availability: [
      { platform_name: "넷플릭스", mode: "subscription", is_verified: true }
    ],
    safe_synopsis: "백악관 지하 벙커 비상전화를 지키던 FBI 요원이 정체불명의 전화를 받으며 거대한 국가적 음모의 중심에 뛰어드는 이야기.",
    why_recommended: "글로벌 넷플릭스 흥행 1위. 멈출 수 없는 폭풍 전개와 빠른 사건 해결로 몰입감 극대화.",
    is_close_score: false,
    poster_gradient: "from-red-800 to-neutral-950",
    watch_status: "not_watched",
    is_wishlisted: false,
    my_rating: null,
    season_trends: {
      trend_direction: "steady",
      score_delta: 0.5,
      seasons: [
        { season: 1, score: 88, year: "2023.03" },
        { season: 2, score: 89, year: "2025.01" }
      ]
    },
    franchise: [],
    youtube: {
      video_id: "night_agent_summary",
      title: "나이트 에이전트 시즌 1 결말까지 10분 순삭 요약",
      video_kind: "FULL_SUMMARY",
      spoiler_locked: true,
      url: "https://www.youtube.com/watch?v=mock"
    }
  }
];

export const mockUsage = {
  daily_limit: 10,
  daily_used: 1,
  monthly_budget_usd: 30.0,
  monthly_used_usd: 0.08,
  reset_at_kst: "매일 00:00 KST"
};
