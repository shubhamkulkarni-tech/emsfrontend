import React, { useEffect, useMemo, useState } from "react";
import Footer from "./Footer";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket"; // ✅ If you already have socket file

import {
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiUsers,
  FiTrendingUp,
  FiSettings,
  FiArrowRight,
  FiUser,
  FiRefreshCcw,
  FiLogOut,
  FiShield,
  FiBell,
  FiFileText,
  FiAlertCircle,
} from "react-icons/fi";

import Toast from "./Toast";

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

// ✅ API SETUP
const api = axios.create({
  baseURL: "https://emsbackend-2w9c.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ Chart Colors
const COLORS = ["#22c55e", "#f97316", "#3b82f6"];

const formatRole = (role = "employee") =>
  role.charAt(0).toUpperCase() + role.slice(1);

const getQuickRoute = (role) => {
  if (role === "admin") return { label: "Manage Users", route: "/employees" };
  if (role === "hr") return { label: "Manage Employees", route: "/employees" };
  if (role === "manager") return { label: "Team Tasks", route: "/tasks" };
  return { label: "My Tasks", route: "/tasks" };
};

// ✅ Small Utility
const getRelativeTime = (ts) => {
  if (!ts) return "Just now";
  const time = new Date(ts).getTime();
  const diff = Date.now() - time;

  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);

  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  if (hr < 24) return `${hr} hr ago`;

  return new Date(ts).toLocaleDateString();
};

// ✅ TASK DISTRIBUTION CHART
const TaskDistributionChart = ({ completed = 0, pending = 0, inProgress = 0 }) => {
  const pieData = [
    { name: "Completed", value: completed },
    { name: "Pending", value: pending },
    { name: "In Progress", value: inProgress },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          outerRadius={88}
          innerRadius={58}
          dataKey="value"
          paddingAngle={4}
          labelLine={false}
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {pieData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>

        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            color: "#0f172a",
            fontSize: "12px",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();

  // ✅ Core States
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);

  const [adminStats, setAdminStats] = useState(null); // ✅ Extra for admin detailed data
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // ✅ Load user safely
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    try {
      setUser(JSON.parse(storedUser));
    } catch (err) {
      console.error("Failed to parse user", err);
      setError("User session corrupted. Please login again.");
    }
  }, []);

  // ✅ Fetch Dashboard Data
  const fetchDashboardData = async (manual = false) => {
    if (!user?.employeeId) return;

    try {
      manual ? setRefreshing(true) : setLoading(true);

      // ✅ Normal dashboard
      const dashRes = await api.get(`/dashboard/${user.employeeId}`);
      setStats(dashRes.data);

      // ✅ Admin detailed dashboard (GLOBAL)
      if (user?.role === "admin") {
        // 🔥 NOTE: You can create this endpoint:
        // GET /dashboard/admin/overview  -> return global stats
        try {
          const adminRes = await api.get(`/dashboard/admin/overview`);
          setAdminStats(adminRes.data);
        } catch (err) {
          console.warn("Admin overview endpoint missing, using fallback...", err);
          // fallback: show basic stats only
          setAdminStats(null);
        }
      }

      // ✅ Notifications API fallback (optional)
      try {
        const notifRes = await api.get(`/notifications/${user.employeeId}`);
        setNotifications(Array.isArray(notifRes.data) ? notifRes.data : []);
      } catch {
        // optional ignore
      }

      setError("");
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      setError("Failed to load dashboard. Please try again.");
      setToast({ show: true, message: "Dashboard fetch failed!", type: "error" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ Auto refresh
  useEffect(() => {
    if (!user?.employeeId) return;
    fetchDashboardData(false);

    const interval = setInterval(() => fetchDashboardData(false), 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [user?.employeeId]);

  // ✅ SOCKET: Live Notifications
  useEffect(() => {
    if (!user?.employeeId) return;

    // join room
    try {
      socket.emit("join", { employeeId: user.employeeId });
    } catch (e) {
      console.warn("Socket join failed:", e);
    }

    const handler = (payload) => {
      const notif = {
        id: payload?.id || Date.now(),
        title: payload?.title || "Notification",
        message: payload?.message || "You have a new update.",
        type: payload?.type || "info", // info / success / warning / danger
        createdAt: payload?.createdAt || new Date().toISOString(),
      };

      setNotifications((prev) => [notif, ...prev].slice(0, 10));
    };

    socket.on("notification", handler);

    return () => {
      socket.off("notification", handler);
    };
  }, [user?.employeeId]);

  // ✅ Derived Stats (safe)
  const safeStats = useMemo(() => {
    const s = stats || {};
    return {
      totalTasks: s.totalTasks || 0,
      completedTasks: s.completedTasks || 0,
      pendingTasks: s.pendingTasks || 0,
      inProgressTasks: s.inProgressTasks || 0,
      performance: Number.isFinite(s.performance) ? s.performance : 0,
      totalUsers: s.totalUsers || 0,
      activities: Array.isArray(s.activities) ? s.activities : [],

      // ✅ KYC Stats (expected from API)
      kycApproved: s.kycApproved || 0,
      kycPending: s.kycPending || 0,
      kycRejected: s.kycRejected || 0,
      totalKyc: s.totalKyc || 0,
    };
  }, [stats]);

  // ✅ KYC Completion %
  const kycCompletion = useMemo(() => {
    const total = safeStats.totalKyc || (safeStats.kycApproved + safeStats.kycPending + safeStats.kycRejected);
    if (!total) return 0;
    return Math.round((safeStats.kycApproved / total) * 100);
  }, [safeStats]);

  // ✅ Weekly dummy chart
  const weeklyData = useMemo(() => {
    return [
      { name: "Week 1", Performance: 70 },
      { name: "Week 2", Performance: 76 },
      { name: "Week 3", Performance: 80 },
      { name: "Week 4", Performance: safeStats.performance || 0 },
    ];
  }, [safeStats.performance]);

  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToast({ show: true, message: "Logged out successfully!", type: "success" });
    setTimeout(() => navigate("/login"), 700);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-6 max-w-md w-full text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-700 mb-3">
            <FiShield size={22} />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Loading Session...</h2>
          <p className="text-sm text-slate-500 mt-1">
            Please wait while we restore your login.
          </p>
        </div>
      </div>
    );
  }

  const { role = "employee", name = "User" } = user;
  const quick = getQuickRoute(role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-800">
      <div className="w-full max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ✅ Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="animate-[fadeIn_0.5s_ease-out]">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome, <span className="text-blue-600">{name}</span> 👋
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase border border-blue-200 bg-blue-50 text-blue-700">
                <FiShield size={12} />
                {formatRole(role)}
              </span>
              <span className="text-sm text-slate-500">
                Real-time Overview • Tasks • KYC • Notifications
              </span>
            </div>
          </div>

          {/* ✅ Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDashboardData(true)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 shadow-sm text-sm font-semibold flex items-center gap-2"
              disabled={refreshing}
            >
              <FiRefreshCcw className={`${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button
              onClick={() => navigate("/profile")}
              className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-800 shadow-sm text-sm font-semibold flex items-center gap-2"
            >
              <FiUser />
              Profile
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 shadow-sm text-sm font-semibold flex items-center gap-2"
            >
              <FiLogOut />
              Logout
            </button>
          </div>
        </div>

        {/* ✅ Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[140px]"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 animate-pulse mb-4"></div>
                <div className="h-3 w-24 bg-slate-100 rounded animate-pulse mb-2"></div>
                <div className="h-7 w-16 bg-slate-100 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        )}

        {/* ✅ Error */}
        {!loading && error && (
          <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm mb-8 flex items-start gap-3">
            <FiAlertCircle className="text-red-600 mt-0.5" size={18} />
            <div>
              <p className="text-red-600 font-semibold">{error}</p>
              <p className="text-sm text-slate-500 mt-1">
                Please refresh or login again.
              </p>
            </div>
          </div>
        )}

        {/* ✅ MAIN */}
        {!loading && !error && (
          <>
            {/* ✅ Top Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Left big stats */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  title="Total Tasks"
                  value={safeStats.totalTasks}
                  icon={<FiActivity size={20} />}
                  badge="All"
                  iconBg="bg-indigo-50"
                  iconText="text-indigo-600"
                />
                <StatsCard
                  title="Completed"
                  value={safeStats.completedTasks}
                  icon={<FiCheckCircle size={20} />}
                  badge="Done"
                  iconBg="bg-green-50"
                  iconText="text-green-600"
                />
                <StatsCard
                  title="Pending"
                  value={safeStats.pendingTasks}
                  icon={<FiClock size={20} />}
                  badge="Waiting"
                  iconBg="bg-orange-50"
                  iconText="text-orange-600"
                />
                <StatsCard
                  title="Performance"
                  value={`${safeStats.performance}%`}
                  icon={<FiTrendingUp size={20} />}
                  badge="Score"
                  iconBg="bg-blue-50"
                  iconText="text-blue-600"
                />
              </div>

              {/* Notifications panel */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <FiBell />
                    Notifications
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-semibold">
                    {notifications?.length || 0}
                  </span>
                </div>

                <div className="space-y-3 max-h-[260px] overflow-auto pr-1">
                  {notifications?.length > 0 ? (
                    notifications.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 transition"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-slate-800">
                            {n.title || "Update"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {getRelativeTime(n.createdAt)}
                          </p>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {n.message || "You have a new notification."}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-500 py-8">
                      <FiBell className="mx-auto text-slate-300 mb-2" size={28} />
                      <p className="text-sm font-semibold">No notifications yet</p>
                      <p className="text-xs text-slate-400 mt-1">
                        You’ll see live updates here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ KYC + Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* KYC Widget */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <FiFileText />
                    KYC Status
                  </h3>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {kycCompletion}% Completed
                  </span>
                </div>

                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-700 transition-all duration-700"
                    style={{ width: `${kycCompletion}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 mt-5">
                  <MiniStat title="Approved" value={safeStats.kycApproved} color="text-green-600" />
                  <MiniStat title="Pending" value={safeStats.kycPending} color="text-orange-600" />
                  <MiniStat title="Rejected" value={safeStats.kycRejected} color="text-red-600" />
                </div>

                <button
                  onClick={() => navigate("/kyc")}
                  className="mt-5 w-full px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-between"
                >
                  <span>View KYC Details</span>
                  <FiArrowRight />
                </button>
              </div>

              {/* Task Distribution */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-1">
                <h3 className="text-lg font-extrabold text-slate-900 mb-4">
                  Task Distribution
                </h3>
                <TaskDistributionChart
                  completed={safeStats.completedTasks}
                  pending={safeStats.pendingTasks}
                  inProgress={safeStats.inProgressTasks}
                />
              </div>

              {/* Weekly Progress */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-1">
                <h3 className="text-lg font-extrabold text-slate-900 mb-4">
                  Weekly Progress
                </h3>

                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
                    <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        color: "#0f172a",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Performance" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ✅ Admin Detailed Section */}
            {role === "admin" && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Admin Global Overview
                  </h3>
                  <span className="text-xs px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                    Full Access
                  </span>
                </div>

                {adminStats ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <StatsCard
                      title="All System Tasks"
                      value={adminStats.totalTasks || 0}
                      icon={<FiActivity size={20} />}
                      badge="Global"
                      iconBg="bg-indigo-50"
                      iconText="text-indigo-600"
                    />
                    <StatsCard
                      title="Completed (Global)"
                      value={adminStats.completedTasks || 0}
                      icon={<FiCheckCircle size={20} />}
                      badge="Global"
                      iconBg="bg-green-50"
                      iconText="text-green-600"
                    />
                    <StatsCard
                      title="Pending (Global)"
                      value={adminStats.pendingTasks || 0}
                      icon={<FiClock size={20} />}
                      badge="Global"
                      iconBg="bg-orange-50"
                      iconText="text-orange-600"
                    />
                    <StatsCard
                      title="Total Employees"
                      value={adminStats.totalEmployees || adminStats.totalUsers || 0}
                      icon={<FiUsers size={20} />}
                      badge="Global"
                      iconBg="bg-purple-50"
                      iconText="text-purple-600"
                    />
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                    <p className="font-semibold">Admin overview not configured</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Please add backend endpoint: <b>/dashboard/admin/overview</b>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ✅ Activities + Quick Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-extrabold text-slate-900 mb-4">
                  Recent Activities
                </h3>

                {safeStats.activities.length > 0 ? (
                  <div className="space-y-3">
                    {safeStats.activities.slice(0, 8).map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          <p className="text-sm font-semibold text-slate-800">
                            {item.activity || "Activity updated"}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">
                          {item.time || "--:--"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-slate-500">
                    <FiActivity className="mx-auto mb-2 text-slate-300" size={34} />
                    <p className="font-semibold">No recent activity found.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Activities will appear here once tasks update.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-700 flex items-center justify-center mb-4">
                    <FiSettings size={20} />
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900">
                    {formatRole(role)} Panel
                  </h3>

                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    {role === "admin" &&
                      "Manage system users, tasks, departments, KYC approvals, and global reports."}
                    {role === "employee" &&
                      "Track your tasks, performance updates, and personal activities."}
                    {role === "hr" &&
                      "Manage employee records, attendance, leave tracking, and HR operations."}
                    {role === "manager" &&
                      "Monitor team tasks, assign work, and track progress."}
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => navigate(quick.route)}
                    className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center justify-between font-semibold text-sm"
                  >
                    <span>{quick.label}</span>
                    <FiArrowRight size={16} />
                  </button>

                  <button
                    onClick={() => navigate("/profile")}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 shadow-sm flex items-center justify-between font-semibold text-sm"
                  >
                    <span>My Profile</span>
                    <FiUser size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <Footer />
            </div>
          </>
        )}

        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />
      </div>
    </div>
  );
};

// ✅ Premium Stats Card
const StatsCard = ({
  title,
  value,
  icon,
  badge = "",
  iconBg = "bg-slate-100",
  iconText = "text-slate-700",
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 min-h-[140px]">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center ${iconText}`}>
          {icon}
        </div>

        {badge && (
          <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {badge}
          </span>
        )}
      </div>

      <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mt-5">
        {title}
      </p>

      <p className="text-3xl font-extrabold text-slate-900 mt-1">{value}</p>
    </div>
  );
};

// ✅ Mini KYC Stat Box
const MiniStat = ({ title, value, color }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
      <p className="text-[11px] font-bold uppercase text-slate-500">{title}</p>
      <p className={`text-xl font-extrabold ${color}`}>{value}</p>
    </div>
  );
};

export default Dashboard;
