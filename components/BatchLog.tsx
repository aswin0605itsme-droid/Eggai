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
    <div className="bg-white p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold text-gray-700">Batch Prediction Log</h2>
            <button
                onClick={handleDownloadCSV}
                disabled={log.length === 0}
                className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
            >
                <DownloadIcon className="w-5 h-5" />
                Download CSV
            </button>
        </div>

        <div className="max-h-96 overflow-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
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
                            <td colSpan={4} className="text-center py-8 text-gray-500">
                                No predictions logged yet. Use the 'Analyze Egg' or 'Live Scan' tabs to add results.
                            </td>
                        </tr>
                    ) : (
                        log.map((row, index) => (
                            <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{row.batchNumber}</td>
                                <td className={`px-6 py-4 font-semibold ${row.prediction === 'Female' ? 'text-pink-600' : 'text-blue-600'}`}>{row.prediction}</td>
                                <td className="px-6 py-4">{row.source}</td>
                                <td className="px-6 py-4">{row.timestamp}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default BatchLog;
