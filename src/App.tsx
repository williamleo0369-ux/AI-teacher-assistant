import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileCheck, BarChart3, Calendar, Settings, Home } from 'lucide-react';
import ExamUpload from './components/ExamUpload';
import GradingResults from './components/GradingResults';
import DiagnosisReport from './components/DiagnosisReport';
import ImprovementPlan from './components/ImprovementPlan';
import Dashboard from './components/Dashboard';

type TabType = 'dashboard' | 'upload' | 'grading' | 'report' | 'plan';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [examData, setExamData] = useState<any>(null);
  const [gradingResults, setGradingResults] = useState<any>(null);

  const tabs = [
    { id: 'dashboard', label: '工作台', icon: Home },
    { id: 'upload', label: '试卷上传', icon: Upload },
    { id: 'grading', label: '智能批改', icon: FileCheck },
    { id: 'report', label: '学情诊断', icon: BarChart3 },
    { id: 'plan', label: '提分计划', icon: Calendar },
  ];

  const handleExamUpload = (data: any) => {
    setExamData(data);
    setActiveTab('grading');
  };

  const handleGradingComplete = (results: any) => {
    setGradingResults(results);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-xl flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">智卷通</h1>
                <p className="text-xs text-gray-500">AI试卷诊断与精准提分系统</p>
              </div>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative
                    ${isActive
                      ? 'text-[#4F46E5]'
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4F46E5]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard
                onNavigate={setActiveTab}
                examData={examData}
                gradingResults={gradingResults}
              />
            )}
            {activeTab === 'upload' && (
              <ExamUpload onUpload={handleExamUpload} />
            )}
            {activeTab === 'grading' && (
              <GradingResults
                examData={examData}
                onComplete={handleGradingComplete}
              />
            )}
            {activeTab === 'report' && (
              <DiagnosisReport gradingResults={gradingResults} />
            )}
            {activeTab === 'plan' && (
              <ImprovementPlan gradingResults={gradingResults} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
          智卷通 · AI驱动的精准教学决策平台 | Powered by Gemini + DeepSeek
        </div>
      </footer>
    </div>
  );
}

export default App;
