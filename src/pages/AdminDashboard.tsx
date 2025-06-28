import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getToken } from "../../utils/auth";
import Chart from "./MonthlyChart"; 

import {
  LayoutDashboard,
  Users,
  UserCheck,
  Settings,
  Package,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

import DashboardOverview from '../components/admin/DashboardOverview';
import CustomerManagement from '../components/admin/CustomerManagement';
import EmployeeManagement from '../components/admin/EmployeeManagement';
import ServiceManagement from '../components/admin/ServiceManagement';
import OrderManagement from '../components/admin/OrderManagement';
import FinancialReports from '../components/admin/FinancialReports';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Pelanggan', href: '/admin/customers', icon: Users },
    { name: 'Karyawan', href: '/admin/employees', icon: UserCheck },
    { name: 'Layanan', href: '/admin/services', icon: Settings },
    { name: 'Pesanan', href: '/admin/orders', icon: Package },
    { name: 'Laporan Keuangan', href: '/admin/reports', icon: TrendingUp },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-800/80 backdrop-blur-xl border-r border-gray-700
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              LaundryZone
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href === '/admin' && location.pathname === '/admin/');

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-3 mb-4 px-4 py-3 bg-gray-700/50 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div>
              <p className="text-white font-medium">{user?.name}</p>
              <p className="text-gray-400 text-sm capitalize">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Keluar</span>
          </button>
        </div>
      </div>

      <div className="flex-1 lg:ml-0">
        <header className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <h1 className="text-2xl font-bold text-white">
                  {navigation.find(item => 
                    location.pathname === item.href || 
                    (item.href === '/admin' && location.pathname === '/admin/')
                  )?.name || 'Dashboard'}
                </h1>
                <p className="text-gray-400 text-sm">
                  Kelola bisnis laundry Anda dengan mudah
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-white font-medium">{user?.name}</p>
                <p className="text-gray-400 text-sm">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/employees" element={<EmployeeManagement />} />
            <Route path="/services" element={<ServiceManagement />} />
            <Route path="/orders" element={<OrderManagement />} />
            <Route path="/reports" element={<FinancialReports />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
