import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Target, CheckCircle2, Clock, BookOpen,
  Users, User, Download, Printer, ChevronRight,
  Trophy, Flame, Star, Sparkles, X
} from 'lucide-react';
import VariantQuestions from './VariantQuestions';

interface ImprovementPlanProps {
  gradingResults: any;
}

// 模拟的错题数据（实际应该从 gradingResults 中提取）
const mockWeakPoints = [
  {
    id: 1,
    question: '已知函数 f(x) = x² - 2x + 1，求 f(x) 的最小值',
    diagnosis: '学生对二次函数顶点公式掌握不牢，需要加强配方法训练',
    knowledgePoint: '二次函数求最值'
  },
  {
    id: 2,
    question: '若 sin α = 3/5，且 α 为第二象限角，求 cos α 的值',
    diagnosis: '学生对三角函数在各象限的符号判断有误，需要强化象限角的概念',
    knowledgePoint: '三角函数象限符号'
  },
  {
    id: 3,
    question: '某工厂生产一批产品，若每天生产 x 件，成本为 C(x) = 0.5x² + 10x + 100（元）。求日产量为多少时，平均成本最低？',
    diagnosis: '学生对均值不等式的应用条件理解不清，需要练习"一正二定三相等"的应用',
    knowledgePoint: '均值不等式应用'
  }
];

const planPhases = [
  {
    id: 1,
    name: '第一阶段：固本',
    period: 'D1 - D4',
    description: '追回"白送分"，清理低级错误',
    color: 'green',
    tasks: [
      { day: 'D1', task: '时态一致性专项（15分钟）', type: '规范作答', points: '+2分' },
      { day: 'D2', task: '书写规范与答题格式', type: '避坑清单', points: '+1分' },
      { day: 'D3', task: '计算细节检查训练', type: '精准练习', points: '+2分' },
      { day: 'D4', task: '阶段测试与复盘', type: '限时测试', points: '验收' },
    ]
  },
  {
    id: 2,
    name: '第二阶段：攻坚',
    period: 'D5 - D10',
    description: '针对"掉分卡点"进行同类题型训练',
    color: 'amber',
    tasks: [
      { day: 'D5-6', task: '完形填空上下文推断', type: '变式练习', points: '+3分' },
      { day: 'D7-8', task: '阅读理解细节推断题', type: '专题突破', points: '+4分' },
      { day: 'D9', task: '写作高级句式升级', type: '模板训练', points: '+3分' },
      { day: 'D10', task: '综合能力测试', type: '限时测试', points: '验收' },
    ]
  },
  {
    id: 3,
    name: '第三阶段：闭环',
    period: 'D11 - D14',
    description: '压力测试与心理建设',
    color: 'purple',
    tasks: [
      { day: 'D11', task: '15分钟限时模拟卷', type: '压力测试', points: '适应' },
      { day: 'D12', task: '错题回顾与心态调整', type: '复盘总结', points: '巩固' },
      { day: 'D13', task: '全真模拟测试', type: '终极测试', points: '验收' },
      { day: 'D14', task: '提分曲线分析与庆功', type: '成果展示', points: '完成' },
    ]
  }
];

const dailyTasks = {
  parent: [
    { time: '18:00', task: '督促完成当日15分钟精准练习' },
    { time: '19:00', task: '检查订正情况，签字确认' },
    { time: '21:00', task: '关注孩子情绪，给予正向鼓励' },
  ],
  student: [
    { time: '17:30', task: '回顾今日错题，标记理解程度' },
    { time: '18:00', task: '完成AI推送的15分钟精准练习' },
    { time: '18:30', task: '整理笔记，记录新掌握的技巧' },
  ]
};

export default function ImprovementPlan({ gradingResults }: ImprovementPlanProps) {
  const [selectedPhase, setSelectedPhase] = useState(1);
  const [viewType, setViewType] = useState<'class' | 'individual'>('class');
  const [showVariantQuestions, setShowVariantQuestions] = useState(false);
  const [selectedWeakPoint, setSelectedWeakPoint] = useState<typeof mockWeakPoints[0] | null>(null);

  const handleGenerateVariants = (weakPoint: typeof mockWeakPoints[0]) => {
    setSelectedWeakPoint(weakPoint);
    setShowVariantQuestions(true);
  };

  if (!gradingResults) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Calendar className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-medium text-gray-600 mb-2">暂无提分计划</h3>
        <p className="text-gray-500">请先完成试卷批改与学情诊断</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">14天精准提分计划</h2>
          <p className="text-gray-600 mt-1">基于AI诊断生成的可执行行动指令</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewType('class')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewType === 'class' ? 'bg-white text-[#4F46E5] shadow-sm' : 'text-gray-600'
              }`}
            >
              <Users className="w-4 h-4" />
              班级计划
            </button>
            <button
              onClick={() => setViewType('individual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewType === 'individual' ? 'bg-white text-[#4F46E5] shadow-sm' : 'text-gray-600'
              }`}
            >
              <User className="w-4 h-4" />
              个人计划
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] transition-colors">
            <Download className="w-4 h-4" />
            导出PDF
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Printer className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '预计提分', value: '+22', unit: '分', icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
          { label: '短期目标', value: '+8', unit: '分', icon: Flame, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: '训练天数', value: '14', unit: '天', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '每日时长', value: '15', unit: '分钟', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${card.bg} rounded-xl p-5`}
            >
              <Icon className={`w-6 h-6 ${card.color} mb-3`} />
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-bold ${card.color}`}>{card.value}</span>
                <span className="text-sm text-gray-600">{card.unit}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{card.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Phase Timeline */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-6">阶段规划</h3>
        <div className="flex gap-4 mb-6">
          {planPhases.map((phase) => (
            <button
              key={phase.id}
              onClick={() => setSelectedPhase(phase.id)}
              className={`
                flex-1 p-4 rounded-xl border-2 transition-all
                ${selectedPhase === phase.id
                  ? phase.color === 'green' ? 'border-green-500 bg-green-50' :
                    phase.color === 'amber' ? 'border-amber-500 bg-amber-50' :
                    'border-purple-500 bg-purple-50'
                  : 'border-gray-100 hover:border-gray-200'
                }
              `}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold
                  ${phase.color === 'green' ? 'bg-green-500' :
                    phase.color === 'amber' ? 'bg-amber-500' :
                    'bg-purple-500'
                  }
                `}>
                  {phase.id}
                </div>
                <span className="font-semibold text-gray-900">{phase.name}</span>
              </div>
              <p className="text-sm text-gray-500 mb-1">{phase.period}</p>
              <p className="text-sm text-gray-700">{phase.description}</p>
            </button>
          ))}
        </div>

        {/* Phase Details */}
        <div className="border-t border-gray-100 pt-6">
          <h4 className="font-medium text-gray-900 mb-4">
            {planPhases.find(p => p.id === selectedPhase)?.name} 任务清单
          </h4>
          <div className="space-y-3">
            {planPhases.find(p => p.id === selectedPhase)?.tasks.map((task, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="w-16 text-center">
                  <span className="text-sm font-bold text-[#4F46E5]">{task.day}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{task.task}</p>
                  <span className="text-xs text-gray-500">{task.type}</span>
                </div>
                <div className={`
                  px-3 py-1 rounded-full text-sm font-medium
                  ${task.points.includes('+') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                `}>
                  {task.points}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Instructions */}
      <div className="grid grid-cols-2 gap-6">
        {/* Parent Instructions */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">家长每日辅导处方</h3>
              <p className="text-sm text-gray-500">帮助家长精准陪伴</p>
            </div>
          </div>
          <div className="space-y-4">
            {dailyTasks.parent.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-16 text-right">
                  <span className="text-sm font-medium text-gray-500">{item.time}</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <p className="flex-1 text-gray-700">{item.task}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <Star className="w-4 h-4 inline mr-1" />
              <span className="font-medium">核心关注点：</span>
              本周重点关注孩子的时态运用，发现错误及时指出
            </p>
          </div>
        </div>

        {/* Student Instructions */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">学生每日精准击破</h3>
              <p className="text-sm text-gray-500">每天15分钟高效提升</p>
            </div>
          </div>
          <div className="space-y-4">
            {dailyTasks.student.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-16 text-right">
                  <span className="text-sm font-medium text-gray-500">{item.time}</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
                <p className="flex-1 text-gray-700">{item.task}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-800">
              <Trophy className="w-4 h-4 inline mr-1" />
              <span className="font-medium">今日目标：</span>
              完成5道时态专项练习，正确率达到80%
            </p>
          </div>
        </div>
      </div>

      {/* Progress Tracking */}
      <div className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">提分进度追踪</h3>
            <p className="text-white/70 text-sm">实时监控学习成效</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">Day 3</p>
            <p className="text-white/70 text-sm">第一阶段进行中</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: '已完成任务', value: '8', total: '12' },
            { label: '累计提分', value: '+5', total: '+22' },
            { label: '连续打卡', value: '3', total: '天' },
            { label: '练习正确率', value: '82', total: '%' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 rounded-lg p-4">
              <p className="text-white/70 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold">
                {stat.value}
                <span className="text-lg text-white/50">/{stat.total}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* AI 变式题训练区 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI 智能变式练习</h3>
              <p className="text-sm text-gray-500">针对薄弱点生成定制化巩固练习</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {mockWeakPoints.map((point, index) => (
            <motion.div
              key={point.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 font-bold">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{point.question}</p>
                <p className="text-sm text-red-600 mt-1">{point.diagnosis}</p>
                <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {point.knowledgePoint}
                </span>
              </div>
              <button
                onClick={() => handleGenerateVariants(point)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                生成变式题
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 变式题弹窗 */}
      <AnimatePresence>
        {showVariantQuestions && selectedWeakPoint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
            onClick={() => setShowVariantQuestions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">AI 变式题生成</h3>
                <button
                  onClick={() => setShowVariantQuestions(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6">
                <VariantQuestions
                  originalQuestion={selectedWeakPoint.question}
                  diagnosis={selectedWeakPoint.diagnosis}
                  knowledgePoint={selectedWeakPoint.knowledgePoint}
                  onClose={() => setShowVariantQuestions(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
