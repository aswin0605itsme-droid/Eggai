import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import AnalyzeEgg from './components/AnalyzeEgg';
import ResearchHub from './components/ResearchHub';
import BatchProcess from './components/BatchProcess';
import ModelSimulator from './components/ModelSimulator';
import ContributeData from './components/ContributeData';
import LiveScan from './components/LiveScan';
import BatchLog from './components/BatchLog';
import { EggIcon, BrainCircuitIcon, SearchIcon, ClipboardListIcon, BeakerIcon, DatabasePlusIcon, CameraIcon } from './components/Icons';
import { BatchResult } from './types';

type Tab = 'analyze' | 'live' | 'batch' | 'model' | 'contribute' | 'research';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('analyze');
  const [batchLog, setBatchLog] = useState<BatchResult[]>([]);

  const addBatchResult = (result: Omit<BatchResult, 'timestamp'>) => {
    const newResult: BatchResult = {
      ...result,
      timestamp: new Date().toLocaleString(),
    }
    setBatchLog(prevLog => [newResult, ...prevLog]);
  };

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'analyze':
        return <AnalyzeEgg addBatchResult={addBatchResult} />;
      case 'live':
        return <LiveScan addBatchResult={addBatchResult} />;
      case 'batch':
        return <BatchProcess />;
      case 'model':
        return <ModelSimulator />;
      case 'contribute':
        return <ContributeData />;
      case 'research':
        return <ResearchHub />;
      default:
        return <AnalyzeEgg addBatchResult={addBatchResult} />;
    }
  }, [activeTab]);

  // FIX: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
  const TabButton = ({ tab, label, icon }: { tab: Tab; label: string; icon: React.ReactElement }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex items-center justify-center p-3 sm:p-4 text-sm sm:text-base font-semibold border-b-4 transition-all duration-300 ease-in-out ${
        activeTab === tab
          ? 'border-amber-500 text-amber-600'
          : 'border-transparent text-gray-500 hover:bg-amber-50 hover:text-amber-600'
      }`}
    >
      {icon}
      <span className="ml-2 hidden lg:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-amber-50 font-sans text-gray-800">
      <Header />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-200">
            <TabButton tab="analyze" label="Analyze Egg" icon={<EggIcon className="w-6 h-6" />} />
            <TabButton tab="live" label="Live Scan" icon={<CameraIcon className="w-6 h-6" />} />
            <TabButton tab="batch" label="Batch" icon={<ClipboardListIcon className="w-6 h-6" />} />
            <TabButton tab="model" label="Simulator" icon={<BeakerIcon className="w-6 h-6" />} />
            <TabButton tab="contribute" label="Contribute" icon={<DatabasePlusIcon className="w-6 h-6" />} />
            <TabButton tab="research" label="Research" icon={<SearchIcon className="w-6 h-6" />} />
          </div>
          <div className="p-4 sm:p-6 md:p-8">
            {renderTabContent()}
          </div>
        </div>
        
        <BatchLog log={batchLog} />

      </main>
       <footer className="text-center p-4 text-sm text-gray-500">
        <p>Built with React, Tailwind CSS, and the Gemini API.</p>
      </footer>
    </div>
  );
};

export default App;