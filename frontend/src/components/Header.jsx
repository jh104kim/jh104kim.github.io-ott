"use client";

import { Sparkles, Heart, Gauge, ShieldCheck } from "lucide-react";

export default function Header({ usage, onOpenWishlist, onOpenUsage, activeTab, setActiveTab }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("search")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
              Screen Intelligence
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Gemini 2.5
              </span>
            </span>
            <p className="text-xs text-slate-400">개인 맞춤형 OTT & 극장 스마트 추천</p>
          </div>
        </div>

        <nav className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "search" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            추천 탐색
          </button>
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "wishlist" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Heart className="w-4 h-4 text-rose-500" />
            찜 목록
          </button>
          <button
            onClick={onOpenUsage}
            className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-all flex items-center gap-2"
          >
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs">
              오늘 잔여 <strong className="text-emerald-400 font-semibold">{usage.daily_limit - usage.daily_used}</strong>회
            </span>
          </button>
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <div className="flex items-center gap-2 pl-1">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-blue-400">
              DA
            </div>
            <div className="hidden md:block text-left text-xs">
              <p className="font-medium text-slate-200">Dev Admin</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" /> 승인됨
              </p>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
