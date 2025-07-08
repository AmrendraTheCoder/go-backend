import React from 'react';
import { Package } from 'lucide-react';

const InventoryList = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Package className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Inventory List</h1>
                        <p className="text-sm text-gray-600">View and manage stock items</p>
                    </div>
                </div>

                <div className="text-center py-12">
                    <div className="text-gray-500 mb-4">
                        <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">Inventory List</h3>
                        <p className="text-sm">This feature will show all stock items</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryList; 