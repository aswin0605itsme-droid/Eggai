import React, { useState, useCallback } from 'react';
import { predictEggSexFromMeasurements } from '../services/geminiService';
import { UploadIcon, SparklesIcon } from './Icons';
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
            setResults([...newResults]); // Update results in real-time
            // Increased delay to stay well within API rate limits and prevent RESOURCE_EXHAUSTED errors.
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-700">Batch Process Egg Data</h2>
      <p className="text-gray-600">
        Upload a CSV file with egg measurements to predict the sex for multiple eggs at once. The file must contain `mass`, `long_axis`, and `short_axis` columns. An `id` column is optional.
      </p>

      <div className="space-y-4 p-4 border border-dashed border-gray-300 rounded-lg">
        <label htmlFor="csv-upload" className="block text-lg font-semibold text-gray-700">Upload Data File</label>
        <input id="csv-upload" type="file" accept=".csv" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
         <p className="text-sm text-gray-500">
          Need a template? <button onClick={createSampleCSV} className="text-amber-600 hover:underline font-semibold">Download sample CSV</button>
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleProcessBatch}
          disabled={parsedData.length === 0 || isLoading}
          className="w-auto flex items-center justify-center gap-2 bg-amber-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-amber-600 disabled:bg-gray-300 transition-colors"
        >
          {isLoading ? <><Spinner /> Processing...</> : <><SparklesIcon className="w-5 h-5" /> Process Batch</>}
        </button>
        {isLoading && <p className="text-gray-600 animate-pulse">{progress}</p>}
      </div>

       {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
       
       {results.length > 0 && (
         <div className="space-y-4">
           <h3 className="text-lg font-semibold text-gray-700">Prediction Results</h3>
           <div className="max-h-96 overflow-auto border border-gray-200 rounded-lg">
             <table className="w-full text-sm text-left text-gray-500">
               <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                 <tr>
                   {Object.keys(results[0]).map(key => <th key={key} scope="col" className="px-6 py-3">{key.replace('_', ' ')}</th>)}
                 </tr>
               </thead>
               <tbody>
                 {results.map((row, index) => (
                   <tr key={index} className="bg-white border-b hover:bg-gray-50">
                     {Object.values(row).map((value, i) => <td key={i} className="px-6 py-4">{value}</td>)}
                   </tr>
                 ))}
               </tbody>
             </table>
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