"use client";

import React, { useContext } from 'react';
import { ToastStateContext } from '../contexts/ToastContext';
import { CheckIcon, InfoIcon } from './Icons';
import { ToastMessage } from '../types';

const toastConfig = {
    success: {
        icon: <CheckIcon className="w-6 h-6 text-green-500" />,
        barClass: 'bg-green-500',
    },
    error: {
        icon: <InfoIcon className="w-6 h-6 text-red-500" />,
        barClass: 'bg-red-500',
    },
    info: {
        icon: <InfoIcon className="w-6 h-6 text-blue-500" />,
        barClass: 'bg-blue-500',
    }
};

const Toast = ({ message, type }: Omit<ToastMessage, 'id'>) => {
    const config = toastConfig[type];

    return (
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden animate-fade-in w-full max-w-sm">
            <div className="flex items-center p-4">
                <div className="flex-shrink-0">
                    {config.icon}
                </div>
                <div className="ml-3 w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{message}</p>
                </div>
            </div>
            <div className={`h-1 ${config.barClass}`} />
        </div>
    );
};

const ToastContainer: React.FC = () => {
    const toasts = useContext(ToastStateContext);

    return (
        <div className="fixed top-0 right-0 z-50 p-4 sm:p-6 space-y-4 w-full max-w-md">
            {toasts.map(toast => (
                <Toast key={toast.id} message={toast.message} type={toast.type} />
            ))}
        </div>
    );
};

export default ToastContainer;
