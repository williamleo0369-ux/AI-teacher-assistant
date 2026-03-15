// @ts-nocheck
import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  User, FileImage, CheckCircle, AlertTriangle, Loader2,
  Layers, Trash2, Plus, ChevronDown, ChevronUp, Merge,
  RotateCcw, Sparkles, GripVertical, X, Check, Edit3
} from 'lucide-react';
import {
  performPreClassification,
  StudentDossier,
  PreClassificationResult,
} from '../services/aiService';

interface StudentDossierManagerProps {
  files: File[];
  onConfirm: (dossiers: StudentDossier[]) => void;
  onCancel: () => void;
}

// 图片缩略图组件
function ImageThumbnail({ file, onClick }: { file: File; onClick?: () => void }) {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => setSrc(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [file]);

  return (
    <div
      onClick={onClick}
      className="w-16 h-20 rounded-lg overflow-hidden border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform"
    >
      {src ? (
        <img src={src} alt={file.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <FileImage className="w-6 h-6 text-gray-400" />
        </div>
      )}
    </div>
  );
}

// 页面类型标签
function PageTypeTag({ type }: { type: string }) {
  const config = {
    front: { label: '正面', color: 'bg-blue-100 text-blue-700' },
    back: { label: '反面', color: 'bg-green-100 text-green-700' },
    continuation: { label: '续页', color: 'bg-amber-100 text-amber-700' },
    unknown: { label: '未知', color: 'bg-gray-100 text-gray-700' },
  }[type] || { label: type, color: 'bg-gray-100 text-gray-700' };

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${config.color}`}>
      {config.label}
    </span>
  );
}

// 卷宗卡片组件 - 支持堆叠展示和拖拽
function DossierCard({
  dossier,
  isExpanded,
  onToggle,
  onEditName,
  onRemoveImage,
  onDrop,
  dragOverId,
  setDragOverId,
}: {
  dossier: StudentDossier;
  isExpanded: boolean;
  onToggle: () => void;
  onEditName: (name: string) => void;
  onRemoveImage: (imageIndex: number) => void;
  onDrop: (e: React.DragEvent, targetDossierId: string) => void;
  dragOverId: string | null;
  setDragOverId: (id: string | null) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(dossier.studentName);

  const handleSaveName = () => {
    onEditName(editName);
    setIsEditing(false);
  };

  const confidenceColor =
    dossier.confidence >= 0.8
      ? 'text-green-600'
      : dossier.confidence >= 0.5
      ? 'text-amber-600'
      : 'text-red-600';

  const statusBadge = {
    auto: { label: 'AI自动归类', color: 'bg-green-100 text-green-700', icon: Sparkles },
    manual: { label: '待确认', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
    confirmed: { label: '已确认', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  }[dossier.status];

  const StatusIcon = statusBadge.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white rounded-xl border-2 transition-all ${
        dragOverId === dossier.id
          ? 'border-[#4F46E5] ring-4 ring-[#4F46E5]/20'
          : 'border-gray-100 hover:border-gray-200'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOverId(dossier.id);
      }}
      onDragLeave={() => setDragOverId(null)}
      onDrop={(e) => onDrop(e, dossier.id)}
    >
      {/* 卡片头部 */}
      <div
        className="p-4 flex items-center gap-4 cursor-pointer"
        onClick={onToggle}
      >
        {/* 堆叠缩略图 */}
        <div className="relative w-20 h-24 flex-shrink-0">
          {dossier.images.slice(0, 3).map((img, idx) => (
            <div
              key={idx}
              className="absolute"
              style={{
                left: idx * 6,
                top: idx * 4,
                zIndex: 3 - idx,
                transform: `rotate(${(idx - 1) * 3}deg)`,
              }}
            >
              <ImageThumbnail file={img.file} />
            </div>
          ))}
          {dossier.images.length > 3 && (
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#4F46E5] rounded-full flex items-center justify-center text-white text-xs font-bold z-10">
              +{dossier.images.length - 3}
            </div>
          )}
        </div>

        {/* 学生信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isEditing ? (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-1 hover:bg-green-100 rounded text-green-600"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditName(dossier.studentName);
                    setIsEditing(false);
                  }}
                  className="p-1 hover:bg-red-100 rounded text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-gray-900">{dossier.studentName}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Edit3 className="w-3 h-3 text-gray-400" />
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">
              <Layers className="w-3 h-3 inline mr-1" />
              {dossier.images.length} 张图片
            </span>
            <span className={confidenceColor}>
              置信度: {Math.round(dossier.confidence * 100)}%
            </span>
          </div>
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${statusBadge.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusBadge.label}
            </span>
          </div>
        </div>

        {/* 展开/收起 */}
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* 展开详情 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-500 mb-3">拖拽图片可重新排序或移出</p>
              <div className="grid grid-cols-4 gap-3">
                {dossier.images.map((img, idx) => (
                  <motion.div
                    key={idx}
                    layout
                    draggable
                    onDragStart={(e) => {
                      (e as any).dataTransfer.setData(
                        'application/json',
                        JSON.stringify({
                          sourceDossierId: dossier.id,
                          imageIndex: idx,
                        })
                      );
                    }}
                    className="relative group"
                  >
                    <div className="aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 cursor-move">
                      <ImageThumbnail file={img.file} />
                    </div>
                    <div className="absolute top-1 left-1 flex items-center gap-1">
                      <PageTypeTag type={img.pageType} />
                    </div>
                    <button
                      onClick={() => onRemoveImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-1">
                      {img.questionNumbers.slice(0, 3).map((q, i) => (
                        <span key={i} className="text-[10px] bg-white/80 px-1 rounded">
                          Q{q}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// 未分类图片池
function UnclassifiedPool({
  images,
  onCreateDossier,
  onDragStart,
}: {
  images: { file: File; fileName: string; reason: string }[];
  onCreateDossier: (imageIndex: number) => void;
  onDragStart: (e: React.DragEvent, imageIndex: number) => void;
}) {
  if (images.length === 0) return null;

  return (
    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        <span className="font-medium text-amber-800">待分类图片</span>
        <span className="text-sm text-amber-600">({images.length} 张)</span>
      </div>
      <p className="text-sm text-amber-700 mb-4">
        将以下图片拖拽到对应学生卡片上进行合并，或点击创建新卷宗
      </p>
      <div className="flex flex-wrap gap-3">
        {images.map((img, idx) => (
          <motion.div
            key={idx}
            draggable
            onDragStart={(e) => onDragStart(e, idx)}
            className="relative group cursor-move"
          >
            <div className="w-20 h-24 rounded-lg overflow-hidden border-2 border-amber-300 hover:border-[#4F46E5]">
              <ImageThumbnail file={img.file} />
            </div>
            <button
              onClick={() => onCreateDossier(idx)}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#4F46E5] text-white text-xs px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
            >
              新建卷宗
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function StudentDossierManager({
  files,
  onConfirm,
  onCancel,
}: StudentDossierManagerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreClassificationResult | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // 执行预归类
  useEffect(() => {
    const classify = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await performPreClassification(files);
        setResult(data);
        // 自动展开第一个卷宗
        if (data.dossiers.length > 0) {
          setExpandedId(data.dossiers[0].id);
        }
      } catch (err: any) {
        setError(err.message || '预归类失败');
      } finally {
        setIsLoading(false);
      }
    };
    classify();
  }, [files]);

  // 编辑学生姓名
  const handleEditName = useCallback(
    (dossierId: string, newName: string) => {
      if (!result) return;
      setResult({
        ...result,
        dossiers: result.dossiers.map((d) =>
          d.id === dossierId ? { ...d, studentName: newName, status: 'confirmed' } : d
        ),
      });
    },
    [result]
  );

  // 从卷宗移除图片
  const handleRemoveImage = useCallback(
    (dossierId: string, imageIndex: number) => {
      if (!result) return;
      const dossier = result.dossiers.find((d) => d.id === dossierId);
      if (!dossier) return;

      const removedImage = dossier.images[imageIndex];
      const newImages = dossier.images.filter((_, i) => i !== imageIndex);

      if (newImages.length === 0) {
        // 卷宗为空，删除卷宗，图片移到未分类
        setResult({
          ...result,
          dossiers: result.dossiers.filter((d) => d.id !== dossierId),
          unclassifiedImages: [
            ...result.unclassifiedImages,
            {
              file: removedImage.file,
              fileName: removedImage.fileName,
              reason: '手动移出卷宗',
            },
          ],
        });
      } else {
        setResult({
          ...result,
          dossiers: result.dossiers.map((d) =>
            d.id === dossierId ? { ...d, images: newImages } : d
          ),
          unclassifiedImages: [
            ...result.unclassifiedImages,
            {
              file: removedImage.file,
              fileName: removedImage.fileName,
              reason: '手动移出卷宗',
            },
          ],
        });
      }
    },
    [result]
  );

  // 处理拖拽合并
  const handleDrop = useCallback(
    (e: React.DragEvent, targetDossierId: string) => {
      e.preventDefault();
      setDragOverId(null);

      if (!result) return;

      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) {
        // 可能是从未分类池拖拽
        const unclassifiedIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!isNaN(unclassifiedIndex) && result.unclassifiedImages[unclassifiedIndex]) {
          const img = result.unclassifiedImages[unclassifiedIndex];
          setResult({
            ...result,
            dossiers: result.dossiers.map((d) =>
              d.id === targetDossierId
                ? {
                    ...d,
                    images: [
                      ...d.images,
                      {
                        file: img.file,
                        fileName: img.fileName,
                        pageType: 'unknown',
                        pageIndex: d.images.length + 1,
                        questionNumbers: [],
                      },
                    ],
                    status: 'manual',
                  }
                : d
            ),
            unclassifiedImages: result.unclassifiedImages.filter(
              (_, i) => i !== unclassifiedIndex
            ),
          });
        }
        return;
      }

      const { sourceDossierId, imageIndex } = JSON.parse(dataStr);
      if (sourceDossierId === targetDossierId) return;

      const sourceDossier = result.dossiers.find((d) => d.id === sourceDossierId);
      if (!sourceDossier) return;

      const movedImage = sourceDossier.images[imageIndex];

      // 从源卷宗移除并添加到目标卷宗
      const newDossiers = result.dossiers
        .map((d) => {
          if (d.id === sourceDossierId) {
            const newImages = d.images.filter((_, i) => i !== imageIndex);
            return newImages.length > 0 ? { ...d, images: newImages } : null;
          }
          if (d.id === targetDossierId) {
            return {
              ...d,
              images: [
                ...d.images,
                { ...movedImage, pageIndex: d.images.length + 1 },
              ],
              status: 'manual',
            };
          }
          return d;
        })
        .filter(Boolean) as StudentDossier[];

      setResult({
        ...result,
        dossiers: newDossiers,
      });
    },
    [result]
  );

  // 从未分类创建新卷宗
  const handleCreateDossier = useCallback(
    (imageIndex: number) => {
      if (!result) return;
      const img = result.unclassifiedImages[imageIndex];
      const newDossier: StudentDossier = {
        id: `dossier-${Date.now()}`,
        studentName: `新学生 ${result.dossiers.length + 1}`,
        confidence: 0.5,
        images: [
          {
            file: img.file,
            fileName: img.fileName,
            pageType: 'unknown',
            pageIndex: 1,
            questionNumbers: [],
          },
        ],
        status: 'manual',
        createdAt: new Date(),
      };

      setResult({
        ...result,
        dossiers: [...result.dossiers, newDossier],
        unclassifiedImages: result.unclassifiedImages.filter((_, i) => i !== imageIndex),
      });
      setExpandedId(newDossier.id);
    },
    [result]
  );

  // 处理未分类拖拽开始
  const handleUnclassifiedDragStart = (e: React.DragEvent, imageIndex: number) => {
    e.dataTransfer.setData('text/plain', imageIndex.toString());
  };

  // 重新归类
  const handleReclassify = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await performPreClassification(files);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 确认所有卷宗
  const handleConfirmAll = () => {
    if (!result) return;
    const confirmedDossiers = result.dossiers.map((d) => ({
      ...d,
      status: 'confirmed' as const,
    }));
    onConfirm(confirmedDossiers);
  };

  // 创建手动归类的初始结果（跳过AI智能归类）
  const handleSkipToManual = useCallback(() => {
    // 将所有图片放入未分类池，让用户手动创建卷宗
    const unclassifiedImages = files.map((file) => ({
      file,
      fileName: file.name,
      reason: '手动跳过AI归类',
    }));

    setResult({
      dossiers: [],
      unclassifiedImages,
      statistics: {
        totalImages: files.length,
        classifiedImages: 0,
        studentCount: 0,
        avgConfidence: 0,
      },
    });
    setError(null);
  }, [files]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">AI 智能归类中</h3>
          <p className="text-gray-600 mb-4">
            正在分析 {files.length} 张试卷图片，识别学生姓名与题号逻辑...
          </p>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#4F46E5]" />
            <span className="text-sm text-gray-500">请稍候</span>
          </div>
        </div>
      </div>
    );
  }

  // 判断是否为 API Key 配置错误
  const isApiKeyError = error?.includes('API_KEY') || error?.includes('未配置');

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isApiKeyError ? 'API 密钥未配置' : '智能归类失败'}
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>

            {isApiKeyError && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mb-4">
                <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  如何配置 API 密钥
                </h4>
                <ol className="text-xs text-amber-700 space-y-1.5 list-decimal list-inside">
                  <li>在项目根目录创建 <code className="bg-amber-100 px-1 py-0.5 rounded">.env</code> 文件</li>
                  <li>添加: <code className="bg-amber-100 px-1 py-0.5 rounded">VITE_GEMINI_API_KEY=你的密钥</code></li>
                  <li>重启开发服务器使配置生效</li>
                </ol>
                <p className="text-xs text-amber-600 mt-2">
                  获取 Gemini API Key: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-800">Google AI Studio</a>
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {/* 手动归类选项 */}
            <button
              onClick={handleSkipToManual}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white rounded-xl hover:opacity-90 flex items-center justify-center gap-2 font-medium"
            >
              <Layers className="w-5 h-5" />
              跳过智能归类，手动分组
            </button>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700"
              >
                取消上传
              </button>
              <button
                onClick={handleReclassify}
                className="flex-1 px-4 py-2.5 border border-[#4F46E5] text-[#4F46E5] rounded-xl hover:bg-[#4F46E5]/5 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                重试归类
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#F8F9FB] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* 头部 */}
        <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">智能卷宗归类</h2>
            <p className="text-sm text-gray-500">
              已识别 {result.statistics.studentCount} 位学生，
              {result.statistics.classifiedImages}/{result.statistics.totalImages} 张已归类
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReclassify}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <RotateCcw className="w-4 h-4" />
              重新归类
            </button>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="bg-white px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-gray-600">
                高置信度: {result.dossiers.filter((d) => d.confidence >= 0.8).length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-gray-600">
                待确认: {result.dossiers.filter((d) => d.confidence < 0.8).length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-gray-600">
                未分类: {result.unclassifiedImages.length}
              </span>
            </div>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 未分类图片池 */}
          <UnclassifiedPool
            images={result.unclassifiedImages}
            onCreateDossier={handleCreateDossier}
            onDragStart={handleUnclassifiedDragStart}
          />

          {/* 学生卷宗列表 */}
          <div className="space-y-3">
            {result.dossiers.map((dossier) => (
              <DossierCard
                key={dossier.id}
                dossier={dossier}
                isExpanded={expandedId === dossier.id}
                onToggle={() =>
                  setExpandedId(expandedId === dossier.id ? null : dossier.id)
                }
                onEditName={(name) => handleEditName(dossier.id, name)}
                onRemoveImage={(idx) => handleRemoveImage(dossier.id, idx)}
                onDrop={handleDrop}
                dragOverId={dragOverId}
                setDragOverId={setDragOverId}
              />
            ))}
          </div>
        </div>

        {/* 底部操作 */}
        <div className="bg-white border-t border-gray-100 p-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            提示：拖拽图片可以在卷宗之间移动，点击卡片展开查看详情
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleConfirmAll}
              disabled={result.unclassifiedImages.length > 0}
              className="px-6 py-2 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              确认归类 ({result.dossiers.length} 位学生)
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
