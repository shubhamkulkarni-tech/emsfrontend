import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { 
  FiMoreVertical, FiSearch, FiX, FiUser, FiCalendar, FiBriefcase, 
  FiEye, FiFilter, FiActivity, FiEdit, FiPlus, FiSend, FiTrash2,
  FiClock, FiCheckCircle, FiUsers, FiCheck
} from "react-icons/fi";

// --- AXIOS INSTANCE ---
const api = axios.create({
  baseURL: "https://emsbackend-2w9c.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- AESTHETIC THEME PALETTE ---
const statusColors = {
  "Not Started": { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
  "In Progress": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "On Hold": { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  "Completed": { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  "In Review": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  "Reverted": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "Pending": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
};

const priorityColors = {
  Low: { bg: "bg-green-100", text: "text-green-800" },
  Medium: { bg: "bg-yellow-100", text: "text-yellow-800" },
  High: { bg: "bg-orange-100", text: "text-orange-800" },
  Critical: { bg: "bg-red-100", text: "text-red-800" },
};

const Task = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewTicket, setViewTicket] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedTicketForReview, setSelectedTicketForReview] = useState(null);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [selectedTicketForProgress, setSelectedTicketForProgress] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  // Dropdown State
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [isHoveringCreateBtn, setIsHoveringCreateBtn] = useState(false);

  const [user, setUser] = useState({ role: "", id: "" });

  const navigate = useNavigate();

  const decodeJWT = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const decoded = decodeJWT(token);
      if (decoded) {
        setUser({ role: decoded.role?.toLowerCase() || "", id: decoded.id || decoded._id });
        fetchTickets();
      } else {
        setToast({ show: true, message: "Invalid session. Please log in again.", type: "error" });
        navigate("/login");
      }
    };
    initializeData();
  }, [navigate]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get("/tasks");
      setTickets(response.data);
      setFilteredTickets(response.data);
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.error || "Failed to load tickets", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!search) {
      setFilteredTickets(tickets);
    } else {
      const searchLower = search.toLowerCase();
      setFilteredTickets(
        tickets.filter(
          (ticket) =>
            ticket.title?.toLowerCase().includes(searchLower) ||
            String(ticket.taskId || "").toLowerCase().includes(searchLower) ||
            (Array.isArray(ticket.assignedTo) && ticket.assignedTo.some(assignee =>
              assignee.name?.toLowerCase().includes(searchLower)
            ))
        )
      );
    }
  }, [search, tickets]);

  // Click Outside to Close Dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.dropdown-actions')) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Escape Key to Close Modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setViewModalOpen(false);
        setModalOpen(false);
        setReviewModalOpen(false);
        setProgressModalOpen(false);
        setDropdownOpen(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // --- ACTION HANDLERS ---
  const confirmDelete = (id) => {
    setDeleteId(id);
    setModalOpen(true);
    setDropdownOpen(null);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/tasks/${deleteId}`);
      fetchTickets();
      setModalOpen(false);
      setToast({ show: true, message: "Ticket deleted successfully", type: "success" });
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.error || "Failed to delete ticket", type: "error" });
    }
  };

  const handleAcceptTask = (ticket) => {
    setSelectedTicketForProgress(ticket);
    setProgressModalOpen(true);
    setDropdownOpen(null);
  };

  const confirmAcceptTask = async () => {
    try {
      await api.put(`/tasks/${selectedTicketForProgress._id}/accept`);
      fetchTickets();
      setProgressModalOpen(false);
      setSelectedTicketForProgress(null);
      setToast({ show: true, message: "Task accepted. Status is now 'In Progress'", type: "success" });
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.error || "Failed to accept task", type: "error" });
    }
  };

  const handleSubmitWork = async (ticketToSubmit) => {
    try {
      await api.put(`/tasks/${ticketToSubmit._id}/submit`);
      fetchTickets();
      if (viewModalOpen && viewTicket?._id === ticketToSubmit._id) {
        setViewModalOpen(false);
      }
      setToast({ show: true, message: "Work submitted for review", type: "success" });
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.error || "Failed to submit work", type: "error" });
    }
  };

  const handleReviewAction = async (action) => {
    try {
      await api.put(`/tasks/${selectedTicketForReview._id}/review`, { action });
      fetchTickets();
      setReviewModalOpen(false);
      setSelectedTicketForReview(null);
      setToast({
        show: true,
        message: action === "approve" ? "Task approved and completed" : "Task has been reverted",
        type: "success"
      });
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.error || "Failed to update task", type: "error" });
    }
  };

  // --- HELPER FUNCTIONS ---
  const getDeadlineStatus = (deadline) => {
    if (!deadline) return { text: "", color: "" };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline); deadlineDate.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: "(Overdue)", color: "text-red-600 font-semibold" };
    if (diffDays <= 3) return { text: "(Due Soon)", color: "text-orange-600 font-semibold" };
    return { text: "", color: "" };
  };

  const isCreator = (ticket) => ticket.createdBy && ticket.createdBy._id === user.id;
  const isReviewer = (ticket) => Array.isArray(ticket.reviewers) && ticket.reviewers.some(r => r._id === user.id);
  const isAssignee = (ticket) => Array.isArray(ticket.assignedTo) && ticket.assignedTo.some(assignee => assignee._id === user.id);

  const canViewAllRecords = user && (user.role === 'admin' || user.role === 'manager');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <Navbar />

      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Tasks Directory</h1>
            <p className="text-slate-500 text-sm mt-1">Manage workflow, tasks, and project assignments</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto items-center h-full">
            <div className="relative w-full md:w-80">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                <FiSearch />
              </span>
              <input
                type="text"
                placeholder="Search by ticket ID, title or assignee..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {(user.role === "admin" || user.role === "manager") && (
              <button
                onClick={() => navigate("/add-task")}
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
                <FiActivity size={18} />
                <span>Add Task</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0"><FiActivity size={24} /></div>
                    <div className="flex flex-col justify-center"><p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Tasks</p><p className="text-2xl font-bold text-slate-800">{filteredTickets.length}</p></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0"><FiClock size={24} /></div>
                    <div className="flex flex-col justify-center"><p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Overdue</p><p className="text-2xl font-bold text-slate-800">{filteredTickets.filter(t => t.dueDate && new Date(t.dueDate) < new Date().setHours(0,0,0,0)).length}</p></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><FiClock size={24} /></div>
                    <div className="flex flex-col justify-center"><p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">In Progress</p><p className="text-2xl font-bold text-slate-800">{filteredTickets.filter(t => t.status === "In Progress").length}</p></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0"><FiCheckCircle size={24} /></div>
                    <div className="flex flex-col justify-center"><p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Completed</p><p className="text-2xl font-bold text-slate-800">{filteredTickets.filter(t => t.status === "Completed").length}</p></div>
                </div>
            </div>
        )}

        {/* List View - COMPACT HORIZONTAL LAYOUT */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
            <p className="mt-4 text-slate-500 text-sm animate-pulse">Loading tasks...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
            <FiBriefcase className="mx-auto h-16 w-16 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No tickets found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-4 py-3 w-[25%]">Ticket Info</th>
                    <th className="px-4 py-3 w-[15%]">Team</th>
                    <th className="px-4 py-3 w-[25%]">Assigned To</th>
                    <th className="px-4 py-3 w-[15%]">Deadline</th>
                    <th className="px-4 py-3 w-[10%]">Status</th>
                    <th className="px-4 py-3 w-[10%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.map((ticket) => {
                      const deadlineStatus = getDeadlineStatus(ticket.dueDate);
                      const displayStatus = ticket.status || "Not Started";
                      return (
                        <tr key={ticket._id} className="hover:bg-blue-50/30 transition duration-200 group">
                          <td className="px-4 py-3 cursor-pointer" onClick={() => { setViewTicket(ticket); setViewModalOpen(true); }}>
                            <div className="flex flex-col justify-center">
                                <span className="font-bold text-slate-800 text-xs truncate group-hover:text-blue-600 transition-colors max-w-[200px]">{ticket.title}</span>
                                <span className="text-[10px] text-slate-400 font-mono mt-0.5">{ticket.taskId}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                              <span className="text-xs text-slate-600 font-medium truncate block max-w-[120px]">{ticket.team?.team_name || "N/A"}</span>
                          </td>
                          <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {Array.isArray(ticket.assignedTo) && ticket.assignedTo.length > 0 ? (
                                  ticket.assignedTo.slice(0, 3).map((emp, idx) => (
                                    <div key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                                      {emp.name}
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-slate-400">Unassigned</span>
                                )}
                                {ticket.assignedTo.length > 3 && <span className="text-[10px] font-bold text-slate-500">+{ticket.assignedTo.length - 3}</span>}
                              </div>
                          </td>
                          <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                  <FiCalendar className="text-slate-400 shrink-0" size={12} />
                                  <span className="text-xs text-slate-600">{ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : "N/A"}</span>
                                  {deadlineStatus.text && <span className={`ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${deadlineStatus.color === 'text-red-600' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>{deadlineStatus.text}</span>}
                              </div>
                          </td>
                          <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border flex items-center gap-1 w-max ${statusColors[displayStatus] ? `${statusColors[displayStatus].bg} ${statusColors[displayStatus].text} ${statusColors[displayStatus].border}` : "bg-gray-100 text-gray-600"}`}>
                                  <span className={`w-1 h-1 rounded-full ${statusColors[displayStatus]?.dot || "bg-gray-400"}`}></span>
                                  {displayStatus}
                              </span>
                          </td>
                          <td className="px-4 py-3 text-right relative dropdown-actions">
                            <div className="inline-block relative">
                              <button
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDropdownOpen(dropdownOpen === ticket._id ? null : ticket._id);
                                }}
                              >
                                <FiMoreVertical className="text-lg" />
                              </button>
                              
                              {/* Dropdown Menu */}
                              <div
                                className={`absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-slate-100 z-20 overflow-hidden transition-all duration-200 origin-top-right ${
                                  dropdownOpen === ticket._id
                                    ? "opacity-100 scale-100 visible"
                                    : "opacity-0 scale-95 invisible"
                                }`}
                              >
                                {/* Always Visible: View */}
                                <button
                                  className="block w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-blue-50 flex items-center gap-2 hover:text-blue-600 transition-colors"
                                  onClick={() => {
                                    setViewTicket(ticket);
                                    setViewModalOpen(true);
                                    setDropdownOpen(null);
                                  }}
                                >
                                  <FiEye size={14}/> View Details
                                </button>

                                {/* Employee: Accept Task */}
                                {user.role === "employee" && isAssignee(ticket) && (ticket.status === "Not Started" || ticket.status === "Reverted") && (
                                  <button
                                    className="block w-full text-left px-4 py-2.5 text-xs font-medium text-green-700 hover:bg-green-50 flex items-center gap-2"
                                    onClick={() => handleAcceptTask(ticket)}
                                  >
                                    <FiPlus size={14}/> Accept Task
                                  </button>
                                )}

                                {/* Employee: Submit Work */}
                                {user.role === "employee" && isAssignee(ticket) && ticket.status === "In Progress" && (
                                  <button
                                    className="block w-full text-left px-4 py-2.5 text-xs font-medium text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                                    onClick={() => handleSubmitWork(ticket)}
                                  >
                                    <FiSend size={14}/> Submit Work
                                  </button>
                                )}

                                {/* Manager/Admin: Review */}
                                {(isCreator(ticket) || isReviewer(ticket)) && ticket.status === "In Review" && (
                                  <button
                                    className="block w-full text-left px-4 py-2.5 text-xs font-medium text-purple-700 hover:bg-purple-50 flex items-center gap-2"
                                    onClick={() => { setSelectedTicketForReview(ticket); setReviewModalOpen(true); setDropdownOpen(null); }}
                                  >
                                    <FiCheckCircle size={14}/> Review Task
                                  </button>
                                )}

                                {/* Divider for Edit/Delete */}
                                {isCreator(ticket) && <div className="border-t border-slate-100"></div>}

                                {/* Edit (Creator) */}
                                {isCreator(ticket) && (
                                  <button
                                    className="block w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 hover:text-blue-600 transition-colors"
                                    onClick={() => {
                                      navigate(`/edit-task/${ticket._id}`);
                                      setDropdownOpen(null);
                                    }}
                                  >
                                    <FiEdit size={14}/> Edit Task
                                  </button>
                                )}

                                {/* Delete (Creator) */}
                                {isCreator(ticket) && (
                                  <button
                                    className="block w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    onClick={() => confirmDelete(ticket._id)}
                                  >
                                    <FiTrash2 size={14}/> Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ===== SPLIT VIEW MODAL ===== */}
      {viewModalOpen && viewTicket && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-xl p-4 sm:p-6 transition-opacity duration-300"
          style={{
            background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(37, 99, 235, 0.75) 50%, rgba(15, 23, 42, 0.95) 100%)"
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-white shrink-0 z-10 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                   <FiBriefcase size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 truncate">{viewTicket.title}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {viewTicket.taskId}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500 transition shrink-0"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Body: Split Layout */}
            <div className="flex flex-col md:flex-row h-full overflow-hidden">
              
              {/* LEFT COLUMN: Quick Stats & Status */}
              <div className="w-full md:w-1/3 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar">
                
                {/* Priority & Status */}
                <div className="flex flex-col gap-3">
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold mb-2">Priority</p>
                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${priorityColors[viewTicket.priority]?.bg || 'bg-gray-100'} ${priorityColors[viewTicket.priority]?.text || 'text-gray-800'}`}>
                            {viewTicket.priority}
                        </span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold mb-2">Status</p>
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border flex items-center gap-2 w-max ${statusColors[viewTicket.status] ? `${statusColors[viewTicket.status].bg} ${statusColors[viewTicket.status].text} ${statusColors[viewTicket.status].border}` : "bg-gray-100 text-gray-600"}`}>
                            <span className={`w-2 h-2 rounded-full ${statusColors[viewTicket.status]?.dot || "bg-gray-400"}`}></span>
                            {viewTicket.status}
                        </span>
                    </div>
                </div>

                {/* Team & Deadline */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                            <FiUsers size={18}/>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Team</p>
                            <p className="text-sm font-bold text-slate-700 truncate">{viewTicket.team?.team_name || "N/A"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <FiCalendar size={18}/>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Due Date</p>
                            <p className="text-sm font-semibold text-slate-700">{viewTicket.dueDate ? new Date(viewTicket.dueDate).toLocaleDateString() : "Not Set"}</p>
                        </div>
                    </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Detailed Info */}
              <div className="w-full md:w-2/3 p-6 bg-white flex flex-col h-full overflow-y-auto custom-scrollbar">
                 <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Task Details</h3>
                    <div className="mt-4">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Description</p>
                        <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{viewTicket.description || "No description provided."}</p>
                    </div>
                 </div>
                 
                 <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Assignment</h3>
                    <div className="mt-4">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold mb-2">Assigned To</p>
                        <div className="flex flex-wrap gap-2">
                            {Array.isArray(viewTicket.assignedTo) && viewTicket.assignedTo.length > 0 ? (
                                viewTicket.assignedTo.map((assignee, idx) => (
                                  <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                        {assignee.name.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">{assignee.name}</span>
                                  </div>
                                ))
                            ) : (
                                <span className="text-sm text-slate-400 italic">Unassigned</span>
                            )}
                        </div>
                    </div>
                 </div>

                 <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Additional Notes</h3>
                    <div className="mt-4">
                        <p className="text-slate-600 italic text-sm bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                            {viewTicket.notes || "No additional notes."}
                        </p>
                    </div>
                 </div>

                 <div className="mt-auto pt-6">
                    {user.role === "employee" && isAssignee(viewTicket) && viewTicket.status === "In Progress" ? (
                        <button onClick={() => handleSubmitWork(viewTicket)} className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-200 transition flex items-center justify-center gap-2">
                          <FiSend size={18} /> Submit for Review
                        </button>
                    ) : user.role === "employee" && isAssignee(viewTicket) && (viewTicket.status === "In Review" || viewTicket.status === "Completed") ? (
                        <div className="text-center text-slate-600 py-3 bg-slate-50 rounded-xl border border-slate-100 font-medium">
                            {viewTicket.status === "In Review" ? "Your work is under review" : "Task has been completed"}
                        </div>
                    ) : null}
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== REVIEW MODAL ===== */}
      {reviewModalOpen && selectedTicketForReview && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-[500px] p-6 flex flex-col relative animate-[fadeIn_0.2s_ease-out]">
            <button onClick={() => { setReviewModalOpen(false); setSelectedTicketForReview(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><FiX size={24} /></button>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Review Task</h2>
                <p className="text-slate-500 text-sm">Review the work submitted for <span className="font-bold text-slate-700">{selectedTicketForReview.title}</span>.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl mb-6">
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Description</p>
                <p className="text-sm text-slate-700 truncate">{selectedTicketForReview.description}</p>
            </div>
            <div className="flex gap-4 mt-2">
              <button onClick={() => handleReviewAction("revert")} className="flex-1 px-4 py-3 rounded-xl bg-white border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition">Revert Work</button>
              <button onClick={() => handleReviewAction("approve")} className="flex-1 px-4 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 shadow-lg shadow-green-200 transition">Approve & Complete</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PROGRESS MODAL ===== */}
      {progressModalOpen && selectedTicketForProgress && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full animate-[fadeIn_0.2s_ease-out]">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
               <FiActivity size={28} />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2 text-center">Accept Task</h2>
            <p className="mb-6 text-slate-500 text-sm text-center px-4">Are you sure you want to start working on "<span className="font-semibold text-slate-700">{selectedTicketForProgress.title}</span>"? This will set the status to 'In Progress'.</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => { setProgressModalOpen(false); setSelectedTicketForProgress(null); }} className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition">Cancel</button>
              <button onClick={confirmAcceptTask} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200">Yes, Start Task</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE MODAL ===== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96 text-center animate-[fadeIn_0.2s_ease-out]">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Delete Task?</h2>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">This will permanently remove this task and all associated history. This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-medium text-sm">Cancel</button>
              <button onClick={handleDelete} className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium text-sm shadow-lg shadow-red-200">Delete</button>
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
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.show} 
        onClose={() => setToast({ show: false, message: "", type: "success" })} 
      />
      <Footer />
    </div>
  );
};

export default Task;