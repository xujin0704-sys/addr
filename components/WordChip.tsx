
import React, { useState } from 'react';
import { SegmentWord } from '../types';

interface WordChipProps {
  word: SegmentWord;
  isDiff?: boolean;
}

const WordChip: React.FC<WordChipProps> = ({ word, isDiff }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Figure 2 color scheme based on levelIndex or category
  const getTheme = () => {
    if (!word.levelIndex) return {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200',
      subText: 'text-slate-400'
    };

    const level = word.levelIndex;
    if (level <= 5) return { // Admin levels (Prov, City, Dist)
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
      subText: 'text-blue-500'
    };
    if (level >= 13 && level <= 13) return { // AOI
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
      subText: 'text-purple-500'
    };
    if (level >= 14) return { // Buildings, Units, Rooms
      bg: 'bg-orange-50',
      text: 'text-orange-900',
      border: 'border-orange-200',
      subText: 'text-orange-500'
    };

    return {
      bg: 'bg-slate-50',
      text: 'text-slate-800',
      border: 'border-slate-200',
      subText: 'text-slate-500'
    };
  };

  const theme = getTheme();

  return (
    <div className={`relative inline-block m-1.5 transition-all duration-300 group ${isDiff ? 'animate-in zoom-in-95 duration-500' : ''}`}>
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex flex-col items-center justify-between min-w-[70px] px-3 py-2 rounded-xl border-2 transition-all cursor-help
          ${theme.bg} ${theme.border}
          ${isDiff ? 'ring-2 ring-rose-400 ring-offset-2 border-rose-500 shadow-lg scale-110 z-20' : 'hover:scale-105 hover:shadow-md'}`}
      >
        {/* Top level number */}
        <div className={`w-full text-[9px] font-black text-left mb-1 opacity-60 ${theme.subText}`}>
          {word.levelIndex || '-'}
        </div>

        {/* Middle word text */}
        <div className={`text-sm font-black tracking-tight mb-1 text-center leading-tight ${theme.text}`}>
          {word.text}
        </div>

        {/* Bottom category shorthand */}
        <div className={`text-[10px] font-black uppercase tracking-widest text-center mt-auto ${theme.subText}`}>
          {word.categoryName || word.pos || '词'}
        </div>

        {isDiff && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 border-2 border-white shadow-sm"></span>
          </span>
        )}
      </div>

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-4 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl text-[11px] space-y-2 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200 ring-1 ring-white/10">
          <div className="flex justify-between items-center border-b border-slate-700/50 pb-2 mb-1">
            <span className="font-black text-sm tracking-tight">{word.text}</span>
            {isDiff && <span className="bg-rose-600 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm shadow-rose-900/50">分歧</span>}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase tracking-tighter">字典层级 (Level)</span>
              <span className="bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-lg font-black">{word.levelIndex || '无'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase tracking-tighter">实体类别 (Cat)</span>
              <span className="text-amber-400 font-black">{word.categoryName || '普通'}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-800">
               <span className="text-slate-400 font-bold uppercase tracking-tighter">AI 置信度</span>
               <div className="flex items-center gap-2">
                 <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500" style={{ width: `${word.confidence * 100}%` }}></div>
                 </div>
                 <span className="font-black tabular-nums">{Math.round(word.confidence * 100)}%</span>
               </div>
            </div>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95"></div>
        </div>
      )}
    </div>
  );
};

export default WordChip;
