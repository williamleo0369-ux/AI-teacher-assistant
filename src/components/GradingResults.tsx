// @ts-nocheck
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, AlertTriangle, User, FileText,
  ChevronRight, Edit3, Save, Loader2, Brain, Sparkles
} from 'lucide-react';
import { processExam, fileToBase64 } from '../services/aiService';

// 从图片文件中使用 Gemini 提取标准答案文本
async function extractStandardAnswerFromFile(file: File): Promise<string> {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!GEMINI_API_KEY) {
    return '';
  }

  const base64 = await fileToBase64(file);
  const prompt = `请仔细阅读这张标准答案图片，提取所有题目的正确答案。

请按以下格式输出：
题号. 标准答案

例如：
1. A
2. B
3. 答案内容...

请确保提取完整、准确的所有题目答案。`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: file.type || 'image/jpeg', data: base64 } }
            ]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
        })
      }
    );

    if (!response.ok) return '';
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch {
    return '';
  }
}

interface GradingResultsProps {
  examData: {
    files: File[];
    config: {
      subject: string;
      totalScore: number;
      questions: any[];
    };
    standardAnswer?: string;
    standardAnswerFile?: File;  // 支持标准答案文件
  } | null;
  onComplete: (results: any) => void;
}

export default function GradingResults({ examData, onComplete }: GradingResultsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'ocr' | 'grading' | 'analysis'>('ocr');
  const [progress, setProgress] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [editingScore, setEditingScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    if (!examData || !examData.files || examData.files.length === 0 || hasProcessed) return;

    const processExamData = async () => {
      setIsProcessing(true);
      setError(null);
      setProgress(0);

      try {
        // Stage 1: OCR
        setProcessingStage('ocr');
        setProgress(10);

        // 如果有标准答案文件，先提取答案文本
        let standardAnswerText = examData.standardAnswer || '';
        if (examData.standardAnswerFile) {
          setProgress(5);
          standardAnswerText = await extractStandardAnswerFromFile(examData.standardAnswerFile);
          console.log('提取的标准答案:', standardAnswerText);
        }

        // 模拟进度
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 5, 30));
        }, 500);

        const { ocrResult, gradingResult } = await processExam(
          examData.files,
          standardAnswerText,
          examData.config
        );

        clearInterval(progressInterval);
        setProgress(50);

        // Stage 2: Grading
        setProcessingStage('grading');
        setProgress(70);

        // Stage 3: Analysis
        setProcessingStage('analysis');
        setProgress(90);

        // 处理结果
        if (gradingResult.students && gradingResult.students.length > 0) {
          const processedStudents = gradingResult.students.map((student, index) => ({
            id: index + 1,
            name: student.name || `学生${index + 1}`,
            score: student.total_score,
            totalScore: student.max_score,
            scoreRate: student.score_rate,
            questions: student.questions || [],
            scoreBreakdown: student.score_breakdown,
            errorPath: student.error_path,
            status: 'completed'
          }));

          setStudents(processedStudents);

          // 设置第一个学生的题目详情
          if (processedStudents.length > 0 && processedStudents[0].questions) {
            setQuestions(processedStudents[0].questions);
            setSelectedStudent(1);
          }
        }

        setProgress(100);
        setHasProcessed(true);

        setTimeout(() => {
          setIsProcessing(false);
          onComplete({ students: gradingResult.students, classAnalysis: gradingResult.class_analysis });
        }, 500);

      } catch (err: any) {
        console.error('处理失败:', err);
        setError(err.message || '处理失败，请检查API密钥配置');
        setIsProcessing(false);
      }
    };

    processExamData();
  }, [examData, hasProcessed]);

  // 当选择学生变化时，更新题目列表
  useEffect(() => {
    if (selectedStudent && students.length > 0) {
      const student = students.find(s => s.id === selectedStudent);
      if (student && student.questions) {
        setQuestions(student.questions);
      }
    }
  }, [selectedStudent, students]);

  if (!examData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-medium text-gray-600 mb-2">暂无批改数据</h3>
        <p className="text-gray-500">请先上传试卷图片</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <XCircle className="w-16 h-16 text-red-400 mb-4" />
        <h3 className="text-xl font-medium text-red-600 mb-2">处理失败</h3>
        <p className="text-gray-500 mb-4 text-center max-w-md">{error}</p>
        <p className="text-sm text-gray-400 mb-4">
          请确保已在 .env 文件中配置 VITE_GEMINI_API_KEY 和 VITE_DEEPSEEK_API_KEY
        </p>
        <button
          onClick={() => {
            setError(null);
            setHasProcessed(false);
          }}
          className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA]"
        >
          重试
        </button>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-2xl flex items-center justify-center mb-6"
        >
          {processingStage === 'ocr' && <Sparkles className="w-10 h-10 text-white" />}
          {processingStage === 'grading' && <Edit3 className="w-10 h-10 text-white" />}
          {processingStage === 'analysis' && <Brain className="w-10 h-10 text-white" />}
        </motion.div>

        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {processingStage === 'ocr' && 'Gemini 正在扫描识别...'}
          {processingStage === 'grading' && 'DeepSeek 正在智能评分...'}
          {processingStage === 'analysis' && '正在生成诊断报告...'}
        </h3>
        <p className="text-gray-500 mb-6">
          {processingStage === 'ocr' && '提取手写内容，识别学生信息'}
          {processingStage === 'grading' && '踩点给分，分析解题步骤'}
          {processingStage === 'analysis' && '定位掉分卡点，计算提分潜力'}
        </p>

        <div className="w-80 h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">{Math.round(progress)}%</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-medium text-gray-600 mb-2">未识别到学生数据</h3>
        <p className="text-gray-500">请确保上传的图片清晰且包含答题内容</p>
      </div>
    );
  }

  const averageScore = students.length > 0
    ? (students.reduce((sum, s) => sum + s.score, 0) / students.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">智能批改结果</h2>
          <p className="text-gray-600 mt-1">共 {students.length} 份试卷已完成批改</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">班级平均分</p>
            <p className="text-2xl font-bold text-[#4F46E5]">{averageScore}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Student List */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">学生列表</h3>
          <div className="space-y-2">
            {students.map((student) => (
              <button
                key={student.id}
                onClick={() => setSelectedStudent(student.id)}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg transition-all
                  ${selectedStudent === student.id
                    ? 'bg-[#4F46E5] text-white'
                    : 'hover:bg-gray-50'
                  }
                `}
              >
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${selectedStudent === student.id
                    ? 'bg-white/20 text-white'
                    : 'bg-[#4F46E5]/10 text-[#4F46E5]'
                  }
                `}>
                  {student.name[0]}
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-medium ${selectedStudent === student.id ? 'text-white' : 'text-gray-900'}`}>
                    {student.name}
                  </p>
                  <p className={`text-sm ${selectedStudent === student.id ? 'text-white/70' : 'text-gray-500'}`}>
                    {student.score}/{student.totalScore}分
                  </p>
                </div>
                <ChevronRight className={`w-5 h-5 ${selectedStudent === student.id ? 'text-white' : 'text-gray-400'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="col-span-2 space-y-4">
          {selectedStudent ? (
            <>
              {/* Student Info */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#4F46E5] rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {students.find(s => s.id === selectedStudent)?.name[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {students.find(s => s.id === selectedStudent)?.name}
                      </h3>
                      <p className="text-gray-500">试卷批改结果</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${
                      (students.find(s => s.id === selectedStudent)?.score || 0) === 0
                        ? 'text-red-500'
                        : 'text-[#4F46E5]'
                    }`}>
                      {students.find(s => s.id === selectedStudent)?.score}
                    </p>
                    <p className="text-sm text-gray-500">/ {students.find(s => s.id === selectedStudent)?.totalScore}分</p>
                  </div>
                </div>

                {/* Score Breakdown */}
                {(() => {
                  const student = students.find(s => s.id === selectedStudent);
                  const scoreBreakdown = student?.scoreBreakdown;
                  return (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {scoreBreakdown?.current_rate || Math.round((student?.score / student?.totalScore) * 100) || 0}%
                        </p>
                        <p className="text-sm text-green-700">当前得分率</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-amber-600">
                          +{scoreBreakdown?.gap_a?.points || 0}分
                        </p>
                        <p className="text-sm text-amber-700">短期可提分</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          +{scoreBreakdown?.gap_b?.points || 0}分
                        </p>
                        <p className="text-sm text-blue-700">冲刺可提分</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Question Details */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">题目详情</h4>
                <div className="space-y-3">
                  {questions.length > 0 ? questions.map((q, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 rounded-lg bg-gray-50"
                    >
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center
                        ${q.is_correct === true ? 'bg-green-100' : q.is_correct === false ? 'bg-red-100' : 'bg-amber-100'}
                      `}>
                        {q.is_correct === true && <CheckCircle className="w-5 h-5 text-green-600" />}
                        {q.is_correct === false && <XCircle className="w-5 h-5 text-red-600" />}
                        {q.is_correct === null && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">第{q.question_id}题</p>
                        <p className="text-sm text-gray-500">{q.feedback || '暂无反馈'}</p>
                      </div>
                      {q.error_type && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                          {q.error_type}
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        {editingScore === index ? (
                          <>
                            <input
                              type="number"
                              defaultValue={q.ai_score}
                              className="w-16 px-2 py-1 border rounded text-center"
                            />
                            <button
                              onClick={() => setEditingScore(null)}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className={`font-semibold ${q.ai_score === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                              {q.ai_score}/{q.max_score}
                            </span>
                            <button
                              onClick={() => setEditingScore(index)}
                              className="p-1 text-gray-400 hover:text-[#4F46E5] hover:bg-[#4F46E5]/10 rounded"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-center py-4">暂无题目详情</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-12 flex flex-col items-center justify-center">
              <User className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500">请选择左侧学生查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
