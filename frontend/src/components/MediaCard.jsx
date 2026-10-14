"use client";

import ScoreBadge from "./ScoreBadge";
import WatchStateButtons from "./WatchStateButtons";
import { Film, Tv, ChevronRight, CheckCircle2, Ticket } from "lucide-react";

export default function MediaCard({ item, onClick, onUpdateState }) {
  const isSeries = item.kind === "series";
  const isWatched = item.watch_status === "watched";

  return (
    <article
      onClick={() => onClick(item)}
      className={`relative group rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between ${
        isWatched
          ? "bg-slate-950/40 border-slate-800/50 opacity-75 hover:opacity-100"
          : "bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:shadow-xl hover:shadow-blue-500/5"
      }`}
    >
      {/* 봤음 오버레이 배지 (D-08 스냅샷 불변 원칙) */}
      {isWatched && (
        <div className="absolute top-3 right-3 z-20 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 backdrop-blur-md">
          <CheckCircle2 className="w-3.5 h-3.5" /> 시청 완료
        </div>
      )}

      <div>
        {/* 상단 비주얼 영역 */}
        <div className={`h-28 w-full bg-gradient-to-tr ${item.poster_gradient} p-4 flex flex-col justify-between relative`}>
          <div className="flex items-center justify-between">
            <span className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-md flex items-center justify-center text-white text-xs font-black shadow">
              #{item.rank}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-black/50 text-white/90 text-[10px] font-semibold flex items-center gap-1 backdrop-blur-md">
                {isSeries ? <Tv className="w-3 h-3 text-blue-400" /> : <Film className="w-3 h-3 text-amber-400" />}
                {isSeries ? "미드" : "영화"}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-white tracking-tight drop-shadow-sm group-hover:text-blue-200 transition-colors">
              {item.title_ko}
            </h3>
            <p className="text-[11px] text-white/70 italic drop-shadow-sm">
              {item.title_original} ({item.world_first_release_year})
            </p>
          </div>
        </div>

        {/* 본문 정보 영역 */}
        <div className="p-4 space-y-3">
          {/* P-GSEI 점수 배지 */}
          <ScoreBadge
            score={item.p_gsei_score}
            subscores={item.subscores}
            confidence={item.confidence}
            isClose={item.is_close_score}
          />

          {/* 한국 관람 경로 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 mr-0.5">시청처:</span>
            {item.kr_availability.map((p, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 ${
                  p.mode === "theater"
                    ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                    : "bg-slate-800 text-slate-300 border-slate-700/60"
                }`}
              >
                {p.mode === "theater" && <Ticket className="w-2.5 h-2.5" />}
                {p.platform_name}
              </span>
            ))}
            <span className="text-[10px] text-slate-500 ml-auto">자막/더빙 지원</span>
          </div>

          {/* 추천 이유 */}
          <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
            <strong className="text-blue-400 font-semibold block mb-0.5 text-[11px]">왜 이 작품인가?</strong>
            {item.why_recommended}
          </p>
        </div>
      </div>

      {/* 하단 버튼 및 상태 인터랙션 */}
      <div className="p-4 pt-0">
        <WatchStateButtons item={item} onUpdateState={onUpdateState} />
        
        <div className="mt-2.5 pt-2 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-blue-400 transition-colors">
          <span>시즌 추세 · 스핀오프 · YouTube 요약</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </article>
  );
}
