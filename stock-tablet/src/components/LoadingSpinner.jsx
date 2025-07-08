import React from 'react';
import { Package } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
                <Package className="w-12 h-12 text-emerald-600 animate-bounce" />
                <div className="absolute inset-0 w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-lg font-medium text-gray-700">{message}</p>
        </div>
    );
};

export default LoadingSpinner; 