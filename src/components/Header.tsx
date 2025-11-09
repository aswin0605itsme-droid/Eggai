import React from 'react';
import { EggIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-sm text-center p-6 sm:p-8 shadow-sm border-b border-slate-200 sticky top-0 z-10">
      <div className="flex justify-center items-center gap-4">
         <EggIcon className="w-12 h-12 text-amber-500" />
        <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Chick-Sexing AI Assistant</h1>
            <p className="text-slate-600 mt-2 text-sm sm:text-base max-w-2xl">Predicting chick sex from egg morphology to build a more ethical and efficient poultry industry.</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
