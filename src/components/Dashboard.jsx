import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  FiActivity, FiCheckCircle, FiClock, FiUsers, 
  FiTrendingUp, FiSettings, FiArrowRight, FiCalendar, FiUser // Added FiUser here
} from "react-icons/fi";
import Toast from './Toast';
import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer
} from 'recharts';

// --- API SETUP ---
const api = axios.create({
  baseURL: "https://emsbackend-2w9c.onrender.com/api",
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- CHART COMPONENTS ---
const COLORS = ['#22c55e', '#f97316', '#3b82f6']; // Green, Orange, Blue

const TaskDistributionChart = ({ completed, pending, inProgress }) => {
  const pieData = [
    { name: 'Completed', value: completed },
    { name: 'Pending', value: pending },
    { name: 'In Progress', value: inProgress }
  ];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            color: '#334155'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/dashboard/${user.employeeId}`);
      setStats(response.data);
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
      setError('Failed to load dashboard data. Please try again later.');
      setToast({ show: true, message: 'Failed to load dashboard data', type: 'error' });
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return <p className="p-10 text-center text-slate-600">Loading user information...</p>;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !stats) return <p className="p-10 text-center text-red-600">Unable to load dashboard data.</p>;

  const { role, name } = user;

  // Dummy Data for Weekly Chart (as per original code)
  const barData = [
    { name: 'Week 1', Performance: 70 },
    { name: 'Week 2', Performance: 76 },
    { name: 'Week 3', Performance: 80 },
    { name: 'Week 4', Performance: stats.performance || 0 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <Navbar />

      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Welcome back, <span className="text-blue-600">{name}</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-blue-200">
              {role}
            </span>
            <span className="text-slate-500 text-sm">Dashboard Overview</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${role === 'admin' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-6 mb-8`}>
          
          {/* Total Tasks */}
          <StatsCard 
            title="Total Tasks" 
            value={stats.totalTasks} 
            icon={<FiActivity size={24} />}
            color="bg-indigo-100 text-indigo-600"
          />
          
          {/* Completed Tasks */}
          <StatsCard 
            title="Completed" 
            value={stats.completedTasks} 
            icon={<FiCheckCircle size={24} />}
            color="bg-green-100 text-green-600"
          />
          
          {/* Pending Tasks */}
          <StatsCard 
            title="Pending" 
            value={stats.pendingTasks} 
            icon={<FiClock size={24} />}
            color="bg-orange-100 text-orange-600"
          />
          
          {/* Performance */}
          <StatsCard 
            title="Performance" 
            value={`${stats.performance}%`} 
            icon={<FiTrendingUp size={24} />}
            color="bg-blue-100 text-blue-600"
          />
          
          {/* Total Users (Admin Only) */}
          {role === 'admin' && (
            <StatsCard 
              title="Total Users" 
              value={stats.totalUsers || 0} 
              icon={<FiUsers size={24} />}
              color="bg-purple-100 text-purple-600"
            />
          )}
        </div>

        {/* Performance Progress Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800">Overall Performance</h3>
            <span className="text-3xl font-bold text-blue-600">{stats.performance}%</span>
          </div>
          <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-out"
              style={{ width: `${stats.performance}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-right">Based on completed tasks and deadlines</p>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Task Distribution */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Ticket Distribution</h3>
            <TaskDistributionChart 
              completed={stats.completedTasks} 
              pending={stats.pendingTasks} 
              inProgress={stats.inProgressTasks || 0} 
            />
          </div>

          {/* Weekly Performance */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Weekly Progress</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#334155'
                  }}
                />
                <Legend />
                <Bar dataKey="Performance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Activities */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Activities</h3>
            <div className="space-y-3">
              {stats.activities && stats.activities.length > 0 ? (
                stats.activities.map((item, index) => (
                  <div 
                    key={item.id || index} 
                    className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-slate-700 font-medium">{item.activity}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{item.time}</span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <FiActivity size={32} className="mb-2 text-slate-200" />
                  <p className="text-sm">No recent activity found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Role / Quick Actions Panel */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <FiSettings size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">{role.charAt(0).toUpperCase() + role.slice(1)} Panel</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                {role === 'admin' && "System administration, user management, and global settings."}
                {role === 'employee' && "View your assigned tasks, track progress, and manage files."}
                {role === 'hr' && "Manage employee records, attendance, and leave requests."}
                {role === 'manager' && "Oversee team performance, assign tasks, and review workflows."}
              </p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => navigate(role === 'admin' ? '/employees' : role === 'hr' ? '/employees' : '/tasks')}
                className="w-full flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium text-sm"
              >
                <span>Manage {role === 'admin' ? 'Users' : role === 'hr' ? 'Employees' : 'Tasks'}</span>
                <FiArrowRight size={16} />
              </button>
              <button 
                onClick={() => navigate('/profile')}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-medium text-sm"
              >
                <span>My Profile</span>
                <FiUser size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>

      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
      
      <Footer />
    </div>
  );
};

// --- STATS CARD COMPONENT ---
const StatsCard = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[140px]">
      <div className={`w-12 h-12 rounded-full ${color.split(' ')[0]} flex items-center justify-center ${color.split(' ')[1]} shrink-0`}>
        {icon}
      </div>
      <div className="flex flex-col justify-center">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
};

export default Dashboard;