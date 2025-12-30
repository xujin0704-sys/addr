
import React, { useState, useMemo } from 'react';
/* Added AlertCircle to lucide-react imports to fix the error on line 470 */
import { Upload, Send, Download, Layers, ShieldCheck, Zap, FileText, ChevronRight, BarChart2, SplitSquareHorizontal, Info, List, TrendingUp, PieChart, Settings2, Sliders, BrainCircuit, Sparkles, MapPin, Edit3, Plus, X, RotateCcw, Link, Globe, Code2, Cpu, Activity, Server, Hash, Type as LucideType, Bookmark, FileSearch, Settings, AlertCircle } from 'lucide-react';
import { BatchComparisonData, ComparisonMode, ComparisonData, EvaluationWeights, AIConfig, GranularityLevel, LevelDefinition, ExternalSegmentation, ApiEndpointConfig } from './types';
import { evaluateBatchSegmentation } from './services/geminiService';
import WordChip from './components/WordChip';
import ScoringCard from './components/ScoringCard';

type SettingsTab = 'interfaces' | 'engine' | 'weights' | 'dictionary';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [batchData, setBatchData] = useState<BatchComparisonData | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<ComparisonMode>(ComparisonMode.BOTH);
  const [scoreFilter, setScoreFilter] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('interfaces');
  
  const default18Level: LevelDefinition[] = [
    { id: 'L1', name: '国家 (Country)', alias: '国', pos: 'ns', example: '中国', description: '主权国家名称' },
    { id: 'L2', name: '省/直辖市 (Province)', alias: '省', pos: 'ns', example: '广东省', description: '一级行政区' },
    { id: 'L3', name: '城市 (City)', alias: '市', pos: 'ns', example: '深圳市', description: '地级行政单位' },
    { id: 'L4', name: '区县 (District)', alias: '区', pos: 'ns', example: '南山区', description: '县级行政单位' },
    { id: 'L5', name: '乡镇街道 (Township)', alias: '镇', pos: 'ns', example: '粤海街道', description: '乡级行政单位' },
    { id: 'L6', name: '路/街 (Road)', alias: '路', pos: 'n', example: '深南大道', description: '城市道路名称' },
    { id: 'L7', name: '门牌号 (Number)', alias: '号', pos: 'm', example: '100号', description: '道路门牌' },
    { id: 'L8', name: '建筑物 (Building)', alias: '栋', pos: 'n', example: '腾讯大厦', description: '独立建筑物名称' },
    { id: 'L9', name: '楼栋 (Block)', alias: '幢', pos: 'm', example: 'A座', description: '建筑物内部区块' },
    { id: 'L10', name: '单元 (Unit)', alias: '单元', pos: 'm', example: '2单元', description: '楼栋单元号' },
    { id: 'L11', name: '层 (Floor)', alias: '层', pos: 'm', example: '18层', description: '楼层高度' },
    { id: 'L12', name: '户/房号 (Room)', alias: '室', pos: 'm', example: '1801室', description: '最小房间编号' },
    { id: 'L13', name: '方位词 (Direction)', alias: '位', pos: 'f', example: '旁边', description: '相对地理方位' },
    { id: 'L14', name: '距离 (Distance)', alias: '距', pos: 'm', example: '200米', description: '距离描述' },
    { id: 'L15', name: '兴趣点 (POI)', alias: 'POI', pos: 'n', example: '世界之窗', description: '地标、商铺等点状地名' },
    { id: 'L16', name: '附属设施 (Facility)', alias: '施', pos: 'n', example: '停车场', description: '建筑物附属设施' },
    { id: 'L17', name: '交叉路口 (Intersection)', alias: '叉', pos: 'n', example: '路口', description: '两条路交汇处' },
    { id: 'L18', name: '区域描述 (Area)', alias: '域', pos: 'n', example: '核心区', description: '非标准行政划定的区域' }
  ];

  const default24Level: LevelDefinition[] = [
    ...default18Level,
    { id: 'L19', name: '商圈 (Business District)', alias: '圈', pos: 'n', example: '东门商圈', description: '商业聚集区域' },
    { id: 'L20', name: '社区 (Community)', alias: '社', pos: 'n', example: '南园社区', description: '基层群众性自治组织区域' },
    { id: 'L21', name: '地标 (Landmark)', alias: '标', pos: 'n', example: '东方明珠', description: '具有标志性的地理实体' },
    { id: 'L22', name: 'POI分类 (POI Category)', alias: '类', pos: 'n', example: '酒店', description: 'POI的类别标签' },
    { id: 'L23', name: '子区域 (Sub-area)', alias: '子', pos: 'n', example: '北区', description: '大区域内部的子划分' },
    { id: 'L24', name: '邮编 (Postcode)', alias: '邮', pos: 'm', example: '518000', description: '邮政编码数字' }
  ];

  const initialApiConfig: ApiEndpointConfig = {
    enabled: false,
    method: 'POST',
    url: '',
    headers: '{\n  "Content-Type": "application/json"\n}',
    bodyTemplate: '{\n  "text": "{{text}}"\n}',
    responsePath: 'words'
  };

  const initialEvalApiConfig: ApiEndpointConfig = {
    enabled: false,
    method: 'POST',
    url: '',
    headers: '{\n  "Content-Type": "application/json"\n}',
    bodyTemplate: '{\n  "payload": "{{payload}}"\n}',
    responsePath: 'data'
  };

  const [aiConfig, setAiConfig] = useState<AIConfig>({
    model: 'gemini-3-flash-preview',
    temperature: 0.2,
    evaluatorType: 'gemini',
    evaluatorApi: { ...initialEvalApiConfig },
    granularityLevel: '18-level',
    levelDefinitions: {
      '18-level': default18Level,
      '24-level': default24Level,
      'custom': [{ id: 'C1', name: '地理核心区', alias: '核心', pos: 'n', example: '中心枢纽', description: '自定义核心区域' }]
    },
    weights: {
      recall: 30,
      precision: 30,
      accuracy: 20,
      consistency: 20
    },
    traditionalApi: { ...initialApiConfig },
    mgeoApi: { ...initialApiConfig }
  });

  const isBatch = useMemo(() => {
    return inputText.trim().split('\n').filter(l => l.trim()).length > 1;
  }, [inputText]);

  const handleWeightChange = (key: keyof EvaluationWeights, value: string) => {
    const numValue = parseInt(value) || 0;
    setAiConfig(prev => ({
      ...prev,
      weights: { ...prev.weights, [key]: numValue }
    }));
  };

  const handleConfigChange = (key: keyof AIConfig, value: any) => {
    setAiConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateApiConfig = (type: 'traditionalApi' | 'mgeoApi' | 'evaluatorApi', field: keyof ApiEndpointConfig, value: any) => {
    setAiConfig(prev => ({
      ...prev,
      [type]: { ...prev[type as keyof AIConfig] as any, [field]: value }
    }));
  };

  const handleDefinitionChange = (level: GranularityLevel, value: LevelDefinition[]) => {
    setAiConfig(prev => ({
      ...prev,
      levelDefinitions: {
        ...prev.levelDefinitions,
        [level]: value
      }
    }));
  };

  const updateDictionaryItem = (index: number, field: keyof LevelDefinition, value: string) => {
    const current = aiConfig.levelDefinitions[aiConfig.granularityLevel];
    const newList = [...current];
    newList[index] = { ...newList[index], [field]: value };
    handleDefinitionChange(aiConfig.granularityLevel, newList);
  };

  const addDictionaryItem = () => {
    const current = aiConfig.levelDefinitions[aiConfig.granularityLevel];
    handleDefinitionChange(aiConfig.granularityLevel, [...current, { id: `L${current.length + 1}`, name: '新层级名称', alias: '别名', pos: 'n', example: '示例', description: '说明文字' }]);
  };

  const removeDictionaryItem = (index: number) => {
    const current = aiConfig.levelDefinitions[aiConfig.granularityLevel];
    handleDefinitionChange(aiConfig.granularityLevel, current.filter((_, i) => i !== index));
  };

  const resolvePath = (obj: any, path: string) => {
    if (!path) return obj;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const callExternalApi = async (config: ApiEndpointConfig, text: string, payload?: any): Promise<any | undefined> => {
    if (!config.enabled || !config.url) return undefined;
    try {
      let headers = {};
      try { headers = JSON.parse(config.headers); } catch (e) { console.warn("Invalid headers JSON"); }

      let fetchOptions: RequestInit = { method: config.method, headers };
      let requestUrl = config.url;

      if (config.method === 'POST') {
        let body = config.bodyTemplate.replace('{{text}}', text);
        if (payload) {
          body = body.replace('{{payload}}', JSON.stringify(payload));
        }
        fetchOptions.body = body;
      } else {
        const url = new URL(config.url);
        url.searchParams.append('text', text);
        requestUrl = url.toString();
      }

      const response = await fetch(requestUrl, fetchOptions);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return resolvePath(data, config.responsePath);
    } catch (e) {
      console.warn(`External API call failed`, e);
      return undefined;
    }
  };

  const handleRunEvaluation = async () => {
    const lines = inputText.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) return;
    
    setLoading(true);
    try {
      const externalResults: ExternalSegmentation[] = [];
      if (aiConfig.traditionalApi.enabled || aiConfig.mgeoApi.enabled) {
        for (const line of lines) {
          const tradWords = await callExternalApi(aiConfig.traditionalApi, line);
          const mgeoWords = await callExternalApi(aiConfig.mgeoApi, line);
          externalResults.push({
            text: line,
            traditionalWords: Array.isArray(tradWords) ? tradWords : undefined,
            mgeoWords: Array.isArray(mgeoWords) ? mgeoWords : undefined
          });
        }
      }

      let data: BatchComparisonData;
      if (aiConfig.evaluatorType === 'external' && aiConfig.evaluatorApi.enabled) {
        const evalPayload = {
          texts: lines,
          weights: aiConfig.weights,
          granularity: aiConfig.granularityLevel,
          definitions: aiConfig.levelDefinitions[aiConfig.granularityLevel],
          externalResults: externalResults.length > 0 ? externalResults : undefined
        };
        const result = await callExternalApi(aiConfig.evaluatorApi, inputText, evalPayload);
        if (!result) throw new Error("外部评测引擎返回为空");
        data = result as BatchComparisonData;
      } else {
        data = await evaluateBatchSegmentation(lines, aiConfig, externalResults.length > 0 ? externalResults : undefined);
      }
      
      setBatchData(data);
      setSelectedIndex(0);
    } catch (error: any) {
      console.error("Evaluation failed", error);
      alert(`评测失败: ${error.message || "请检查控制台、API连接或网络状态。"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setInputText(text);
      };
      reader.readAsText(file);
    }
  };

  const downloadResult = () => {
    if (!batchData) return;
    const blob = new Blob([JSON.stringify(batchData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `批量分词评测结果-${Date.now()}.json`;
    a.click();
  };

  const totalWeight = useMemo(() => {
    return aiConfig.weights.recall + aiConfig.weights.precision + aiConfig.weights.accuracy + aiConfig.weights.consistency;
  }, [aiConfig.weights]);

  const currentResult: ComparisonData | null = batchData ? batchData.items[selectedIndex] : null;

  const ApiConfigCard = ({ type, title, icon: Icon, color }: { type: 'traditionalApi' | 'mgeoApi' | 'evaluatorApi', title: string, icon: any, color: string }) => {
    const config = aiConfig[type as keyof AIConfig] as ApiEndpointConfig;
    return (
      <div className={`bg-white p-6 rounded-3xl border transition-all ${config.enabled ? `border-${color}-200 ring-1 ring-${color}-100 shadow-lg shadow-${color}-50` : 'border-slate-200 shadow-sm'} space-y-4`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${config.enabled ? `bg-${color}-50 text-${color}-600` : 'bg-slate-100 text-slate-400'}`}>
              <Icon className="w-4 h-4" />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase">{config.enabled ? '已启用' : '禁用'}</span>
            <button 
              onClick={() => updateApiConfig(type, 'enabled', !config.enabled)}
              className={`w-8 h-4 rounded-full transition-all relative ${config.enabled ? `bg-${color}-500` : 'bg-slate-200'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${config.enabled ? 'left-4.5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        <div className={`space-y-3 transition-opacity ${!config.enabled && 'opacity-40 grayscale pointer-events-none'}`}>
          <div className="flex gap-2">
            <select 
              value={config.method}
              onChange={(e) => updateApiConfig(type, 'method', e.target.value)}
              className="px-2 py-1.5 bg-slate-100 border-none rounded-lg text-[10px] font-black outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
            </select>
            <div className="relative flex-1">
              <input 
                value={config.url}
                placeholder="REST API Endpoint URL"
                onChange={(e) => updateApiConfig(type, 'url', e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-700 focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none"
              />
              <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                <Code2 className="w-2.5 h-2.5" /> Headers (JSON)
              </label>
              <textarea 
                value={config.headers}
                onChange={(e) => updateApiConfig(type, 'headers', e.target.value)}
                className="w-full h-24 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-mono leading-tight focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                <Cpu className="w-2.5 h-2.5" /> Body ({"{{text}}"} / {"{{payload}}"})
              </label>
              <textarea 
                value={config.bodyTemplate}
                onChange={(e) => updateApiConfig(type, 'bodyTemplate', e.target.value)}
                className="w-full h-24 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-mono leading-tight focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
              <Activity className="w-2.5 h-2.5" /> Response Path (e.g. data.results)
            </label>
            <input 
              value={config.responsePath}
              placeholder="e.g. words or results.list"
              onChange={(e) => updateApiConfig(type, 'responsePath', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderSettingsContent = () => {
    switch (settingsTab) {
      case 'interfaces':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex items-center gap-2 text-slate-800 mb-2">
              <Globe className="w-4 h-4 text-indigo-500" />
              <h2 className="text-xs font-black uppercase tracking-widest">REST 外部分词接口</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ApiConfigCard 
                type="traditionalApi" 
                title="传统分词 (Baseline)" 
                icon={Cpu} 
                color="indigo" 
              />
              <ApiConfigCard 
                type="mgeoApi" 
                title="MGeo 深度识别 (Engine)" 
                icon={Zap} 
                color="blue" 
              />
            </div>
          </div>
        );
      case 'engine':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex items-center gap-2 text-slate-800 mb-2">
              <BrainCircuit className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-black uppercase tracking-widest">评测逻辑引擎</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">引擎类型选择</label>
                  <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
                    <button
                      onClick={() => handleConfigChange('evaluatorType', 'gemini')}
                      className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${
                        aiConfig.evaluatorType === 'gemini' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Gemini 专家
                    </button>
                    <button
                      onClick={() => handleConfigChange('evaluatorType', 'external')}
                      className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${
                        aiConfig.evaluatorType === 'external' 
                        ? 'bg-white text-amber-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      自定义 API
                    </button>
                  </div>
                </div>

                {aiConfig.evaluatorType === 'gemini' ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase">模型规模</label>
                      <div className="flex gap-2">
                        {(['gemini-3-flash-preview', 'gemini-3-pro-preview'] as const).map(m => (
                          <button
                            key={m}
                            onClick={() => handleConfigChange('model', m)}
                            className={`flex-1 px-3 py-2 rounded-xl border-2 transition-all ${
                              aiConfig.model === m 
                              ? 'border-blue-500 bg-blue-50 text-blue-800 font-black' 
                              : 'border-slate-100 bg-slate-50 text-slate-500 text-[9px]'
                            }`}
                          >
                            {m.includes('pro') ? 'PRO' : 'FLASH'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase">
                        <span>温度系数</span>
                        <span className="text-blue-600">{aiConfig.temperature}</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.1"
                        value={aiConfig.temperature}
                        onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                        className="w-full accent-blue-600 h-1 rounded-full bg-slate-100"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24 text-center">
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed px-4 italic">
                      外部接口将完全托管评测逻辑。<br/>需返回 BatchComparisonData 格式。
                    </p>
                  </div>
                )}
              </div>
              <div className="lg:col-span-2">
                <ApiConfigCard 
                  type="evaluatorApi" 
                  title="自定义评测 REST 接口" 
                  icon={Server} 
                  color="amber" 
                />
              </div>
            </div>
          </div>
        );
      case 'weights':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex items-center gap-2 text-slate-800 mb-2">
              <Sliders className="w-4 h-4 text-emerald-500" />
              <h2 className="text-xs font-black uppercase tracking-widest">评测评分加权</h2>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-8">
              {(['recall', 'precision', 'accuracy', 'consistency'] as const).map((key) => (
                <div key={key} className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-2">
                      {key === 'recall' ? '召回率 (Recall)' : key === 'precision' ? '精确率 (Precision)' : key === 'accuracy' ? '准确率 (Accuracy)' : '一致性 (Consistency)'}
                    </span>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full">{aiConfig.weights[key]}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" step="5"
                    value={aiConfig.weights[key]}
                    onChange={(e) => handleWeightChange(key, e.target.value)}
                    className="w-full accent-blue-600 h-2 rounded-full bg-slate-100 cursor-pointer"
                  />
                </div>
              ))}
              <div className={`p-5 rounded-2xl flex items-center justify-between border ${totalWeight === 100 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                <div className="flex items-center gap-3">
                  {totalWeight === 100 ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <span className="text-xs font-black uppercase tracking-widest">总计加权占比: {totalWeight}%</span>
                </div>
                <span className="text-[10px] font-bold opacity-70 italic">{totalWeight === 100 ? '符合评分基准' : '总和需等于 100%'}</span>
              </div>
            </div>
          </div>
        );
      case 'dictionary':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex items-center gap-2 text-slate-800 mb-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              <h2 className="text-xs font-black uppercase tracking-widest">分词粒度标准定义</h2>
            </div>
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col h-[500px]">
              <div className="flex p-1 bg-slate-100 rounded-2xl gap-1 mb-2">
                {(['18-level', '24-level', 'custom'] as GranularityLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => handleConfigChange('granularityLevel', level)}
                    className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all uppercase ${
                      aiConfig.granularityLevel === level 
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200' 
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {level === '18-level' ? '18层地理级' : level === '24-level' ? '24层扩展级' : '自定义配置'}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3 px-2">
                <div className="grid grid-cols-[40px_60px_100px_60px_60px_120px_1fr_40px] gap-4 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  <span>#</span>
                  <span>层级ID</span>
                  <span>层级名称</span>
                  <span>别名</span>
                  <span>词性</span>
                  <span>典型示例</span>
                  <span>说明</span>
                  <span></span>
                </div>
                {aiConfig.levelDefinitions[aiConfig.granularityLevel].map((def, idx) => (
                  <div key={idx} className="grid grid-cols-[40px_60px_100px_60px_60px_120px_1fr_40px] gap-4 items-center group bg-slate-50 hover:bg-blue-50/50 p-3 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all">
                    <span className="text-[10px] font-black text-slate-300">{idx + 1}</span>
                    <input 
                      value={def.id}
                      onChange={(e) => updateDictionaryItem(idx, 'id', e.target.value)}
                      className="bg-transparent text-[10px] font-black outline-none"
                    />
                    <input 
                      value={def.name}
                      onChange={(e) => updateDictionaryItem(idx, 'name', e.target.value)}
                      className="bg-transparent text-[10px] font-bold outline-none"
                    />
                    <input 
                      value={def.alias}
                      onChange={(e) => updateDictionaryItem(idx, 'alias', e.target.value)}
                      className="bg-blue-100 text-[10px] font-black text-blue-700 text-center rounded-lg outline-none px-2 py-0.5"
                    />
                    <input 
                      value={def.pos}
                      onChange={(e) => updateDictionaryItem(idx, 'pos', e.target.value)}
                      className="bg-slate-200 text-[10px] font-mono text-center rounded-lg outline-none px-2 py-0.5"
                    />
                    <input 
                      value={def.example}
                      onChange={(e) => updateDictionaryItem(idx, 'example', e.target.value)}
                      className="bg-transparent text-[10px] italic text-slate-600 outline-none"
                    />
                    <input 
                      value={def.description}
                      onChange={(e) => updateDictionaryItem(idx, 'description', e.target.value)}
                      className="bg-transparent text-[10px] text-slate-400 outline-none truncate focus:text-slate-800"
                    />
                    <button onClick={() => removeDictionaryItem(idx)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={addDictionaryItem} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[11px] font-black text-slate-400 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2 mt-2">
                  <Plus className="w-4 h-4" /> 新增层级规则
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-inner">
              <Layers className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">MGeo 分词评测工具</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">开放引擎基准评测平台 (Custom & Gemini)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${
                showSettings ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-2 ring-blue-100 ring-offset-2' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              配置与标准
            </button>
            <button
              onClick={downloadResult}
              disabled={!batchData}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-blue-100"
            >
              <Download className="w-4 h-4" />
              导出结果
            </button>
          </div>
        </div>
      </header>

      {showSettings && (
        <section className="bg-slate-50 border-b border-slate-200 animate-in slide-in-from-top duration-300">
           <div className="max-w-7xl mx-auto p-8 pt-6">
             {/* Secondary Settings Tabs */}
             <div className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit mb-10 mx-auto">
                <button 
                  onClick={() => setSettingsTab('interfaces')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${settingsTab === 'interfaces' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  接口配置
                </button>
                <button 
                  onClick={() => setSettingsTab('engine')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${settingsTab === 'engine' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  评测引擎
                </button>
                <button 
                  onClick={() => setSettingsTab('weights')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${settingsTab === 'weights' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  评分指标权重
                </button>
                <button 
                  onClick={() => setSettingsTab('dictionary')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${settingsTab === 'dictionary' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  分词层级配置
                </button>
             </div>

             {/* Tab Content Rendering */}
             <div className="min-h-[400px]">
                {renderSettingsContent()}
             </div>
           </div>
        </section>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-end">
              <label className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                测试语料数据集
              </label>
              <div className="flex gap-4">
                <select
                   value={mode}
                   onChange={(e) => setMode(e.target.value as ComparisonMode)}
                   className="text-xs font-black bg-slate-100 border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 transition-all outline-none cursor-pointer"
                >
                   <option value={ComparisonMode.BOTH}>分屏对比模式</option>
                   <option value={ComparisonMode.TRADITIONAL_ONLY}>仅显示 Baseline</option>
                   <option value={ComparisonMode.MGEO_ONLY}>仅显示 MGeo</option>
                </select>
                <div className="relative">
                  <input
                    type="file" id="file-upload" className="hidden" accept=".txt,.csv"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-black rounded-xl cursor-pointer transition-all border border-blue-100"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    批量载入
                  </label>
                </div>
              </div>
            </div>

            <textarea
              className="w-full h-48 p-8 bg-slate-50/50 border border-slate-200 rounded-[1.5rem] focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-slate-800 font-bold placeholder-slate-300 leading-relaxed shadow-inner"
              placeholder="请输入测试文本，每行代表一个待评估样本..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />

            <div className="flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <div className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    {isBatch ? `样本量: ${inputText.trim().split('\n').filter(l => l.trim()).length}` : '单样本检测'}
                  </div>
                  <div className="px-4 py-1.5 bg-blue-50 rounded-full text-[10px] text-blue-600 font-black uppercase tracking-widest">
                    标准: {aiConfig.granularityLevel}
                  </div>
                  {aiConfig.evaluatorType === 'external' && aiConfig.evaluatorApi.enabled && (
                    <div className="px-4 py-1.5 bg-amber-50 rounded-full text-[10px] text-amber-600 font-black uppercase tracking-widest flex items-center gap-2">
                       <Server className="w-3 h-3" /> 自定义评测模式
                    </div>
                  )}
               </div>
              <button
                onClick={handleRunEvaluation}
                disabled={loading || !inputText.trim() || totalWeight !== 100}
                className={`flex items-center gap-3 px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale`}
              >
                {loading ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    正在执行跨引擎评测逻辑...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    启动基准评测
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {batchData && batchData.items.length > 1 && (
          <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-700">
             <div className="absolute -top-10 -right-10 p-4 opacity-5 pointer-events-none">
                <BarChart2 className="w-64 h-64" />
             </div>
             <div className="flex items-center gap-4 mb-10 relative z-10">
                <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30">
                  <PieChart className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-2xl font-black tracking-tight uppercase tracking-widest">批次评测专家深度报告</h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                <div className="p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                   <div className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-3">样本总量</div>
                   <div className="text-5xl font-black tabular-nums">{batchData.summary.totalItems}</div>
                </div>
                <div className="p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                   <div className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-3">MGeo 均分</div>
                   <div className="text-5xl font-black tabular-nums text-emerald-400">{batchData.summary.mgeoAvgScore}</div>
                </div>
                <div className="p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                   <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">传统均分</div>
                   <div className="text-5xl font-black tabular-nums text-slate-300">{batchData.summary.traditionalAvgScore}</div>
                </div>
                <div className="md:col-span-1 flex flex-col justify-center bg-blue-600/10 p-8 rounded-3xl border border-blue-500/20">
                   <div className="text-[11px] text-amber-400 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                     <BrainCircuit className="w-4 h-4" />
                     跨引擎共性洞察
                   </div>
                   <p className="text-sm text-slate-300 leading-relaxed font-bold italic line-clamp-5">
                     "{batchData.summary.keyInsights}"
                   </p>
                </div>
             </div>
          </section>
        )}

        {batchData && batchData.items.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-6 custom-scrollbar no-scrollbar pt-2 px-2">
             {batchData.items.map((item, idx) => (
               <button
                 key={idx}
                 onClick={() => setSelectedIndex(idx)}
                 className={`flex-shrink-0 px-6 py-4 rounded-2xl text-[11px] font-black transition-all border-2 ${
                   selectedIndex === idx 
                   ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100 scale-105' 
                   : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                 }`}
               >
                 样本 {idx + 1}: {item.input.slice(0, 15)}...
               </button>
             ))}
          </div>
        )}

        {currentResult && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
             <div className="flex items-center justify-between bg-white/80 backdrop-blur-md p-6 rounded-[2rem] border border-slate-200 shadow-sm">
               <div className="flex items-center gap-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">样本</span>
                    <span className="text-sm font-black text-slate-800 tabular-nums">#{selectedIndex + 1}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">层级字典</span>
                    <span className="text-sm font-black text-blue-600 uppercase tracking-tight">{aiConfig.granularityLevel}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">报告过滤</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-slate-600 tabular-nums min-w-[24px]">{scoreFilter}</span>
                      <input
                        type="range" min="0" max="100"
                        value={scoreFilter}
                        onChange={(e) => setScoreFilter(parseInt(e.target.value))}
                        className="accent-blue-600 h-1.5 w-40 cursor-pointer bg-slate-100 rounded-full"
                      />
                    </div>
                  </div>
               </div>
               <div className={`px-5 py-2 rounded-full text-[11px] font-black text-white flex items-center gap-2.5 shadow-lg ${aiConfig.evaluatorType === 'external' ? 'bg-amber-600' : 'bg-slate-900'}`}>
                 <ShieldCheck className={`w-4 h-4 ${aiConfig.evaluatorType === 'external' ? 'text-amber-200' : 'text-blue-400'}`} />
                 {aiConfig.evaluatorType === 'external' ? 'EXTERNAL API EVALUATION' : 'AI-POWERED EVALUATION'}
               </div>
             </div>

            <div className={`grid gap-10 ${mode === ComparisonMode.BOTH ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {(mode === ComparisonMode.BOTH || mode === ComparisonMode.TRADITIONAL_ONLY) && (
                <div className="space-y-6">
                   <div className="flex items-center justify-between px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-300 shadow-inner" />
                        <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">传统通用分词 (Baseline)</h2>
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GEN-01 STANDARD</div>
                   </div>
                   <div className="bg-white border border-slate-200 rounded-[2rem] p-10 min-h-[200px] shadow-sm flex flex-wrap content-start">
                     {currentResult.traditional.words.map((word, idx) => {
                       const isDiff = !currentResult.mgeo.words.some(w => w.text === word.text);
                       return <WordChip key={idx} word={word} isDiff={isDiff} />;
                     })}
                   </div>
                   {currentResult.traditionalEval.overallScore >= scoreFilter && (
                      <ScoringCard report={currentResult.traditionalEval} title="Traditional" />
                   )}
                </div>
              )}

              {(mode === ComparisonMode.BOTH || mode === ComparisonMode.MGEO_ONLY) && (
                <div className="space-y-6">
                   <div className="flex items-center justify-between px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-xl shadow-blue-100 animate-pulse" />
                        <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">MGeo 深度地理识别 (Optimized)</h2>
                      </div>
                      <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">MGEO-V2.5 ENGINE</div>
                   </div>
                   <div className="bg-white border border-blue-100 rounded-[2rem] p-10 min-h-[200px] shadow-sm shadow-blue-50/30 flex flex-wrap content-start">
                     {currentResult.mgeo.words.map((word, idx) => {
                       const isDiff = !currentResult.traditional.words.some(w => w.text === word.text);
                       return <WordChip key={idx} word={word} isDiff={isDiff} />;
                     })}
                   </div>
                   {currentResult.mgeoEval.overallScore >= scoreFilter && (
                      <ScoringCard report={currentResult.mgeoEval} title="MGeo" />
                   )}
                </div>
              )}
            </div>
          </div>
        )}

        {!batchData && !loading && (
          <div className="flex flex-col items-center justify-center py-40 text-slate-400 space-y-10 animate-in fade-in duration-1000">
            <div className="relative scale-125">
              <div className="p-12 bg-white rounded-full shadow-2xl border border-slate-100 animate-pulse-slow">
                 <Layers className="w-20 h-20 text-blue-100" />
              </div>
              <div className="absolute -bottom-3 -right-3 bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-200 ring-4 ring-white">
                 <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">基准评测引擎就绪</h3>
              <p className="text-base font-bold text-slate-400 max-w-lg mx-auto leading-relaxed">配置您的自定义 REST API 评测引擎或使用内置 Gemini AI。支持 OpenAPI 规格，支持地理字典层级深度校验。</p>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-16 px-6 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">
           <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-slate-100 rounded-lg shadow-inner flex items-center justify-center">
                <Layers className="w-4 h-4 text-slate-300" />
              </div>
              <p>© 2024 MGEO EVALUATOR. 开放引擎与多级字典评测系统.</p>
           </div>
           <div className="flex gap-16">
             <a href="#" className="hover:text-blue-600 transition-colors">接入规格文档</a>
             <a href="#" className="hover:text-blue-600 transition-colors">关于 MGeo 算法</a>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
