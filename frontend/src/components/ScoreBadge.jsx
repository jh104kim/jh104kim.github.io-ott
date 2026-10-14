"use client";

import { Award, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function ScoreBadge({ score, subscores, confidence, isClose }) {
  const getScoreColor = (val) => {
    if (val >= 90) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (val >= 80) return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    if (val >= 70) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-slate-400 bg-slate-500/10 border-slate-500/30";
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <div className={`px-2.5 py-1 rounded-lg border font-bold text-sm flex items-center gap-1.5 ${getScoreColor(score)}`}>
          <Award className="w-4 h-4" />
          <span>P-GSEI {score.toFixed(1)}</span>
        </div>
        {isClose && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            0.1점차 접전
          </span>
        )}
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 신뢰도 {confidence}
        </span>
      </div>

      {/* 40/40/10/10 점수 구성 바 */}
      <div className="grid grid-cols-4 gap-1.5 text-[10px] text-slate-400 pt-1">
        <div className="bg-slate-900/60 border border-slate-800/80 px-2 py-1 rounded">
          <span className="block text-slate-500 text-[9px]">관객 40%</span>
          <strong className="text-slate-200 font-semibold">{subscores.audience ?? "-"}</strong>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 px-2 py-1 rounded">
          <span className="block text-slate-500 text-[9px]">인기 40%</span>
          <strong className="text-slate-200 font-semibold">{subscores.popularity ?? "-"}</strong>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 px-2 py-1 rounded">
          <span className="block text-slate-500 text-[9px]">평론 10%</span>
          <strong className="text-slate-200 font-semibold">{subscores.critics ?? "-"}</strong>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 px-2 py-1 rounded">
          <span className="block text-slate-500 text-[9px]">취향 10%</span>
          <strong className="text-slate-200 font-semibold">{subscores.taste ?? "-"}</strong>
        </div>
      </div>
    </div>
  );
}
