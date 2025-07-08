import React, { useState } from 'react';
import { Package, User, Lock, Wifi, WifiOff, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const LoginPage = () => {
    const { login, isLoading, error, isConnected, getConnectionStatus } = useAuthStore();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        warehouse: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showDemoCredentials, setShowDemoCredentials] = useState(true);

    const warehouses = [
        { id: 'warehouse-a', name: 'Warehouse A', location: 'Building A' },
        { id: 'warehouse-b', name: 'Warehouse B', location: 'Building B' },
        { id: 'quality-control', name: 'Quality Control', location: 'QC Lab' },
        { id: 'receiving', name: 'Receiving Area', location: 'Loading Dock' },
        { id: 'shipping', name: 'Shipping Area', location: 'Dispatch' }
    ];

    const demoCredentials = [
        {
            title: 'Demo Stock Manager',
            email: 'demo@stockmanager.com',
            password: 'demo123',
            warehouse: 'warehouse-a',
            description: 'General stock management access'
        },
        {
            title: 'Warehouse Supervisor',
            email: 'supervisor@warehouse.com',
            password: 'supervisor123',
            warehouse: 'warehouse-a',
            description: 'Supervisor-level access'
        },
        {
            title: 'QC Stock Manager',
            email: 'qc@qualitycontrol.com',
            password: 'qc123',
            warehouse: 'quality-control',
            description: 'Quality control stock management'
        }
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password || !formData.warehouse) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const result = await login({
                email: formData.email,
                password: formData.password,
                warehouse: formData.warehouse,
                userType: 'stock-manager'
            });

            if (!result.success) {
                console.error('Login failed:', result.error);
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    const fillDemoCredentials = (demo) => {
        setFormData({
            email: demo.email,
            password: demo.password,
            warehouse: demo.warehouse
        });
    };

    const connectionStatus = getConnectionStatus();

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-emerald-600 p-3 rounded-full">
                            <Package className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
                    <p className="text-gray-600 mt-2">Tablet Interface</p>
                </div>

                {/* Connection Status */}
                <div className="mb-6">
                    <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${connectionStatus.status === 'connected'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : connectionStatus.status === 'reconnecting'
                                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {connectionStatus.status === 'connected' ? (
                            <Wifi className="w-4 h-4" />
                        ) : (
                            <WifiOff className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">{connectionStatus.message}</span>
                    </div>
                </div>

                {/* Demo Credentials */}
                {showDemoCredentials && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-blue-900">Demo Credentials</h3>
                            <button
                                onClick={() => setShowDemoCredentials(false)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                                Hide
                            </button>
                        </div>
                        <div className="space-y-2">
                            {demoCredentials.map((demo, index) => (
                                <button
                                    key={index}
                                    onClick={() => fillDemoCredentials(demo)}
                                    className="w-full text-left p-2 bg-white rounded border hover:bg-blue-50 transition-colors"
                                >
                                    <div className="font-medium text-blue-900 text-sm">{demo.title}</div>
                                    <div className="text-xs text-blue-600">{demo.description}</div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        {demo.email} / {demo.password}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Login Form */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Warehouse/Location
                            </label>
                            <select
                                value={formData.warehouse}
                                onChange={(e) => handleInputChange('warehouse', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg"
                                required
                            >
                                <option value="">Select Warehouse</option>
                                {warehouses.map(warehouse => (
                                    <option key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name} - {warehouse.location}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-6 py-4 bg-emerald-600 text-white rounded-lg font-medium text-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Signing In...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-sm text-gray-500">
                        Stock Management Tablet v1.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage; 