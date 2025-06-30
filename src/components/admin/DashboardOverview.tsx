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
  Zap
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
  monthlyOrders: Array<{ month: string; count: number }>;
  servicePopularity: Array<{ name: string; count: number }>;
  monthlyRevenue: Array<{ month: string; income: number; expense: number }>;
  totals: {
    total_orders: number;
    total_customers: number;
    total_employees: number;
    net_profit: number;
  };
}

const DashboardOverview = () => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="text-center text-gray-400 h-64 flex items-center justify-center">
        Error loading statistics
      </div>
    );
  }

  // Chart data
  const monthlyOrdersData = {
    labels: statistics.monthlyOrders.map(item => {
      const [year, month] = item.month.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    }),
    datasets: [
      {
        label: 'Pesanan',
        data: statistics.monthlyOrders.map(item => item.count),
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
        {/* Monthly Orders Chart */}
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
              data={monthlyOrdersData}
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