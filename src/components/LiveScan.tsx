"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { analyzeLiveFrame, checkFrameAlignment, LiveAnalysisResult } from '../services/geminiService';
import { CameraIcon, StopCircleIcon, ShutterIcon } from './Icons';
import Spinner from './Spinner';
import { BatchResult } from '../types';

interface LiveScanProps {
  addBatchResult: (result: Omit<BatchResult, 'timestamp'>) => void;
}

const LiveScan: React.FC<LiveScanProps> = ({ addBatchResult }) => {
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<LiveAnalysisResult | null>(null);
    const [batchNumber, setBatchNumber] = useState<string>('');
    const [alignment, setAlignment] = useState({ confidence: 0, color: 'border-slate-700' });
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const captureCanvasRef = useRef<HTMLCanvasElement>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const frameCheckIntervalRef = useRef<number | null>(null);

    const stopCamera = useCallback(() => {
        if (frameCheckIntervalRef.current) {
            clearInterval(frameCheckIntervalRef.current);
            frameCheckIntervalRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
        setIsLoading(false);
        setIsAnalyzing(false);
        setAnalysisResult(null);
        setError(null);
        setAlignment({ confidence: 0, color: 'border-slate-700' });
    }, []);

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    const handleAnalyzeFrame = useCallback(async () => {
        if (!videoRef.current || !captureCanvasRef.current || isAnalyzing || !batchNumber) {
            if (!batchNumber) setError("Please enter a batch number first.");
            return;
        }
        
        setIsAnalyzing(true);
        setError(null);
        setAnalysisResult(null);

        const video = videoRef.current;
        const canvas = captureCanvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');

        if (!context) {
            setError('Could not get canvas context.');
            setIsAnalyzing(false);
            return;
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
            if (blob) {
                try {
                    const result = await analyzeLiveFrame(blob);
                    setAnalysisResult(result);
                    addBatchResult({ batchNumber, prediction: result.prediction || 'Unknown', source: 'Live Scan' });
                } catch (err) {
                    setError("Frame analysis failed. The AI couldn't determine a result. Please try again with a clearer image.");
                    console.error(err);
                } finally {
                    setIsAnalyzing(false);
                }
            } else {
                setError("Failed to capture frame from video.");
                setIsAnalyzing(false);
            }
        }, 'image/jpeg', 0.9);
    }, [isAnalyzing, batchNumber, addBatchResult]);

    const startCamera = useCallback(async () => {
        if (isCameraOn) return;
        if (!batchNumber) {
            setError("Please enter a batch number before starting the camera.");
            return;
        };
        stopCamera();
        setIsLoading(true);
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
            mediaStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setIsCameraOn(true);
                    
                    frameCheckIntervalRef.current = window.setInterval(async () => {
                        if (!videoRef.current || !captureCanvasRef.current || videoRef.current.paused || videoRef.current.ended) return;
                        
                        const video = videoRef.current;
                        const canvas = captureCanvasRef.current;
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        const context = canvas.getContext('2d');
                        if (!context) return;
                        context.drawImage(video, 0, 0, canvas.width, canvas.height);
                        
                        canvas.toBlob(async (blob) => {
                            if (blob) {
                                const alignResult = await checkFrameAlignment(blob);
                                const confidence = alignResult.confidence;
                                let color = 'border-red-500';
                                if (confidence > 0.8) color = 'border-green-500';
                                else if (confidence > 0.5) color = 'border-yellow-500';
                                setAlignment({ confidence, color });
                            }
                        }, 'image/jpeg', 0.8);
                    }, 1500);
                };
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setError("Could not access camera. Please check permissions and try again.");
            stopCamera();
        } finally {
            setIsLoading(false);
        }
    }, [isCameraOn, stopCamera, batchNumber]);
    
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-800 font-serif">Live Video Scan & Analysis</h2>
                <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
                    Enter a batch number, point your camera at an egg, and capture a frame for real-time analysis.
                </p>
            </div>

            <div className="max-w-md mx-auto">
                <label htmlFor="batch-number-live" className="block text-sm font-bold text-slate-700 mb-2">
                    Enter Batch Number
                </label>
                <input
                    id="batch-number-live"
                    type="text"
                    value={batchNumber}
                    onChange={(e) => { setBatchNumber(e.target.value); setError(null); }}
                    placeholder="e.g., BATCH-002B"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 transition"
                    disabled={isCameraOn}
                />
            </div>

            <div className={`relative w-full max-w-4xl mx-auto aspect-video bg-slate-900 rounded-xl overflow-hidden border-4 shadow-inner transition-colors duration-500 ${isAnalyzing ? 'border-amber-500 animate-pulse' : alignment.color}`}>
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <canvas ref={captureCanvasRef} className="hidden" />
                
                {!isCameraOn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 p-4 text-center">
                        <CameraIcon className="w-24 h-24 text-slate-600" />
                        <p className="text-slate-400 mt-2">Enter a batch number, then start the camera.</p>
                    </div>
                )}

                {isCameraOn && (
                    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-4">
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-500" style={{ width: `${alignment.confidence * 100}%` }} />
                        </div>
                        <span className="text-xs font-bold text-white bg-slate-800/50 px-2 py-1 rounded-md">{`${(alignment.confidence * 100).toFixed(0)}% Alignment`}</span>
                    </div>
                )}
            </div>

             <div className="flex flex-wrap justify-center items-center gap-4">
                 <button
                    onClick={isCameraOn ? stopCamera : startCamera}
                    disabled={isLoading || (!batchNumber && !isCameraOn)}
                    className={`w-44 flex items-center justify-center gap-3 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 disabled:bg-slate-400 disabled:scale-100
                        ${isCameraOn ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}
                >
                    {isLoading ? <Spinner /> : isCameraOn ? <StopCircleIcon className="w-6 h-6" /> : <CameraIcon className="w-6 h-6" />}
                    {isLoading ? 'Starting...' : isCameraOn ? 'Stop Camera' : 'Start Camera'}
                </button>
                
                {isCameraOn && (
                    <button
                        onClick={handleAnalyzeFrame}
                        disabled={isAnalyzing || alignment.confidence < 0.8}
                        className="w-44 flex items-center justify-center gap-3 bg-blue-500 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 disabled:bg-slate-400 disabled:scale-100 disabled:cursor-not-allowed"
                        title={alignment.confidence < 0.8 ? "Improve alignment to analyze" : "Analyze frame"}
                    >
                       {isAnalyzing ? <Spinner /> : <ShutterIcon className="w-6 h-6" />}
                       {isAnalyzing ? 'Analyzing...' : 'Analyze & Log'}
                    </button>
                )}
            </div>
             
             <div className="max-w-4xl mx-auto">
                {error && <p className="text-center text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}

                {analysisResult && (
                    <div className="mt-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm animate-fade-in">
                        <h3 className="font-semibold text-lg text-slate-800">Latest Analysis Result</h3>
                        <p className="text-3xl font-bold mt-2">
                            Prediction: <span className={analysisResult.prediction === 'Female' ? 'text-pink-600' : 'text-blue-600'}>
                                {analysisResult.prediction || 'Unknown'}
                            </span>
                        </p>
                        <p className="text-slate-700 mt-2 whitespace-pre-wrap prose prose-sm max-w-none">{analysisResult.analysis_text}</p>
                    </div>
                )}
             </div>
        </div>
    );
};

export default LiveScan;
