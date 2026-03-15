// @ts-nocheck
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ChevronDown, ChevronUp, CheckCircle,
  RefreshCw, Loader2, BookOpen, Lightbulb, Target
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { generateVariantQuestions, VariantQuestion, VariantQuestionsResult } from '../services/aiService';

interface VariantQuestionsProps {
  originalQuestion: string;
  diagnosis: string;
  knowledgePoint?: string;
  onClose?: () => void;
}

// LaTeX 渲染组件 - 解析文本中的 LaTeX 公式
function LatexRenderer({ text }: { text: string }) {
  if (!text) return null;

  // 分割文本，识别 LaTeX 公式
  const parts: { type: 'text' | 'inline' | 'block'; content: string }[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // 先检查块级公式 $$...$$
    const blockMatch = remaining.match(/^\$\$([\s\S]*?)\$\$/);
    if (blockMatch) {
      parts.push({ type: 'block', content: blockMatch[1].trim() });
      remaining = remaining.slice(blockMatch[0].length);
      continue;
    }

    // 检查行内公式 $...$
    const inlineMatch = remaining.match(/^\$([^$]+)\$/);
    if (inlineMatch) {
      parts.push({ type: 'inline', content: inlineMatch[1].trim() });
      remaining = remaining.slice(inlineMatch[0].length);
      continue;
    }

    // 查找下一个公式的位置
    const nextBlock = remaining.indexOf('$$');
    const nextInline = remaining.indexOf('$');
    let nextFormula = -1;

    if (nextBlock !== -1 && nextInline !== -1) {
      nextFormula = Math.min(nextBlock, nextInline);
    } else if (nextBlock !== -1) {
      nextFormula = nextBlock;
    } else if (nextInline !== -1) {
      nextFormula = nextInline;
    }

    if (nextFormula === -1) {
      // 没有更多公式，剩余都是普通文本
      parts.push({ type: 'text', content: remaining });
      break;
    } else if (nextFormula > 0) {
      // 公式前有普通文本
      parts.push({ type: 'text', content: remaining.slice(0, nextFormula) });
      remaining = remaining.slice(nextFormula);
    } else {
      // 避免无限循环
      parts.push({ type: 'text', content: remaining[0] });
      remaining = remaining.slice(1);
    }
  }

  return (
    <span className="latex-content">
      {parts.map((part, index) => {
        if (part.type === 'block') {
          return (
            <div key={index} className="my-2 text-center">
              <BlockMath math={part.content} />
            </div>
          );
        } else if (part.type === 'inline') {
          return <InlineMath key={index} math={part.content} />;
        } else {
          return <span key={index}>{part.content}</span>;
        }
      })}
    </span>
  );
}

// 难度指示器
function DifficultyIndicator({ difficulty }: { difficulty: number }) {
  const level = Math.round(difficulty * 5);
  const colors = ['bg-green-400', 'bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-gray-500 mr-1">难度:</span>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i <= level ? colors[Math.min(level - 1, 4)] : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

// 单个变式题卡片
function VariantCard({ variant, index }: { variant: VariantQuestion; index: number }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const typeIcons = {
    numerical: Target,
    contextual: BookOpen,
    inverse: Lightbulb,
  };

  const typeColors = {
    numerical: 'from-blue-500 to-cyan-500',
    contextual: 'from-amber-500 to-orange-500',
    inverse: 'from-purple-500 to-pink-500',
  };

  const Icon = typeIcons[variant.type] || Target;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl border border-gray-100 overflow-hidden"
    >
      {/* 题目头部 */}
      <div className={`bg-gradient-to-r ${typeColors[variant.type]} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            <span className="font-medium">{variant.typeName}</span>
          </div>
          <DifficultyIndicator difficulty={variant.difficulty} />
        </div>
      </div>

      {/* 题目内容 */}
      <div className="p-4">
        <div className="text-gray-800 leading-relaxed mb-4">
          <LatexRenderer text={variant.question} />
        </div>

        {/* 答案区域 */}
        <div className="space-y-2">
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="flex items-center gap-2 text-[#4F46E5] hover:text-[#4338CA] font-medium text-sm"
          >
            {showAnswer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showAnswer ? '隐藏答案' : '查看答案'}
          </button>

          <AnimatePresence>
            {showAnswer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-green-50 rounded-lg p-3 border border-green-200"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <div className="text-green-800">
                    <LatexRenderer text={variant.answer} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 解析区域 */}
        <div className="mt-3 space-y-2">
          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium text-sm"
          >
            {showAnalysis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showAnalysis ? '隐藏解析' : '查看解析'}
          </button>

          <AnimatePresence>
            {showAnalysis && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-amber-50 rounded-lg p-3 border border-amber-200"
              >
                <div className="text-amber-900 text-sm leading-relaxed">
                  <LatexRenderer text={variant.analysis} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function VariantQuestions({
  originalQuestion,
  diagnosis,
  knowledgePoint,
  onClose
}: VariantQuestionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VariantQuestionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await generateVariantQuestions(originalQuestion, diagnosis, knowledgePoint);
      setResult(data);
    } catch (err: any) {
      setError(err.message || '生成失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI 变式题生成</h3>
            <p className="text-sm text-gray-500">基于诊断结果智能生成巩固练习</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* 原题预览 */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
        <p className="text-xs text-gray-500 mb-2">原题</p>
        <p className="text-gray-800">{originalQuestion}</p>
      </div>

      {/* 诊断信息 */}
      <div className="bg-red-50 rounded-lg p-4 mb-6 border border-red-200">
        <p className="text-xs text-red-600 mb-2">诊断结果</p>
        <p className="text-red-800 text-sm">{diagnosis}</p>
      </div>

      {/* 生成按钮或结果 */}
      {!result ? (
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              AI 正在生成变式题...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              生成变式练习题
            </>
          )}
        </button>
      ) : (
        <div className="space-y-4">
          {/* 重新生成按钮 */}
          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex items-center gap-2 text-[#4F46E5] hover:text-[#4338CA] text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              重新生成
            </button>
          </div>

          {/* 变式题列表 */}
          <div className="grid gap-4">
            {result.variants.map((variant, index) => (
              <VariantCard key={index} variant={variant} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
