"use client";

import React, { useState, useCallback } from 'react';
import { UploadIcon, SparklesIcon, MaleIcon, FemaleIcon } from './Icons';
import Spinner from './Spinner';

type Gender = 'male' | 'female';

const ContributeData: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setGender(null);
    const fileInput = document.getElementById('contribution-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  }, []);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleGenderSelect = (selectedGender: Gender) => {
    setGender(selectedGender);
    setError(null);
  };

  const handleSubmit = useCallback(async () => {
    if (!imageFile) {
      setError('Please upload an image.');
      return;
    }
    if (!gender) {
      setError('Please select the chick\'s gender.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // This is a simulation. In a real application, you would upload the imageFile and gender 
    // label to a secure backend service for storage and model retraining.
    console.log(`Simulating upload of ${imageFile.name} with label: ${gender}`);
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsLoading(false);
    setSuccessMessage('Thank you! Your contribution will help improve the AI model.');
    
    setTimeout(() => {
        resetForm();
        setSuccessMessage(null);
    }, 3000);

  }, [imageFile, gender, resetForm]);

  const Step = ({ number, title, children }: { number: number, title: string, children: React.ReactNode}) => (
    <div className="space-y-3">
        <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-white font-bold">{number}</div>
            <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
        </div>
        <div className="pl-11">{children}</div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800 font-serif">Help Us Improve</h2>
        <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
          Your contributions are vital for training a more accurate AI. By uploading a photo of an egg with a known outcome, you directly help advance this technology.
        </p>
      </div>

      <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-slate-200 space-y-8">
        <Step number={1} title="Upload Egg Image">
            <label htmlFor="contribution-upload" className="group flex flex-col items-center justify-center w-full h-56 border-2 border-amber-300 border-dashed rounded-lg cursor-pointer bg-amber-50 hover:bg-amber-100 transition-colors relative overflow-hidden">
              {imagePreview ? (
                 <img src={imagePreview} alt="Egg contribution preview" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              ) : (
                <div className="flex flex-col items-center justify-center">
                    <UploadIcon className="w-10 h-10 mb-3 text-amber-500" />
                    <p className="text-sm text-amber-700"><span className="font-semibold">Click to upload</span> or drag & drop</p>
                    <p className="text-xs text-amber-600">PNG, JPG, or WEBP</p>
                </div>
              )}
              <input id="contribution-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
        </Step>
        
        <Step number={2} title="Identify the Chick's Gender">
             <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => handleGenderSelect('female')}
                    className={`group flex flex-col items-center justify-center gap-2 py-4 rounded-lg border-2 transition-all duration-200 transform hover:-translate-y-1 ${gender === 'female' ? 'bg-pink-500 text-white border-pink-600 shadow-md' : 'bg-white hover:bg-pink-50 hover:border-pink-400 border-slate-300'}`}
                >
                    <FemaleIcon className={`w-8 h-8 transition-colors ${gender === 'female' ? 'text-white' : 'text-pink-400 group-hover:text-pink-500'}`} />
                    <span className="font-semibold">Female</span>
                </button>
                <button 
                    onClick={() => handleGenderSelect('male')}
                    className={`group flex flex-col items-center justify-center gap-2 py-4 rounded-lg border-2 transition-all duration-200 transform hover:-translate-y-1 ${gender === 'male' ? 'bg-blue-500 text-white border-blue-600 shadow-md' : 'bg-white hover:bg-blue-50 hover:border-blue-400 border-slate-300'}`}
                >
                    <MaleIcon className={`w-8 h-8 transition-colors ${gender === 'male' ? 'text-white' : 'text-blue-400 group-hover:text-blue-500'}`} />
                    <span className="font-semibold">Male</span>
                </button>
            </div>
        </Step>
        
        <Step number={3} title="Submit Your Data">
            <button
                onClick={handleSubmit}
                disabled={!imageFile || !gender || isLoading}
                className="w-full flex items-center justify-center gap-3 bg-amber-500 text-white font-bold py-4 px-4 rounded-lg hover:bg-amber-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
                {isLoading ? <><Spinner /> Submitting Data...</> : <><SparklesIcon className="w-6 h-6"/>Submit Contribution</>}
            </button>
        </Step>
            
        <div className="min-h-[3rem] flex items-center justify-center pt-4">
            {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg w-full text-center font-semibold animate-shake">{error}</p>}
            {successMessage && <p className="text-green-700 bg-green-100 p-3 rounded-lg w-full text-center font-semibold">{successMessage}</p>}
        </div>
      </div>
    </div>
  );
};

export default ContributeData;