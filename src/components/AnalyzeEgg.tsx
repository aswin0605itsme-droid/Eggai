"use client";

import React, { useState, useCallback } from 'react';
import { analyzeEggImage } from '../services/geminiService';
import { UploadIcon, SparklesIcon } from './Icons';
import Spinner from './Spinner';
import { BatchResult } from '../types';

interface AnalyzeEggProps {
  addBatchResult: (result: Omit<BatchResult, 'timestamp'>) => void;
}

const AnalyzeEgg: React.FC<AnalyzeEggProps> = ({ addBatchResult }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [batchNumber, setBatchNumber] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setAnalysis('');
      setError(null);
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!imageFile) {
      setError('Please upload an image first.');
      return;
    }
    if (!batchNumber) {
        setError('Please enter a batch number.');
        return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis('');

    try {
      let fullText = '';
      const stream = await analyzeEggImage(imageFile);
      for await (const chunk of stream) {
        const textChunk = chunk.text;
        fullText += textChunk;
        setAnalysis((prev) => prev + textChunk);
      }
      
      const predictionMatch = fullText.match(/\b(Male|Female)\b/i);
      const prediction = predictionMatch ? predictionMatch[0].charAt(0).toUpperCase() + predictionMatch[0].slice(1).toLowerCase() : 'Unknown';
      addBatchResult({ batchNumber, prediction, source: 'Image' });

      setBatchNumber('');
      setImageFile(null);
      setImagePreview(null);

    } catch (err) {
      setError('Failed to analyze the image. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, batchNumber, addBatchResult]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800 font-serif">Predict Chick Sex from an Egg Photo</h2>
        <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
          Enter a batch number, upload a clear photo of a single chicken egg, and the AI will analyze its shape to predict the likely sex.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm transition hover:shadow-lg">
          <div>
              <label htmlFor="batch-number-image" className="block text-sm font-bold text-slate-700 mb-2">
                  Step 1: Enter Batch Number
              </label>
              <input
                  id="batch-number-image"
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g., BATCH-001A"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 transition"
              />
          </div>

          <div>
            <label htmlFor="egg-upload" className="block text-sm font-bold text-slate-700 mb-2">Step 2: Upload Egg Image</label>
            <div className="w-full">
              <label htmlFor="egg-upload" className={`group flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 relative overflow-hidden ${!batchNumber ? 'bg-slate-100 cursor-not-allowed border-slate-300' : 'bg-amber-50 hover:bg-amber-100 border-amber-300 hover:border-amber-400'}`}>
                {imagePreview && batchNumber ? (
                  <img src={imagePreview} alt="Egg preview" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center z-10">
                    <UploadIcon className="w-10 h-10 mb-3 text-amber-500 transition-transform group-hover:scale-110" />
                    <p className="mb-2 text-sm text-amber-700"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-amber-600">PNG, JPG, or WEBP</p>
                    {!batchNumber && <p className="text-xs text-red-500 mt-2">Enter batch number to enable.</p>}
                  </div>
                )}
                <div className={`absolute inset-0 bg-white/50 transition-opacity duration-300 ${imagePreview && batchNumber ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}></div>
                <input id="egg-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={!batchNumber} />
              </label>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!imageFile || isLoading || !batchNumber}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-amber-600 disabled:bg-slate-300 transition-all duration-200 transform hover:scale-[1.02] active:scale-100"
          >
            {isLoading ? <><Spinner /> Analyzing...</> : <><SparklesIcon className="w-5 h-5" /> Analyze & Log Result</>}
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700">Analysis Results</h3>
          <div className="bg-white rounded-xl p-6 min-h-[24rem] border border-slate-200 shadow-sm">
            {error && <p className="text-red-500">{error}</p>}
            {isLoading && (
                 <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
            )}
            {!analysis && !isLoading && <p className="text-slate-500">Enter a batch number and upload an image to see the results here.</p>}
            {analysis && <div className="text-slate-800 whitespace-pre-wrap prose prose-sm max-w-none">{analysis}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzeEgg;