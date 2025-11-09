"use client";

import React, { useState, useCallback } from 'react';
import { predictEggSexFromMeasurements } from '../services/geminiService';
import { SparklesIcon } from './Icons';
import Spinner from './Spinner';

interface EggData {
  id?: string;
  mass: number;
  long_axis: number;
  short_axis: number;
}

interface ResultData extends EggData {
  predicted_sex: 'male' | 'female' | 'unknown' | 'error';
}

const BatchProcess: React.FC = () => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<EggData[]>([]);
  const [results, setResults] = useState<ResultData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  const createSampleCSV = () => {
    const header = "id,mass,long_axis,short_axis\n";
    const example1 = "E001,60.5,58.2,43.5\n";
    const example2 = "E002,55.1,56.9,41.8\n";
    const example3 = "E003,62.0,59.1,44.2\n";
    const blob = new Blob([header, example1, example2, example3], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_eggs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setError(null);
      setResults([]);
      setParsedData([]);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
          if (lines.length < 2) {
            setError("CSV file must have a header and at least one data row.");
            return;
          }
          const header = lines[0].split(',').map(h => h.trim());
          const requiredHeaders = ['mass', 'long_axis', 'short_axis'];
          if (!requiredHeaders.every(h => header.includes(h))) {
            setError(`CSV header must contain: ${requiredHeaders.join(', ')}.`);
            return;
          }

          const massIndex = header.indexOf('mass');
          const longAxisIndex = header.indexOf('long_axis');
          const shortAxisIndex = header.indexOf('short_axis');
          const idIndex = header.indexOf('id');

          const data: EggData[] = lines.slice(1).map(line => {
            const values = line.split(',');
            return {
              id: idIndex > -1 ? values[idIndex]?.trim() : undefined,
              mass: parseFloat(values[massIndex]),
              long_axis: parseFloat(values[longAxisIndex]),
              short_axis: parseFloat(values[shortAxisIndex]),
            };
          });
          
          if (data.some(d => isNaN(d.mass) || isNaN(d.long_axis) || isNaN(d.short_axis))) {
             setError("CSV contains non-numeric data in measurement columns. Please check the file.");
             return;
          }

          setParsedData(data);
        } catch (err) {
          setError("Failed to parse CSV file. Please ensure it is correctly formatted.");
          console.error(err);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleProcessBatch = useCallback(async () => {
    if (parsedData.length === 0) {
      setError("No data to process. Please upload a valid CSV file.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResults([]);
    
    const newResults: ResultData[] = [];

    for (let i = 0; i < parsedData.length; i++) {
        const egg = parsedData[i];
        setProgress(`Processing egg ${i + 1} of ${parsedData.length}...`);
        try {
            const prediction = await predictEggSexFromMeasurements(egg);
            newResults.push({ ...egg, predicted_sex: prediction });
            setResults([...newResults]);
            await new Promise(resolve => setTimeout(resolve, 3100));
        } catch (err) {
            console.error(`Error processing egg ${egg.id || i + 1}:`, err);
            newResults.push({ ...egg, predicted_sex: 'error' });
            setResults([...newResults]);
        }
    }
    
    setProgress('');
    setIsLoading(false);
  }, [parsedData]);
  
  const handleDownloadResults = () => {
    if (results.length === 0) return;
    
    const header = Object.keys(results[0]).join(',') + '\n';
    const csvContent = results.map(row => {
        return Object.values(row).join(',');
    }).join('\n');
    
    const blob = new Blob([header, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "prediction_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800 font-serif">Batch Process Egg Data</h2>
        <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
          Upload a CSV with `mass`, `long_axis`, and `short_axis` columns to predict the sex for multiple eggs at once.
        </p>
      </div>

      <div className="space-y-4 p-6 bg-white rounded-xl border border-slate-200">
        <label htmlFor="csv-upload" className="block text-lg font-semibold text-slate-700">Upload Data File</label>
        <input id="csv-upload" type="file" accept=".csv" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 transition" />
         <p className="text-sm text-slate-500">
          Need a template? <button onClick={createSampleCSV} className="text-amber-600 hover:underline font-semibold">Download sample CSV</button>
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleProcessBatch}
          disabled={parsedData.length === 0 || isLoading}
          className="w-auto flex items-center justify-center gap-2 bg-amber-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-amber-600 disabled:bg-slate-300 transition-colors"
        >
          {isLoading ? <><Spinner /> Processing...</> : <><SparklesIcon className="w-5 h-5" /> Process Batch</>}
        </button>
        {isLoading && <p className="text-slate-600 animate-pulse">{progress}</p>}
      </div>

       {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
       
       {results.length > 0 && (
         <div className="space-y-4">
           <h3 className="text-lg font-semibold text-slate-700">Prediction Results</h3>
           <div className="overflow-hidden border border-slate-200 rounded-lg">
            <div className="overflow-x-auto">
             <table className="w-full text-sm text-left text-slate-500">
               <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                 <tr>
                   {Object.keys(results[0]).map(key => <th key={key} scope="col" className="px-6 py-3 whitespace-nowrap">{key.replace(/_/g, ' ')}</th>)}
                 </tr>
               </thead>
               <tbody>
                 {results.map((row, index) => (
                   <tr key={index} className="bg-white border-b last:border-b-0 border-slate-200 hover:bg-slate-50">
                     {Object.entries(row).map(([key, value], i) => <td key={i} className={`px-6 py-4 whitespace-nowrap ${key === 'id' ? 'font-medium text-slate-900' : ''}`}>{value}</td>)}
                   </tr>
                 ))}
               </tbody>
             </table>
            </div>
           </div>
           <button
             onClick={handleDownloadResults}
             className="w-auto bg-green-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-green-700 transition-colors"
           >
             Download Results
           </button>
         </div>
       )}
    </div>
  );
};

export default BatchProcess;