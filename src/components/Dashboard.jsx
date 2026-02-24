import React, { useEffect, useMemo, useState } from "react";
import Footer from "./Footer";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import API from "../api/api"; // ✅ Use the interceptor-enabled API instance
import { toast } from "react-toastify";

import {
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiUsers,
  FiTrendingUp,
  FiArrowRight,
  FiUser,
  FiRefreshCcw,
  FiFileText,
  FiAlertCircle,
} from "react-icons/fi";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ✅ Chart Colors - Professional ERP Palette
const COLORS = ["#1e293b", "#334155", "#475569", "#64748b", "#94a3b8"];

const formatRole = (role = "employee") =>
  role.charAt(0).toUpperCase() + role.slice(1);

const getRelativeTime = (ts) => {
  if (!ts) return "Just now";
  const time = new Date(ts).getTime();
  const diff = Date.now() - time;
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);

  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  return new Date(ts).toLocaleDateString();
};

const TaskDistributionChart = ({
  completed = 0,
  pending = 0,
  inProgress = 0,
}) => {
  const pieData = [
    { name: "Completed", value: completed },
    { name: "Pending", value: pending },
    { name: "In Progress", value: inProgress },
  ];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={60}
          dataKey="value"
          paddingAngle={4}
        >
          {pieData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              stroke="none"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            fontSize: "12px",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/");
      return;
    }
    try {
      setUser(JSON.parse(storedUser));
    } catch (err) {
      toast.error("Session corrupted. Please login again.");
      navigate("/");
    }
  }, [navigate]);

  const fetchDashboardData = async (manual = false) => {
    if (!user?.employeeId) return;
    try {
      manual ? setRefreshing(true) : setLoading(true);

      const dashRes = await API.get(`/dashboard/${user.employeeId}`);
      setStats(dashRes.data);

      if (user?.role === "admin") {
        try {
          const adminRes = await API.get(`/dashboard/admin/overview`, { _silentFail: true });
          setAdminStats(adminRes.data);
        } catch (err) {
          // Silent fail for admin global stats
        }
      }

      try {
        const notifRes = await API.get(`/notifications/my?page=1&limit=10`, { _silentFail: true });
        const notifData = notifRes?.data?.data || notifRes?.data || [];
        setNotifications(Array.isArray(notifData) ? notifData : []);
      } catch (err) {
        // Silent fail - notifications not critical
      }
    } catch (err) {
      // API interceptor will handle the error toast
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.employeeId) {
      fetchDashboardData();
    }
  }, [user?.employeeId]);

  const safeStats = useMemo(() => {
    const s = stats || {};
    return {
      totalTasks: s.totalTasks || 0,
      completedTasks: s.completedTasks || 0,
      pendingTasks: s.pendingTasks || 0,
      inProgressTasks: s.inProgressTasks || 0,
      performance: s.performance || 0,
      activities: s.activities || [],
      kycStatus: s.kycStatus || "unstarted",
      recentTasks: s.recentTasks || []
    };
  }, [stats]);

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4" />
        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          Synchronizing Workspace
        </span>
      </div>
    );
  }

  const { role = "employee", name = "User" } = user || {};

  return (
    <div className="min-h-screen bg-[#fbfcfd] text-slate-800 pb-12">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        {/* Workspace Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between py-8 border-b border-slate-200 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Operational Dashboard
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome, {name}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Resource allocation and performance tracking for{" "}
              {formatRole(role)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDashboardData(true)}
              className="erp-button-secondary h-9 flex items-center gap-2 group"
              disabled={refreshing}
            >
              <FiRefreshCcw
                className={
                  refreshing
                    ? "animate-spin"
                    : "group-hover:rotate-45 transition-transform"
                }
              />
              <span>{refreshing ? "Syncing..." : "Sync Space"}</span>
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="erp-button-secondary h-9 flex items-center gap-2"
            >
              <FiUser /> Account
            </button>
          </div>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Active Tasks"
            value={safeStats.totalTasks}
            icon={<FiActivity />}
            color="text-slate-900"
          />
          <StatsCard
            title="Resolution"
            value={`${safeStats.performance}%`}
            icon={<FiTrendingUp />}
            color="text-blue-600"
          />
          <StatsCard
            title="Pending Review"
            value={safeStats.pendingTasks}
            icon={<FiClock />}
            color="text-slate-500"
          />
          <StatsCard
            title="Task Success"
            value={safeStats.completedTasks}
            icon={<FiCheckCircle />}
            color="text-green-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Visualizations */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="erp-card p-6">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-slate-900">
                  Workflow Distribution
                </h3>
                <div className="flex gap-4">
                  <LegendItem color="bg-[#1e293b]" label="Completed" />
                  <LegendItem color="bg-[#334155]" label="In Progress" />
                  <LegendItem color="bg-[#64748b]" label="Pending" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
                <div className="md:col-span-2">
                  <TaskDistributionChart
                    completed={safeStats.completedTasks}
                    pending={safeStats.pendingTasks}
                    inProgress={safeStats.inProgressTasks}
                  />
                </div>
                <div className="md:col-span-3 space-y-4">
                  <MetricRow
                    label="Current Efficiency"
                    value={`${safeStats.performance}%`}
                    percent={safeStats.performance}
                  />
                  <MetricRow
                    label="Task Throughput"
                    value={`${safeStats.completedTasks} units`}
                    percent={(safeStats.completedTasks / (safeStats.totalTasks || 1)) * 100}
                  />
                  <MetricRow 
                    label="System Reliability" 
                    value="99.9%" 
                    percent={100} 
                  />
                </div>
              </div>
            </div>

            {/* Admin Overview if applicable */}
            {role === "admin" && adminStats && (
              <div className="erp-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <FiUsers className="text-blue-500" /> Enterprise Global
                    Overview
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">Network Live</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <MiniStat
                    title="Personnel"
                    value={adminStats.totalEmployees || 0}
                  />
                  <MiniStat
                    title="Live Tasks"
                    value={adminStats.totalTasks || 0}
                  />
                  <MiniStat title="Resource Util" value="94.2%" />
                  <MiniStat title="Status" value={adminStats.systemHealth || "Stable"} />
                </div>
              </div>
            )}

            <div className="erp-card overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Recent System Logs</h3>
                <button className="text-[11px] font-bold text-blue-600 uppercase tracking-wider hover:underline">
                  View Journal
                </button>
              </div>
              <div className="divide-y divide-slate-100 font-mono text-[13px]">
                {safeStats.activities.length > 0 ? (
                  safeStats.activities.slice(0, 6).map((item, idx) => (
                    <div
                      key={idx}
                      className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-slate-600">{item.activity}</span>
                      <span className="text-slate-400 text-xs">
                        {item.time}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-12 text-center text-slate-400">
                    No recent activities recorded in this cycle.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Panels */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* KYC Compliance Card */}
            <div className="erp-card p-6 bg-slate-900 text-white shadow-2xl shadow-slate-900/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold flex items-center gap-2">
                  <FiFileText className="text-blue-400" /> Compliance
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono tracking-wider uppercase ${
                  safeStats.kycStatus === 'verified' ? 'bg-green-500/20 text-green-400 border-green-400/30' : 
                  safeStats.kycStatus === 'pending' ? 'bg-orange-500/20 text-orange-400 border-orange-400/30' :
                  'bg-blue-500/20 text-blue-400 border-blue-400/30'
                }`}>
                  {safeStats.kycStatus}
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">
                      Onboarding Document Integrity
                    </span>
                    <span className="font-mono">
                      {safeStats.kycStatus === 'verified' ? '100%' : safeStats.kycStatus === 'pending' ? '60%' : '0%'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        safeStats.kycStatus === 'verified' ? 'bg-green-500' :
                        safeStats.kycStatus === 'pending' ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`}
                      style={{
                        width: safeStats.kycStatus === 'verified' ? '100%' : safeStats.kycStatus === 'pending' ? '60%' : '10%',
                      }}
                    />
                  </div>
                </div>

                {role === "admin" && adminStats && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                      <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">
                        Verified
                      </p>
                      <p className="text-xl font-bold">{adminStats.kycApproved}</p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                      <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">
                        Pending
                      </p>
                      <p className="text-xl font-bold text-orange-400">
                        {adminStats.kycPending}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => navigate(role === 'admin' ? "/admin/onboarding-documents" : "/profile")}
                  className="w-full bg-white text-slate-900 h-10 rounded font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                   Verification Hub <FiArrowRight />
                </button>
              </div>
            </div>

            {/* Communication Feed */}
            <div className="erp-card flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">
                  Broadcasts
                </h3>
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
              </div>
              <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className="p-3 border border-slate-100 rounded-xl hover:border-slate-200 transition-all bg-white shadow-sm"
                    >
                      <p className="text-xs font-bold text-slate-900 mb-1">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-tight mb-2">
                        {n.message}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        {getRelativeTime(n.createdAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                    <FiAlertCircle className="opacity-20 mb-3 text-slate-300" size={32} />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      No Updates
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Footer />
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, icon, color }) => (
  <div className="erp-card p-6 flex items-start justify-between">
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
        {title}
      </p>
      <p className={`text-3xl font-bold tracking-tight ${color}`}>{value}</p>
    </div>
    <div className="p-2.5 bg-slate-50 rounded-lg text-slate-400 border border-slate-100">
      {React.cloneElement(icon, { size: 20 })}
    </div>
  </div>
);

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
      {label}
    </span>
  </div>
);

const MetricRow = ({ label, value, percent }) => (
  <div>
    <div className="flex justify-between items-end mb-1.5">
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-xs font-bold text-slate-900">{value}</span>
    </div>
    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-slate-900 rounded-full"
        style={{ width: `${percent}%` }}
      />
    </div>
  </div>
);

const MiniStat = ({ title, value }) => (
  <div>
    <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">
      {title}
    </p>
    <p className="text-lg font-bold text-slate-900">{value}</p>
  </div>
);

export default Dashboard;
