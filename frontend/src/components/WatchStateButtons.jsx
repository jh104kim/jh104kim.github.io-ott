"use client";

import { useState } from "react";
import { Check, Heart, Ban, Star, RotateCcw } from "lucide-react";

export default function WatchStateButtons({ item, onUpdateState }) {
  const [showRating, setShowRating] = useState(false);
  const isWatched = item.watch_status === "watched";

  const handleToggleWatched = (e) => {
    e.stopPropagation();
    if (isWatched) {
      onUpdateState(item.media_id, { watch_status: "not_watched", my_rating: null });
      setShowRating(false);
    } else {
      onUpdateState(item.media_id, { watch_status: "watched", is_wishlisted: false });
      setShowRating(true);
    }
  };

  const handleToggleWishlist = (e) => {
    e.stopPropagation();
    onUpdateState(item.media_id, { is_wishlisted: !item.is_wishlisted });
  };

  const handleSetRating = (ratingValue, e) => {
    e.stopPropagation();
    onUpdateState(item.media_id, { my_rating: ratingValue });
  };

  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/60" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5">
          {/* 봤음 버튼 */}
          <button
            onClick={handleToggleWatched}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              isWatched
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            }`}
          >
            {isWatched ? <Check className="w-3.5 h-3.5" /> : null}
            {isWatched ? "봤음 (다음 검색 제외)" : "봤음"}
          </button>

          {/* 찜하기 버튼 */}
          <button
            onClick={handleToggleWishlist}
            className={`p-1.5 rounded-lg border transition-all ${
              item.is_wishlisted
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                : "border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="나중에 보기 찜하기"
          >
            <Heart className={`w-4 h-4 ${item.is_wishlisted ? "fill-rose-500" : ""}`} />
          </button>

          {/* 관심 없음 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateState(item.media_id, { watch_status: "not_interested" });
            }}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-500 hover:text-amber-400 hover:border-slate-700 transition-all"
            title="관심 없음 (추천 제외)"
          >
            <Ban className="w-4 h-4" />
          </button>
        </div>

        {/* 봤음 체크 시 되돌리기(Undo) 안내 */}
        {isWatched && (
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 스냅샷 보존됨
          </span>
        )}
      </div>

      {/* 개인 별점 (봤음 이후 선택적 입력, D-34, D-35) */}
      {isWatched && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[11px] text-slate-400">내 별점:</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                onClick={(e) => handleSetRating(val, e)}
                className="p-0.5 text-slate-600 hover:text-amber-400 transition-colors"
              >
                <Star
                  className={`w-4 h-4 ${
                    item.my_rating && val <= item.my_rating
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-600"
                  }`}
                />
              </button>
            ))}
          </div>
          {item.my_rating && (
            <span className="text-xs font-semibold text-amber-300 ml-1">{item.my_rating}점</span>
          )}
        </div>
      )}
    </div>
  );
}
