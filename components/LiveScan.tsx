import React, { useState, useRef, useCallback, useEffect } from 'react';
import { analyzeLiveFrame, LiveAnalysisResult } from '../services/geminiService';
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
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<LiveAnalysisResult | null>(null);
    const [batchNumber, setBatchNumber] = useState<string>('');
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const captureCanvasRef = useRef<HTMLCanvasElement>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    
    const stopCamera = useCallback(() => {
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
    }, []);

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    const handleAnalyzeFrame = useCallback(async () => {
        if (!videoRef.current || !captureCanvasRef.current || isAnalyzing || !batchNumber) return;
        
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
    
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-700">Live Video Scan & Analysis</h2>
            <p className="text-gray-600">
                Enter a batch number, point your camera at an egg, and capture a frame for the AI to analyze and log.
            </p>

            <div className="max-w-md mx-auto">
                <label htmlFor="batch-number-live" className="block text-lg font-semibold text-gray-700 mb-2">
                    Enter Batch Number
                </label>
                <input
                    id="batch-number-live"
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="e.g., BATCH-002B"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    disabled={isCameraOn}
                />
            </div>

            <div className={`relative w-full max-w-4xl mx-auto aspect-video bg-gray-900 rounded-lg overflow-hidden border-4 shadow-inner transition-colors duration-500 ${isAnalyzing ? 'border-amber-500 animate-pulse' : 'border-gray-200'}`}>
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <canvas ref={captureCanvasRef} className="hidden" />
                
                {!isCameraOn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
                        <CameraIcon className="w-24 h-24 text-gray-600" />
                        <p className="text-gray-400 mt-2">Enter a batch number, then start the camera.</p>
                    </div>
                )}
            </div>

             <div className="flex flex-wrap justify-center items-center gap-4">
                 <button
                    onClick={isCameraOn ? stopCamera : startCamera}
                    disabled={isLoading || (!batchNumber && !isCameraOn)}
                    className={`w-44 flex items-center justify-center gap-3 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:scale-100
                        ${isCameraOn ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}
                >
                    {isLoading ? <Spinner /> : isCameraOn ? <StopCircleIcon className="w-6 h-6" /> : <CameraIcon className="w-6 h-6" />}
                    {isLoading ? 'Starting...' : isCameraOn ? 'Stop Camera' : 'Start Camera'}
                </button>
                
                {isCameraOn && (
                    <button
                        onClick={handleAnalyzeFrame}
                        disabled={isAnalyzing}
                        className="w-44 flex items-center justify-center gap-3 bg-blue-500 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:scale-100"
                    >
                       {isAnalyzing ? <Spinner /> : <SparklesIcon className="w-6 h-6" />}
                       {isAnalyzing ? 'Analyzing...' : 'Analyze & Log'}
                    </button>
                )}
            </div>
             
             <div className="max-w-4xl mx-auto">
                {error && <p className="text-center text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}

                {analysisResult && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h3 className="font-semibold text-lg text-gray-800">Latest Analysis Result</h3>
                        <p className="text-3xl font-bold mt-2">
                            Prediction: <span className={analysisResult.prediction === 'Female' ? 'text-pink-600' : 'text-blue-600'}>
                                {analysisResult.prediction || 'Unknown'}
                            </span>
                        </p>
                        <p className="text-gray-700 mt-2 whitespace-pre-wrap">{analysisResult.analysis_text}</p>
                    </div>
                )}
             </div>
        </div>
    );
};

export default LiveScan;