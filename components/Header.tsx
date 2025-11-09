
import React from 'react';
import { EggIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="bg-amber-100 text-center p-6 sm:p-8 shadow-sm">
      <div className="flex justify-center items-center gap-4">
         <EggIcon className="w-12 h-12 text-amber-500" />
        <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-amber-900">Chick-Sexing AI Assistant</h1>
            <p className="text-amber-800 mt-2 text-sm sm:text-base">Predicting chick sex from egg morphology to build a more ethical and efficient poultry industry.</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
