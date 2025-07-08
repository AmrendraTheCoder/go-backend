import React, { useState } from 'react';
import { Package, Plus, Scan, Camera, Check, X, AlertTriangle, Wifi, WifiOff } from 'lucide-react';

const StockEntry = () => {
    const [formData, setFormData] = useState({
        itemName: '',
        category: '',
        quantity: '',
        unit: '',
        location: '',
        supplier: '',
        batchNumber: '',
        expiryDate: '',
        costPrice: '',
        sellingPrice: '',
        minStockLevel: '',
        description: '',
        barcode: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const categories = [
        'Raw Materials',
        'Finished Goods',
        'Work in Progress',
        'Spare Parts',
        'Consumables',
        'Packaging',
        'Tools & Equipment'
    ];

    const units = [
        'pieces',
        'kg',
        'grams',
        'liters',
        'meters',
        'sheets',
        'rolls',
        'boxes',
        'sets'
    ];

    const locations = [
        'Warehouse A1',
        'Warehouse A2',
        'Warehouse B1',
        'Warehouse B2',
        'Production Floor',
        'Quality Control',
        'Shipping Area',
        'Receiving Area'
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.itemName || !formData.category || !formData.quantity) {
            alert('Please fill in all required fields (Item Name, Category, Quantity)');
            return;
        }

        setIsLoading(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            setShowSuccess(true);
            console.log('Stock item added:', formData);

            // Reset form after successful submission
            setTimeout(() => {
                setFormData({
                    itemName: '',
                    category: '',
                    quantity: '',
                    unit: '',
                    location: '',
                    supplier: '',
                    batchNumber: '',
                    expiryDate: '',
                    costPrice: '',
                    sellingPrice: '',
                    minStockLevel: '',
                    description: '',
                    barcode: ''
                });
                setShowSuccess(false);
                setIsLoading(false);
            }, 2000);

        } catch (error) {
            console.error('Error adding stock item:', error);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Package className="w-8 h-8 text-emerald-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Stock Entry</h1>
                            <p className="text-sm text-gray-600">Add new items to inventory</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Wifi className="w-5 h-5 text-green-500" />
                            <span className="text-sm text-green-600 font-medium">Online</span>
                        </div>

                        <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">Stock Manager</div>
                            <div className="text-xs text-gray-600">Warehouse A</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {showSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                    <Check className="w-6 h-6 text-green-600" />
                    <div>
                        <h3 className="font-medium text-green-800">Stock Item Added Successfully!</h3>
                        <p className="text-sm text-green-600">The item has been added to the inventory.</p>
                    </div>
                </div>
            )}

            {/* Stock Entry Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Item Name *
                            </label>
                            <input
                                type="text"
                                value={formData.itemName}
                                onChange={(e) => handleInputChange('itemName', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                                placeholder="Enter item name"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category *
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => handleInputChange('category', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantity *
                            </label>
                            <input
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => handleInputChange('quantity', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                                placeholder="0"
                                min="0"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Unit
                            </label>
                            <select
                                value={formData.unit}
                                onChange={(e) => handleInputChange('unit', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                            >
                                <option value="">Select Unit</option>
                                {units.map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Storage Location
                            </label>
                            <select
                                value={formData.location}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                            >
                                <option value="">Select Location</option>
                                {locations.map(location => (
                                    <option key={location} value={location}>{location}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Supplier
                            </label>
                            <input
                                type="text"
                                value={formData.supplier}
                                onChange={(e) => handleInputChange('supplier', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                                placeholder="Supplier name"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                            placeholder="Additional notes or description"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-lg font-medium text-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Adding Item...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    Add to Inventory
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockEntry; 