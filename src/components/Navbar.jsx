import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CompanyLogo from "../assets/logo.png";
import { GrDocumentMissing } from "react-icons/gr";
import { Bell, Menu, X, ChevronDown, LogOut, ShieldCheck, Search, HelpCircle, User, Network } from "lucide-react";

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
  } catch {
    return null;
  }
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenu, setMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // ✅ Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const user = getUserSafe();
  const token = localStorage.getItem("token");
  const userId = user?._id || user?.id;

  const { role, employeeId, name, profileImage } = user || {
    role: "guest",
    employeeId: "",
    name: "Guest",
    profileImage: "",
  };

  // ✅ Fetch Notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      setLoadingNotifs(true);
      const res = await getMyNotifications(token, 1, 10);
      setNotifications(res?.data?.data || []);
    } catch (err) {
      console.log("❌ Notification fetch error:", err?.response?.data || err.message);
    } finally {
      setLoadingNotifs(false);
    }
  };

  // ✅ Fetch Unread Count
  const fetchUnread = async () => {
    if (!token) return;
    try {
      const res = await getUnreadCount(token);
      setUnreadCount(res?.data?.unread || 0);
    } catch (err) {
      console.log("❌ Unread count error:", err?.response?.data || err.message);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await markAllRead(token);
      await fetchNotifications();
      await fetchUnread();
    } catch (err) {
      console.log("❌ Mark all read error:", err?.response?.data || err.message);
    }
  };

  const handleMarkRead = async (id) => {
    if (!token || !id) return;
    try {
      await markOneRead(token, id);
      await fetchNotifications();
      await fetchUnread();
    } catch (err) {
      console.log("❌ Mark read error:", err?.response?.data || err.message);
    }
  };

  const handleDeleteNotif = async (id) => {
    if (!token || !id) return;
    try {
      await deleteOneNotification(token, id);
      await fetchNotifications();
      await fetchUnread();
    } catch (err) {
      console.log("❌ Delete notification error:", err?.response?.data || err.message);
    }
  };

  // ✅ Initial Load
  useEffect(() => {
    if (token) {
      fetchNotifications();
      fetchUnread();
    }
  }, [token]);

  // ✅ Logout Handler (removed socket.disconnect)
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    navigate("/");
  };

  // ✅ close dropdowns on outside click
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

  // ✅ Menu Items - Grouped and Cleaned
  const menuItems = [
    { name: "Overview", path: "/dashboard" },
    ...(role === "admin" || role === "hr" ? [{ name: "Personnel", path: "/employees" }] : []),
    { name: "Projects", path: "/projects" },
    { name: "Tasks", path: "/tasks" },
    { name: "Presence", path: "/attendance" },
    { name: "Leave", path: "/leave" },
    ...(role === "admin" || role === "hr" ? [{ name: "Payroll", path: "/payroll" }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm transition-all duration-200">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center h-14">
          
          {/* Logo Section */}
          <div className="flex items-center gap-8 shrink-0">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shadow-lg border border-slate-200 overflow-hidden">
                <img src={CompanyLogo} alt="Logo" className="w-8 h-8 object-contain" />
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight hidden sm:block">Wordlane Tech</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.path)
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Search Bar - ERP Standard */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search modules, tasks, or users..." 
                className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 transition-all"
              />
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2 shrink-0">
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-md transition-colors relative hidden sm:block">
              <HelpCircle size={20} />
            </button>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) {
                    fetchNotifications();
                    fetchUnread();
                  }
                }}
                className={`p-2 rounded-md transition-all relative ${
                  showNotifications ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-[350px] bg-white rounded-lg shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[400px] overflow-y-auto">
                    {loadingNotifs ? (
                      <div className="p-8 text-center text-xs text-slate-400 animate-pulse">Synchronizing...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        <Bell size={24} className="mx-auto mb-2 opacity-20" />
                        <p className="text-xs font-medium">System fully updated</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notifications.map((n) => (
                          <div
                            key={n._id}
                            className={`p-4 transition-colors hover:bg-slate-50 group ${!n.isRead ? "bg-blue-50/30" : ""}`}
                          >
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                  <p className="text-xs font-bold text-slate-900">{n.title}</p>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 leading-normal line-clamp-2">{n.message}</p>
                                <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!n.isRead && (
                                    <button onClick={() => handleMarkRead(n._id)} className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:underline">Read</button>
                                  )}
                                  <button onClick={() => handleDeleteNotif(n._id)} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-red-500 transition-colors">Dismiss</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Profile Section */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className={`flex items-center gap-2 p-1 pl-2 rounded-md transition-all ${
                  showProfileDropdown ? "bg-slate-100" : "hover:bg-slate-50"
                }`}
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-none mb-1">{name}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{role}</p>
                </div>
                <div className="relative">
                  {profileImage ? (
                    <img
                      src={`https://backend-node-5ylk.onrender.com${profileImage}`}
                      alt="Profile"
                      className="w-8 h-8 rounded shadow-sm object-cover grayscale-20"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-slate-800 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                      {name?.charAt(0)}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${showProfileDropdown ? "rotate-180" : ""}`} />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-4 bg-slate-50/50 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center text-slate-500 font-bold overflow-hidden">
                        {profileImage ? <img src={`https://backend-node-5ylk.onrender.com${profileImage}`} className="w-full h-full object-cover" /> : name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 truncate">{name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{employeeId}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-1">
                    <Link to="/profile" onClick={() => setShowProfileDropdown(false)} className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors">
                      <User size={16} className="text-slate-400" /> My Profile
                    </Link>

                    {(role === "admin" || role === "hr") && (
                      <>
                        <div className="h-px bg-slate-100 my-1 mx-2" />
                        <Link to="/admin/onboarding-documents" onClick={() => setShowProfileDropdown(false)} className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors">
                          <ShieldCheck size={16} className="text-slate-400" /> Document Verification
                        </Link>
                        <Link to="/admin/missing-documents" onClick={() => setShowProfileDropdown(false)} className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors">
                          <GrDocumentMissing size={16} className="text-slate-400" /> Compliance Audit
                        </Link>
                      </>
                    )}
                  </div>
                  <div className="p-1 mt-1 border-t border-slate-100">
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded transition-colors">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenu && (
        <div className="lg:hidden bg-white border-t border-slate-200 py-2 shadow-xl animate-in fade-in slide-in-from-top-1">
          <div className="px-4 flex flex-col gap-1">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenu(false)}
                className={`px-4 py-2 text-sm font-semibold rounded-md flex items-center justify-between group ${
                  isActive(item.path) ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.name}
                <ChevronDown size={14} className={`-rotate-90 opacity-40 group-hover:opacity-100 transition-all ${isActive(item.path) ? "opacity-100" : ""}`} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
