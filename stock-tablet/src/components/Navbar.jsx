import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Package,
    List,
    TrendingUp,
    AlertTriangle,
    Settings,
    Plus
} from 'lucide-react';

const Navbar = () => {
    const navItems = [
        {
            path: '/stock-entry',
            icon: Plus,
            label: 'Add Stock',
            color: 'text-emerald-600'
        },
        {
            path: '/inventory',
            icon: List,
            label: 'Inventory',
            color: 'text-blue-600'
        },
        {
            path: '/adjustments',
            icon: TrendingUp,
            label: 'Adjustments',
            color: 'text-purple-600'
        },
        {
            path: '/alerts',
            icon: AlertTriangle,
            label: 'Alerts',
            color: 'text-orange-600'
        },
        {
            path: '/settings',
            icon: Settings,
            label: 'Settings',
            color: 'text-gray-600'
        }
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
            <div className="flex justify-around items-center">
                {navItems.map(({ path, icon: Icon, label, color }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-0 ${isActive
                                ? `${color} bg-gray-50 font-medium`
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`
                        }
                    >
                        <Icon className="w-6 h-6 flex-shrink-0" />
                        <span className="text-xs leading-tight text-center truncate">
                            {label}
                        </span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default Navbar; 