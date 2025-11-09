import React, { useState, useMemo, useCallback } from 'react';
import { simulateRusBoostPrediction } from '../services/geminiService';
import { SparklesIcon, BeakerIcon } from './Icons';
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
    if (long_axis === 0) return null;

    const shape_index = short_axis / long_axis;
    // Assuming cross point AE is roughly 45% of long axis for an average egg for this calculation
    const cross_point_ae = long_axis * 0.45; 
    const ovality = (long_axis - cross_point_ae) / long_axis;
    
    // Formulas from the research paper
    const surface_area = 4.835 * Math.pow(mass, 0.662);
    const volume = Math.pow(surface_area / 4.951, 1 / 0.666);
    const density = mass / volume;

    return {
      shape_index,
      ovality,
      surface_area,
      volume,
      density,
    };
  }, [measurements]);

  const handleMeasurementChange = (param: keyof Measurements, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setMeasurements(prev => ({ ...prev, [param]: numValue }));
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!derivedMetrics) {
        setError("Invalid measurements. Long axis cannot be zero.");
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
      <label className="flex justify-between items-center text-sm font-medium text-gray-700">
        <span>{label}</span>
        <input 
          type="number"
          value={value}
          onChange={(e) => handleMeasurementChange(param, e.target.value)}
          className="w-24 p-1 text-right border border-gray-300 rounded-md"
        />
      </label>
      <div className="flex items-center gap-2">
         <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => handleMeasurementChange(param, e.target.value)}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <span className="text-xs text-gray-500 w-8 text-center">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-700">RUSBoost Model Simulator</h2>
      <p className="text-gray-600">
        Interactively explore how different egg measurements influence the chick sex prediction based on a simulated RUSBoosted Trees classifier. Adjust the sliders to see how the model might react.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 border border-gray-200 rounded-lg bg-white space-y-6">
            <h3 className="font-semibold text-lg text-gray-800">Input Measurements</h3>
            <SliderInput label="Mass" unit="g" value={measurements.mass} min={40} max={75} step={0.1} param="mass" />
            <SliderInput label="Long Axis" unit="mm" value={measurements.long_axis} min={45} max={70} step={0.1} param="long_axis" />
            <SliderInput label="Short Axis" unit="mm" value={measurements.short_axis} min={35} max={50} step={0.1} param="short_axis" />
             <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-amber-600 disabled:bg-gray-300 transition-colors"
             >
                {isLoading ? <><Spinner /> Predicting...</> : <><SparklesIcon className="w-5 h-5" /> Calculate & Predict</>}
            </button>
        </div>
        
        <div className="space-y-4">
            {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
            
            {derivedMetrics && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-2">Derived Metrics</h3>
                    <ul className="text-sm space-y-1 text-gray-600">
                        <li><strong>Shape Index:</strong> {derivedMetrics.shape_index.toFixed(4)}</li>
                        <li><strong>Ovality (approx.):</strong> {derivedMetrics.ovality.toFixed(4)}</li>
                        <li><strong>Surface Area:</strong> {derivedMetrics.surface_area.toFixed(2)} cm²</li>
                        <li><strong>Volume:</strong> {derivedMetrics.volume.toFixed(2)} cm³</li>
                        <li><strong>Density:</strong> {derivedMetrics.density.toFixed(4)} g/cm³</li>
                    </ul>
                </div>
            )}

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg min-h-[140px] flex flex-col justify-center items-center">
                <h3 className="font-semibold text-gray-700 mb-2 self-start">Model Prediction</h3>
                {isLoading && <Spinner />}
                {!isLoading && !result && <p className="text-gray-500">Prediction will appear here.</p>}
                {result && (
                    <div className="text-center">
                        <p className={`text-4xl font-bold ${result.prediction === 'female' ? 'text-pink-600' : 'text-blue-600'}`}>
                            {result.prediction.charAt(0).toUpperCase() + result.prediction.slice(1)}
                        </p>
                        <p className="text-sm text-gray-600">
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
