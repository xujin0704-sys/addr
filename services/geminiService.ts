
import { GoogleGenAI, Type } from "@google/genai";
import { BatchComparisonData, AIConfig, ExternalSegmentation } from "../types";

export const evaluateBatchSegmentation = async (
  texts: string[], 
  config: AIConfig,
  externalResults?: ExternalSegmentation[]
): Promise<BatchComparisonData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { model, temperature, weights, granularityLevel, levelDefinitions } = config;

  const rawDefinitions = levelDefinitions[granularityLevel];
  const formattedDefinition = "包含以下详细层级字典定义（层级ID | 名称 | 别名 | 建议词性 | 示例 | 说明）：\n" + 
    rawDefinitions.map((d, i) => `${i + 1}. [${d.id}] ${d.name} (${d.alias}) | POS: ${d.pos} | 示例: ${d.example} | 说明: ${d.description}`).join('\n');

  const granularityInstruction = `采用【${granularityLevel}】标准：${formattedDefinition}`;

  // Prepare external results context for the prompt
  const externalContext = externalResults ? `
    以下是外部接口提供的初步分词结果（请优先评估这些结果）：
    ${externalResults.map((res, i) => {
      const tradDisplay = res.traditionalDetailed 
        ? res.traditionalDetailed.map(w => `${w.text}^${w.levelId}`).join(' | ')
        : (res.traditionalWords?.join(' | ') || '未提供');
      
      const mgeoDisplay = res.mgeoDetailed
        ? res.mgeoDetailed.map(w => `${w.text}^${w.levelId}`).join(' | ')
        : (res.mgeoWords?.join(' | ') || '未提供');

      return `
      样本 ${i + 1}:
      传统分词 (old): ${tradDisplay}
      MGeo分词 (new): ${mgeoDisplay}
      `;
    }).join('\n')}
    
    注意：外部结果中 "text^id" 格式的 id 对应字典定义中的“层级ID”。如果 id 为 18 或 24 等，请核对是否符合相应的层级定义。
  ` : '';

  const systemInstruction = `你是一位资深的中文 NLP 语言学家，专门从事地理空间实体识别 (Geo-NER)。你的任务是对一组文本进行“传统分词”与“MGeo 分词”的对比分析。

  ${granularityInstruction}

  ${externalContext}

  重要要求：
  1. 如果提供了外部接口结果，请基于这些分词进行深入的语言学评估。
  2. 对于 MGeo 分词，必须严格映射到上述字典中的层级标准，特别是考虑层级说明和示例。
  3. 如果外部结果中带有 ^id 标识，请验证该 ID 是否正确反映了其在字典中的层级（levelIndex）。
  4. levelIndex 属性应为该词语对应的层级在字典中的 1-based 索引。
  5. categoryName 属性应使用字典中该层级对应的“别名”。
  6. pos 属性应参考字典中建议的“词性”。
  
  评分原则：
  - 基于指定的标准权重（Recall: ${weights.recall}%, Precision: ${weights.precision}%, Accuracy: ${weights.accuracy}%, Consistency: ${weights.consistency}%）计算最终评分。
  - 重点核对 MGeo 是否符合其层级定义中的“说明”和“典型示例”。
  
  分析内容必须使用中文。`;

  const prompt = `
    对比并评估以下文本的分词效果：
    ${texts.map((t, i) => `文本 ${i + 1}: "${t}"`).join('\n')}

    要求：
    1. 为每条文本生成详细的分词对象列表（包含文本、词性、层级索引、别名、置信度）。
    2. 基于提供的详细字典标准，为每条文本的两种方法分别进行加权打分 (0-100)。
    3. 汇总整个批量的表现，计算平均分并提供核心洞察。
  `;

  const wordSchema = {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING },
      pos: { type: Type.STRING },
      entity: { type: Type.STRING, nullable: true },
      granularity: { type: Type.STRING },
      confidence: { type: Type.NUMBER },
      levelIndex: { type: Type.NUMBER, nullable: true },
      categoryName: { type: Type.STRING, nullable: true }
    },
    required: ["text", "pos", "granularity", "confidence"]
  };

  const metricSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      score: { type: Type.NUMBER },
      reason: { type: Type.STRING }
    },
    required: ["name", "score", "reason"]
  };

  const finalReportSchema = {
    type: Type.OBJECT,
    properties: {
      overallScore: { type: Type.NUMBER },
      recall: metricSchema,
      precision: metricSchema,
      accuracy: metricSchema,
      consistency: metricSchema,
      pros: { type: Type.ARRAY, items: { type: Type.STRING } },
      cons: { type: Type.ARRAY, items: { type: Type.STRING } },
      suggestion: { type: Type.STRING }
    },
    required: ["overallScore", "recall", "precision", "accuracy", "consistency", "pros", "cons", "suggestion"]
  };

  const itemSchema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      input: { type: Type.STRING },
      traditional: {
        type: Type.OBJECT,
        properties: { words: { type: Type.ARRAY, items: wordSchema } },
        required: ["words"]
      },
      mgeo: {
        type: Type.OBJECT,
        properties: { words: { type: Type.ARRAY, items: wordSchema } },
        required: ["words"]
      },
      traditionalEval: finalReportSchema,
      mgeoEval: finalReportSchema
    },
    required: ["id", "input", "traditional", "mgeo", "traditionalEval", "mgeoEval"]
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      items: { type: Type.ARRAY, items: itemSchema },
      summary: {
        type: Type.OBJECT,
        properties: {
          traditionalAvgScore: { type: Type.NUMBER },
          mgeoAvgScore: { type: Type.NUMBER },
          totalItems: { type: Type.NUMBER },
          keyInsights: { type: Type.STRING }
        },
        required: ["traditionalAvgScore", "mgeoAvgScore", "totalItems", "keyInsights"]
      }
    },
    required: ["items", "summary"]
  };

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      temperature,
      responseMimeType: "application/json",
      responseSchema: responseSchema as any
    },
  });

  return JSON.parse(response.text || '{}');
};
