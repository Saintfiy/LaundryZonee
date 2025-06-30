// MultipleFiles/OrderManagement.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Clock,
  CheckCircle,
  CreditCard,
  X,
  Save,
  User,
  Phone,
  MapPin
} from 'lucide-react';

// Interface untuk data Order
interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  weight: number;
  total_price: number;
  status: string;
  estimated_completion: string;
  created_at: string;
}

// Interface untuk data Service - DIUPDATE untuk menggunakan UUID
interface Service {
  id: string; // ✅ UBAH: dari number ke string untuk UUID
  name: string;
  price_per_kg: number;
  estimated_hours: number;
}

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null); // Untuk fitur edit, saat ini belum diimplementasikan penuh
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    service_id: '',
    weight: '',
  });

  // Base URL untuk API backend
  const API_BASE_URL = 'http://localhost:3001'; // Sesuaikan jika backend berjalan di port/host lain

  // Effect hook untuk memuat data saat komponen dimuat
  useEffect(() => {
    fetchOrders();
    fetchServices();
  }, []);

  // Fungsi untuk mengambil data pesanan dari API
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found.');
        // Redirect to login or show error
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch orders:', response.status, errorData);
        alert(`Failed to load orders: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('Network error while fetching orders.');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mengambil data layanan dari API
  const fetchServices = async () => {
    try {
      // Fetch services tidak memerlukan token jika endpointnya publik
      const response = await fetch(`${API_BASE_URL}/api/services`);
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch services:', response.status, errorData);
        alert(`Failed to load services: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      alert('Network error while fetching services.');
    }
  };

  // Handler untuk perubahan input form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler untuk submit form pembuatan pesanan baru - DIPERBAIKI
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token missing. Please log in again.');
        return;
      }

      // Validasi input di frontend sebelum mengirim ke backend
      if (!formData.customer_name || !formData.customer_phone || !formData.service_id || !formData.weight) {
        alert('Please fill in all required fields (Customer Name, Phone, Service, Weight).');
        return;
      }
      if (parseFloat(formData.weight) <= 0 || isNaN(parseFloat(formData.weight))) {
        alert('Weight must be a positive number.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          weight: parseFloat(formData.weight), // Pastikan dikirim sebagai number
          service_id: formData.service_id, // ✅ UBAH: Kirim sebagai string UUID, bukan parseInt!
        }),
      });

      if (response.ok) {
        alert('Order created successfully!');
        await fetchOrders(); // Refresh daftar pesanan
        handleCloseModal(); // Tutup modal dan reset form
      } else {
        const errorData = await response.json();
        console.error('Error saving order:', response.status, errorData);
        alert(`Failed to create order: ${errorData.error || 'Unknown error'}. Details: ${errorData.details || ''}`);
      }
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Network error while saving order.');
    }
  };

  // Handler untuk update status pesanan
  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token missing. Please log in again.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        alert('Order status updated successfully!');
        await fetchOrders(); // Refresh daftar pesanan
      } else {
        const errorData = await response.json();
        console.error('Error updating order status:', response.status, errorData);
        alert(`Failed to update status: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Network error while updating status.');
    }
  };

  // Handler untuk menghapus pesanan
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token missing. Please log in again.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Order deleted successfully!');
        await fetchOrders(); // Refresh daftar pesanan
      } else {
        const errorData = await response.json();
        console.error('Error deleting order:', response.status, errorData);
        alert(`Failed to delete order: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Network error while deleting order.');
    }
  };

  // Handler untuk menutup modal dan mereset form
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOrder(null); // Reset editing state
    setFormData({ // Reset form data
      customer_name: '',
      customer_phone: '',
      customer_address: '',
      service_id: '',
      weight: '',
    });
  };

  // Filter pesanan berdasarkan search term dan status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm) ||
      order.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Fungsi format mata uang
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Fungsi format tanggal
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Fungsi untuk mendapatkan warna status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paid':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Fungsi untuk mendapatkan teks status yang dilokalisasi
  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing':
        return 'Diproses';
      case 'completed':
        return 'Selesai';
      case 'paid':
        return 'Dibayar';
      default:
        return status;
    }
  };

  // Fungsi untuk mendapatkan ikon status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return Clock;
      case 'completed':
        return CheckCircle;
      case 'paid':
        return CreditCard;
      default:
        return Package;
    }
  };

  // Tampilan loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-gray-900 min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Manajemen Pesanan</h2>
          <p className="text-gray-400">Kelola pesanan dan status laundry</p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Pesanan</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari pesanan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Semua Status</option>
          <option value="processing">Diproses</option>
          <option value="completed">Selesai</option>
          <option value="paid">Dibayar</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Pesanan</p>
              <p className="text-2xl font-bold text-white">{orders.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Sedang Diproses</p>
              <p className="text-2xl font-bold text-white">
                {orders.filter(o => o.status === 'processing').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Selesai</p>
              <p className="text-2xl font-bold text-white">
                {orders.filter(o => o.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Pendapatan</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(orders.reduce((sum, o) => sum + o.total_price, 0))}
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-purple-400" />
          </div>
        </motion.div>
      </div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Pesanan
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Pelanggan
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Layanan
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Berat
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredOrders.map((order, index) => {
                const StatusIcon = getStatusIcon(order.status);
                
                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <StatusIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">#{order.id}</div>
                          <div className="text-sm text-gray-400">{formatDate(order.created_at)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{order.customer_name}</div>
                        <div className="text-sm text-gray-400">{order.customer_phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {order.service_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {order.weight} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {formatCurrency(order.total_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        className={`text-xs font-medium border rounded-full px-3 py-1 ${getStatusColor(order.status)} bg-transparent focus:outline-none`}
                      >
                        <option value="processing">Diproses</option>
                        <option value="completed">Selesai</option>
                        <option value="paid">Dibayar</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {/* <button
                        onClick={() => setEditingOrder(order)} // Untuk fitur edit
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors mr-2"
                      >
                        <Edit className="w-4 h-4" />
                      </button> */}
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'Tidak ada hasil' : 'Belum ada pesanan'}
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' ? 'Coba ubah filter pencarian' : 'Buat pesanan pertama Anda'}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Buat Pesanan Baru</h3>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="customer_name" className="block text-sm font-medium text-gray-300 mb-2">
                  Nama Pelanggan
                </label>
                <input
                  type="text"
                  id="customer_name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-300 mb-2">
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  id="customer_phone"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="customer_address" className="block text-sm font-medium text-gray-300 mb-2">
                  Alamat
                </label>
                <input
                  type="text"
                  id="customer_address"
                  name="customer_address"
                  value={formData.customer_address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="service_id" className="block text-sm font-medium text-gray-300 mb-2">
                  Layanan
                </label>
                <select
                  id="service_id"
                  name="service_id"
                  value={formData.service_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih layanan</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {formatCurrency(service.price_per_kg)}/kg
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-300 mb-2">
                  Berat (kg)
                </label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0.1"
                  step="0.1"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Buat Pesanan</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;