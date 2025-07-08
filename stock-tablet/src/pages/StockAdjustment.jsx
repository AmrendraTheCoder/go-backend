import React from 'react';
import { TrendingUp } from 'lucide-react';

const StockAdjustment = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Stock Adjustments</h1>
                        <p className="text-sm text-gray-600">Adjust stock quantities</p>
                    </div>
                </div>

                <div className="text-center py-12">
                    <div className="text-gray-500 mb-4">
                        <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">Stock Adjustments</h3>
                        <p className="text-sm">This feature will handle stock quantity adjustments</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockAdjustment; 