import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { 
  FiCalendar, FiUser, FiCheckCircle, FiClock, FiAlertCircle, 
  FiSearch, FiFilter, FiPlus, FiX, FiMoreVertical, FiTrash2, FiLogOut
} from "react-icons/fi";

// --- STATUS COLORS ---
const statusColors = {
  Approved: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
  Pending: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  Rejected: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
};

const TOTAL_LEAVES = 12;

const generateLeaveId = () => {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${mm}${dd}${random}`;
};

const Leave = () => {
  const [leaves, setLeaves] = useState([]);
  const [showDropdown, setShowDropdown] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Add Form
  const [newLeave, setNewLeave] = useState({
    type: "Sick Leave",
    from: "",
    to: "",
    reason: "",
  });

  const role = localStorage.getItem("role");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const employeeId = user.employeeId;
  const employeeName = user.name;
  const today = new Date().toISOString().split("T")[0];

  // Fetch Data
  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://emsbackend-2w9c.onrender.com/api/leaves");
      const data = res.data || [];
      setLeaves(
        role === "employee" ? data.filter((l) => l.employee_id === employeeId) : data
      );
    } catch (e) {
      console.error("Error fetching leaves:", e);
      setToast({ show: true, message: "Failed to fetch leave requests", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Counts
  const usedLeaves = leaves.filter((l) => l.status === "Approved").length;
  const remainingLeaves = Math.max(TOTAL_LEAVES - usedLeaves, 0);

  // Filter Logic
  const filteredLeaves = leaves.filter((l) => {
    if (
      search &&
      !l.employee_name.toLowerCase().includes(search.toLowerCase()) &&
      !String(l.leave_id).includes(search)
    )
      return false;
    if (typeFilter !== "All" && l.type !== typeFilter) return false;
    if (statusFilter !== "All" && l.status !== statusFilter) return false;
    if (fromDate && new Date(l.from) < new Date(fromDate)) return false;
    if (toDate && new Date(l.to) > new Date(toDate)) return false;
    return true;
  });

  const handleAddLeave = async (e) => {
    e.preventDefault();
    try {
      await axios.post("https://emsbackend-2w9c.onrender.com/api/leaves", {
        leave_id: generateLeaveId(),
        employee_id: employeeId,
        employee_name: employeeName,
        ...newLeave,
        status: "Pending",
      });
      setShowAddModal(false);
      setNewLeave({ type: "Sick Leave", from: "", to: "", reason: "" });
      fetchLeaves();
      setToast({ show: true, message: "Leave request submitted successfully", type: "success" });
    } catch (error) {
      console.error("Error adding leave:", error);
      setToast({ show: true, message: "Failed to submit leave request", type: "error" });
    }
  };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await axios.patch(`https://emsbackend-2w9c.onrender.com/api/leaves/${id}`, { status });
      setShowDropdown(null);
      fetchLeaves();
      setToast({ show: true, message: `Leave request ${status.toLowerCase()}`, type: "success" });
    } catch (error) {
      console.error("Error updating status:", error);
      setToast({ show: true, message: "Failed to update status", type: "error" });
    } finally {
      setUpdating(null);
    }
  };

  // Click Outside to Close Dropdown
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown(null);
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showDropdown]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <Navbar />

      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Leave Management</h1>
            <p className="text-slate-500 text-sm mt-1">View balances and manage leave requests</p>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="h-full px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
          >
            <FiPlus size={18} />
            <span>Request Leave</span>
          </button>
        </div>

        {/* Stats Grid (Employee Only) */}
        {role === "employee" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><FiCalendar size={24} /></div>
                    <div className="flex flex-col justify-center"><p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Total Leaves</p><p className="text-2xl font-bold text-slate-800">{TOTAL_LEAVES}</p></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0"><FiCheckCircle size={24} /></div>
                    <div className="flex flex-col justify-center"><p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Used Leaves</p><p className="text-2xl font-bold text-slate-800">{usedLeaves}</p></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0"><FiAlertCircle size={24} /></div>
                    <div className="flex flex-col justify-center"><p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Remaining</p><p className="text-2xl font-bold text-slate-800">{remainingLeaves}</p></div>
                </div>
            </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Search</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"><FiSearch size={18} /></span>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="Search by ID or name..."
                    />
                </div>
            </div>

            <div className="flex-1 min-w-[150px]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Type</label>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                    <option value="All">All Types</option>
                    <option>Sick Leave</option>
                    <option>Casual Leave</option>
                    <option>Paid Leave</option>
                    <option>Other</option>
                </select>
            </div>

            <div className="flex-1 min-w-[150px]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Status</label>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                    <option value="All">All Status</option>
                    <option>Approved</option>
                    <option>Pending</option>
                    <option>Rejected</option>
                </select>
            </div>

            <div className="flex-1 min-w-[150px]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">From</label>
                <input 
                    type="date" 
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
            </div>

            <div className="flex-1 min-w-[150px]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">To</label>
                <input 
                    type="date" 
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
            </div>
          </div>
        </div>

        {/* Empty State */}
        {!loading && filteredLeaves.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
            <FiCalendar className="mx-auto h-16 w-16 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No leave requests found</p>
          </div>
        )}

        {/* Leave Cards */}
        {!loading && filteredLeaves.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredLeaves.map((leave) => {
              const statusStyle = statusColors[leave.status] || statusColors.Pending;
              return (
                <div key={leave._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow relative group">
                  
                  {/* Header: Avatar + Name + Actions */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            <FiUser size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">{leave.employee_name}</h3>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{leave.leave_id}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Admin/HR Status Actions */}
                        {role !== "employee" && (
                            <div className="relative">
                                <button
                                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDropdown(showDropdown === leave._id ? null : leave._id);
                                  }}
                                >
                                  <FiMoreVertical className="text-lg" />
                                </button>
                                
                                <div className={`absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-slate-100 z-20 overflow-hidden transition-all duration-200 origin-top-right ${
                                  showDropdown === leave._id ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
                                }`}>
                                    <button
                                      onClick={() => updateStatus(leave._id, "Approved")}
                                      className="w-full text-left px-4 py-3 text-xs font-medium text-green-700 hover:bg-green-50 flex items-center gap-2 transition-colors"
                                    >
                                      <FiCheckCircle size={14} /> Approve
                                    </button>
                                    <button
                                      onClick={() => updateStatus(leave._id, "Rejected")}
                                      className="w-full text-left px-4 py-3 text-xs font-medium text-red-700 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                    >
                                      <FiX size={14} /> Reject
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* Status Badge (Read only for employee or fallback) */}
                        <span className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase border flex items-center gap-1.5 w-max ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                            {leave.status}
                        </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-2 mb-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <FiCalendar className="text-blue-500 shrink-0" size={14} />
                      <span>
                          {new Date(leave.from).toLocaleDateString()} &rarr; {new Date(leave.to).toLocaleDateString()}
                      </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                      <div>
                          <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Type</p>
                          <p className="font-medium text-slate-700">{leave.type}</p>
                      </div>
                      <div>
                          <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Days</p>
                          <p className="font-medium text-slate-700">
                            {Math.ceil((new Date(leave.to) - new Date(leave.from)) / (1000 * 60 * 60 * 24))} days
                          </p>
                      </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Reason</p>
                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">{leave.reason || "No reason provided"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD LEAVE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto p-6 md:p-8 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Request Leave</h2>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500 transition"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleAddLeave} className="space-y-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Employee Name</label>
                    <input 
                        value={employeeName || ""} 
                        disabled 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 focus:outline-none"
                    />
                </div>

                <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">Leave Type</label>
                    <div className="relative">
                         <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"><FiLogOut size={18} /></span>
                        <select
                            value={newLeave.type}
                            onChange={(e) => setNewLeave({ ...newLeave, type: e.target.value })}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                        >
                            <option>Sick Leave</option>
                            <option>Casual Leave</option>
                            <option>Paid Leave</option>
                            <option>Other</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">From Date</label>
                        <input 
                            type="date" 
                            min={today}
                            required 
                            value={newLeave.from}
                            onChange={(e) => setNewLeave({ ...newLeave, from: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">To Date</label>
                        <input 
                            type="date" 
                            min={today}
                            required 
                            value={newLeave.to}
                            onChange={(e) => setNewLeave({ ...newLeave, to: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">Reason</label>
                    <textarea 
                        required
                        rows={3}
                        placeholder="Please provide a reason for your leave..."
                        value={newLeave.reason}
                        onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    />
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                    <button 
                        type="button" 
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 px-6 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-semibold bg-white hover:bg-slate-50 transition shadow-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="flex-1 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                    >
                        <FiPlus size={18} />
                        Submit Request
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

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

export default Leave;