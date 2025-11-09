"use client";

import React from 'react';
import { BatchResult } from '../types';
import { DownloadIcon } from './Icons';

interface BatchLogProps {
  log: BatchResult[];
}

const BatchLog: React.FC<BatchLogProps> = ({ log }) => {

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
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold text-slate-700">Batch Prediction Log</h2>
            <button
                onClick={handleDownloadCSV}
                disabled={log.length === 0}
                className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-slate-300 transition-colors"
            >
                <DownloadIcon className="w-5 h-5" />
                Download CSV
            </button>
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
                <tbody>
                    {log.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="text-center py-8 text-slate-500">
                                No predictions logged yet.
                            </td>
                        </tr>
                    ) : (
                        log.map((row, index) => (
                            <tr key={index} className="bg-white border-b last:border-b-0 border-slate-200 hover:bg-slate-50/50">
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
  );
};

export default BatchLog;
