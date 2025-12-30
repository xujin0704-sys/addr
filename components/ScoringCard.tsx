
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { EvaluationReport } from '../types';
import { Trophy, AlertCircle, CheckCircle } from 'lucide-react';

interface ScoringCardProps {
  report: EvaluationReport;
  title: string;
}

const ScoringCard: React.FC<ScoringCardProps> = ({ report, title }) => {
  // Mapping metric keys/names to Chinese display labels
  const getMetricLabel = (name: string) => {
    const map: Record<string, string> = {
      'Recall': '召回率',
      'Precision': '精确率',
      'Accuracy': '准确率',
      'Consistency': '一致性'
    };
    return map[name] || name;
  };

  const radarData = [
    { subject: '召回率', A: report.recall.score, fullMark: 100 },
    { subject: '精确率', A: report.precision.score, fullMark: 100 },
    { subject: '准确率', A: report.accuracy.score, fullMark: 100 },
    { subject: '一致性', A: report.consistency.score, fullMark: 100 },
  ];

  const metrics = [
    { ...report.recall, displayName: '召回率' },
    { ...report.precision, displayName: '精确率' },
    { ...report.accuracy, displayName: '准确率' },
    { ...report.consistency, displayName: '一致性' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          {title === 'Traditional' ? '传统分词' : 'MGeo 分词'} AI 评估
        </h3>
        <div className="flex items-center gap-1">
           <span className="text-2xl font-black text-blue-600">{report.overallScore}</span>
           <span className="text-slate-400 text-xs font-bold mt-2">/ 100</span>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
        {/* Radar Chart */}
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name={title}
                dataKey="A"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m) => (
            <div key={m.name} className="p-3 rounded-lg border border-slate-100 bg-slate-50/30">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">{m.displayName}</div>
              <div className="text-lg font-bold text-slate-800">{m.score}%</div>
              <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">{m.reason}</p>
            </div>
          ))}
        </div>

        {/* Pros & Cons */}
        <div className="space-y-4 pt-2">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              核心优势
            </h4>
            <ul className="space-y-1">
              {report.pros.map((pro, i) => (
                <li key={i} className="text-sm text-slate-700 flex gap-2">
                  <span className="text-emerald-500 mt-1">•</span> {pro}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-rose-500" />
              改进建议
            </h4>
            <ul className="space-y-1">
              {report.cons.map((con, i) => (
                <li key={i} className="text-sm text-slate-700 flex gap-2">
                  <span className="text-rose-500 mt-1">•</span> {con}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-50/50 border-t border-blue-100">
        <p className="text-xs text-blue-700 font-medium italic">
          " {report.suggestion} "
        </p>
      </div>
    </div>
  );
};

export default ScoringCard;
