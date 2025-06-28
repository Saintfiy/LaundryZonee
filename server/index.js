// server/index.js

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { supabase } from './supabaseClient.js'; // Pastikan path ini benar
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/LaundryZonee">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

dotenv.config(); // Memuat variabel lingkungan dari .env

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'; // Ganti dengan kunci rahasia yang kuat!

// ───────────────────────────────── Middleware ─────────────────────────────────
app.use(cors()); // Mengizinkan permintaan lintas domain
app.use(express.json()); // Mengizinkan parsing body request sebagai JSON

// ─────────────────────────────── Auth Helpers ────────────────────────────────
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('Auth: No Authorization header provided.');
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('Auth: Token not found in Authorization header.');
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Auth: Token verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user; // Menyimpan payload user dari token ke objek request
    console.log('Auth: Token verified for user:', user.username, 'Role:', user.role);
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    console.warn('Auth: Admin access denied for user:', req.user ? req.user.username : 'unknown');
    return res.status(403).json({ error: 'Admin access required' });
  }
  console.log('Auth: Admin access granted for user:', req.user.username);
  next();
};

// ──────────────────────────────── AUTH Routes ────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt for username:', username);

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      console.log('Login failed: User not found or DB error.', error ? error.message : '');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password.trim(), user.password.trim());
    if (!ok) {
      console.log('Login failed: Incorrect password for user:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful for user:', username, 'Role:', user.role);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
  } catch (err) {
    console.error('Login unexpected error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// ───────────────────────────── Customers (users) ─────────────────────────────
app.get('/api/customers', authenticateToken, requireAdmin, async (req, res) => {
  console.log('Fetching all customers...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error.message);
      return res.status(500).json({ error: error.message });
    }
    console.log('Customers fetched successfully. Count:', data.length);
    res.json(data);
  } catch (err) {
    console.error('Unexpected error fetching customers:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/customers', authenticateToken, requireAdmin, async (req, res) => {
  const { name, phone, address } = req.body;
  console.log('Creating new customer:', { name, phone, address });
  try {
    const username = name.toLowerCase().replace(/\s+/g, '') + phone.slice(-6);
    const passwordHash = bcrypt.hashSync('123456', 10);

    const { data, error } = await supabase
      .from('users')
      .insert([{ username, password: passwordHash, role: 'customer', name, phone, address }])
      .select('id,username');

    if (error) {
      console.error('Error creating customer:', error.message);
      return res.status(500).json({ error: error.message });
    }
    console.log('Customer created successfully:', data[0].id);
    res.json(data[0]);
  } catch (err) {
    console.error('Unexpected error creating customer:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/customers/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, phone, address } = req.body;
  console.log('Updating customer ID:', id, 'with data:', { name, phone, address });
  try {
    const { error } = await supabase
      .from('users')
      .update({ name, phone, address })
      .eq('id', id)
      .eq('role', 'customer');

    if (error) {
      console.error('Error updating customer:', error.message);
      return res.status(500).json({ error: error.message });
    }
    console.log('Customer updated successfully ID:', id);
    res.json({ success: true });
  } catch (err) {
    console.error('Unexpected error updating customer:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/customers/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  console.log('Deleting customer ID:', id);
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .eq('role', 'customer');

    if (error) {
      console.error('Error deleting customer:', error.message);
      return res.status(500).json({ error: error.message });
    }
    console.log('Customer deleted successfully ID:', id);
    res.json({ success: true });
  } catch (err) {
    console.error('Unexpected error deleting customer:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────── Services ────────────────────────────────────
app.get('/api/services', async (req, res) => { // Tidak perlu auth untuk fetch services
  console.log('Fetching all services...');
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching services:', error.message);
      return res.status(500).json({ error: error.message });
    }
    console.log('Services fetched successfully. Count:', data.length);
    res.json(data);
  } catch (err) {
    console.error('Unexpected error fetching services:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/services', authenticateToken, requireAdmin, async (req, res) => {
  const { name, price_per_kg, estimated_hours, description } = req.body;
  console.log('Creating new service:', { name, price_per_kg });
  try {
    const { data, error } = await supabase
      .from('services')
      .insert([{ name, price_per_kg, estimated_hours, description }])
      .select('id');

    if (error) {
      console.error('Error creating service:', error.message);
      return res.status(500).json({ error: error.message });
    }
    console.log('Service created successfully ID:', data[0].id);
    res.json(data[0]);
  } catch (err) {
    console.error('Unexpected error creating service:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, price_per_kg, estimated_hours, description } = req.body;
  console.log('Updating service ID:', id, 'with data:', { name, price_per_kg });
  try {
    const { error } = await supabase
      .from('services')
      .update({ name, price_per_kg, estimated_hours, description })
      .eq('id', id);

    if (error) {
      console.error('Error updating service:', error.message);
      return res.status(500).json({ error: error.message });
    }
    console.log('Service updated successfully ID:', id);
    res.json({ success: true });
  } catch (err) {
    console.error('Unexpected error updating service:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  console.log('Deleting service ID:', id);
  try {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      console.error('Error deleting service:', error.message);
      return res.status(500).json({ error: error.message });
    }
    console.log('Service deleted successfully ID:', id);
    res.json({ success: true });
  } catch (err) {
    console.error('Unexpected error deleting service:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────── orders ───────────────────────────────────────
// Debugging endpoints (bisa dihapus di produksi)
app.get('/api/debug/tables', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Debugging database structure...');
    const { data: users, error: usersError } = await supabase.from('users').select('*').limit(1);
    const { data: services, error: servicesError } = await supabase.from('services').select('*').limit(1);
    const { data: orders, error: ordersError } = await supabase.from('orders').select('*').limit(1);
    const { data: financial, error: financialError } = await supabase.from('financial_reports').select('*').limit(1);
    const { data: employees, error: employeesError } = await supabase.from('employees').select('*').limit(1);

    const debug = {
      users: { data: users, error: usersError ? usersError.message : null },
      services: { data: services, error: servicesError ? servicesError.message : null },
      orders: { data: orders, error: ordersError ? ordersError.message : null },
      financial_reports: { data: financial, error: financialError ? financialError.message : null },
      employees: { data: employees, error: employeesError ? employeesError.message : null }
    };
    console.log('📊 Database structure debug:', JSON.stringify(debug, null, 2));
    res.json(debug);
  } catch (error) {
    console.error('💥 Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/debug/connection', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Testing database connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact', head: true });

    if (error) {
      console.error('💥 Connection test failed:', error.message);
      return res.status(500).json({ error: error.message });
    }
    console.log('✅ Database connection OK, user count:', data);
    res.json({ status: 'OK', message: 'Database connection working' });
  } catch (error) {
    console.error('💥 Connection error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET all orders (for display in frontend table)
app.get('/api/orders', authenticateToken, requireAdmin, async (req, res) => {
  console.log('Fetching all orders...');
  try {
    // Join with users (customers) and services to get names
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        weight,
        total_price,
        status,
        estimated_completion,
        created_at,
        users (
          name,
          phone
        ),
        services (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error.message);
      return res.status(500).json({ error: error.message });
    }

    // Map data to flatten customer and service names
    const formattedorders = data.map(order => ({
      id: order.id,
      customer_name: order.users.name,
      customer_phone: order.users.phone,
      service_name: order.services.name,
      weight: order.weight,
      total_price: order.total_price,
      status: order.status,
      estimated_completion: order.estimated_completion,
      created_at: order.created_at,
    }));

    console.log('orders fetched successfully. Count:', formattedorders.length);
    res.json(formattedorders);
  } catch (err) {
    console.error('Unexpected error fetching orders:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.post('/api/orders', authenticateToken, requireAdmin, async (req, res) => {
  console.log('🚀 Menerima request order:', req.body);

  try {
    const { customer_name, customer_phone, customer_address, service_id, weight } = req.body;

    // 1. Validasi Input
    if (!customer_name || !customer_phone || !service_id || !weight) {
      return res.status(400).json({ 
        error: 'Harap isi semua field: nama, telepon, layanan, berat' 
      });
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      return res.status(400).json({ 
        error: 'Berat harus angka positif' 
      });
    }

    // 2. Validasi UUID service_id
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(service_id)) {
      return res.status(400).json({ 
        error: 'Format ID layanan tidak valid' 
      });
    }

    // 3. Cari/Create Customer
    const cleanPhone = customer_phone.replace(/\D/g, '');
    let { data: customer, error: customerError } = await supabase
      .from('users')
      .select('id, name')
      .eq('phone', cleanPhone)
      .eq('role', 'customer')
      .single();

    if (!customer) {
      const { data: newCustomer, error } = await supabase
        .from('users')
        .insert({ 
          name: customer_name,
          phone: cleanPhone,
          address: customer_address,
          role: 'customer',
          username: `${customer_name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
          password: await bcrypt.hash('default123', 10)
        })
        .select('id, name')
        .single();
      
      if (error) throw error;
      customer = newCustomer;
    }

    // 4. Verifikasi Service
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('name, price_per_kg, estimated_hours')
      .eq('id', service_id)
      .single();

    if (!service || serviceError) {
      return res.status(404).json({ 
        error: 'Layanan tidak ditemukan' 
      });
    }

    // 5. Create Order
    const total_price = service.price_per_kg * weightNum;
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customer.id,
        service_id,
        weight: weightNum,
        total_price,
        status: 'processing',
        estimated_completion: new Date(Date.now() + service.estimated_hours * 3600000).toISOString()
      })
      .select('id')
      .single();

    if (orderError) throw orderError;

    // 6. Response
    res.json({
      success: true,
      order_id: order.id,
      customer: customer.name,
      service: service.name,
      total_price
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      error: 'Terjadi kesalahan sistem',
      details: error.message 
    });
  }
});

app.put('/api/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  console.log('Updating order ID:', id, 'to status:', status);
  try {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) {
      console.error('Error updating order status:', error.message);
      return res.status(500).json({ error: error.message });
    }
    console.log('Order status updated successfully ID:', id);
    res.json({ success: true });
  } catch (err) {
    console.error('Unexpected error updating order:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  console.log('Deleting order ID:', id);
  try {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      console.error('Error deleting order:', error.message);
      return res.status(500).json({ error: error.message });
    }
    console.log('Order deleted successfully ID:', id);
    res.json({ success: true });
  } catch (err) {
    console.error('Unexpected error deleting order:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ────────────────────────────── EMPLOYEES ─────────────────────────────────────
app.get('/api/employees', authenticateToken, requireAdmin, async (req, res) => {
  console.log('Fetching all employees...');
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching employees:', error.message);
      return res.status(500).json({ error: error.message });
    }
    console.log('Employees fetched successfully. Count:', data.length);
    res.json(data);
  } catch (err) {
    console.error('Unexpected error fetching employees:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/employees', authenticateToken, requireAdmin, async (req, res) => {
  const { name, phone, status = 'permanent', hire_date } = req.body;
  console.log('Creating new employee:', { name, phone });
  try {
    const cleanDate = hire_date?.trim() ? hire_date : null;

    const { data, error } = await supabase
      .from('employees')
      .insert([{ name, phone, status, hire_date: cleanDate }])
      .select('id');

    if (error) {
      console.error('Error creating employee:', error.message);
      return res.status(500).json({ error: error.message });
    }
    console.log('Employee created successfully ID:', data[0].id);
    res.json(data[0]);
  } catch (err) {
    console.error('Unexpected error creating employee:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/employees/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, phone, status, hire_date } = req.body;
  console.log('Updating employee ID:', id, 'with data:', { name, phone });
  try {
    const cleanDate = hire_date?.trim() ? hire_date : null;

    const { error } = await supabase
      .from('employees')
      .update({ name, phone, status, hire_date: cleanDate })
      .eq('id', id);

    if (error) {
      console.error('Error updating employee:', error.message);
      return res.status(500).json({ error: error.message });
    }
    console.log('Employee updated successfully ID:', id);
    res.json({ success: true });
  } catch (err) {
    console.error('Unexpected error updating employee:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/employees/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  console.log('Deleting employee ID:', id);
  try {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) {
      console.error('Error deleting employee:', error.message);
      return res.status(500).json({ error: error.message });
    }
    console.log('Employee deleted successfully ID:', id);
    res.json({ success: true });
  } catch (err) {
    console.error('Unexpected error deleting employee:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────── Financial Reports ───────────────────────────────
// Financial Reports Routes - Add these to your existing Express app

// GET all financial reports
app.get('/api/financial-reports', authenticateToken, async (req, res) => {
  console.log('Fetching financial reports...');
  try {
    const { data, error } = await supabase
      .from('financial_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('🧨 Error fetching financial reports:', error.message);
      return res.status(500).json({ error: 'Failed to fetch financial reports' });
    }

    console.log(`✅ Successfully fetched ${data.length} financial reports`);
    res.json(data);
  } catch (err) {
    console.error('🛑 /api/financial-reports GET unexpected error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST new financial report
app.post('/api/financial-reports', authenticateToken, async (req, res) => {
  console.log('Creating new financial report...');
  try {
    const { type, amount, description, date } = req.body;

    // Validation
    if (!type || !amount || !description || !date) {
      return res.status(400).json({ 
        error: 'Missing required fields: type, amount, description, date' 
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type. Must be either "income" or "expense"' 
      });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be a positive number' 
      });
    }

    const reportData = {
      type,
      amount: parseFloat(amount),
      description: description.trim(),
      date,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('financial_reports')
      .insert([reportData])
      .select()
      .single();

    if (error) {
      console.error('🧨 Error creating financial report:', error.message);
      return res.status(500).json({ error: 'Failed to create financial report' });
    }

    console.log('✅ Successfully created financial report:', data.id);
    res.status(201).json(data);
  } catch (err) {
    console.error('🛑 /api/financial-reports POST unexpected error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// PUT update financial report
app.put('/api/financial-reports/:id', authenticateToken, async (req, res) => {
  console.log(`Updating financial report ${req.params.id}...`);
  try {
    const { id } = req.params;
    const { type, amount, description, date } = req.body;

    // Validation
    if (!type || !amount || !description || !date) {
      return res.status(400).json({ 
        error: 'Missing required fields: type, amount, description, date' 
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type. Must be either "income" or "expense"' 
      });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be a positive number' 
      });
    }

    const updateData = {
      type,
      amount: parseFloat(amount),
      description: description.trim(),
      date,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('financial_reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('🧨 Error updating financial report:', error.message);
      return res.status(500).json({ error: 'Failed to update financial report' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Financial report not found' });
    }

    console.log('✅ Successfully updated financial report:', id);
    res.json(data);
  } catch (err) {
    console.error('🛑 /api/financial-reports PUT unexpected error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// DELETE financial report
app.delete('/api/financial-reports/:id', authenticateToken, async (req, res) => {
  console.log(`Deleting financial report ${req.params.id}...`);
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('financial_reports')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('🧨 Error deleting financial report:', error.message);
      return res.status(500).json({ error: 'Failed to delete financial report' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Financial report not found' });
    }

    console.log('✅ Successfully deleted financial report:', id);
    res.json({ message: 'Financial report deleted successfully', id });
  } catch (err) {
    console.error('🛑 /api/financial-reports DELETE unexpected error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET financial report by ID
app.get('/api/financial-reports/:id', authenticateToken, async (req, res) => {
  console.log(`Fetching financial report ${req.params.id}...`);
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('financial_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('🧨 Error fetching financial report:', error.message);
      return res.status(500).json({ error: 'Failed to fetch financial report' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Financial report not found' });
    }

    console.log('✅ Successfully fetched financial report:', id);
    res.json(data);
  } catch (err) {
    console.error('🛑 /api/financial-reports/:id GET unexpected error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.get('/api/statistics', authenticateToken, async (req, res) => {
  console.log('📊 Building statistics response...');
  try {
    // ambil data utama
    const { data: orders }   = await supabase.from('orders').select('created_at, service_id');
    const { data: services } = await supabase.from('services').select('id, NamaLayanan');
    const { data: reports }  = await supabase.from('financial_reports').select('date, type, amount');

    // hitung jumlah total (head: true = hanya hitung)
    const { count: total_orders }     = await supabase.from('orders').select('*',     { count: 'exact', head: true });
    const { count: total_customers }  = await supabase.from('users').select('*',      { count: 'exact', head: true });
    const { count: total_employees }  = await supabase.from('employees').select('*',  { count: 'exact', head: true });

    // pastikan array tidak null
    const ord = orders   || [];
    const svc = services || [];
    const rep = reports  || [];

    /* ---------- Monthly orders ---------- */
    const monthlyorders = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const cnt = ord.filter(o => o.created_at?.startsWith(key)).length;
      return { month: key, count: cnt };
    }).reverse();

    /* ---------- Service Popularity ---------- */
    const servicePopularity = svc.map(s => ({
      name: s.NamaLayanan,
      count: ord.filter(o => o.service_id === s.id).length
    }));

    /* ---------- Monthly Revenue ---------- */
    const monthlyRevenue = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const rows = rep.filter(r => r.date?.startsWith(key));
      const income  = rows.filter(r => r.type === 'income').reduce((a, r) => a + r.amount, 0);
      const expense = rows.filter(r => r.type === 'expense').reduce((a, r) => a + r.amount, 0);
      return { month: key, income, expense };
    }).reverse();

    /* ---------- Net Profit ---------- */
    const net_profit =
      rep.filter(r => r.type === 'income').reduce((a, r) => a + r.amount, 0) -
      rep.filter(r => r.type === 'expense').reduce((a, r) => a + r.amount, 0);

    /* ---------- Response ---------- */
    res.json({
      monthlyorders,
      servicePopularity,
      monthlyRevenue,
      totals: {
        total_orders,
        total_customers,
        total_employees,
        net_profit,
      },
    });
  } catch (error) {
    console.error('❌ Error building statistics:', error.message);
    res.status(500).json({ error: 'Failed to fetch statistics', detail: error.message });
  }
});

// ───────────────────────────── Server Start ───────────────────────────────────
app.get('/', (req, res) => res.send('LaundryZone backend (Supabase) ✅'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
