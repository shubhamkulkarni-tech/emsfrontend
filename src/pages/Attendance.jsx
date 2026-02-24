import React, { useEffect, useState, useRef } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

import Footer from "../components/Footer";
import Toast from "../components/Toast";
import {
  FiSearch, FiCalendar, FiClock, FiUser, FiCheckCircle,
  FiXCircle, FiLogIn, FiLogOut, FiEdit2, FiTrash2, FiDownload,
  FiMoreVertical, FiX, FiFilter, FiActivity, FiBriefcase, FiShield, FiUsers
} from "react-icons/fi";
import EmptyState from "../components/EmptyState";
import { useAuth } from '../context/AuthContext';

// --- STATUS BADGE STYLES ---
const statusColors = {
  Present:         { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  dot: "bg-green-500" },
  Absent:          { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    dot: "bg-red-500" },
  Leave:           { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", dot: "bg-yellow-500" },
  Late:            { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  "Half Day":      { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  "Auto Punch Out":{ bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200", dot: "bg-orange-600" },
  "Failed Punchout":{ bg: "bg-red-50",  text: "text-red-600",    border: "border-red-200",    dot: "bg-red-600" },
};

const API_PATH    = "/attendance";
const USERS_PATH  = "/users";
const LEAVES_PATH = "/leaves";

const Attendance = () => {
  const navigate = useNavigate();

  const {
    user, isLoggedIn, attendanceRecord, logoutTime,
    setIsLoggedIn, setAttendanceRecord, setLoginTime, setLogoutTime, clearAuthState
  } = useAuth();

  const [records,     setRecords]     = useState([]);
  const [users,       setUsers]       = useState([]);
  const [leaves,      setLeaves]      = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [search,      setSearch]      = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
  );
  const [error, setError] = useState(false);

  const [dropdownOpen,      setDropdownOpen]      = useState(null);
  const [showPunchInModal,  setShowPunchInModal]  = useState(false);
  const [showPunchOutModal, setShowPunchOutModal] = useState(false);
  const [showEditModal,     setShowEditModal]     = useState(false);
  const [showDeleteModal,   setShowDeleteModal]   = useState(false);

  const [editingRecord,  setEditingRecord]  = useState(null);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const activityTimeoutRef = useRef(null);

  // --- Helpers ---
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const getISTDateTime = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const timeStr = now.toLocaleTimeString("en-US", {
      timeZone: "Asia/Kolkata", hour12: true,
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
    return { date: dateStr, time: timeStr };
  };

  const parseTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== "string") return new Date(2000, 0, 1, 0, 0, 0);
    const [time, period] = timeStr.split(" ");
    if (!time || !period) return new Date(2000, 0, 1, 0, 0, 0);
    const [hours, minutes, seconds] = time.split(":").map(Number);
    let hour24 = hours;
    if (period === "PM" && hours !== 12) hour24 += 12;
    if (period === "AM" && hours === 12) hour24 = 0;
    return new Date(2000, 0, 1, hour24, minutes, seconds || 0);
  };

  const getDerivedStatus = (timeStr) => {
    if (!timeStr) return "Absent";
    const punch = parseTime(timeStr);
    const hour  = punch.getHours();
    if (hour >= 10 && hour < 11) return "Present";
    if (hour >= 11 && hour < 14) return "Late";
    if (hour >= 14 && hour < 15) return "Half Day";
    return "Absent";
  };

  const resetSessionTimer = () => {
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    localStorage.setItem("tokenExpiry", (Date.now() + TEN_MINUTES_MS).toString());
  };

  const handleSessionExpired = () => {
    setIsLoggedIn(false);
    setAttendanceRecord(null);
    setLoginTime(null);
    clearAuthState();
    setToast({ show: true, message: "Session Expired. Please login again.", type: "error" });
    localStorage.removeItem("tokenExpiry");
    localStorage.removeItem("token");
    setTimeout(() => navigate("/"), 2000);
  };

  // --- Session timer effect ---
  useEffect(() => {
    if (!user) return;
    const EXPIRY_KEY = "tokenExpiry";
    const checkInterval = setInterval(() => {
      const now    = Date.now();
      const expiry = parseInt(localStorage.getItem(EXPIRY_KEY));
      if (now > expiry) {
        clearInterval(checkInterval);
        handleSessionExpired();
      }
    }, 1000);
    const handleActivity = () => resetSessionTimer();
    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach(evt => window.addEventListener(evt, handleActivity));
    return () => {
      clearInterval(checkInterval);
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
    };
  }, [user]);

  // --- Calculation helpers ---
  const calculateWorkingHours = (loginTime, logoutTime) => {
    if (!loginTime || !logoutTime) return { hours: 0, minutes: 0, seconds: 0 };
    const login  = parseTime(loginTime);
    const logout = parseTime(logoutTime);
    const diffMs = logout - login;
    const total  = Math.floor(diffMs / 1000);
    return { hours: Math.floor(total / 3600), minutes: Math.floor((total % 3600) / 60), seconds: total % 60 };
  };

  const formatTimer = (timer) => {
    if (!timer) return "0s";
    const parts = [];
    if (timer.hours > 0) parts.push(`${timer.hours}h`);
    if (timer.minutes > 0 || timer.hours > 0) parts.push(`${timer.minutes}m`);
    parts.push(`${timer.seconds}s`);
    return parts.join(" ");
  };

  const exportToCSV = () => {
    if (displayData.length === 0) {
      setToast({ show: true, message: "No data to export", type: "error" });
      return;
    }
    const headers  = ["Employee ID", "Name", "Date", "Punch In", "Punch Out", "Working Hours", "Status"];
    const csvRows  = [headers.join(",")];
    displayData.forEach(row => {
      csvRows.push([
        `"${row.employeeId}"`, `"${row.name || ""}"`, `"${row.date}"`,
        `"${row.punch_in || ""}"`, `"${row.punch_out || ""}"`,
        `"${row.workingHours || ""}"`, `"${row.status}"`
      ].join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", `attendance_report_${getISTDateTime().date}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setToast({ show: true, message: "CSV downloaded", type: "success" });
  };

  // --- Fetch ---
  const fetchUsers = async () => {
    if (!user) return;
    try {
      const res = await api.get(USERS_PATH);
      setUsers(res.data || []);
    } catch (err) { console.error("Error fetching users:", err); }
  };

  const fetchLeaves = async () => {
    if (!user) return;
    try {
      const res = await api.get(LEAVES_PATH);
      setLeaves(res.data || []);
    } catch (err) { setLeaves([]); }
  };

  const fetchRecords = async () => {
    try {
      if (!user) return;
      let res;
      if (user.role === "employee" || user.role === "manager") {
        setError(false);
        res = await api.get(`${API_PATH}/employee/${user.employeeId}`);
        setRecords(res.data);
        checkActiveSession(res.data);
      } else if (user.role === "admin" || user.role === "hr") {
        res = await api.get(API_PATH);
        const allRecords = res.data.records || res.data;
        setRecords(allRecords);
        fetchUsers();
        fetchLeaves();
        const userRecords = allRecords.filter(r => r.employeeId === user.employeeId);
        checkActiveSession(userRecords);
      }
    } catch (err) {
      setError(true);
      setToast({ show: true, message: "Failed to fetch records", type: "error" });
    }
  };

  const checkActiveSession = (userRecords) => {
    if (!userRecords) return;
    const istDate    = getISTDateTime().date;
    const todayRecord = userRecords.find(r => r.date === istDate && r.punch_in && !r.punch_out);
    if (todayRecord) {
      setIsLoggedIn(true);
      setLoginTime(todayRecord.punch_in);
      setAttendanceRecord({
        empId: todayRecord.employeeId, empName: todayRecord.name,
        loginTime: todayRecord.punch_in, date: todayRecord.date, _id: todayRecord._id
      });
      setLogoutTime(null);
    } else {
      setIsLoggedIn(false);
      setAttendanceRecord(null);
      setLoginTime(null);
    }
  };

  useEffect(() => { if (user) fetchRecords(); }, [user]);

  // --- Data merge with auto punch-out logic ---
  useEffect(() => {
    if (!user) return;

    if (user.role === "employee" || user.role === "manager") {
      let temp = [...records];
      if (search.trim()) temp = temp.filter(r => r?.name?.toLowerCase().includes(search.toLowerCase()));
      if (selectedDate.trim()) temp = temp.filter(r => r.date && r.date.startsWith(selectedDate));
      temp = temp.map(r => {
        let status = getDerivedStatus(r.punch_in);
        if (r.punch_out && parseTime(r.punch_out).getHours() >= 18) status = "Auto Punch Out";
        if (r.status === "Failed Punchout" || r.status === "Auto Punch Out" || r.status === "Leave") status = r.status;
        return { ...r, status };
      });
      setDisplayData(temp);
      return;
    }

    if (user.role === "admin" || user.role === "hr") {
      const filteredUsers = users.filter(u => u?.name?.toLowerCase().includes(search.toLowerCase()));
      let mergedList = filteredUsers.map(u => {
        const empId  = u.employeeId || u._id;
        const onLeave = leaves.find(l => l.employeeId === empId && l.date === selectedDate);
        if (onLeave) return { _id: null, employeeId: empId, name: u.name, date: selectedDate, status: "Leave", punch_in: null, punch_out: null, workingHours: null };

        const att = records.find(r => r.employeeId === empId && r.date === selectedDate);
        if (att) {
          let finalStatus = getDerivedStatus(att.punch_in);
          if (att.punch_out && parseTime(att.punch_out).getHours() >= 18) finalStatus = "Auto Punch Out";
          if (att.status === "Leave" || att.status === "Absent" || att.status === "Failed Punchout") finalStatus = att.status;
          return { ...att, status: finalStatus };
        }
        return { _id: null, employeeId: empId, name: u.name, date: selectedDate, status: "Absent", punch_in: null, punch_out: null, workingHours: null };
      });

      const priority = { Present: 1, Late: 2, "Half Day": 3, Leave: 4, "Auto Punch Out": 4.5, "Failed Punchout": 4.6, Absent: 5 };
      mergedList.sort((a, b) => {
        const pA = priority[a.status] || 5;
        const pB = priority[b.status] || 5;
        return pA !== pB ? pA - pB : a.name.localeCompare(b.name);
      });
      setDisplayData(mergedList);
    }
  }, [search, selectedDate, records, users, user, leaves]);

  // --- Today's status helpers ---
  const istDate      = getISTDateTime().date;
  const myTodayRecord = records.find(r => r.date === istDate && r.employeeId === user?.employeeId);

  // --- Handlers ---
  const handlePunchIn = async () => {
    if (!user) return;
    const { date: currentDate, time: currentTime } = getISTDateTime();
    try {
      const response = await api.post(API_PATH, {
        employeeId: user.employeeId, name: user.name, date: currentDate, punch_in: currentTime
      });
      setIsLoggedIn(true);
      setLoginTime(currentTime);
      setRecords(prev => [...prev, response.data]);
      setShowPunchInModal(false);
      setToast({ show: true, message: "Punch In successful!", type: "success" });
      resetSessionTimer();
    } catch (error) {
      setToast({ show: true, message: error.response?.data?.message || "Punch In failed", type: "error" });
    }
  };

  const handlePunchOut = async () => {
    if (!user || !attendanceRecord) return;
    const currentTimeStr = getISTDateTime().time;
    const currentHour    = parseTime(currentTimeStr).getHours();
    if (currentHour < 17) {
      setToast({ show: true, message: "You'll have to wait till 5:00:00 PM to punch out", type: "error" });
      setShowPunchOutModal(false);
      return;
    }
    const sessionDate   = attendanceRecord.date;
    const currentTime   = getISTDateTime().time;
    try {
      const workingHours = calculateWorkingHours(attendanceRecord.loginTime, currentTime);
      await api.put(`${API_PATH}/logout`, {
        employeeId: user.employeeId, date: sessionDate,
        punch_out: currentTime, workingHours: formatTimer(workingHours)
      });
      setLogoutTime(currentTime);
      setIsLoggedIn(false);
      setAttendanceRecord(null);
      setRecords(prev => prev.map(r => r._id === attendanceRecord._id
        ? { ...r, punch_out: currentTime, workingHours: formatTimer(workingHours) } : r
      ));
      setShowPunchOutModal(false);
      setToast({ show: true, message: "Punch Out successful!", type: "success" });
      resetSessionTimer();
    } catch (error) {
      setToast({ show: true, message: error.response?.data?.message || "Punch Out failed", type: "error" });
    }
  };

  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    if (!editingRecord._id) {
      setToast({ show: true, message: "Cannot update — employee has not punched in yet.", type: "error" });
      setShowEditModal(false);
      return;
    }
    try {
      const { _id, ...dataToUpdate } = editingRecord;
      const response = await api.put(`${API_PATH}/${_id}`, dataToUpdate);
      setRecords(prev => prev.map(r => r._id === _id ? response.data : r));
      setShowEditModal(false);
      setToast({ show: true, message: "Record updated", type: "success" });
      resetSessionTimer();
    } catch {
      setToast({ show: true, message: "Failed to update", type: "error" });
    }
  };

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    try {
      await api.delete(`${API_PATH}/${recordToDelete._id}`);
      setRecords(prev => prev.filter(r => r._id !== recordToDelete._id));
      setShowDeleteModal(false);
      setRecordToDelete(null);
      setToast({ show: true, message: "Record deleted", type: "success" });
      resetSessionTimer();
    } catch {
      setToast({ show: true, message: "Failed to delete", type: "error" });
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownOpen && !e.target.closest(".dropdown-actions")) setDropdownOpen(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // --- Derived counts ---
  const canViewAllRecords = user && (user.role === "admin" || user.role === "hr");
  const presentCount      = displayData.filter(r => r.status === "Present").length;
  const absentCount       = displayData.filter(r => r.status === "Absent").length;
  const leaveCount        = displayData.filter(r => r.status === "Leave").length;
  const lateCount         = displayData.filter(r => r.status === "Late").length;
  const halfDayCount      = displayData.filter(r => r.status === "Half Day").length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans tracking-tight">
      {/* 🔹 Premium Header Area - Light Theme */}
      <div className="bg-white pt-10 pb-20 px-4 md:px-8 border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-bl from-blue-500/5 to-transparent opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl" />
        
        <div className="max-w-[1600px] mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 backdrop-blur-sm shadow-sm transition-transform hover:scale-105">
                <FiClock className="text-blue-600 text-3xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Operational Stream</span>
                  <div className="h-1 w-1 bg-slate-200 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Temporal Matrix</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Time & Attendance</h1>
                <p className="text-slate-500 text-sm mt-1 max-w-md leading-relaxed font-bold">
                  Monitor professional engagement and manage workforce schedules with precision.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPunchInModal(true)}
                  disabled={isLoggedIn || !user}
                  className={`flex items-center gap-2 h-12 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all active:scale-95 shadow-2xl ${
                    isLoggedIn || !user
                      ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed shadow-none"
                      : "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700 shadow-emerald-500/20"
                  }`}
                >
                  <FiLogIn size={16} /> Punch In
                </button>
                <button
                  onClick={() => setShowPunchOutModal(true)}
                  disabled={!isLoggedIn || !user}
                  className={`flex items-center gap-2 h-12 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all active:scale-95 shadow-2xl ${
                    !isLoggedIn || !user
                      ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed shadow-none"
                      : "bg-rose-600 text-white border-rose-500 hover:bg-rose-700 shadow-rose-500/20"
                  }`}
                >
                  <FiLogOut size={16} /> Punch Out
                </button>
              </div>
              {canViewAllRecords && (
                <button 
                  onClick={exportToCSV} 
                  className="h-12 px-6 rounded-2xl bg-white border border-slate-200 text-slate-900 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                >
                  <FiDownload size={16} /> Export CSV
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-10 max-w-[1600px] mx-auto w-full px-4 md:px-6 pb-12 relative z-20">
        {/* ── Today's punch cards ──────────────────────────────────────── */}
        {user && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/50 shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 shrink-0 border border-green-100 shadow-sm">
                <FiLogIn size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Session Start</p>
                <p className="text-2xl font-black text-slate-900 font-mono tracking-tighter">
                  {isLoggedIn && attendanceRecord?.loginTime
                    ? attendanceRecord.loginTime
                    : myTodayRecord?.punch_in || "--:--"}
                </p>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/50 shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shrink-0 border border-red-100 shadow-sm">
                <FiLogOut size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Session End</p>
                <p className="text-2xl font-black text-slate-900 font-mono tracking-tighter">
                  {isLoggedIn ? "--:--" : myTodayRecord?.punch_out || "--:--"}
                </p>
              </div>
            </div>
            
            {canViewAllRecords && (
              <>
                <StatCard label="Present Assets" value={presentCount} icon={<FiCheckCircle />} color="emerald" />
                <StatCard label="Critical Vacancy" value={absentCount} icon={<FiXCircle />} color="red" />
              </>
            )}
          </div>
        )}

        {/* ── Admin/HR stat cards ──────────────────────────────────────── */}
        {canViewAllRecords && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard label="Late Arrivals" value={lateCount} icon={<FiActivity />} color="orange" />
            <StatCard label="Half Day Cycles" value={halfDayCount} icon={<FiActivity />} color="purple" />
            <StatCard label="On Leave" value={leaveCount} icon={<FiCalendar />} color="blue" />
          </div>
        )}

        {/* ── Filter bar ───────────────────────────────────────────────── */}
        <div className="erp-card p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <FiFilter className="text-slate-400 shrink-0" />
            {canViewAllRecords && (
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search employee..."
                  className="erp-input pl-8 h-9 w-48 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            )}
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
              <input
                type="date"
                className="erp-input pl-9 h-9 text-sm"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        <div className="erp-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Punch In</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Punch Out</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  {canViewAllRecords && <th className="px-6 py-4 text-right" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {error ? (
                  <tr>
                    <td colSpan={canViewAllRecords ? 7 : 6} className="py-20 px-6">
                      <EmptyState 
                        type="error" 
                        title="Timeline Sync Failure" 
                        message="Connectivity to the temporal matrix has been compromised. Re-synchronization required."
                        onRetry={fetchRecords}
                      />
                    </td>
                  </tr>
                ) : displayData.length === 0 ? (
                  <tr>
                    <td colSpan={canViewAllRecords ? 7 : 6} className="py-20 px-6">
                      <EmptyState 
                        type={search ? "search" : "empty"}
                        title={search ? "No Record Matches" : "Temporal Void"} 
                        message={search ? `No personnel engagement logs match "${search}" for this cycle.` : "The temporal ledger for this date is currently empty."}
                      />
                    </td>
                  </tr>
                ) : displayData.map((rec) => {
                  const sc = statusColors[rec.status];
                  return (
                    <tr key={rec.employeeId + rec.date} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0 border border-slate-200">
                            {rec.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{rec.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{rec.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{rec.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600">{rec.punch_in || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600">{rec.punch_out || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">{rec.workingHours || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold border ${sc ? `${sc.bg} ${sc.text} ${sc.border}` : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc?.dot || "bg-slate-400"}`} />
                          {rec.status}
                        </span>
                      </td>
                      {canViewAllRecords && (
                        <td className="px-6 py-4 text-right whitespace-nowrap dropdown-actions">
                          <div className="relative inline-block">
                            <button
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDropdownOpen(dropdownOpen === rec.employeeId + rec.date ? null : rec.employeeId + rec.date);
                              }}
                            >
                              <FiMoreVertical size={15} />
                            </button>
                            <div className={`absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-2xl border border-slate-100 z-20 overflow-hidden transition-all duration-150 origin-top-right ${dropdownOpen === rec.employeeId + rec.date ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"}`}>
                              <button
                                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                onClick={() => {
                                  if (!rec._id) { setToast({ show: true, message: "Cannot edit absent record", type: "error" }); return; }
                                  setEditingRecord(rec); setShowEditModal(true); setDropdownOpen(null);
                                }}
                              >
                                <FiEdit2 size={13} /> Edit
                              </button>
                              <div className="border-t border-slate-100" />
                              <button
                                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                onClick={() => {
                                  if (!rec._id) { setToast({ show: true, message: "Cannot delete absent record", type: "error" }); return; }
                                  setRecordToDelete(rec); setShowDeleteModal(true); setDropdownOpen(null);
                                }}
                              >
                                <FiTrash2 size={13} /> Delete
                              </button>
                            </div>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />

      {/* ── Punch In Modal ── */}
      {showPunchInModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 text-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-600 mx-auto mb-4">
              <FiLogIn size={26} />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Start Session?</h2>
            <p className="text-sm text-slate-500 mb-5">Tracking time for <span className="font-bold text-slate-700">{user?.name}</span>.</p>
            <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-medium">Date</span>
                <span className="font-mono text-slate-700">{getISTDateTime().date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-medium">Time</span>
                <span className="font-mono text-slate-700">{getISTDateTime().time}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPunchInModal(false)} className="erp-button-secondary flex-1">Cancel</button>
              <button onClick={handlePunchIn} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-green-700 transition-colors">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Punch Out Modal ── */}
      {showPunchOutModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 text-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-600 mx-auto mb-4">
              <FiLogOut size={26} />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">End Session?</h2>
            <p className="text-sm text-slate-500 mb-5">Total hours will be calculated on confirmation.</p>
            <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Session Started</p>
              <p className="text-lg font-mono font-semibold text-slate-700">{attendanceRecord?.loginTime || "--:--"}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPunchOutModal(false)} className="erp-button-secondary flex-1">Cancel</button>
              <button onClick={handlePunchOut} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-red-700 transition-colors">Confirm Punch Out</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FiEdit2 size={15} className="text-blue-600" /> Edit Record
              </h2>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><FiX /></button>
            </div>
            <form onSubmit={handleUpdateRecord} className="px-6 py-5 space-y-4">
              <div>
                <label className="erp-label">Status</label>
                <select value={editingRecord.status} onChange={(e) => setEditingRecord({ ...editingRecord, status: e.target.value })} className="erp-input">
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Absent">Absent</option>
                  <option value="Leave">Leave</option>
                  <option value="Auto Punch Out">Auto Punch Out</option>
                  <option value="Failed Punchout">Failed Punchout</option>
                </select>
              </div>
              <div>
                <label className="erp-label">Punch In</label>
                <input type="text" value={editingRecord.punch_in || ""} onChange={(e) => setEditingRecord({ ...editingRecord, punch_in: e.target.value })} className="erp-input" placeholder="e.g. 09:00:00 AM" />
              </div>
              <div>
                <label className="erp-label">Punch Out</label>
                <input type="text" value={editingRecord.punch_out || ""} onChange={(e) => setEditingRecord({ ...editingRecord, punch_out: e.target.value })} className="erp-input" placeholder="e.g. 05:00:00 PM" />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowEditModal(false)} className="erp-button-secondary">Cancel</button>
                <button type="submit" className="erp-button-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {showDeleteModal && recordToDelete && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 text-center">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner"><FiTrash2 size={28} /></div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-2">Delete Record?</h3>
            <p className="text-xs text-slate-500 font-medium mb-8 leading-relaxed">
              This will permanently delete the attendance record for <span className="text-slate-900 font-black">{recordToDelete.name}</span>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleDeleteRecord} className="flex-1 py-3 rounded-xl bg-red-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-red-700 shadow-xl shadow-red-500/20 transition-all">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/50 shadow-xl overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
          <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
        </div>
        <div className={`p-3 rounded-2xl ${colors[color] || colors.blue} border border-current/10 shadow-sm`}>
          {React.cloneElement(icon, { size: 20 })}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
