"use client";

import { useState } from "react";
import Header from "../components/Header";
import SearchSection from "../components/SearchSection";
import MediaCard from "../components/MediaCard";
import DetailModal from "../components/DetailModal";
import { mockMovies, mockSeries, mockUsage } from "../mock/mockData";
import { Film, Tv, Sparkles, Plus, AlertCircle, Heart } from "lucide-react";

export default function HomePage() {
  const [movies, setMovies] = useState(mockMovies);
  const [series, setSeries] = useState(mockSeries);
  const [usage, setUsage] = useState(mockUsage);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState("search");
  const [showUsageModal, setShowUsageModal] = useState(false);

  // 상태 변경 핸들러 (봤음, 찜, 별점 등)
  const handleUpdateState = (mediaId, changes) => {
    setMovies((prev) =>
      prev.map((item) => (item.media_id === mediaId ? { ...item, ...changes } : item))
    );
    setSeries((prev) =>
      prev.map((item) => (item.media_id === mediaId ? { ...item, ...changes } : item))
    );
  };

  const handleSearch = ({ query, selectedSubgenres }) => {
    // 목업 인터랙션: 검색 실행 시 토스트 또는 상태 갱신
    alert(`[검색 실행] 질의: "${query}"\n선택 세부 장르: ${selectedSubgenres.join(", ")}`);
  };

  const wishlistedItems = [
    ...movies.filter((m) => m.is_wishlisted),
    ...series.filter((s) => s.is_wishlisted),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header
        usage={usage}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUsage={() => setShowUsageModal(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pb-16">
        {activeTab === "search" ? (
          <>
            <SearchSection onSearch={handleSearch} />

            <div className="space-y-12 mt-6">
              {/* 섹션 1: 영화 TOP 10 (독립 섹션, D-05) */}
              <section aria-labelledby="movies-heading">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Film className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 id="movies-heading" className="text-xl font-bold text-white tracking-tight">
                        영화 추천 TOP 10
                      </h2>
                      <p className="text-xs text-slate-400">국내 OTT 구독·대여 및 현재 극장 상영작 독립 랭킹</p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    검증 완료 3건
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {movies.map((item) => (
                    <MediaCard
                      key={item.media_id}
                      item={item}
                      onClick={setSelectedItem}
                      onUpdateState={handleUpdateState}
                    />
                  ))}
                </div>
              </section>

              {/* 섹션 2: 미국 드라마 TOP 10 (독립 섹션, D-05, D-26) */}
              <section aria-labelledby="series-heading">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Tv className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 id="series-heading" className="text-xl font-bold text-white tracking-tight">
                        미국 드라마(미드) 추천 TOP 10
                      </h2>
                      <p className="text-xs text-slate-400">시즌별 품질 추세 및 미시청 신규 시즌 우선</p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    검증 완료 2건
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {series.map((item) => (
                    <MediaCard
                      key={item.media_id}
                      item={item}
                      onClick={setSelectedItem}
                      onUpdateState={handleUpdateState}
                    />
                  ))}
                </div>
              </section>

              {/* 확장 검색 섹션 (영드/유럽 및 전 연도 확장 버튼, D-25) */}
              <section className="p-6 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
                <p className="text-xs text-slate-400">
                  원하는 작품을 더 찾아보고 싶으신가요? 기존 순위를 변경하지 않고 별도 섹션으로 확장합니다.
                </p>
                <div className="flex items-center justify-center gap-2.5 flex-wrap">
                  <button className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700/80 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> 영국·유럽 드라마 확장 탐색 (D-25)
                  </button>
                  <button className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700/80 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> 전체 연도(과거 명작)로 확장 (D-21)
                  </button>
                  <button className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700/80 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> 관련 인접 장르 탐색
                  </button>
                </div>
              </section>
            </div>
          </>
        ) : (
          /* 찜 목록 화면 */
          <section className="py-8">
            <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
              나중에 보기 찜 목록 ({wishlistedItems.length}건)
            </h1>
            {wishlistedItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {wishlistedItems.map((item) => (
                  <MediaCard
                    key={item.media_id}
                    item={item}
                    onClick={setSelectedItem}
                    onUpdateState={handleUpdateState}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 rounded-2xl border border-slate-800">
                찜한 작품이 없습니다. 추천 카드에서 하트 아이콘을 눌러 추가해보세요.
              </div>
            )}
          </section>
        )}
      </main>

      {/* 작품 상세 모달 */}
      {selectedItem && (
        <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {/* 사용량 및 예산 현황 모달 */}
      {showUsageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative space-y-4">
            <h3 className="text-lg font-bold text-white">API 사용량 및 비용 원장</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">오늘 유료 검색 사용량</span>
                <strong className="text-emerald-400 font-semibold">{usage.daily_used} / {usage.daily_limit}회</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">서비스 월간 Gemini 예산</span>
                <strong className="text-blue-400 font-semibold">${usage.monthly_used_usd} / ${usage.monthly_budget_usd}</strong>
              </div>
              <p className="text-[11px] text-slate-500">
                * 동일 검색 24시간 캐시 재열람, 상세 시즌 확인, YouTube 링크 조회는 0회(무료)로 차감되지 않습니다 (INT-43).
              </p>
            </div>
            <button
              onClick={() => setShowUsageModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
