import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import AnalyzeEgg from './components/AnalyzeEgg';
import ResearchHub from './components/ResearchHub';
import BatchProcess from './components/BatchProcess';
import ModelSimulator from './components/ModelSimulator';
import ContributeData from './components/ContributeData';
import LiveScan from './components/LiveScan';
import BatchLog from './components/BatchLog';
import { EggIcon, CameraIcon, ClipboardListIcon, BeakerIcon, DatabasePlusIcon, SearchIcon } from './components/Icons';
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

  const TabButton = ({ tab, label, icon }: { tab: Tab; label: string; icon: React.ReactElement }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`group relative flex-1 flex items-center justify-center p-3 sm:p-4 text-sm sm:text-base font-semibold transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
        activeTab === tab
          ? 'text-amber-600'
          : 'text-slate-500 hover:bg-amber-50 hover:text-amber-600'
      }`}
      aria-current={activeTab === tab ? 'page' : undefined}
    >
      {icon}
      <span className="ml-2 hidden lg:inline">{label}</span>
      {activeTab === tab && (
         <span className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-t-full"></span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <Header />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
          <div className="flex border-b border-slate-200">
            <TabButton tab="analyze" label="Analyze Egg" icon={<EggIcon className="w-6 h-6" />} />
            <TabButton tab="live" label="Live Scan" icon={<CameraIcon className="w-6 h-6" />} />
            <TabButton tab="batch" label="Batch" icon={<ClipboardListIcon className="w-6 h-6" />} />
            <TabButton tab="model" label="Simulator" icon={<BeakerIcon className="w-6 h-6" />} />
            <TabButton tab="contribute" label="Contribute" icon={<DatabasePlusIcon className="w-6 h-6" />} />
            <TabButton tab="research" label="Research" icon={<SearchIcon className="w-6 h-6" />} />
          </div>
          <div className="p-4 sm:p-6 md:p-8 bg-slate-50/50">
            {renderTabContent()}
          </div>
        </div>
        
        <BatchLog log={batchLog} />

      </main>
       <footer className="text-center p-6 text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Chick-Sexing AI Assistant. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
