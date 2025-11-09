"use client";

import React, { useState, useCallback } from 'react';
import Header from '../components/Header';
import AnalyzeEgg from '../components/AnalyzeEgg';
import ResearchHub from '../components/ResearchHub';
import BatchProcess from '../components/BatchProcess';
import ModelSimulator from '../components/ModelSimulator';
import ContributeData from '../components/ContributeData';
import LiveScan from '../components/LiveScan';
import BatchLog from '../components/BatchLog';
import ImageGenerator from '../components/ImageGenerator';
import { EggIcon, CameraIcon, ClipboardListIcon, BeakerIcon, DatabasePlusIcon, SearchIcon, ImageIcon } from '../components/Icons';
import { BatchResult } from '../types';
import { ToastProvider } from '../contexts/ToastContext';
import ToastContainer from '../components/ToastContainer';

type Tab = 'analyze' | 'live' | 'batch' | 'model' | 'contribute' | 'research' | 'image';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('analyze');
  const [batchLog, setBatchLog] = useState<BatchResult[]>([]);

  const addBatchResult = (result: Omit<BatchResult, 'timestamp'>) => {
    const newResult: BatchResult = {
      ...result,
      timestamp: new Date().toLocaleString(),
    }
    setBatchLog(prevLog => [newResult, ...prevLog]);
  };
  
  const clearLog = () => {
    setBatchLog([]);
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
      case 'image':
        return <ImageGenerator />;
      default:
        return <AnalyzeEgg addBatchResult={addBatchResult} />;
    }
  }, [activeTab]);

  const TabButton = ({ tab, label, icon }: { tab: Tab; label: string; icon: React.ReactElement }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`group relative flex-1 flex items-center justify-center p-3 sm:p-4 text-sm sm:text-base font-semibold transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 rounded-t-lg ${
        activeTab === tab
          ? 'text-amber-600 bg-slate-50'
          : 'text-slate-500 hover:bg-slate-100 hover:text-amber-600'
      }`}
      aria-current={activeTab === tab ? 'page' : undefined}
    >
      {icon}
      <span className="ml-2 hidden lg:inline">{label}</span>
       {activeTab === tab && (
         <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-amber-500"></span>
      )}
    </button>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200/80">
            <div className="flex border-b border-slate-200 bg-white">
              <TabButton tab="analyze" label="Analyze Egg" icon={<EggIcon className="w-6 h-6" />} />
              <TabButton tab="live" label="Live Scan" icon={<CameraIcon className="w-6 h-6" />} />
              <TabButton tab="batch" label="Batch" icon={<ClipboardListIcon className="w-6 h-6" />} />
              <TabButton tab="model" label="Simulator" icon={<BeakerIcon className="w-6 h-6" />} />
              <TabButton tab="contribute" label="Contribute" icon={<DatabasePlusIcon className="w-6 h-6" />} />
              <TabButton tab="research" label="Research" icon={<SearchIcon className="w-6 h-6" />} />
              <TabButton tab="image" label="Generate" icon={<ImageIcon className="w-6 h-6" />} />
            </div>
            <div className="p-4 sm:p-6 md:p-8 bg-slate-50/70">
              <div key={activeTab} className="animate-slide-in-fade-up">
                {renderTabContent()}
              </div>
            </div>
          </div>
          
          <BatchLog log={batchLog} clearLog={clearLog} />

        </main>
        <footer className="text-center p-6 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Chick-Sexing AI Assistant. All rights reserved.</p>
        </footer>
        <ToastContainer />
      </div>
    </ToastProvider>
  );
};
