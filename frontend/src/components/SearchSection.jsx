"use client";

import { useState } from "react";
import { Search, Sparkles, SlidersHorizontal, Check } from "lucide-react";
import { mockSubgenres } from "../mock/mockData";

export default function SearchSection({ onSearch }) {
  const [query, setQuery] = useState("2026년 첩보 관련 미드나 영화 추천해줘");
  const [selectedSubgenres, setSelectedSubgenres] = useState(["intel_politics", "action_terror"]);
  const [yearFilter, setYearFilter] = useState("2026");

  const toggleSubgenre = (id) => {
    if (selectedSubgenres.includes(id)) {
      setSelectedSubgenres(selectedSubgenres.filter((item) => item !== id));
    } else {
      setSelectedSubgenres([...selectedSubgenres, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedSubgenres(mockSubgenres.map((s) => s.id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ query, selectedSubgenres, yearFilter });
  };

  return (
    <section className="w-full max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
          재미와 화제성이 검증된 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">인생 작품</span> 탐색
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          내가 아직 보지 않은 시즌까지, 신뢰할 수 있는 40/40/10/10 지수와 함께 추천합니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 자연어 검색 입력창 */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 2026년 첩보 미드나 영화 추천해줘"
            className="w-full h-14 pl-12 pr-32 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-base shadow-xl transition-all"
          />
          <Search className="w-5 h-5 text-slate-500 absolute left-4" />
          <button
            type="submit"
            className="absolute right-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            추천 탐색
          </button>
        </div>

        {/* 세부 장르 4개 선택지 (INT-27, D-22 확정 규격) */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
              '첩보' 세부 장르 선택 (최대 4개)
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-blue-400 hover:underline font-medium"
            >
              전체 선택
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {mockSubgenres.map((sub) => {
              const isSelected = selectedSubgenres.includes(sub.id);
              return (
                <button
                  type="button"
                  key={sub.id}
                  onClick={() => toggleSubgenre(sub.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? "bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-sm"
                      : "bg-slate-950/40 border-slate-800/70 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold">{sub.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-tight line-clamp-1">
                    {sub.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </section>
  );
}
