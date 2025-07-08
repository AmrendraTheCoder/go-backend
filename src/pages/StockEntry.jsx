import React, { useState, useEffect } from 'react';
import { Package, Plus, Scan, Camera, Check, X, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { useStockStore } from '../stores/stockStore';
import { useAuthStore } from '../stores/authStore';

const StockEntry = () => {
    const { user, isConnected } = useAuthStore();
    const { addStockItem, isLoading, error } = useStockStore();

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

    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [photos, setPhotos] = useState([]);
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

        try {
            const stockItem = {
                ...formData,
                quantity: parseInt(formData.quantity),
                costPrice: parseFloat(formData.costPrice) || 0,
                sellingPrice: parseFloat(formData.sellingPrice) || 0,
                minStockLevel: parseInt(formData.minStockLevel) || 0,
                photos: photos,
                enteredBy: user?.id,
                enteredAt: new Date().toISOString()
            };

            await addStockItem(stockItem);
            setShowSuccess(true);

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
                setPhotos([]);
                setShowSuccess(false);
            }, 2000);

        } catch (error) {
            console.error('Error adding stock item:', error);
        }
    };

    const handlePhotoCapture = (photoData) => {
        setPhotos(prev => [...prev, photoData]);
        setShowCamera(false);
    };

    const removePhoto = (index) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleBarcodeScanned = (barcode) => {
        handleInputChange('barcode', barcode);
        setShowBarcodeScanner(false);
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
                            {isConnected ? (
                                <>
                                    <Wifi className="w-5 h-5 text-green-500" />
                                    <span className="text-sm text-green-600 font-medium">Online</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="w-5 h-5 text-red-500" />
                                    <span className="text-sm text-red-600 font-medium">Offline</span>
                                </>
                            )}
                        </div>

                        <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                            <div className="text-xs text-gray-600">Stock Manager</div>
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

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <div>
                        <h3 className="font-medium text-red-800">Error</h3>
                        <p className="text-sm text-red-600">{error}</p>
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

                    {/* Additional Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Batch Number
                            </label>
                            <input
                                type="text"
                                value={formData.batchNumber}
                                onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                                placeholder="Batch/Lot number"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Expiry Date
                            </label>
                            <input
                                type="date"
                                value={formData.expiryDate}
                                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cost Price
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.costPrice}
                                onChange={(e) => handleInputChange('costPrice', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                                placeholder="0.00"
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Selling Price
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.sellingPrice}
                                onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                                placeholder="0.00"
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Minimum Stock Level
                            </label>
                            <input
                                type="number"
                                value={formData.minStockLevel}
                                onChange={(e) => handleInputChange('minStockLevel', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                                placeholder="0"
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Barcode
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.barcode}
                                    onChange={(e) => handleInputChange('barcode', e.target.value)}
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                                    placeholder="Enter or scan barcode"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowBarcodeScanner(true)}
                                    className="px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                >
                                    <Scan className="w-5 h-5" />
                                </button>
                            </div>
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

                    {/* Photos */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Photos
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {photos.map((photo, index) => (
                                <div key={index} className="relative">
                                    <img
                                        src={photo}
                                        alt={`Stock item ${index + 1}`}
                                        className="w-full h-32 object-cover rounded-lg border"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(index)}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setShowCamera(true)}
                                className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-emerald-500 transition-colors"
                            >
                                <Camera className="w-6 h-6 text-gray-400" />
                                <span className="text-sm text-gray-500">Add Photo</span>
                            </button>
                        </div>
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