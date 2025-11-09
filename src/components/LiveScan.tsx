"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { analyzeLiveFrame, checkFrameAlignment, LiveAnalysisResult } from '../services/geminiService';
import { CameraIcon, StopCircleIcon, SparklesIcon } from './Icons';
import Spinner from './Spinner';
import { BatchResult } from '../types';

interface LiveScanProps {
  addBatchResult: (result: Omit<BatchResult, 'timestamp'>) => void;
}

const LiveScan: React.FC<LiveScanProps> = ({ addBatchResult }) => {
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isAutoCaptureEnabled, setIsAutoCaptureEnabled] = useState(false);
    const [autoCaptureThreshold, setAutoCaptureThreshold] = useState(0.9);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<LiveAnalysisResult | null>(null);
    const [batchNumber, setBatchNumber] = useState<string>('');
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const captureCanvasRef = useRef<HTMLCanvasElement>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const autoCaptureIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
    const stopCamera = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        if (autoCaptureIntervalRef.current) {
            clearInterval(autoCaptureIntervalRef.current);
            autoCaptureIntervalRef.current = null;
        }
        setIsCameraOn(false);
        setIsLoading(false);
        setIsAnalyzing(false);
        setIsScanning(false);
        setAnalysisResult(null);
        setError(null);
    }, []);

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    const handleAnalyzeFrame = useCallback(async () => {
        if (!videoRef.current || !captureCanvasRef.current || isAnalyzing || !batchNumber) return;
        
        setIsAnalyzing(true);
        setError(null);
        setAnalysisResult(null);
        if (autoCaptureIntervalRef.current) {
            clearInterval(autoCaptureIntervalRef.current);
        }

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
        if (isCameraOn || !batchNumber) {
            if(!batchNumber) setError("Please enter a batch number before starting the camera.");
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
                await videoRef.current.play();
                setIsCameraOn(true);
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setError("Could not access camera. Please check permissions and try again.");
            stopCamera();
        } finally {
            setIsLoading(false);
        }
    }, [isCameraOn, stopCamera, batchNumber]);
    
    useEffect(() => {
        if (autoCaptureIntervalRef.current) {
            clearInterval(autoCaptureIntervalRef.current);
            autoCaptureIntervalRef.current = null;
            setIsScanning(false);
        }

        if (isCameraOn && isAutoCaptureEnabled && !isAnalyzing) {
            autoCaptureIntervalRef.current = setInterval(async () => {
                if (!videoRef.current || !captureCanvasRef.current || isScanning || document.hidden) {
                    return;
                }

                setIsScanning(true);
                
                const video = videoRef.current;
                const canvas = captureCanvasRef.current;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const context = canvas.getContext('2d');

                if (!context) {
                    console.error('Could not get canvas context for auto-capture.');
                    setIsScanning(false);
                    return;
                }
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(async (blob) => {
                    if (blob) {
                        try {
                            const alignmentResult = await checkFrameAlignment(blob);
                            if (alignmentResult.is_aligned && alignmentResult.confidence >= autoCaptureThreshold) {
                                if (autoCaptureIntervalRef.current) {
                                    clearInterval(autoCaptureIntervalRef.current);
                                    autoCaptureIntervalRef.current = null;
                                }
                                setIsAutoCaptureEnabled(false);
                                handleAnalyzeFrame();
                            }
                        } catch (err) {
                            console.error("Auto-capture alignment check failed:", err);
                        } finally {
                           setIsScanning(false);
                        }
                    } else {
                        setIsScanning(false);
                    }
                }, 'image/jpeg', 0.8);

            }, 2000);
        }

        return () => {
            if (autoCaptureIntervalRef.current) {
                clearInterval(autoCaptureIntervalRef.current);
                autoCaptureIntervalRef.current = null;
                setIsScanning(false);
            }
        };
    }, [isCameraOn, isAutoCaptureEnabled, isAnalyzing, isScanning, handleAnalyzeFrame, autoCaptureThreshold]);
    
    return (
        <div className="space-y-6 animate-fade-in">
             <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-800 font-serif">Live Video Scan & Analysis</h2>
                <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
                    Enter a batch number, point your camera at an egg, and capture a frame for the AI to analyze and log.
                </p>
            </div>

            {!isCameraOn && (
                 <div className="max-w-md mx-auto p-6 bg-white rounded-xl border border-slate-200">
                    <label htmlFor="batch-number-live" className="block text-sm font-bold text-slate-700 mb-2">
                        Enter Batch Number to Begin
                    </label>
                    <input
                        id="batch-number-live"
                        type="text"
                        value={batchNumber}
                        onChange={(e) => { setBatchNumber(e.target.value); setError(null); }}
                        placeholder="e.g., BATCH-002B"
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                </div>
            )}

            <div className={`relative w-full max-w-4xl mx-auto aspect-video bg-slate-900 rounded-lg overflow-hidden border-4 shadow-inner transition-colors duration-500 ${isAnalyzing ? 'border-amber-500' : 'border-slate-200'}`}>
                {isAnalyzing && <div className="absolute inset-0 border-4 border-amber-500 rounded-lg animate-pulse-slow z-10 pointer-events-none"></div>}
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <canvas ref={captureCanvasRef} className="hidden" />
                
                {isScanning && !isAnalyzing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white p-4 z-20">
                        <Spinner />
                        <p className="mt-2 font-semibold">Scanning for a clear shot...</p>
                        <p className="text-sm text-slate-300">Hold egg steady in the center.</p>
                    </div>
                )}
                
                {!isCameraOn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 text-center p-4">
                        {isLoading ? (
                            <>
                                <Spinner size="lg" />
                                <p className="text-slate-300 mt-4 text-lg font-semibold">Initializing Camera...</p>
                                <p className="text-slate-400 mt-1 text-sm">Please allow camera permissions if prompted.</p>
                            </>
                        ) : (
                            <>
                                <CameraIcon className="w-24 h-24 text-slate-600" />
                                <p className="text-slate-400 mt-2">Enter a batch number, then start the camera.</p>
                            </>
                        )}
                    </div>
                )}
            </div>

             <div className="flex flex-col items-center gap-4">
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
                            disabled={isAnalyzing || isAutoCaptureEnabled}
                            className="w-44 flex items-center justify-center gap-3 bg-blue-500 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 disabled:bg-slate-400 disabled:scale-100"
                        >
                        {isAnalyzing ? <Spinner /> : <SparklesIcon className="w-6 h-6" />}
                        {isAnalyzing ? 'Analyzing...' : 'Analyze & Log'}
                        </button>
                    )}
                </div>
                {isCameraOn && (
                    <div className="p-4 bg-slate-100 rounded-lg w-full max-w-sm">
                        <label className="flex items-center cursor-pointer select-none">
                            <input 
                                type="checkbox" 
                                checked={isAutoCaptureEnabled}
                                onChange={(e) => setIsAutoCaptureEnabled(e.target.checked)}
                                className="sr-only peer"
                                disabled={!isCameraOn || isAnalyzing}
                            />
                            <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                            <span className="ms-3 text-sm font-medium text-slate-700">Automatic Capture</span>
                        </label>
                        {isAutoCaptureEnabled && (
                            <div className="w-full mt-3 space-y-2 animate-fade-in">
                                <label htmlFor="threshold-slider" className="flex justify-between items-center text-xs font-medium text-slate-600">
                                <span>Capture Confidence Threshold</span>
                                <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                    {Math.round(autoCaptureThreshold * 100)}%
                                </span>
                                </label>
                                <input
                                id="threshold-slider"
                                type="range"
                                min="0.7"
                                max="0.99"
                                step="0.01"
                                value={autoCaptureThreshold}
                                onChange={(e) => setAutoCaptureThreshold(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                disabled={isScanning || isAnalyzing}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
             
             <div className="max-w-4xl mx-auto">
                {error && <p className="text-center text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}

                {analysisResult && (
                    <div className="mt-4 p-4 bg-white border border-slate-200 rounded-lg animate-fade-in">
                        <h3 className="font-semibold text-lg text-slate-800">Latest Analysis Result</h3>
                        <p className="text-3xl font-bold mt-2">
                            Prediction: <span className={analysisResult.prediction === 'Female' ? 'text-pink-600' : 'text-blue-600'}>
                                {analysisResult.prediction || 'Unknown'}
                            </span>
                        </p>
                        <p className="text-slate-700 mt-2 whitespace-pre-wrap">{analysisResult.analysis_text}</p>
                    </div>
                )}
             </div>
        </div>
    );
};

export default LiveScan;