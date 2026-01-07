import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiMoreVertical, FiSearch, FiX, FiUsers, FiShield, FiCalendar, FiBriefcase, FiEye, FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Toast from "./Toast";

// --- AXIOS INSTANCE ---
const api = axios.create({
  baseURL: "https://emsbackend-2w9c.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Aesthetic Color Palette
const roleColors = {
  ADMIN: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  HR: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  EMPLOYEE: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  MANAGER: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  DEFAULT: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
};

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(null);
  
  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [viewEmployee, setViewEmployee] = useState(null); 
  
  // Hover State for Create Button
  const [isHoveringCreateBtn, setIsHoveringCreateBtn] = useState(false);

  const [userRole, setUserRole] = useState("");
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();

  // --- HELPER: Ultimate Date Formatter (DD/MM/YYYY) ---
  // Checks dateStr first, then falls back to MongoDB _id timestamp if missing
  const formatDate = (dateStr, idStr) => {
    // Try 1: Use provided date string (e.g., createdAt)
    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-GB'); // Returns DD/MM/YYYY
      }
    }

    // Try 2: Extract timestamp from MongoDB ObjectId (_id)
    // The first 4 bytes of an ObjectId are the timestamp
    if (idStr && idStr.length >= 8) {
      try {
        const timestamp = parseInt(idStr.substring(0, 8), 16);
        const dateFromId = new Date(timestamp * 1000);
        if (!isNaN(dateFromId.getTime())) {
          return dateFromId.toLocaleDateString('en-GB');
        }
      } catch (e) {
        console.error("Date ID extraction error", e);
      }
    }

    return "N/A";
  };

  // --- 1. Fetch Role ---
  useEffect(() => {
    const role = localStorage.getItem("role") || "";
    setUserRole(role.toLowerCase());
  }, []);

  // --- 2. Fetch Employees ---
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get("/users");
        if(res.data) {
          setEmployees(res.data);
          setFilteredEmployees(res.data);
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
        setToast({ show: true, message: "Failed to load employees", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // --- 3. Search Logic ---
  useEffect(() => {
    if (!search) setFilteredEmployees(employees);
    else {
      setFilteredEmployees(
        employees.filter(
          (emp) =>
            (emp.name || "").toLowerCase().includes(search.toLowerCase()) ||
            (emp.email || "").toLowerCase().includes(search.toLowerCase()) ||
            (emp.department || "").toLowerCase().includes(search.toLowerCase()) ||
            (emp.role || "").toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, employees]);

  // --- 4. Click Outside to Close Dropdown ---
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

  // --- 5. Escape Key to Close Modals ---
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setViewEmployee(null);
        setModalOpen(false);
        setDropdownOpen(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const confirmDelete = (id) => {
    setDeleteId(id);
    setModalOpen(true);
    setDropdownOpen(null);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${deleteId}`);
      setEmployees((prev) => prev.filter((emp) => emp._id !== deleteId));
      setFilteredEmployees((prev) => prev.filter((emp) => emp._id !== deleteId));
      setModalOpen(false);
      setDeleteId(null);
      setToast({ show: true, message: 'Employee deleted successfully!', type: 'success' });
    } catch (err) {
      setToast({ show: true, message: 'Failed to delete employee.', type: 'error' });
    }
  };

  const cancelDelete = () => {
      setModalOpen(false);
      setDeleteId(null);
  };

  // Stats Calculations
  const totalEmployees = employees.length;
  const departmentsCount = new Set(employees.map(e => e.department).filter(Boolean)).size;
  const adminsCount = employees.filter(e => e.role?.toLowerCase() === 'admin').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <Navbar />

      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Employees Directory</h1>
            <p className="text-slate-500 text-sm mt-1">Manage workforce and employee details</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto items-center h-full">
            <div className="relative w-full md:w-80">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                <FiSearch />
              </span>
              <input
                type="text"
                placeholder="Search by name, email or role..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {(userRole === "admin" || userRole === "hr") && (
              <button
                onClick={() => navigate("/add-employee")}
                onMouseEnter={() => setIsHoveringCreateBtn(true)}
                onMouseLeave={() => setIsHoveringCreateBtn(false)}
                style={{
                  backgroundColor: isHoveringCreateBtn ? 'rgb(255, 172, 28)' : 'rgb(37, 99, 235)', 
                  color: '#fff', 
                  boxShadow: isHoveringCreateBtn ? '0 10px 15px -3px rgba(255, 172, 28, 0.4)' : '0 10px 15px -3px rgba(37, 99, 235, 0.4)',
                  transform: isHoveringCreateBtn ? 'translateY(-2px)' : 'translateY(0)'
                }}
                className="h-full px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-medium border border-transparent transition-all duration-300 ease-out"
              >
                <span>Add Employee</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <FiUsers size={24} />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Employees</p>
                <p className="text-2xl font-bold text-slate-800">{totalEmployees}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <FiBriefcase size={24} />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Departments</p>
                <p className="text-2xl font-bold text-slate-800">{departmentsCount}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <FiShield size={24} />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Admins</p>
                <p className="text-2xl font-bold text-slate-800">{adminsCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading / Empty / Table */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
            <p className="mt-4 text-slate-500 text-sm animate-pulse">Loading employees...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
            <FiUsers className="mx-auto h-16 w-16 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No employees found.</p>
          </div>
        ) : (
          /* Table */
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Designation</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-orange-50/30 transition duration-200 group">
                      <td className="px-6 py-4 cursor-pointer" onClick={() => setViewEmployee(emp)}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md text-xs shrink-0 overflow-hidden">
                                {emp.profileImage ? (
                                    <img src={`https://emsbackend-2w9c.onrender.com${emp.profileImage}`} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    emp.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                                    {emp.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">{emp.employeeId || emp._id.slice(-6)}</span>
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-sm text-slate-600 font-medium">{emp.department || "-"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${roleColors[emp.role?.toUpperCase()] ? `${roleColors[emp.role?.toUpperCase()].bg} ${roleColors[emp.role?.toUpperCase()].text} ${roleColors[emp.role?.toUpperCase()].border}` : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                {emp.role}
                            </span>
                            <span className="text-xs text-slate-400 truncate">{emp.designation}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col justify-center h-full text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 mb-0.5 truncate max-w-[150px]">
                            <FiMail size={10} className="text-blue-400 shrink-0"/> {emp.email}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <FiPhone size={10} className="text-green-400 shrink-0"/> {emp.phone || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                            <FiCalendar size={12} className="text-blue-400"/> {formatDate(emp.createdAt, emp._id)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right relative dropdown-actions">
                        <div className="inline-block relative">
                          <button
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDropdownOpen(dropdownOpen === emp._id ? null : emp._id);
                            }}
                          >
                            <FiMoreVertical className="text-xl" />
                          </button>
                          <div
                            className={`absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-slate-100 z-20 overflow-hidden transition-all duration-200 origin-top-right ${
                              dropdownOpen === emp._id
                                ? "opacity-100 scale-100 visible"
                                : "opacity-0 scale-95 invisible"
                            }`}
                          >
                            <button
                              className="block w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 flex items-center gap-2 hover:text-blue-600 transition-colors"
                              onClick={() => {
                                setViewEmployee(emp);
                                setDropdownOpen(null);
                              }}
                            >
                              <FiEye size={14}/> View Detail
                            </button>
                            <div className="border-t border-slate-100">
                              <button
                                className="block w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 hover:text-blue-600 transition-colors"
                                onClick={() => {
                                  navigate(`/edit-employee/${emp._id}`);
                                  setDropdownOpen(null);
                                }}
                              >
                                <FiBriefcase size={14}/> Edit
                              </button>
                            </div>
                            {(userRole === "admin" || userRole === "hr") && (
                              <div className="border-t border-slate-100">
                                  <button
                                    className="block w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    onClick={() => confirmDelete(emp._id)}
                                  >
                                    <FiX size={14}/> Delete
                                  </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- EMPLOYEE DETAILS MODAL (Split Layout) --- */}
      {viewEmployee && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-xl p-4 sm:p-6 transition-opacity duration-300"
          style={{
            background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 58, 138, 0.75) 50%, rgba(15, 23, 42, 0.95) 100%)"
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-white shrink-0 z-10 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                   <FiUsers size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 truncate">{viewEmployee.name}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {viewEmployee.employeeId || viewEmployee._id}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewEmployee(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500 transition shrink-0"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Body: Split Layout */}
            <div className="flex flex-col md:flex-row h-full overflow-hidden">
              
              {/* LEFT COLUMN: Employee Profile (Sidebar) */}
              <div className="w-full md:w-1/3 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col gap-6 shrink-0">
                
                {/* Profile Card */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-white mb-4">
                    {viewEmployee.profileImage ? (
                        <img src={`https://emsbackend-2w9c.onrender.com${viewEmployee.profileImage}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-4xl">
                            {viewEmployee.name?.charAt(0)}
                        </div>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 text-xl">{viewEmployee.name}</h3>
                  <p className="text-slate-500 text-sm mt-1">{viewEmployee.designation || "Employee"}</p>
                  <span className={`mt-3 text-[11px] px-3 py-1 rounded-full font-bold uppercase border max-w-max ${
                    roleColors[viewEmployee.role?.toUpperCase()] ? 
                    `${roleColors[viewEmployee.role?.toUpperCase()].bg} ${roleColors[viewEmployee.role?.toUpperCase()].text} ${roleColors[viewEmployee.role?.toUpperCase()].border}` :
                    "bg-gray-100 text-gray-700 border-gray-200"
                 }`}>
                    {viewEmployee.role}
                 </span>
                </div>

                {/* Quick Stats */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                            <FiBriefcase size={18}/>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Department</p>
                            <p className="text-sm font-bold text-slate-700 truncate">{viewEmployee.department || "N/A"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <FiCalendar size={18}/>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Joined On</p>
                            <p className="text-sm font-semibold text-slate-700">{formatDate(viewEmployee.createdAt, viewEmployee._id)}</p>
                        </div>
                    </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Detailed Info */}
              <div className="w-full md:w-2/3 p-6 bg-white flex flex-col h-full overflow-hidden">
                 <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 text-blue-500 mb-1"><FiMail /> Email Address</div>
                            <p className="text-slate-700 font-medium break-all">{viewEmployee.email}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 text-green-500 mb-1"><FiPhone /> Phone Number</div>
                            <p className="text-slate-700 font-medium">{viewEmployee.phone || "N/A"}</p>
                        </div>
                    </div>
                 </div>
                 
                 <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Professional Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Designation</p>
                            <p className="text-slate-700 font-medium">{viewEmployee.designation || "N/A"}</p>
                        </div>
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Status</p>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">Active</span>
                        </div>
                    </div>
                 </div>

                 <div className="mt-auto pt-6">
                    {(userRole === "admin" || userRole === "hr") && (
                        <div className="flex gap-3 justify-end">
                             <button 
                                onClick={() => {
                                    navigate(`/edit-employee/${viewEmployee._id}`);
                                    setViewEmployee(null);
                                }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                             >
                                 <FiBriefcase size={16}/> Edit Employee
                             </button>
                        </div>
                    )}
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE MODAL --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Delete Employee?</h2>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">This will permanently remove this employee and all associated data. This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button
                className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-medium text-sm"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium text-sm shadow-lg shadow-red-200"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}</style>

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

export default Employees;