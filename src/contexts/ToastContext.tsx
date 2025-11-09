"use client";

import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { ToastMessage, ToastType } from '../types';

type ToastContextType = (message: string, type: ToastType) => void;

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
export const ToastStateContext = createContext<ToastMessage[]>([]);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now();
        setToasts(prevToasts => [...prevToasts, { id, message, type }]);
        setTimeout(() => {
            setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
        }, 5000);
    }, []);

    return (
        <ToastContext.Provider value={addToast}>
            <ToastStateContext.Provider value={toasts}>
                {children}
            </ToastStateContext.Provider>
        </ToastContext.Provider>
    );
};
