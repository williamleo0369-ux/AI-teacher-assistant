// @ts-nocheck
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image, X, FileText, Users, CheckCircle, AlertCircle, Loader2, Sparkles, Layers } from 'lucide-react';
import axios from 'axios';
import StudentDossierManager from './StudentDossierManager';
import { StudentDossier } from '../services/aiService';

interface ExamUploadProps {
  onUpload: (data: any) => void;
}

interface ExamConfig {
  subject: string;
  totalScore: number;
  questions: { type: string; score: number; count: number }[];
}

export default function ExamUpload({ onUpload }: ExamUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [standardAnswer, setStandardAnswer] = useState<File | null>(null);
  const [config, setConfig] = useState<ExamConfig>({
    subject: '高中英语',
    totalScore: 150,
    questions: [
      { type: '听力选择', score: 1.5, count: 20 },
      { type: '阅读理解', score: 2.5, count: 15 },
      { type: '完形填空', score: 1.5, count: 20 },
      { type: '语法填空', score: 1.5, count: 10 },
      { type: '短文改错', score: 1, count: 10 },
      { type: '书面表达', score: 25, count: 1 },
    ],
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDossierManager, setShowDossierManager] = useState(false);
  const [confirmedDossiers, setConfirmedDossiers] = useState<StudentDossier[] | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 启动智能归类流程
  const handleStartClassification = () => {
    if (files.length === 0) return;
    setShowDossierManager(true);
  };

  // 卷宗归类确认回调
  const handleDossierConfirm = (dossiers: StudentDossier[]) => {
    setShowDossierManager(false);
    setConfirmedDossiers(dossiers);
  };

  // 开始批改（使用已确认的卷宗）
  const handleSubmit = async () => {
    if (!confirmedDossiers || confirmedDossiers.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 20;
      });
    }, 100);

    setTimeout(() => {
      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsUploading(false);

      // 传递学生卷宗数据给批改组件
      onUpload({
        dossiers: confirmedDossiers,
        files: confirmedDossiers.flatMap(d => d.images.map(img => img.file)),
        config: config,
        standardAnswerFile: standardAnswer  // 传递标准答案文件
      });
    }, 500);
  };

  // 旧模式：直接上传不归类
  const handleDirectSubmit = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 20;
      });
    }, 100);

    setTimeout(() => {
      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsUploading(false);

      onUpload({
        files: files,
        config: config,
        standardAnswerFile: standardAnswer  // 传递标准答案文件
      });
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">批量上传试卷</h2>
        <p className="text-gray-600 mt-1">支持多张试卷图片一次性上传，AI自动识别归档</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Upload Area */}
        <div className="col-span-2 space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
              ${isDragActive
                ? 'border-[#4F46E5] bg-[#4F46E5]/5'
                : 'border-gray-200 hover:border-[#4F46E5]/50 hover:bg-gray-50'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className={`
                w-16 h-16 rounded-2xl flex items-center justify-center transition-colors
                ${isDragActive ? 'bg-[#4F46E5]' : 'bg-[#4F46E5]/10'}
              `}>
                <Upload className={`w-8 h-8 ${isDragActive ? 'text-white' : 'text-[#4F46E5]'}`} />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive ? '释放以上传文件' : '拖拽试卷图片到此处'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  或点击选择文件 · 支持 JPG、PNG、WebP 格式
                </p>
              </div>
            </div>
          </div>

          {/* File Preview */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-xl border border-gray-100 p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Image className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">已选择 {files.length} 张图片</span>
                  </div>
                  <button
                    onClick={() => setFiles([])}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    清空全部
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {files.map((file, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative group"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg truncate">
                        {file.name}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Standard Answer Upload */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-[#4F46E5]" />
              <span className="font-medium text-gray-900">标准答案（可选）</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              上传标准答案图片，AI将自动提取题目结构及各题分值
            </p>

            {/* 已上传的标准答案预览 */}
            {standardAnswer ? (
              <div className="mb-3">
                <div className="relative inline-block">
                  <img
                    src={URL.createObjectURL(standardAnswer)}
                    alt="标准答案预览"
                    className="h-32 w-auto rounded-lg border border-gray-200 object-contain"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setStandardAnswer(null);
                      // 重置 input
                      const input = document.getElementById('standard-answer') as HTMLInputElement;
                      if (input) input.value = '';
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  已上传: {standardAnswer.name}
                </p>
              </div>
            ) : null}

            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setStandardAnswer(file);
                }
              }}
              className="hidden"
              id="standard-answer"
            />
            <label
              htmlFor="standard-answer"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                standardAnswer
                  ? 'bg-green-100 hover:bg-green-200 text-green-700'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Upload className="w-4 h-4" />
              {standardAnswer ? '重新选择' : '选择文件'}
            </label>
          </div>
        </div>

        {/* Config Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">试卷配置</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">科目</label>
                <select
                  value={config.subject}
                  onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                >
                  <option>高中英语</option>
                  <option>高中数学</option>
                  <option>高中物理</option>
                  <option>高中化学</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">总分</label>
                <input
                  type="number"
                  value={config.totalScore}
                  onChange={(e) => setConfig({ ...config, totalScore: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#4F46E5]" />
              <h3 className="font-semibold text-gray-900">题型分布</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {config.questions.map((q, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-gray-700">{q.type}</span>
                  <span className="text-gray-500">{q.count}题</span>
                  <span className="text-[#4F46E5] font-medium">{q.score * q.count}分</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
              <span className="font-medium text-gray-900">总计</span>
              <span className="font-bold text-[#4F46E5]">{config.totalScore}分</span>
            </div>
          </div>

          {/* 已确认的卷宗预览 */}
          {confirmedDossiers && confirmedDossiers.length > 0 && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">
                  已归类 {confirmedDossiers.length} 位学生
                </span>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {confirmedDossiers.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-green-700">{d.studentName}</span>
                    <span className="text-green-600">{d.images.length} 张图</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setConfirmedDossiers(null);
                  setShowDossierManager(true);
                }}
                className="mt-3 text-sm text-green-600 hover:text-green-700"
              >
                重新归类
              </button>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="space-y-3">
            {/* 智能归类按钮 */}
            {!confirmedDossiers && (
              <button
                onClick={handleStartClassification}
                disabled={files.length === 0 || isUploading}
                className={`
                  w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
                  ${files.length > 0 && !isUploading
                    ? 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white hover:opacity-90'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                <Sparkles className="w-5 h-5" />
                AI 智能归类
              </button>
            )}

            {/* 开始批改按钮 */}
            <button
              onClick={confirmedDossiers ? handleSubmit : handleDirectSubmit}
              disabled={(confirmedDossiers ? confirmedDossiers.length === 0 : files.length === 0) || isUploading}
              className={`
                w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
                ${((confirmedDossiers ? confirmedDossiers.length > 0 : files.length > 0) && !isUploading)
                  ? 'bg-[#4F46E5] text-white hover:bg-[#4338CA]'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  上传中 {uploadProgress}%
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {confirmedDossiers ? `批改 ${confirmedDossiers.length} 份试卷` : '跳过归类直接批改'}
                </>
              )}
            </button>
          </div>

          {/* Tips */}
          <div className="bg-amber-50 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">温馨提示</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700">
                  <li>图片清晰度影响识别准确率</li>
                  <li>点击"AI 智能归类"自动识别学生</li>
                  <li>支持拖拽合并正反面图片</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 智能归类管理器 */}
      {showDossierManager && (
        <StudentDossierManager
          files={files}
          onConfirm={handleDossierConfirm}
          onCancel={() => setShowDossierManager(false)}
        />
      )}
    </div>
  );
}
