/**
 * AI 服务层 - 调用 Gemini OCR 和 DeepSeek 评分
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';

interface OCRResult {
  students: {
    name: string;
    student_id?: string;
    pages: {
      page_index: number;
      type: string;
      questions: {
        question_id: string;
        student_answer: string;
        ocr_confidence: number;
      }[];
    }[];
    raw_text: string;
  }[];
  total_images: number;
}

interface GradingResult {
  students: {
    name: string;
    total_score: number;
    max_score: number;
    score_rate: number;
    questions: {
      question_id: string;
      ai_score: number;
      max_score: number;
      is_correct: boolean | null;
      error_type?: string;
      feedback?: string;
    }[];
    score_breakdown: {
      current_rate: number;
      gap_a: { points: number; description: string };
      gap_b: { points: number; description: string };
    };
    error_path?: {
      breakdown_point: string;
      description: string;
    };
  }[];
  class_analysis?: any;
  improvement_plan?: any;
}

/**
 * 将图片文件转换为 Base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // 移除 data:image/xxx;base64, 前缀
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * 使用 Gemini 进行 OCR 识别
 */
export async function performOCR(imageFiles: File[]): Promise<OCRResult> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 未配置');
  }

  // 转换所有图片为 base64
  const imageContents = await Promise.all(
    imageFiles.map(async (file) => ({
      inline_data: {
        mime_type: file.type || 'image/jpeg',
        data: await fileToBase64(file),
      },
    }))
  );

  const prompt = `你是一个专业的试卷扫描专家。请分析这组试卷图片：

1. 识别每张图片顶部的姓名/学号（如果有的话）
2. 判断每张图是[正面]、[反面]还是[续页]
3. 提取所有手写和印刷文字内容
4. 识别每道题目的题号和学生作答内容
5. 特别注意：如果看到空白答案或未作答的题目，请标记为"未作答"

请输出严格的JSON格式：
{
    "students": [
        {
            "name": "学生姓名（如无法识别则为'未知学生'）",
            "student_id": "学号",
            "pages": [
                {
                    "page_index": 1,
                    "type": "front/back/continuation",
                    "questions": [
                        {
                            "question_id": "题号",
                            "student_answer": "学生作答内容（空白则为'未作答'）",
                            "ocr_confidence": 0.95
                        }
                    ]
                }
            ],
            "raw_text": "完整的识别文本"
        }
    ],
    "total_images": ${imageFiles.length}
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }, ...imageContents],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API 错误: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // 提取 JSON
    if (resultText.includes('```json')) {
      resultText = resultText.split('```json')[1].split('```')[0];
    } else if (resultText.includes('```')) {
      resultText = resultText.split('```')[1].split('```')[0];
    }

    return JSON.parse(resultText.trim());
  } catch (error) {
    console.error('OCR 失败:', error);
    throw error;
  }
}

/**
 * 使用 DeepSeek 进行智能评分
 */
export async function performGrading(
  ocrResult: OCRResult,
  standardAnswer: string,
  config: { subject: string; totalScore: number; questions: any[] }
): Promise<GradingResult> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY 未配置');
  }

  const prompt = `你是一位经验丰富的特级教师，同时也是教育诊断专家。请根据以下识别出的学生答卷内容和标准答案进行深度诊断分析：

【考试配置】
科目: ${config.subject}
总分: ${config.totalScore}
题型分布: ${JSON.stringify(config.questions)}

【标准答案】
${standardAnswer || '请根据学生作答情况进行客观评估，如果明显空白或未作答则给0分'}

【学生答卷OCR结果】
${JSON.stringify(ocrResult, null, 2)}

【重要评分规则】
1. 如果学生答案为"未作答"、空白或明显没有内容，该题必须给0分
2. 如果答案与标准答案完全不符，给0分
3. 只有答案正确或部分正确才能得分
4. 严格按照踩点给分原则评分

请输出严格的JSON格式：
{
    "students": [
        {
            "name": "学生姓名",
            "total_score": 实际得分数字,
            "max_score": ${config.totalScore},
            "score_rate": 得分率小数,
            "questions": [
                {
                    "question_id": "题号",
                    "ai_score": 该题得分,
                    "max_score": 该题满分,
                    "is_correct": true/false/null,
                    "error_type": "错误类型（如有）",
                    "feedback": "评分反馈"
                }
            ],
            "score_breakdown": {
                "current_rate": 当前得分率百分比,
                "gap_a": {
                    "points": 短期可提分数,
                    "description": "3天内可追回的失分"
                },
                "gap_b": {
                    "points": 冲刺可提分数,
                    "description": "14天可攻克的失分"
                }
            },
            "error_path": {
                "breakdown_point": "主要掉分环节",
                "description": "掉分路径描述"
            }
        }
    ],
    "class_analysis": {
        "average_score": 班级平均分,
        "weak_points": [{"topic": "薄弱点", "error_rate": 错误率}]
    }
}`;

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个精准教育诊断专家，擅长分析学生答卷并给出客观准确的评分。对于空白或未作答的题目，必须给0分。',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`DeepSeek API 错误: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content || '';

    return JSON.parse(resultText);
  } catch (error) {
    console.error('评分失败:', error);
    throw error;
  }
}

/**
 * 学生卷宗对象定义
 */
export interface StudentDossier {
  id: string;
  studentName: string;
  studentId?: string;
  confidence: number;
  images: {
    file: File;
    fileName: string;
    pageType: 'front' | 'back' | 'continuation' | 'unknown';
    pageIndex: number;
    questionNumbers: string[];
    thumbnail?: string;
  }[];
  status: 'auto' | 'manual' | 'confirmed';
  createdAt: Date;
}

export interface PreClassificationResult {
  dossiers: StudentDossier[];
  unclassifiedImages: {
    file: File;
    fileName: string;
    reason: string;
  }[];
  statistics: {
    totalImages: number;
    classifiedImages: number;
    studentCount: number;
    avgConfidence: number;
  };
}

/**
 * 使用 Gemini 1.5 Flash 进行智能预归类
 * 通过姓名识别与题号逻辑链将图片归并为'学生卷宗对象'
 */
export async function performPreClassification(
  imageFiles: File[]
): Promise<PreClassificationResult> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 未配置');
  }

  // 转换所有图片为 base64 并创建缩略图
  const imageContents = await Promise.all(
    imageFiles.map(async (file, index) => ({
      index,
      fileName: file.name,
      inline_data: {
        mime_type: file.type || 'image/jpeg',
        data: await fileToBase64(file),
      },
    }))
  );

  const prompt = `你是一个智能试卷预分类专家。请分析这组 ${imageFiles.length} 张试卷图片，将它们按学生归类。

【核心任务】
1. **姓名识别**: 在每张图片的顶部区域寻找学生姓名（可能是手写或打印）
2. **题号识别**: 识别每张图片中出现的题号（如"1."、"第2题"、"(3)"等）
3. **页面类型判断**: 判断每张图是正面(front)、反面(back)还是续页(continuation)
4. **逻辑链建立**: 通过以下规则将图片归并为同一学生：
   - 相同姓名的图片属于同一学生
   - 题号连续的图片可能属于同一学生（如1-5题和6-10题）
   - 正面和反面应配对

【输出格式】
请输出严格的JSON格式：
{
    "classifications": [
        {
            "student_name": "学生姓名（无法识别则为null）",
            "student_id": "学号（如有）",
            "confidence": 0.95,
            "pages": [
                {
                    "image_index": 0,
                    "page_type": "front/back/continuation/unknown",
                    "page_order": 1,
                    "question_numbers": ["1", "2", "3"],
                    "name_detected": "检测到的姓名",
                    "match_reason": "匹配原因说明"
                }
            ]
        }
    ],
    "unclassified": [
        {
            "image_index": 2,
            "reason": "无法识别学生信息且题号无连续性"
        }
    ],
    "analysis_notes": "整体分析说明"
}

【图片列表】
${imageContents.map((img, i) => `图片${i}: ${img.fileName}`).join('\n')}

请仔细分析每张图片并建立学生-卷面的对应关系。`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                ...imageContents.map((img) => ({ inline_data: img.inline_data })),
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API 错误: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // 提取 JSON
    if (resultText.includes('```json')) {
      resultText = resultText.split('```json')[1].split('```')[0];
    } else if (resultText.includes('```')) {
      resultText = resultText.split('```')[1].split('```')[0];
    }

    const aiResult = JSON.parse(resultText.trim());

    // 转换为 StudentDossier 格式
    const dossiers: StudentDossier[] = aiResult.classifications.map(
      (classification: any, idx: number) => ({
        id: `dossier-${Date.now()}-${idx}`,
        studentName: classification.student_name || `未知学生 ${idx + 1}`,
        studentId: classification.student_id,
        confidence: classification.confidence || 0.5,
        images: classification.pages.map((page: any) => ({
          file: imageFiles[page.image_index],
          fileName: imageFiles[page.image_index]?.name || `image-${page.image_index}`,
          pageType: page.page_type,
          pageIndex: page.page_order,
          questionNumbers: page.question_numbers || [],
        })),
        status: classification.confidence > 0.8 ? 'auto' : 'manual',
        createdAt: new Date(),
      })
    );

    const unclassifiedImages = (aiResult.unclassified || []).map((item: any) => ({
      file: imageFiles[item.image_index],
      fileName: imageFiles[item.image_index]?.name || `image-${item.image_index}`,
      reason: item.reason,
    }));

    const classifiedCount = dossiers.reduce((sum, d) => sum + d.images.length, 0);

    return {
      dossiers,
      unclassifiedImages,
      statistics: {
        totalImages: imageFiles.length,
        classifiedImages: classifiedCount,
        studentCount: dossiers.length,
        avgConfidence:
          dossiers.length > 0
            ? dossiers.reduce((sum, d) => sum + d.confidence, 0) / dossiers.length
            : 0,
      },
    };
  } catch (error) {
    console.error('预归类失败:', error);
    throw error;
  }
}

/**
 * 完整的批改流程
 */
export async function processExam(
  imageFiles: File[],
  standardAnswer: string,
  config: { subject: string; totalScore: number; questions: any[] }
): Promise<{
  ocrResult: OCRResult;
  gradingResult: GradingResult;
}> {
  // Step 1: OCR 识别
  const ocrResult = await performOCR(imageFiles);

  // Step 2: 智能评分
  const gradingResult = await performGrading(ocrResult, standardAnswer, config);

  return { ocrResult, gradingResult };
}

/**
 * 变式题接口定义
 */
export interface VariantQuestion {
  type: 'numerical' | 'contextual' | 'inverse';
  typeName: string;
  question: string;
  answer: string;
  analysis: string;
  difficulty: number;
}

export interface VariantQuestionsResult {
  originalQuestion: string;
  diagnosis: string;
  variants: VariantQuestion[];
}

/**
 * 使用 DeepSeek 生成变式题
 */
export async function generateVariantQuestions(
  originalQuestion: string,
  diagnosis: string,
  knowledgePoint?: string
): Promise<VariantQuestionsResult> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY 未配置');
  }

  const prompt = `你是一位资深数学命题专家。请根据以下原题和诊断信息，生成3道变式题用于巩固练习。

【原题】
${originalQuestion}

【诊断信息】
${diagnosis}

${knowledgePoint ? `【知识点】\n${knowledgePoint}` : ''}

【变式要求】
请生成以下3种类型的变式题：

1. **变式1（数值变式）**：保持题目结构和解法不变，仅改变数值参数
2. **变式2（情境变式）**：更换应用场景或问题背景，但保持核心数学逻辑相同
3. **变式3（逆向变式）**：将已知条件和求解目标互换，考查逆向思维

【输出格式】
请输出严格的JSON格式，数学公式使用LaTeX语法（用$...$包裹行内公式，用$$...$$包裹独立公式）：
{
    "variants": [
        {
            "type": "numerical",
            "typeName": "数值变式",
            "question": "题目内容（支持LaTeX）",
            "answer": "标准答案（支持LaTeX）",
            "analysis": "解题思路和步骤（支持LaTeX）",
            "difficulty": 0.7
        },
        {
            "type": "contextual",
            "typeName": "情境变式",
            "question": "题目内容",
            "answer": "标准答案",
            "analysis": "解题思路和步骤",
            "difficulty": 0.75
        },
        {
            "type": "inverse",
            "typeName": "逆向变式",
            "question": "题目内容",
            "answer": "标准答案",
            "analysis": "解题思路和步骤",
            "difficulty": 0.8
        }
    ]
}

注意：
1. 难度值范围0-1，原题难度约0.6-0.7
2. 确保每道变式题的数学表达式语法正确
3. 解析要详细，包含关键步骤`;

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的数学命题专家，擅长设计变式题帮助学生巩固薄弱知识点。输出的数学公式使用LaTeX语法。',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`DeepSeek API 错误: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content || '';
    const result = JSON.parse(resultText);

    return {
      originalQuestion,
      diagnosis,
      variants: result.variants || [],
    };
  } catch (error) {
    console.error('变式题生成失败:', error);
    throw error;
  }
}
