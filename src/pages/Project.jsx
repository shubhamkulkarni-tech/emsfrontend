import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { 
  FiCalendar, FiUser, FiMoreVertical, FiFolder, FiSearch, 
  FiX, FiBriefcase, FiFilter, FiEdit, FiTrash2, FiCheckCircle, FiClock
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { useNavigate } from "react-router-dom";

// --- AESTHETIC THEME PALETTE ---
const statusColors = {
  "In Progress": { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", dot: "bg-yellow-500" },
  "Completed": { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
  "On Hold": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  DEFAULT: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200", dot: "bg-gray-400" },
};

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    onHold: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [managerFilter, setManagerFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [teams, setTeams] = useState([]);
  const [managers, setManagers] = useState([]);
  
  // Dropdown State
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  const [userRole, setUserRole] = useState("");
  const [isHoveringCreateBtn, setIsHoveringCreateBtn] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [page, setPage] = useState(1);
  const limit = 12;

  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role") || "";
    setUserRole(role.toLowerCase());

    Promise.all([API.get("/teams"), API.get("/users/managers")])
      .then(([tRes, mRes]) => {
        setTeams(tRes.data || []);
        setManagers(mRes.data || []);
      })
      .catch(console.error);
  }, []);

  const fetchProjects = async (p = 1) => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: p,
        limit,
        search,
        status: statusFilter,
        team: teamFilter,
        manager: managerFilter,
        from: fromDate,
        to: toDate,
      };

      const res = await API.get("/projects", { params });
      setProjects(res.data.projects || []);
      setSummary(res.data.summary || {});
    } catch (err) {
      console.error(err);
      setError("Failed to fetch projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchProjects(1);
    }, 350); // debounce
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, teamFilter, managerFilter, fromDate, toDate]);

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

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setTeamFilter("");
    setManagerFilter("");
    setFromDate("");
    setToDate("");
    setPage(1);
    fetchProjects(1);
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setModalOpen(true);
    setDropdownOpen(null);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/projects/${deleteId}`);
      setModalOpen(false);
      setDeleteId(null);
      fetchProjects(page);
      setToast({ 
        show: true, 
        message: 'Project deleted successfully!', 
        type: 'success' 
      });
    } catch (err) {
      console.error(err);
      setToast({ 
        show: true, 
        message: 'Failed to delete project.', 
        type: 'error' 
      });
    }
  };

  const nextPage = () => {
    setPage((p) => {
      const np = p + 1;
      fetchProjects(np);
      return np;
    });
  };

  const prevPage = () => {
    setPage((p) => {
      const np = Math.max(1, p - 1);
      fetchProjects(np);
      return np;
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <Navbar />

      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Projects Directory</h1>
            <p className="text-slate-500 text-sm mt-1">Manage projects, teams, and deadlines</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto items-center h-full">
            <div className="relative w-full md:w-80">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                <FiSearch />
              </span>
              <input
                type="text"
                placeholder="Search by name or manager..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {(userRole === "admin" || userRole === "manager") && (
              <button
                onClick={() => navigate("/add-project")}
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
                <FiBriefcase size={18} />
                <span>Add Project</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0"><FiFolder size={24} /></div>
                    <div className="flex flex-col justify-center"><p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Projects</p><p className="text-2xl font-bold text-slate-800">{summary.total}</p></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0"><FiCheckCircle size={24} /></div>
                    <div className="flex flex-col justify-center"><p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Completed</p><p className="text-2xl font-bold text-slate-800">{summary.completed}</p></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
                    <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 shrink-0"><FiClock size={24} /></div>
                    <div className="flex flex-col justify-center"><p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">In Progress</p><p className="text-2xl font-bold text-slate-800">{summary.inProgress}</p></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0"><FiClock size={24} /></div>
                    <div className="flex flex-col justify-center"><p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">On Hold</p><p className="text-2xl font-bold text-slate-800">{summary.onHold}</p></div>
                </div>
            </div>
        )}

        {/* FILTER BAR */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Status</label>
                <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                >
                <option value="">All Status</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                </select>
            </div>

            <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Team</label>
                <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                >
                <option value="">All Teams</option>
                {teams.map((t) => (
                    <option key={t._id} value={t._id}>
                    {t.team_name}
                    </option>
                ))}
                </select>
            </div>

            <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Manager</label>
                <select
                value={managerFilter}
                onChange={(e) => setManagerFilter(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                >
                <option value="">All Managers</option>
                {managers.map((m) => (
                    <option key={m._id} value={m._id}>
                    {m.name}
                    </option>
                ))}
                </select>
            </div>

            <div className="flex-1 min-w-[150px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">From</label>
                <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>

            <div className="flex-1 min-w-[150px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">To</label>
                <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>

            <div className="pb-1">
                <button
                onClick={resetFilters}
                className="h-11 px-6 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition flex items-center justify-center gap-2"
                >
                <FiFilter size={16} /> Reset
                </button>
            </div>
          </div>
        </div>

        {/* List View - COMPACT HORIZONTAL TABLE */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
            <p className="mt-4 text-slate-500 text-sm animate-pulse">Loading projects...</p>
          </div>
        ) : error ? (
          <p className="text-red-500 text-center text-lg">{error}</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
            <FiFolder className="mx-auto h-16 w-16 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No projects found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-4 py-3 w-[25%]">Project Info</th>
                    <th className="px-4 py-3 w-[20%]">Team</th>
                    <th className="px-4 py-3 w-[20%]">Manager</th>
                    <th className="px-4 py-3 w-[15%]">Deadline</th>
                    <th className="px-4 py-3 w-[10%]">Status</th>
                    <th className="px-4 py-3 w-[10%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map((proj) => {
                      const displayStatus = proj.status || "Unknown";
                      const statusStyle = statusColors[displayStatus] || statusColors.DEFAULT;
                      return (
                        <tr key={proj._id} className="hover:bg-blue-50/30 transition duration-200 group">
                          <td className="px-4 py-3 cursor-pointer" onClick={() => navigate(`/edit-project/${proj._id}`)}>
                            <div className="flex flex-col justify-center">
                                <span className="font-bold text-slate-800 text-xs truncate group-hover:text-blue-600 transition-colors max-w-[220px]">{proj.project_name}</span>
                                <span className="text-[10px] text-slate-400 font-mono mt-0.5">{proj.project_id || "N/A"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                              <span className="text-xs text-slate-600 font-medium truncate block max-w-[150px]">{proj.team?.team_name || "N/A"}</span>
                          </td>
                          <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-bold">
                                    {proj.manager?.name?.charAt(0) || '?'}
                                  </div>
                                  <span className="text-xs text-slate-700 truncate">{proj.manager?.name || "Unassigned"}</span>
                              </div>
                          </td>
                          <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                  <FiCalendar className="text-slate-400 shrink-0" size={12} />
                                  <span className="text-xs text-slate-600">{proj.deadline ? new Date(proj.deadline).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : "Not Set"}</span>
                              </div>
                          </td>
                          <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border flex items-center gap-1 w-max ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                  <span className={`w-1 h-1 rounded-full ${statusStyle.dot}`}></span>
                                  {displayStatus}
                              </span>
                          </td>
                          <td className="px-4 py-3 text-right relative dropdown-actions">
                            <div className="inline-block relative">
                              <button
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDropdownOpen(dropdownOpen === proj._id ? null : proj._id);
                                }}
                              >
                                <FiMoreVertical className="text-lg" />
                              </button>
                              
                              {/* Dropdown Menu */}
                              <div
                                className={`absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-slate-100 z-20 overflow-hidden transition-all duration-200 origin-top-right ${
                                  dropdownOpen === proj._id
                                    ? "opacity-100 scale-100 visible"
                                    : "opacity-0 scale-95 invisible"
                                }`}
                              >
                                {/* Edit */}
                                <button
                                  className="block w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-blue-50 flex items-center gap-2 hover:text-blue-600 transition-colors"
                                  onClick={() => {
                                    navigate(`/edit-project/${proj._id}`);
                                    setDropdownOpen(null);
                                  }}
                                >
                                  <FiEdit size={14}/> Edit Project
                                </button>
                                
                                <div className="border-t border-slate-100"></div>

                                {/* Delete */}
                                <button
                                  className="block w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  onClick={() => confirmDelete(proj._id)}
                                >
                                  <FiTrash2 size={14}/> Delete
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-100 flex justify-center items-center gap-4 bg-slate-50/50">
              <button 
                onClick={prevPage} 
                className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={page === 1}
              >
                Previous
              </button>
              <div className="text-xs font-bold text-slate-500">Page {page}</div>
              <button 
                onClick={nextPage} 
                className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={projects.length < limit}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96 text-center animate-[fadeIn_0.2s_ease-out]">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Delete Project?</h2>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">This will permanently remove this project and all associated tasks. This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button 
                className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-medium text-sm" 
                onClick={() => setModalOpen(false)}
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
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
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

export default Projects;