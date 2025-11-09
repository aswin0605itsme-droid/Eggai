import React, { useState, useMemo, useCallback } from 'react';
import { simulateRusBoostPrediction } from '../services/geminiService';
import { SparklesIcon } from './Icons';
import Spinner from './Spinner';

interface Measurements {
  mass: number;
  long_axis: number;
  short_axis: number;
}

interface PredictionResult {
    prediction: 'male' | 'female';
    confidence: number;
}

const ModelSimulator: React.FC = () => {
  const [measurements, setMeasurements] = useState<Measurements>({
    mass: 58,
    long_axis: 57,
    short_axis: 43,
  });
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const derivedMetrics = useMemo(() => {
    const { mass, long_axis, short_axis } = measurements;
    if (long_axis === 0 || mass === 0) return null;

    const shape_index = short_axis / long_axis;
    const cross_point_ae = long_axis * 0.45; 
    const ovality = (long_axis - cross_point_ae) / long_axis;
    
    const surface_area = 4.835 * Math.pow(mass, 0.662);
    const volume = Math.pow(surface_area / 4.951, 1 / 0.666);
    const density = mass / volume;

    return { shape_index, ovality, surface_area, volume, density };
  }, [measurements]);

  const handleMeasurementChange = (param: keyof Measurements, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setMeasurements(prev => ({ ...prev, [param]: numValue }));
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!derivedMetrics) {
        setError("Invalid measurements. Long axis and mass cannot be zero.");
        return;
    }
    
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
        const fullMeasurements = { ...measurements, ...derivedMetrics };
        const predictionResult = await simulateRusBoostPrediction(fullMeasurements);
        setResult(predictionResult);

    } catch(err) {
        setError("Failed to get prediction from the simulated model.");
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [measurements, derivedMetrics]);
  
  const SliderInput = ({ label, unit, value, min, max, step, param }: { label: string; unit: string; value: number; min: number; max: number; step: number; param: keyof Measurements; }) => (
    <div className="space-y-2">
      <label className="flex justify-between items-center text-sm font-medium text-slate-700">
        <span>{label}</span>
        <span className="px-2 py-1 text-sm bg-slate-100 rounded-md">{value} {unit}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => handleMeasurementChange(param, e.target.value)}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
      />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800">RUSBoost Model Simulator</h2>
        <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
          Interactively explore how different egg measurements influence the chick sex prediction based on a simulated classifier.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-6">
            <h3 className="font-semibold text-lg text-slate-800">Input Measurements</h3>
            <SliderInput label="Mass" unit="g" value={measurements.mass} min={40} max={75} step={0.1} param="mass" />
            <SliderInput label="Long Axis" unit="mm" value={measurements.long_axis} min={45} max={70} step={0.1} param="long_axis" />
            <SliderInput label="Short Axis" unit="mm" value={measurements.short_axis} min={35} max={50} step={0.1} param="short_axis" />
             <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-amber-600 disabled:bg-slate-300 transition-colors"
             >
                {isLoading ? <><Spinner /> Predicting...</> : <><SparklesIcon className="w-5 h-5" /> Calculate & Predict</>}
            </button>
        </div>
        
        <div className="space-y-4">
            {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
            
            {derivedMetrics && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl">
                    <h3 className="font-semibold text-slate-700 mb-2">Derived Metrics</h3>
                    <ul className="text-sm space-y-1 text-slate-600 grid grid-cols-2 gap-x-4">
                        <li><strong>Shape Index:</strong> {derivedMetrics.shape_index.toFixed(4)}</li>
                        <li><strong>Ovality:</strong> {derivedMetrics.ovality.toFixed(4)}</li>
                        <li><strong>Surface Area:</strong> {derivedMetrics.surface_area.toFixed(2)} cm²</li>
                        <li><strong>Volume:</strong> {derivedMetrics.volume.toFixed(2)} cm³</li>
                        <li className="col-span-2"><strong>Density:</strong> {derivedMetrics.density.toFixed(4)} g/cm³</li>
                    </ul>
                </div>
            )}

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl min-h-[140px] flex flex-col justify-center items-center">
                <h3 className="font-semibold text-slate-700 mb-2 self-start">Model Prediction</h3>
                {isLoading && <Spinner />}
                {!isLoading && !result && <p className="text-slate-500">Prediction will appear here.</p>}
                {result && (
                    <div className="text-center">
                        <p className={`text-5xl font-bold ${result.prediction === 'female' ? 'text-pink-600' : 'text-blue-600'}`}>
                            {result.prediction.charAt(0).toUpperCase() + result.prediction.slice(1)}
                        </p>
                        <p className="text-sm text-slate-600">
                           Confidence: <span className="font-semibold">{(result.confidence * 100).toFixed(1)}%</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSimulator;