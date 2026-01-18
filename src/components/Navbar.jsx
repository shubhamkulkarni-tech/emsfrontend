import { socket } from "../socket";
import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CompanyLogo from "../assets/logo.png";
import { Bell, Menu, X, User, ChevronDown, LogOut, MoreVertical } from "lucide-react";

import {
  getMyNotifications,
  getUnreadCount,
  markAllRead,
  markOneRead,
  deleteOneNotification,
} from "../api/notificationApi";

// ✅ Safe Helper
const getUserSafe = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw || raw === "undefined" || raw === "null") return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Hooks (Top)
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Safe Data Fetching
  const user = getUserSafe();
  const token = localStorage.getItem("token");
  const userId = user?._id || user?.id;

  // Safe Destructure
  const { role, employeeId, name, profileImage } = user || { 
    role: "guest", 
    employeeId: "", 
    name: "Guest", 
    profileImage: "" 
  };

  // Functions
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      setLoadingNotifs(true);
      const res = await getMyNotifications(token);
      setNotifications(res?.data?.data || []);
    } catch (err) {
      console.log("Notification fetch error:", err?.message || err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const fetchUnread = async () => {
    if (!token) return;
    try {
      const res = await getUnreadCount(token);
      setUnreadCount(res?.data?.unread || 0);
    } catch (err) {
      console.log("Unread count error:", err?.message || err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await markAllRead(token);
      fetchNotifications();
      fetchUnread();
    } catch (err) {
      console.log("Mark all read error:", err?.message || err);
    }
  };

  const handleMarkRead = async (id) => {
    if (!token || !id) return;
    try {
      await markOneRead(token, id);
      fetchNotifications();
      fetchUnread();
    } catch (err) {
      console.log("Mark read error:", err?.message || err);
    }
  };

  const handleDeleteNotif = async (id) => {
    if (!token || !id) return;
    try {
      await deleteOneNotification(token, id);
      fetchNotifications();
      fetchUnread();
    } catch (err) {
      console.log("Delete notification error:", err?.message || err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/");
  };

  // Effects
  useEffect(() => {
    if (token) {
      fetchNotifications();
      fetchUnread();
    }
  }, [token]);

  useEffect(() => {
    if (!token || !userId) return;

    socket.emit("join", userId);

    const onNewNotification = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("newNotification", onNewNotification);

    return () => socket.off("newNotification", onNewNotification);
  }, [token, userId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Menu Items
  const menuItems = [
    { name: "Dashboard", path: "/dashboard" },
    ...(role === "admin"
      ? [
          { name: "Employees", path: "/employees" },
          { name: "Team", path: "/team" },
          { name: "Projects", path: "/projects" },
          { name: "Tickets", path: "/tasks" },
          { name: "Attendance", path: "/attendance" },
          { name: "Leaves", path: "/leave" },
        ]
      : []),
    ...(role === "manager"
      ? [
          { name: "Team", path: "/team" },
          { name: "Projects", path: "/projects" },
          { name: "Tickets", path: "/tasks" },
          { name: "Attendance", path: "/attendance" },
          { name: "Leaves", path: "/leave" },
        ]
      : []),
    ...(role === "hr"
      ? [
          { name: "Employees", path: "/employees" },
          { name: "Team", path: "/team" },
          { name: "Attendance", path: "/attendance" },
          { name: "Leaves", path: "/leave" },
        ]
      : []),
    ...(role === "employee"
      ? [
          { name: "Team", path: "/team" },
          { name: "Projects", path: "/projects" },
          { name: "Tickets", path: "/tasks" },
          { name: "Attendance", path: "/attendance" },
          { name: "Leaves", path: "/leave" },
        ]
      : []),
  ];

  return (
    // ✅ BACKGROUND: Solid White (No transparency, No blur)
    <nav className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* --- LOGO SECTION --- */}
          <Link to="/dashboard" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
              <img src={CompanyLogo} alt="Logo" className="w-6 h-6 object-contain transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-slate-800 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                Wordlane
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-tight">
                Tech
              </span>
            </div>
          </Link>

          {/* --- DESKTOP MENU (Horizontal Scrollable) --- */}
          <div className="hidden lg:flex items-center bg-slate-50/50 rounded-full px-1.5 py-1 border border-slate-200/60 shadow-inner max-w-[60%] mx-auto md:mx-0">
            <div className="flex items-center overflow-x-auto no-scrollbar space-x-1 px-1 py-1 snap-x">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`relative px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 shrink-0 snap-start whitespace-nowrap ${
                    location.pathname === item.path
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                      : "text-slate-600 hover:text-blue-600 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* --- RIGHT ACTIONS --- */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) {
                    fetchNotifications();
                    fetchUnread();
                  }
                }}
                className={`relative p-2.5 rounded-full transition-all duration-200 ${
                  showNotifications ? "bg-blue-50 text-blue-600 ring-2 ring-blue-100" : "text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                }`}
              >
                <Bell size={20} strokeWidth={2} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl shadow-slate-200/60 border border-slate-100 z-50 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                  <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Bell size={16} /> Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                        Mark all
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {loadingNotifs ? (
                      <p className="p-4 text-center text-sm text-slate-500">Loading...</p>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                        <Bell size={32} className="mb-2 opacity-20" />
                        <p className="text-sm">No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          className={`p-3 rounded-xl border transition-all duration-200 ${
                            n.isRead
                              ? "bg-white border-slate-100 hover:border-slate-200"
                              : "bg-blue-50/50 border-blue-100 hover:bg-blue-50"
                          }`}
                        >
                          <div className="flex gap-3">
                            {!n.isRead && <div className="w-2 h-2 mt-2 rounded-full bg-blue-600 shrink-0"></div>}
                            <div className="flex-1">
                              <p className={`text-sm font-semibold mb-1 ${n.isRead ? "text-slate-700" : "text-slate-900"}`}>{n.title}</p>
                              <p className="text-xs text-slate-500 leading-relaxed mb-2">{n.message}</p>
                              <div className="flex items-center gap-2 mb-1">
                                {!n.isRead && (
                                  <button onClick={() => handleMarkRead(n._id)} className="text-[10px] font-bold uppercase px-2 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
                                    Read
                                  </button>
                                )}
                                <button onClick={() => handleDeleteNotif(n._id)} className="text-[10px] font-bold uppercase px-2 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600">
                                  Delete
                                </button>
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {new Date(n.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 sm:gap-3 p-1 pr-2.5 rounded-full hover:bg-slate-100 transition-all duration-200 border border-transparent hover:border-slate-200 group"
              >
                <div className="relative">
                  {profileImage ? (
                    <img src={`https://emsbackend-2w9c.onrender.com${profileImage}`} alt="Profile" className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center border-2 border-white shadow-sm font-bold text-sm">
                      {name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-green-400"></span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-700 leading-none">{name || "User"}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">{role}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showProfileDropdown ? "rotate-180" : ""}`} />
              </button>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl shadow-slate-200/60 border border-slate-100 z-50 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                  <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-800 truncate">{name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-1 bg-slate-100 inline-block px-1.5 py-0.5 rounded">{employeeId || "ID: N/A"}</p>
                  </div>
                  <div className="p-2">
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors">
                      <LogOut size={18} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Toggle */}
            <button className="lg:hidden p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* --- MOBILE MENU --- */}
      {mobileMenu && (
        <div className="lg:hidden bg-white border-b border-slate-200 animate-[slideDown_0.2s_ease-out] shadow-xl">
          <div className="px-4 py-6 space-y-2 max-w-7xl mx-auto">
            {menuItems.map((item) => (
              <Link key={item.name} to={item.path} onClick={() => setMobileMenu(false)} className={`block px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-between group ${location.pathname === item.path ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}>
                <span>{item.name}</span>
                {location.pathname === item.path ? <ChevronDown size={16} /> : <ChevronDown size={16} className="opacity-0 group-hover:opacity-50" />}
              </Link>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </nav>
  );
};

export default Navbar;