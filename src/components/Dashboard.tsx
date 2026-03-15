import { motion } from 'framer-motion';
import { Upload, Users, TrendingUp, Clock, FileText, ArrowRight, Zap, Target, Brain } from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: any) => void;
  examData: any;
  gradingResults: any;
}

export default function Dashboard({ onNavigate, examData, gradingResults }: DashboardProps) {
  const stats = [
    { label: '本周批改', value: examData ? '1' : '0', unit: '份', icon: FileText, color: 'bg-blue-500' },
    { label: '诊断学生', value: gradingResults ? '50' : '0', unit: '人', icon: Users, color: 'bg-green-500' },
    { label: '平均提分', value: '+12.5', unit: '分', icon: TrendingUp, color: 'bg-amber-500' },
    { label: '节省时间', value: '4.2', unit: '小时', icon: Clock, color: 'bg-purple-500' },
  ];

  const features = [
    {
      icon: Zap,
      title: '30秒极速批改',
      description: 'OCR识别+AI评分，全班试卷3-5分钟完成',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Target,
      title: '精准踩点给分',
      description: '识别解题步骤，对照逻辑节点分步评分',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Brain,
      title: '智能学情诊断',
      description: '定位掉分卡点，生成可执行的提分路径',
      color: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">欢迎使用智卷通</h2>
        <p className="text-white/80 mb-6">AI赋能精准教学，让每一分都有迹可循</p>
        <button
          onClick={() => onNavigate('upload')}
          className="bg-white text-[#4F46E5] px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-white/90 transition-colors"
        >
          <Upload className="w-5 h-5" />
          开始上传试卷
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 border border-gray-100"
            >
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                <span className="text-sm text-gray-500">{stat.unit}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Features */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">核心能力</h3>
        <div className="grid grid-cols-3 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: '上传试卷', icon: Upload, tab: 'upload' },
            { label: '查看批改', icon: FileText, tab: 'grading' },
            { label: '学情报告', icon: TrendingUp, tab: 'report' },
            { label: '提分计划', icon: Target, tab: 'plan' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => onNavigate(action.tab)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-[#4F46E5]/10 rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[#4F46E5]" />
                </div>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
