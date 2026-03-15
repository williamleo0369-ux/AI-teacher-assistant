// @ts-nocheck
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, User, TrendingUp, AlertCircle,
  Target, Lightbulb, Download, Share2
} from 'lucide-react';
// @ts-ignore
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';

interface DiagnosisReportProps {
  gradingResults: any;
}

const abilityData = [
  { ability: '基础知识', score: 85, fullMark: 100 },
  { ability: '阅读理解', score: 72, fullMark: 100 },
  { ability: '语法运用', score: 68, fullMark: 100 },
  { ability: '写作表达', score: 75, fullMark: 100 },
  { ability: '逻辑推理', score: 80, fullMark: 100 },
];

const weakPointsData = [
  { name: '时态混淆', count: 32, percentage: 64 },
  { name: '词义辨析', count: 28, percentage: 56 },
  { name: '长难句理解', count: 25, percentage: 50 },
  { name: '写作结构', count: 18, percentage: 36 },
  { name: '细节推断', count: 15, percentage: 30 },
];

const scatterData = [
  { x: 65, y: 70, z: 200, name: '王五' },
  { x: 75, y: 85, z: 260, name: '张三' },
  { x: 80, y: 65, z: 300, name: '李四' },
  { x: 90, y: 90, z: 350, name: '钱七' },
  { x: 55, y: 60, z: 180, name: '赵六' },
  { x: 70, y: 75, z: 240, name: '孙八' },
];

const waterfallData = [
  { name: '当前分', value: 115, color: '#4F46E5' },
  { name: '规范性', value: 5, color: '#10B981' },
  { name: '计算失误', value: 3, color: '#10B981' },
  { name: '审题偏差', value: 6, color: '#F59E0B' },
  { name: '逻辑漏洞', value: 8, color: '#F59E0B' },
  { name: '知识盲区', value: 13, color: '#EF4444' },
  { name: '目标分', value: 150, color: '#4F46E5' },
];

export default function DiagnosisReport({ gradingResults }: DiagnosisReportProps) {
  const [viewMode, setViewMode] = useState<'class' | 'individual'>('class');

  if (!gradingResults) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <BarChart3 className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-medium text-gray-600 mb-2">暂无诊断数据</h3>
        <p className="text-gray-500">请先完成试卷批改</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">多维学情诊断报告</h2>
          <p className="text-gray-600 mt-1">基于AI深度分析的精准学情画像</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('class')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'class' ? 'bg-white text-[#4F46E5] shadow-sm' : 'text-gray-600'
              }`}
            >
              <Users className="w-4 h-4" />
              班级维度
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'individual' ? 'bg-white text-[#4F46E5] shadow-sm' : 'text-gray-600'
              }`}
            >
              <User className="w-4 h-4" />
              个体维度
            </button>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Download className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {viewMode === 'class' ? (
        <div className="grid grid-cols-2 gap-6">
          {/* Weak Points */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-gray-900">失分重灾区统计</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weakPointsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, '错误率']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="percentage" fill="#EF4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Class Distribution */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900">班级分层情况</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="正确率" unit="%" domain={[50, 100]} />
                <YAxis type="number" dataKey="y" name="稳定性" unit="%" domain={[50, 100]} />
                <ZAxis type="number" dataKey="z" range={[60, 400]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 rounded-lg shadow-lg border text-sm">
                          <p className="font-medium">{data.name}</p>
                          <p>正确率: {data.x}%</p>
                          <p>稳定性: {data.y}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={scatterData} fill="#4F46E5">
                  {scatterData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.x > 80 && entry.y > 80 ? '#10B981' : entry.x < 60 ? '#EF4444' : '#4F46E5'}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* ROI Ranking */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-gray-900">提分ROI排序</h3>
            </div>
            <div className="space-y-3">
              {[
                { topic: '时态一致性', roi: '高', potential: '+5分', effort: '3天', color: 'green' },
                { topic: '完形上下文', roi: '高', potential: '+4分', effort: '5天', color: 'green' },
                { topic: '阅读细节题', roi: '中', potential: '+6分', effort: '7天', color: 'amber' },
                { topic: '写作高级句式', roi: '中', potential: '+5分', effort: '10天', color: 'amber' },
                { topic: '长难句分析', roi: '低', potential: '+3分', effort: '14天', color: 'red' },
              ].map((item, index) => (
                <motion.div
                  key={item.topic}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className={`
                      px-2 py-1 text-xs font-medium rounded
                      ${item.color === 'green' ? 'bg-green-100 text-green-700' : ''}
                      ${item.color === 'amber' ? 'bg-amber-100 text-amber-700' : ''}
                      ${item.color === 'red' ? 'bg-red-100 text-red-700' : ''}
                    `}>
                      ROI {item.roi}
                    </span>
                    <span className="font-medium text-gray-900">{item.topic}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600 font-semibold">{item.potential}</span>
                    <span className="text-gray-500">{item.effort}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Teaching Insights */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="w-5 h-5 text-[#4F46E5]" />
              <h3 className="font-semibold text-gray-900">教学策略建议</h3>
            </div>
            <div className="space-y-4">
              {[
                { title: '集体讲评重点', content: '时态混淆问题需优先处理，建议用"时间轴对比法"讲透一般过去与现在完成时的边界。' },
                { title: '分层辅导策略', content: '前20%学生侧重写作突破，中间50%强化完形技巧，后30%回归基础语法。' },
                { title: '课堂效率提升', content: '本次阅读D篇全班正确率仅38%，建议下节课专题训练"推断题"解题思路。' },
              ].map((insight, index) => (
                <div key={index} className="p-4 rounded-lg bg-[#4F46E5]/5 border border-[#4F46E5]/10">
                  <p className="font-medium text-[#4F46E5] mb-1">{insight.title}</p>
                  <p className="text-sm text-gray-700">{insight.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Ability Radar */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-[#4F46E5]" />
              <h3 className="font-semibold text-gray-900">能力雷达图</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={abilityData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="ability" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="能力值"
                  dataKey="score"
                  stroke="#4F46E5"
                  fill="#4F46E5"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Score Waterfall */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-gray-900">提分路径瀑布图</h3>
            </div>
            <div className="space-y-2">
              {waterfallData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="w-20 text-sm text-gray-600 text-right">{item.name}</span>
                  <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / 150) * 100}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className="h-full rounded-lg"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-medium">
                      {index === 0 || index === waterfallData.length - 1
                        ? `${item.value}分`
                        : `+${item.value}分`
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">诊断结论：</span>
                该生短期可追回 <span className="font-bold text-amber-600">8分</span>（规范性+计算失误），
                14天冲刺可提升 <span className="font-bold text-amber-600">22分</span>
              </p>
            </div>
          </div>

          {/* Error Pattern */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-gray-900">掉分路径溯源</h3>
            </div>
            <div className="flex items-center justify-between">
              {['审题', '理解', '建模', '计算', '表达'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`
                    w-24 h-24 rounded-xl flex flex-col items-center justify-center
                    ${index === 2 ? 'bg-red-100 border-2 border-red-500' : 'bg-gray-100'}
                  `}>
                    <span className={`text-lg font-bold ${index === 2 ? 'text-red-600' : 'text-gray-600'}`}>
                      {step}
                    </span>
                    <span className={`text-sm ${index === 2 ? 'text-red-500' : 'text-gray-500'}`}>
                      {index === 2 ? '断裂点' : index < 2 ? '正常' : '受影响'}
                    </span>
                  </div>
                  {index < 4 && (
                    <div className={`w-12 h-1 ${index >= 2 ? 'bg-red-300' : 'bg-green-300'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800">
                <span className="font-semibold">核心问题：</span>
                该生在"建模"环节出现逻辑断裂，表现为无法将文字信息正确转化为数学表达式，
                导致后续计算和表达环节连环失分。建议从"条件转化"专项训练入手。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
