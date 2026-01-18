import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Footer from "../components/Footer";
import Toast from "../components/Toast";
import {
  FiSearch, FiCalendar, FiClock, FiUser, FiCheckCircle,
  FiXCircle, FiLogIn, FiLogOut, FiEdit2, FiTrash2, FiDownload,
  FiMoreVertical, FiX, FiFilter, FiActivity, FiBriefcase, FiShield, FiUsers
} from "react-icons/fi";
import { useAuth } from '../context/AuthContext';

// --- AESTHETIC THEME PALETTE ---
const statusColors = {
  Present: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
  Absent: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  Leave: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200", dot: "bg-yellow-500" },
  Late: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  "Half Day": { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  "Auto Punch Out": { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200", dot: "bg-orange-600" }, 
  "Failed Punchout": { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", dot: "bg-red-600" }, 
};

const API_URL = "https://emsbackend-2w9c.onrender.com/api/attendance";
const USERS_API = "https://emsbackend-2w9c.onrender.com/api/users";
const LEAVES_API = "https://emsbackend-2w9c.onrender.com/api/leaves";

const Attendance = () => {
  const navigate = useNavigate();

  const {
    user,
    isLoggedIn,
    attendanceRecord,
    logoutTime,
    setIsLoggedIn,
    setAttendanceRecord,
    setLoginTime,
    setLogoutTime,
    clearAuthState
  } = useAuth();

  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));

  // View & Modals
  const [viewMode, setViewMode] = useState('list');
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const [showPunchInModal, setShowPunchInModal] = useState(false);
  const [showPunchOutModal, setShowPunchOutModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // CRUD States
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const activityTimeoutRef = useRef(null);

  // --- Helper: Get Auth Headers ---
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // --- Helper: Get Current IST Time ---
  const getISTDateTime = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const timeStr = now.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    return { date: dateStr, time: timeStr };
  };

  // --- Helper: Parse Time String to Date Object (24h) ---
  const parseTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return new Date(2000, 0, 1, 0, 0, 0);
    const [time, period] = timeStr.split(' ');
    if (!time || !period) return new Date(2000, 0, 1, 0, 0, 0);
    const [hours, minutes, seconds] = time.split(':').map(Number);
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;
    return new Date(2000, 0, 1, hour24, minutes, seconds || 0);
  };

  // --- Helper: Calculate Status Based on Strict Rules ---
  const getDerivedStatus = (timeStr) => {
    if (!timeStr) return 'Absent';
    
    const punch = parseTime(timeStr);
    const hour = punch.getHours();

    if (hour >= 10 && hour < 11) return 'Present';
    if (hour >= 11 && hour < 14) return 'Late';
    if (hour >= 14 && hour < 15) return 'Half Day';
    return 'Absent'; 
  };

  // --- Helper: Session Timer (Heartbeat) ---
  const resetSessionTimer = () => {
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const newExpiry = Date.now() + TEN_MINUTES_MS;
    localStorage.setItem('tokenExpiry', newExpiry.toString());
  };

  const handleSessionExpired = () => {
    setIsLoggedIn(false);
    setAttendanceRecord(null);
    setLoginTime(null);
    clearAuthState();
    setToast({ show: true, message: 'Session Expired. Please login again.', type: 'error' });
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('token');
    setTimeout(() => navigate('/'), 2000);
  };

  // --- Effects ---
  useEffect(() => {
    if (!user) return;
    const EXPIRY_KEY = 'tokenExpiry';
    const checkInterval = setInterval(() => {
      const now = Date.now();
      const expiry = parseInt(localStorage.getItem(EXPIRY_KEY));
      if (now > expiry) {
        clearInterval(checkInterval);
        handleSessionExpired();
      }
    }, 1000);

    const handleActivity = () => resetSessionTimer();
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(evt => window.addEventListener(evt, handleActivity));

    return () => {
      clearInterval(checkInterval);
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
    };
  }, [user]);

  // Helper Functions
  const calculateWorkingHours = (loginTime, logoutTime) => {
    if (!loginTime || !logoutTime) return { hours: 0, minutes: 0, seconds: 0 };
    const login = parseTime(loginTime);
    const logout = parseTime(logoutTime);
    const diffMs = logout - login;
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { hours, minutes, seconds };
  };

  const formatTimer = (timer) => {
    if (!timer) return '0s';
    const parts = [];
    if (timer.hours > 0) parts.push(`${timer.hours}h`);
    if (timer.minutes > 0 || timer.hours > 0) parts.push(`${timer.minutes}m`);
    parts.push(`${timer.seconds}s`);
    return parts.join(' ');
  };

  const exportToCSV = () => {
    if (displayData.length === 0) {
      setToast({ show: true, message: 'No data to export', type: 'error' });
      return;
    }
    const headers = ["Employee ID", "Name", "Date", "Punch In", "Punch Out", "Working Hours", "Status"];
    const csvRows = [headers.join(',')];
    displayData.forEach(row => {
      const values = [
        `"${row.employeeId}"`, `"${row.name || ''}"`, `"${row.date}"`,
        `"${row.punch_in || ''}"`, `"${row.punch_out || ''}"`, `"${row.workingHours || ''}"`, `"${row.status}"`
      ];
      csvRows.push(values.join(','));
    });
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', ''); a.setAttribute('href', url);
    a.setAttribute('download', `attendance_report_${getISTDateTime().date}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setToast({ show: true, message: 'CSV downloaded', type: 'success' });
  };

  // --- Fetch Functions ---
  const fetchUsers = async () => {
    if (!user) return;
    try {
      const res = await axios.get(USERS_API, { headers: getAuthHeader() });
      setUsers(res.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchLeaves = async () => {
    if (!user) return;
    try {
      const res = await axios.get(LEAVES_API, { headers: getAuthHeader() });
      setLeaves(res.data || []);
    } catch (err) {
      console.error("Error fetching leaves:", err);
      setLeaves([]);
    }
  };

  const fetchRecords = async () => {
    try {
      if (!user) return;
      let res;
      if (user.role === 'employee' || user.role === 'manager') {
        res = await axios.get(`${API_URL}/employee/${user.employeeId}`, { headers: getAuthHeader() });
        setRecords(res.data);
        checkActiveSession(res.data);
      } else if (user.role === 'admin' || user.role === 'hr') {
        res = await axios.get(API_URL, { headers: getAuthHeader() });
        const allRecords = res.data.records || res.data;
        setRecords(allRecords);
        fetchUsers();
        fetchLeaves();
        const userRecords = allRecords.filter(r => r.employeeId === user.employeeId);
        checkActiveSession(userRecords);
      }
    } catch (err) {
      console.error("Error fetching records:", err);
      setToast({ show: true, message: "Failed to fetch records", type: "error" });
    }
  };

  const checkActiveSession = (userRecords) => {
    if (!userRecords) return;
    const istDate = getISTDateTime().date;
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

  // --- DATA MERGE LOGIC WITH AUTO PUNCH OUT RULE ---
  useEffect(() => {
    if (!user) return;

    // 1. Employee View
    if (user.role === 'employee' || user.role === 'manager') {
      let temp = [...records];
      if (search.trim() !== "") {
        temp = temp.filter((r) => r?.name?.toLowerCase().includes(search.toLowerCase()));
      }
      if (selectedDate.trim() !== "") {
        temp = temp.filter((r) => r.date && r.date.startsWith(selectedDate));
      }

      temp = temp.map(r => {
        // Default status based on Punch In
        let currentStatus = getDerivedStatus(r.punch_in);
        
        // AUTO PUNCH OUT RULE:
        // If punch_out exists and is >= 18:00, force status to "Auto Punch Out"
        if (r.punch_out) {
            const hour = parseTime(r.punch_out).getHours();
            if (hour >= 18) {
                currentStatus = 'Auto Punch Out';
            }
        }

        // Respect specific DB overrides (like explicit Failed Punchout)
        if (r.status === 'Failed Punchout' || r.status === 'Auto Punch Out' || r.status === 'Leave') {
            currentStatus = r.status;
        }

        return { ...r, status: currentStatus };
      });

      setDisplayData(temp);
      return;
    }

    // 2. Admin/HR View
    if (user.role === 'admin' || user.role === 'hr') {
      const filteredUsers = users.filter(u =>
        u?.name?.toLowerCase().includes(search.toLowerCase())
      );

      let mergedList = filteredUsers.map(u => {
        const empId = u.employeeId || u._id;

        // Check for Approved Leave
        const onLeave = leaves.find(l => l.employeeId === empId && l.date === selectedDate);
        if (onLeave) {
          return {
            _id: null,
            employeeId: empId,
            name: u.name,
            date: selectedDate,
            status: 'Leave',
            punch_in: null,
            punch_out: null,
            workingHours: null
          };
        }

        const att = records.find(r => r.employeeId === empId && r.date === selectedDate);

        if (att) {
          // Default status based on Punch In
          let finalStatus = getDerivedStatus(att.punch_in);
          
          // AUTO PUNCH OUT RULE:
          // If punch_out exists and is >= 18:00, force status to "Auto Punch Out"
          if (att.punch_out) {
             const hour = parseTime(att.punch_out).getHours();
             if (hour >= 18) {
                 finalStatus = 'Auto Punch Out';
             } 
          }
          
          // Respect DB explicit override if it's leave or absent
          if (att.status === 'Leave' || att.status === 'Absent' || att.status === 'Failed Punchout') {
              finalStatus = att.status;
          }

          return { ...att, status: finalStatus };
        } else {
          return {
            _id: null,
            employeeId: empId,
            name: u.name,
            date: selectedDate,
            status: 'Absent',
            punch_in: null,
            punch_out: null,
            workingHours: null
          };
        }
      });

      // Sorting Priority: Present < Late < Half Day < Leave < Auto Punch Out < Absent
      mergedList.sort((a, b) => {
        const priority = { 'Present': 1, 'Late': 2, 'Half Day': 3, 'Leave': 4, 'Auto Punch Out': 4.5, 'Failed Punchout': 4.6, 'Absent': 5 };
        const pA = priority[a.status] || 5;
        const pB = priority[b.status] || 5;
        if (pA !== pB) return pA - pB;
        return a.name.localeCompare(b.name);
      });

      setDisplayData(mergedList);
    }
  }, [search, selectedDate, records, users, user, leaves]);

  // --- Helpers for Today's Status ---
  const istDate = getISTDateTime().date;
  const myTodayRecord = records.find(r => r.date === istDate && r.employeeId === user.employeeId);

  // --- Handlers ---
  const handlePunchIn = async () => {
    if (!user) return;
    const { date: currentDate, time: currentTime } = getISTDateTime();
    try {
      const response = await axios.post(API_URL, {
        employeeId: user.employeeId, name: user.name, date: currentDate, punch_in: currentTime
      }, { headers: getAuthHeader() });
      setIsLoggedIn(true); setLoginTime(currentTime);
      setRecords(prev => [...prev, response.data]);
      setShowPunchInModal(false);
      setToast({ show: true, message: 'Punch In successful!', type: 'success' });
      resetSessionTimer();
    } catch (error) {
      setToast({ show: true, message: error.response?.data?.message || 'Punch In failed', type: "error" });
    }
  };

  const handlePunchOut = async () => {
    if (!user || !attendanceRecord) return;
    
    // --- RESTRICTION: Check if before 17:00 (5:00 PM) ---
    const currentTimeStr = getISTDateTime().time; 
    const currentDateObj = parseTime(currentTimeStr);
    const currentHour = currentDateObj.getHours(); 

    if (currentHour < 17) {
      setToast({ 
        show: true, 
        message: "You'll have to wait till 5:00:00 to punchout", 
        type: 'error' 
      });
      setShowPunchOutModal(false); 
      return; 
    }
    // ------------------------------------------------

    const sessionDate = attendanceRecord.date;
    const currentTime = getISTDateTime().time;
    try {
      const workingHours = calculateWorkingHours(attendanceRecord.loginTime, currentTime);
      await axios.put(`${API_URL}/logout`, {
        employeeId: user.employeeId, date: sessionDate,
        punch_out: currentTime, workingHours: formatTimer(workingHours)
      }, { headers: getAuthHeader() });
      
      setLogoutTime(currentTime); 
      setIsLoggedIn(false); 
      setAttendanceRecord(null);
      
      setRecords(prev => prev.map(r => r._id === attendanceRecord._id
        ? { ...r, punch_out: currentTime, workingHours: formatTimer(workingHours) } : r
      ));
      setShowPunchOutModal(false);
      setToast({ show: true, message: 'Punch Out successful!', type: 'success' });
      resetSessionTimer();
    } catch (error) {
      console.error(error);
      setToast({ show: true, message: error.response?.data?.message || 'Punch Out failed', type: "error" });
    }
  };

  const handleUpdateRecord = async (e) => {
    e.preventDefault();

    if (!editingRecord._id) {
      setToast({ show: true, message: 'Cannot update this record. Employee has not punched in yet.', type: 'error' });
      setShowEditModal(false);
      return;
    }

    try {
      const { _id, ...dataToUpdate } = editingRecord;
      const response = await axios.put(`${API_URL}/${_id}`, dataToUpdate, { headers: getAuthHeader() });
      setRecords(prev => prev.map(r => r._id === _id ? response.data : r));
      setShowEditModal(false);
      setToast({ show: true, message: 'Record updated', type: 'success' });
      resetSessionTimer();
    } catch (error) {
      setToast({ show: true, message: 'Failed to update', type: 'error' });
    }
  };

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    try {
      await axios.delete(`${API_URL}/${recordToDelete._id}`, { headers: getAuthHeader() });
      setRecords(prev => prev.filter(r => r._id !== recordToDelete._id));
      setShowDeleteModal(false); setRecordToDelete(null);
      setToast({ show: true, message: 'Record deleted', type: 'success' });
      resetSessionTimer();
    } catch (error) {
      setToast({ show: true, message: 'Failed to delete', type: 'error' });
    }
  };

  // Click Outside Dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen) {
        if (!event.target.closest('.dropdown-actions')) {
          setDropdownOpen(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const canViewAllRecords = user && (user.role === 'admin' || user.role === 'hr');
  const presentCount = displayData.filter(r => r.status === 'Present').length;
  const absentCount = displayData.filter(r => r.status === 'Absent').length;
  const leaveCount = displayData.filter(r => r.status === 'Leave').length;
  const lateCount = displayData.filter(r => r.status === 'Late').length;
  const halfDayCount = displayData.filter(r => r.status === 'Half Day').length;
  const autoPunchOutCount = displayData.filter(r => r.status === 'Auto Punch Out').length;

  return (
    <><div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      
      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Attendance Directory</h1>
            <p className="text-slate-500 text-sm mt-1">Manage daily punches and working hours</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
            <div className="flex gap-2 w-full sm:w-auto bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setShowPunchInModal(true)}
                disabled={isLoggedIn || !user}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all duration-300 ${isLoggedIn || !user ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                  }`}>
                <FiLogIn size={18} /> Punch In
              </button>
              <button
                onClick={() => setShowPunchOutModal(true)}
                disabled={!isLoggedIn || !user}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all duration-300 ${!isLoggedIn || !user ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  }`}>
                <FiLogOut size={18} /> Punch Out
              </button>
            </div>
          </div>
        </div>

        {/* --- NEW: USER'S TODAY STATUS CARDS --- */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Punch In Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                <FiLogIn size={24} />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Punch In (Today)</p>
                <p className="text-2xl font-bold text-slate-800 font-mono">
                  {isLoggedIn && attendanceRecord?.loginTime ? attendanceRecord.loginTime : (myTodayRecord?.punch_in || '--:--')}
                </p>
              </div>
            </div>

            {/* Punch Out Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <FiLogOut size={24} />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Punch Out (Today)</p>
                <p className="text-2xl font-bold text-slate-800 font-mono">
                  {isLoggedIn ? '--:--' : (myTodayRecord?.punch_out || '--:--')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- ADMIN/HR STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          {canViewAllRecords && (
            <>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0"><FiCheckCircle size={24} /></div>
                <div className="flex flex-col justify-center"><p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Present</p><p className="text-2xl font-bold text-slate-800">{presentCount}</p></div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0"><FiClock size={24} /></div>
                <div className="flex flex-col justify-center"><p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Late</p><p className="text-2xl font-bold text-slate-800">{lateCount}</p></div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0"><FiActivity size={24} /></div>
                <div className="flex flex-col justify-center"><p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Half Day</p><p className="text-2xl font-bold text-slate-800">{halfDayCount}</p></div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 shrink-0"><FiCalendar size={24} /></div>
                <div className="flex flex-col justify-center"><p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">On Leave</p><p className="text-2xl font-bold text-slate-800">{leaveCount}</p></div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0"><FiXCircle size={24} /></div>
                <div className="flex flex-col justify-center"><p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Absent</p><p className="text-2xl font-bold text-slate-800">{absentCount}</p></div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 w-full gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex gap-1 p-1">
            <button onClick={() => setViewMode('list')} className={`px-5 py-2 rounded-xl font-medium transition-all duration-200 ${viewMode === 'list' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>List View</button>
          </div>

          <div className="flex gap-3 w-full sm:w-auto items-center pl-2 sm:pl-4 border-l border-slate-100">
            <div className="relative flex-grow sm:flex-grow-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiCalendar className="text-slate-400" /></div>
              <input type="date" className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full text-sm" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            {canViewAllRecords && (
              <button onClick={exportToCSV} className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 hover:shadow-indigo-300 active:scale-95">
                <FiDownload size={18} /> Export CSV
              </button>
            )}
          </div>
        </div>

        {canViewAllRecords && (
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><FiFilter className="text-slate-400" /></div>
            <input type="text" placeholder="Search employee..." className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        )}
        {viewMode === 'list' && (
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Punch In</th>
                    <th className="px-6 py-4">Punch Out</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Status</th>
                    {canViewAllRecords && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayData.length === 0 ? (
                    <tr><td colSpan={canViewAllRecords ? 7 : 6} className="p-12 text-center text-slate-400">No records found for this date.</td></tr>
                  ) : displayData.map((rec) => (
                    <tr key={rec.employeeId + rec.date} className={`hover:bg-blue-50/30 transition duration-200 group ${rec.status === 'Absent' || rec.status === 'Auto Punch Out' ? 'bg-red-50/20' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0 border border-slate-200">
                            {rec.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col justify-center">
                            <span className="font-bold text-slate-800 text-sm">{rec.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{rec.employeeId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">{rec.date}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">{rec.punch_in || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">{rec.punch_out || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-800 font-semibold">{rec.workingHours || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border flex items-center gap-1.5 w-max ${statusColors[rec.status] ? `${statusColors[rec.status].bg} ${statusColors[rec.status].text} ${statusColors[rec.status].border}` : "bg-gray-100 text-gray-600"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusColors[rec.status]?.dot || "bg-gray-400"}`}></span>
                          {rec.status}
                        </span>
                      </td>
                      {canViewAllRecords && (
                        <td className="px-6 py-4 text-right relative dropdown-actions">
                          <div className="inline-block relative">
                            <button
                              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDropdownOpen(dropdownOpen === rec.employeeId + rec.date ? null : rec.employeeId + rec.date);
                              }}
                            >
                              <FiMoreVertical className="text-xl" />
                            </button>
                            <div
                              className={`absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-slate-100 z-20 overflow-hidden transition-all duration-200 origin-top-right ${dropdownOpen === rec.employeeId + rec.date ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
                                }`}
                            >
                              <button
                                className="block w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 flex items-center gap-2 hover:text-blue-600 transition-colors"
                                onClick={() => {
                                  if (!rec._id) {
                                    setToast({ show: true, message: 'Cannot edit absent record (No punch-in)', type: 'error' });
                                    return;
                                  }
                                  setEditingRecord(rec);
                                  setShowEditModal(true);
                                  setDropdownOpen(null);
                                }}
                              >
                                <FiEdit2 size={14} /> Edit
                              </button>
                              <div className="border-t border-slate-100">
                                <button
                                  onClick={() => {
                                    if (!rec._id) {
                                      setToast({ show: true, message: 'Cannot delete absent record (No punch-in)', type: 'error' });
                                      return;
                                    }
                                    setRecordToDelete(rec);
                                    setShowDeleteModal(true);
                                    setDropdownOpen(null);
                                  }}
                                  className="block w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                >
                                  <FiTrash2 size={14} /> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
      <Footer />

      {/* --- PUNCH IN MODAL --- */}
      {showPunchInModal && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center backdrop-blur-xl p-4" style={{ background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 58, 138, 0.75) 50%, rgba(15, 23, 42, 0.95) 100%)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 mx-auto mb-4">
              <FiLogIn size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Start Session?</h2>
            <p className="text-slate-500 mb-6">Start tracking time for <span className="font-bold text-slate-700">{user?.name}</span>.</p>
            <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100 text-left">
              <div className="flex justify-between mb-2"><span className="text-xs text-slate-400 uppercase font-semibold">Date</span> <span className="font-mono text-sm text-slate-700">{getISTDateTime().date}</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-400 uppercase font-semibold">Time</span> <span className="font-mono text-sm text-slate-700">{getISTDateTime().time}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPunchInModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition">Cancel</button>
              <button onClick={handlePunchIn} className="flex-1 px-4 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition shadow-lg shadow-green-200">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* --- PUNCH OUT MODAL --- */}
      {showPunchOutModal && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center backdrop-blur-xl p-4" style={{ background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 58, 138, 0.75) 50%, rgba(15, 23, 42, 0.95) 100%)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto mb-4">
              <FiLogOut size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">End Session?</h2>
            <p className="text-slate-500 mb-6">Stop tracking time. Total hours will be calculated upon confirmation.</p>
            
            <div className="flex flex-col items-center justify-center bg-slate-50 py-4 rounded-xl border border-slate-100 mb-6">
                 <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Session Started</p>
                 <p className="text-lg font-mono text-slate-700 font-semibold">{attendanceRecord?.loginTime || "--:--"}</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowPunchOutModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition">Cancel</button>
              <button onClick={handlePunchOut} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition shadow-lg shadow-red-200">Confirm Punch Out</button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center backdrop-blur-xl p-4" style={{ background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 58, 138, 0.75) 50%, rgba(15, 23, 42, 0.95) 100%)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><FiEdit2 className="text-blue-600" /> Edit Record</h2>
            <form onSubmit={handleUpdateRecord} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select value={editingRecord.status} onChange={(e) => setEditingRecord({ ...editingRecord, status: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none">
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Punch In</label>
                <input type="text" value={editingRecord.punch_in || ''} onChange={(e) => setEditingRecord({ ...editingRecord, punch_in: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" placeholder="e.g. 09:00:00 AM" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Punch Out</label>
                <input type="text" value={editingRecord.punch_out || ''} onChange={(e) => setEditingRecord({ ...editingRecord, punch_out: e.target.value })} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" placeholder="e.g. 05:00:00 PM" />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE MODAL --- */}
      {showDeleteModal && recordToDelete && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center backdrop-blur-xl p-4" style={{ background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 58, 138, 0.75) 50%, rgba(15, 23, 42, 0.95) 100%)" }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Delete Record?</h2>
            <p className="text-slate-500 mb-6 text-sm">Are you sure you want to delete this record for <strong>{recordToDelete.name}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition">Cancel</button>
              <button onClick={handleDeleteRecord} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition shadow-lg shadow-red-200">Delete</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}</style>

    <div />
  </div></>
    
  )};
export default Attendance;