"use client";

import React, { useState } from 'react';
import { BatchResult } from '../types';
import { DownloadIcon, TrashIcon } from './Icons';
import { useToast } from '../hooks/useToast';

interface BatchLogProps {
  log: BatchResult[];
  clearLog: () => void;
}

const ConfirmationModal = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void; }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 shadow-2xl max-w-sm w-full animate-fade-in">
            <h3 className="text-lg font-bold text-slate-800">Are you sure?</h3>
            <p className="text-slate-600 mt-2">This will permanently delete all entries in the log. This action cannot be undone.</p>
            <div className="flex justify-end gap-4 mt-6">
                <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                    Cancel
                </button>
                <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
                    Clear Log
                </button>
            </div>
        </div>
    </div>
);

const BatchLog: React.FC<BatchLogProps> = ({ log, clearLog }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const addToast = useToast();

  const handleDownloadCSV = () => {
    if (log.length === 0) return;

    const header = "Batch Number,Prediction,Source,Timestamp\n";
    const csvContent = log.map(row => {
        return `"${row.batchNumber}","${row.prediction}","${row.source}","${row.timestamp}"`;
    }).join('\n');
    
    const blob = new Blob([header, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "batch_prediction_log.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Log downloaded successfully!', 'success');
  };

  const handleClearLog = () => {
    clearLog();
    setShowConfirmModal(false);
    addToast('Prediction log has been cleared.', 'info');
  };

  return (
    <>
      {showConfirmModal && <ConfirmationModal onConfirm={handleClearLog} onCancel={() => setShowConfirmModal(false)} />}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200/80 animate-slide-in-fade-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <h2 className="text-2xl font-bold text-slate-800 font-serif">Batch Prediction Log</h2>
              <div className="flex gap-2">
                <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={log.length === 0}
                    className="flex items-center gap-2 bg-red-50 text-red-600 font-bold py-2 px-4 rounded-lg hover:bg-red-100 disabled:bg-slate-100 disabled:text-slate-400 transition-colors"
                >
                    <TrashIcon className="w-5 h-5" />
                    Clear
                </button>
                <button
                    onClick={handleDownloadCSV}
                    disabled={log.length === 0}
                    className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-slate-300 transition-all transform hover:scale-105 active:scale-100"
                >
                    <DownloadIcon className="w-5 h-5" />
                    Download CSV
                </button>
              </div>
          </div>

          <div className="overflow-hidden border border-slate-200 rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-500">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                      <tr>
                          <th scope="col" className="px-6 py-3">Batch Number</th>
                          <th scope="col" className="px-6 py-3">Prediction</th>
                          <th scope="col" className="px-6 py-3">Source</th>
                          <th scope="col" className="px-6 py-3">Timestamp</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                      {log.length === 0 ? (
                          <tr>
                              <td colSpan={4} className="text-center py-8 text-slate-500">
                                  No predictions logged yet.
                              </td>
                          </tr>
                      ) : (
                          log.map((row, index) => (
                              <tr key={index} className="bg-white hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{row.batchNumber}</td>
                                  <td className={`px-6 py-4 font-semibold whitespace-nowrap ${row.prediction === 'Female' ? 'text-pink-600' : row.prediction === 'Male' ? 'text-blue-600' : 'text-slate-600'}`}>{row.prediction}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">{row.source}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">{row.timestamp}</td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
            </div>
          </div>
      </div>
    </>
  );
};

export default BatchLog;
