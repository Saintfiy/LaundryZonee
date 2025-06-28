import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Calendar,
  Zap,
  AlertCircle
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Statistics {
  monthlyorders: Array<{ month: string; count: number }>;
  servicePopularity: Array<{ name: string; count: number }>;
  monthlyRevenue: Array<{ month: string; income: number; expense: number }>;
  totals: {
    total_orders: number;
    total_customers: number;
    total_employees: number;
    net_profit: number;
  };
}

// Default/fallback data
const defaultStatistics: Statistics = {
  monthlyorders: [
    { month: '2024-01', count: 0 },
    { month: '2024-02', count: 0 },
    { month: '2024-03', count: 0 },
  ],
  servicePopularity: [
    { name: 'Cuci Kering', count: 0 },
    { name: 'Cuci Setrika', count: 0 },
  ],
  monthlyRevenue: [
    { month: '2024-01', income: 0, expense: 0 },
    { month: '2024-02', income: 0, expense: 0 },
    { month: '2024-03', income: 0, expense: 0 },
  ],
  totals: {
    total_orders: 0,
    total_customers: 0,
    total_employees: 0,
    net_profit: 0,
  },
};

const DashboardOverview = () => {
  const [statistics, setStatistics] = useState<Statistics>(defaultStatistics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      console.log('🔥 Fetching statistics...');
      
      const response = await fetch('http://localhost:3001/api/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Statistics data:', data);
        
        // Validate and set data with fallbacks
        setStatistics({
          monthlyorders: data.monthlyorders || defaultStatistics.monthlyorders,
          servicePopularity: data.servicePopularity || defaultStatistics.servicePopularity,
          monthlyRevenue: data.monthlyRevenue || defaultStatistics.monthlyRevenue,
          totals: {
            total_orders: data.totals?.total_orders || 0,
            total_customers: data.totals?.total_customers || 0,
            total_employees: data.totals?.total_employees || 0,
            net_profit: data.totals?.net_profit || 0,
          }
        });
        setError(null);
      } else {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        setError(`API Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('💥 Fetch Error:', error);
      setError(`Network Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        <div className="ml-4 text-gray-400">Loading dashboard data...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchStatistics();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Chart data
  const monthlyordersData = {
    labels: statistics.monthlyorders.map(item => {
      const [year, month] = item.month.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    }),
    datasets: [
      {
        label: 'Pesanan',
        data: statistics.monthlyorders.map(item => item.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const revenueData = {
    labels: statistics.monthlyRevenue.map(item => {
      const [year, month] = item.month.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    }),
    datasets: [
      {
        label: 'Pendapatan',
        data: statistics.monthlyRevenue.map(item => item.income || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Pengeluaran',
        data: statistics.monthlyRevenue.map(item => item.expense || 0),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      },
    ],
  };

  const serviceData = {
    labels: statistics.servicePopularity.map(item => item.name),
    datasets: [
      {
        data: statistics.servicePopularity.map(item => item.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const stats = [
    {
      name: 'Total Pesanan',
      value: statistics.totals.total_orders.toString(),
      icon: Package,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      name: 'Total Pelanggan',
      value: statistics.totals.total_customers.toString(),
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
    },
    {
      name: 'Total Karyawan',
      value: statistics.totals.total_employees.toString(),
      icon: Calendar,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10 border-orange-500/20',
    },
    {
      name: 'Laba Bersih',
      value: formatCurrency(statistics.totals.net_profit),
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10 border-green-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Debug Info - Remove in production */}
      <div className="bg-gray-800/30 border border-gray-600 rounded-lg p-4 text-sm">
        <p className="text-gray-300">
          📊 Debug: orders: {statistics.totals.total_orders}, 
          Customers: {statistics.totals.total_customers}, 
          Employees: {statistics.totals.total_employees}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.bgColor} backdrop-blur-xl border rounded-2xl p-6`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">{stat.name}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly orders Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Tren Pesanan Bulanan</h3>
              <p className="text-gray-400 text-sm">Jumlah pesanan per bulan</p>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div style={{ height: '300px' }}>
            <Line
              data={monthlyordersData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  x: {
                    grid: {
                      color: 'rgba(55, 65, 81, 0.5)',
                    },
                    ticks: {
                      color: 'rgba(156, 163, 175, 1)',
                    },
                  },
                  y: {
                    grid: {
                      color: 'rgba(55, 65, 81, 0.5)',
                    },
                    ticks: {
                      color: 'rgba(156, 163, 175, 1)',
                    },
                  },
                },
              }}
            />
          </div>
        </motion.div>

        {/* Service Popularity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Popularitas Layanan</h3>
              <p className="text-gray-400 text-sm">Distribution of service usage</p>
            </div>
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <div style={{ height: '300px' }}>
            <Doughnut
              data={serviceData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: 'rgba(156, 163, 175, 1)',
                      padding: 20,
                    },
                  },
                },
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Laporan Keuangan Bulanan</h3>
            <p className="text-gray-400 text-sm">Pendapatan vs Pengeluaran per bulan</p>
          </div>
          <DollarSign className="w-5 h-5 text-green-400" />
        </div>
        <div style={{ height: '400px' }}>
          <Bar
            data={revenueData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  labels: {
                    color: 'rgba(156, 163, 175, 1)',
                  },
                },
              },
              scales: {
                x: {
                  grid: {
                    color: 'rgba(55, 65, 81, 0.5)',
                  },
                  ticks: {
                    color: 'rgba(156, 163, 175, 1)',
                  },
                },
                y: {
                  grid: {
                    color: 'rgba(55, 65, 81, 0.5)',
                  },
                  ticks: {
                    color: 'rgba(156, 163, 175, 1)',
                    callback: function(value) {
                      return new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(value as number);
                    },
                  },
                },
              },
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardOverview;