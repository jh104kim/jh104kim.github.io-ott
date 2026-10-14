"use client";

import { useState } from "react";
import { X, Play, Eye, EyeOff, Film, Tv, TrendingUp, TrendingDown, Minus, ExternalLink, ShieldAlert, Award } from "lucide-react";

export default function DetailModal({ item, onClose }) {
  const [spoilerUnlocked, setSpoilerUnlocked] = useState(false);

  if (!item) return null;

  const isSeries = item.kind === "series";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* 상단 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 상단 히어로 배너 */}
        <div className={`w-full h-44 bg-gradient-to-r ${item.poster_gradient} p-6 flex flex-col justify-end relative`}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded bg-black/40 text-xs font-semibold text-white backdrop-blur-md flex items-center gap-1">
              {isSeries ? <Tv className="w-3.5 h-3.5" /> : <Film className="w-3.5 h-3.5" />}
              {isSeries ? "미국 드라마" : "영화"}
            </span>
            <span className="text-xs text-white/80">세계 최초 공개 {item.world_first_release_year}년</span>
            {item.target_season_number && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 text-xs font-semibold">
                시즌 {item.target_season_number} 추천
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{item.title_ko}</h2>
          <p className="text-xs text-white/70 italic">{item.title_original}</p>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* 점수 요약 & 플랫폼 */}
          <div className="flex items-center justify-between flex-wrap gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">개인화 복합 지수</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-blue-400">P-GSEI {item.p_gsei_score.toFixed(1)}</span>
                <span className="text-xs text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  신뢰도 {item.confidence}
                </span>
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-1">국내 시청·예매 경로</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {item.kr_availability.map((p, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 font-medium flex items-center gap-1"
                  >
                    {p.platform_name} ({p.mode === "theater" ? "극장 상영중" : p.mode})
                    <ExternalLink className="w-3 h-3" />
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 안전한 시놉시스 (스포일러 차단) */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              안전한 줄거리 맥락 (SAFE_CONTEXT)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
              {item.safe_synopsis}
            </p>
          </div>

          {/* 드라마 시즌 품질 추세 (동일 출처 기준, SP-05, SP-12) */}
          {item.season_trends && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  시즌별 품질 평가 추세
                </h3>
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  {item.season_trends.trend_direction === "rising" && <TrendingUp className="w-3.5 h-3.5" />}
                  {item.season_trends.trend_direction === "steady" && <Minus className="w-3.5 h-3.5" />}
                  최근 시즌 {item.season_trends.score_delta > 0 ? `+${item.season_trends.score_delta}` : item.season_trends.score_delta}점 상승세
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {item.season_trends.seasons.map((s) => (
                  <div key={s.season} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block font-medium">시즌 {s.season}</span>
                    <span className="text-lg font-bold text-white block my-0.5">{s.score}점</span>
                    <span className="text-[10px] text-slate-500">{s.year} 공개</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 프랜차이즈 관계도 (INT-17, SP-12) */}
          {item.franchise && item.franchise.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                <Film className="w-4 h-4 text-purple-400" />
                프랜차이즈 & 스핀오프 관계도 (세계 최초 공개연도 기준)
              </h3>
              <div className="space-y-1.5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
                {item.franchise.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/50 last:border-none">
                    <span className="text-slate-300 font-medium">{f.title} ({f.year})</span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[11px] font-semibold">
                      {f.relation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* YouTube 한국어 줄거리 요약 (스포일러 잠금 UI, D-02~04, SP-12) */}
          {item.youtube && (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <Play className="w-4 h-4 text-red-500 fill-red-500" />
                    유튜브 한국어 영상 큐레이션
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {item.youtube.video_kind === "FULL_SUMMARY" ? "전체 줄거리 요약 영상" : "공식 예고편"}
                  </p>
                </div>
                {item.youtube.spoiler_locked && !spoilerUnlocked && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-1 border border-amber-500/30">
                    <EyeOff className="w-3 h-3" /> 결말 스포일러 잠금 상태
                  </span>
                )}
              </div>

              <div className="p-4">
                {item.youtube.spoiler_locked && !spoilerUnlocked ? (
                  <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 text-center space-y-3">
                    <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto" />
                    <div>
                      <p className="text-sm font-semibold text-slate-200">결말 및 핵심 반전이 포함되어 있습니다</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        스포일러 보호 정책에 따라 영상 제목, 썸네일, 링크가 잠겨 있습니다.
                        영상을 열람하시겠습니까? (D-02, D-04)
                      </p>
                    </div>
                    <button
                      onClick={() => setSpoilerUnlocked(true)}
                      className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                    >
                      <Eye className="w-4 h-4" />
                      스포일러 확인 후 요약 영상 보기
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">{item.youtube.title}</span>
                      <a
                        href={item.youtube.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        YouTube에서 재생
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
