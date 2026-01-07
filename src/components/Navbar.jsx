import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CompanyLogo from '../assets/logo.png';
import { Bell, Menu, X, User, ChevronDown, LogOut } from 'lucide-react';

const Navbar = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  if (!user) return null;

  const { role, employeeId, name, profileImage } = user;

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard' },
    ...(role === 'admin'
      ? [
          { name: 'Employees', path: '/employees' },
          { name: 'Team', path: '/team' },
          { name: 'Projects', path: '/projects' },
          { name: 'Tickets', path: '/tasks' },
          { name: 'Attendance', path: '/attendance' },
          { name: 'Leaves', path: '/leave' },
        ]
      : []),
    ...(role === 'manager'
      ? [
          { name: 'Team', path: '/team' },
          { name: 'Projects', path: '/projects' },
          { name: 'Tickets', path: '/tasks' },
          { name: 'Attendance', path: '/attendance' },
          { name: 'Leaves', path: '/leave' },
        ]
      : []),
    ...(role === 'hr'
      ? [
          { name: 'Employees', path: '/employees' },
          { name: 'Team', path: '/team' },
          { name: 'Attendance', path: '/attendance' },
          { name: 'Leaves', path: '/leave' },
        ]
      : []),
    ...(role === 'employee'
      ? [
          { name: 'Team', path: '/team' },
          { name: 'Projects', path: '/projects' },
          { name: 'Tickets', path: '/tasks' },
          { name: 'Attendance', path: '/attendance' },
          { name: 'Leaves', path: '/leave' },
        ]
      : []),
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 transition-transform group-hover:scale-105 shadow-sm">
                <img
                  src={CompanyLogo}
                  alt="Wordlane Tech Logo"
                  className="w-6 h-6 object-contain"
                />
              </div>
              <span className="text-xl font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">Wordlane Tech</span>
            </Link>

            {/* Desktop Menu & Icons Wrapper */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Desktop Menu */}
              <div className="bg-slate-50 rounded-full px-1 py-1 border border-slate-200 shadow-inner">
                <ul className="flex items-center space-x-1">
                  {menuItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.path}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                          location.pathname === item.path
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-600 hover:bg-white hover:shadow-sm'
                        }`}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Icons */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-all duration-200 group"
                  >
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                      <div className="p-4 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-800">Notifications</h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto p-2 space-y-2">
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors">
                            <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0"></div>
                            <span className="text-sm font-medium text-slate-700">New ticket assigned</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-green-50 hover:bg-green-100 cursor-pointer transition-colors">
                            <div className="w-2 h-2 bg-green-500 rounded-full shrink-0"></div>
                            <span className="text-sm font-medium text-slate-700">Leave request approved</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-orange-50 hover:bg-orange-100 cursor-pointer transition-colors">
                            <div className="w-2 h-2 bg-orange-500 rounded-full shrink-0"></div>
                            <span className="text-sm font-medium text-slate-700">Attendance reminder</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-purple-50 hover:bg-purple-100 cursor-pointer transition-colors">
                            <div className="w-2 h-2 bg-purple-500 rounded-full shrink-0"></div>
                            <span className="text-sm font-medium text-slate-700">Performance review pending</span>
                        </div>
                      </div>
                    </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-all duration-200 flex items-center gap-2"
                >
                  {profileImage ? (
                    <img
                      src={`http://localhost:5000${profileImage}`}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-slate-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border-2 border-blue-200">
                      <User size={18} />
                    </div>
                  )}
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                    <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                          <User size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{name || "User"}</p>
                          <p className="text-xs text-slate-400 font-mono truncate">{employeeId || "ID: N/A"}</p>
                        </div>
                    </div>
                    <div className="py-2">
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileDropdown(false)}
                        className="block w-full px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors rounded-lg"
                      >
                        View Profile
                      </Link>
                    </div>
                    <div className="border-t border-slate-100 mt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors rounded-lg"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 text-slate-600 hover:text-blue-600 transition-colors"
                onClick={() => setMobileMenu(!mobileMenu)}
              >
                {mobileMenu ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>  

        {/* Mobile Menu Overlay */}
        {mobileMenu && (
          <div className="md:hidden bg-white border-b border-slate-100 animate-[fadeIn_0.2s_ease-out]">
            <div className="px-4 py-4 space-y-2 max-w-7xl mx-auto">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenu(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              {/* Mobile User Info */}
              <div className="border-t border-slate-100 mt-4 pt-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border-2 border-blue-200">
                    {profileImage ? (
                        <img
                            src={`http://localhost:5000${profileImage}`}
                            alt="Profile"
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <User size={18} />
                    )}
                </div>
                <div className="flex-1">
                     <p className="text-sm font-bold text-slate-800">{name || "User"}</p>
                     <button
                        onClick={handleLogout}
                        className="text-xs font-medium text-red-600 hover:text-red-700 underline"
                    >
                        Logout
                    </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-[fadeIn_0.2s_ease-out] {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default Navbar;