import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiMoreVertical, FiSearch, FiX, FiUsers, FiShield, FiUser, FiCalendar, FiBriefcase, FiEye } from "react-icons/fi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Toast from "../components/Toast";

// Aesthetic Color Palette
const roleColors = {
  ADMIN: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  HR: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  EMPLOYEE: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  MANAGER: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  DEFAULT: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
};

const Team = () => {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(null);
  
  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTeamId, setDeleteTeamId] = useState(null);
  const [viewTeam, setViewTeam] = useState(null); 
  
  // Hover State for the Create Team Button
  const [isHoveringCreateBtn, setIsHoveringCreateBtn] = useState(false);

  const [userRole, setUserRole] = useState("");
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();

  // --- 1. Fetch Role ---
  useEffect(() => {
    const role = localStorage.getItem("role") || "";
    setUserRole(role.toLowerCase());
  }, []);

  // --- 2. Fetch Teams ---
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await axios.get("https://emsbackend-2w9c.onrender.com/api/teams", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        // Add safety check for response data
        if(res.data) {
          setTeams(res.data);
          setFilteredTeams(res.data);
        }
      } catch (err) {
        console.error("Error fetching teams:", err);
        setError("Failed to fetch teams");
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // --- 3. Search Logic ---
  useEffect(() => {
    if (!search) setFilteredTeams(teams);
    else {
      setFilteredTeams(
        teams.filter(
          (team) =>
            (team.team_name || "").toLowerCase().includes(search.toLowerCase()) ||
            (team.team_leader?.name || "").toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, teams]);

  // --- 4. Advanced UX: Click Outside to Close Dropdown ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close if a dropdown is open
      if (dropdownOpen) {
        // Check if click is outside of a specific element logic, here we simplify to close if not interacting
        // In a complex app we'd use refs, but a global reset is safer for this snippet
        // unless clicking on a specific "actions" button. 
        // We will let the state handle this via the onClick in the render, 
        // but here we can close if clicking on the main container.
        if (!event.target.closest('.dropdown-actions')) {
            setDropdownOpen(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // --- 5. Advanced UX: Escape Key to Close Modals ---
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setViewTeam(null);
        setModalOpen(false);
        setDropdownOpen(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const confirmDelete = (id) => {
    setDeleteTeamId(id);
    setModalOpen(true);
    setDropdownOpen(null);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`https://emsbackend-2w9c.onrender.com/api/teams/${deleteTeamId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setTeams((prev) => prev.filter((team) => team._id !== deleteTeamId));
      setFilteredTeams((prev) => prev.filter((team) => team._id !== deleteTeamId));
      setModalOpen(false);
      setDeleteTeamId(null); // Reset ID after delete
      setToast({ show: true, message: 'Team deleted successfully!', type: 'success' });
    } catch (err) {
      setToast({ show: true, message: 'Failed to delete team.', type: 'error' });
    }
  };

  const cancelDelete = () => {
      setModalOpen(false);
      setDeleteTeamId(null); // Reset ID on cancel as well
  };

  // Stats Calculations
  const totalMembers = teams.reduce((acc, team) => acc + (team.members?.length || 0), 0);
  const teamsWithLeaders = teams.filter(t => t.team_leader).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <Navbar />

      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Teams Directory</h1>
            <p className="text-slate-500 text-sm mt-1">Manage organizational structure and members</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto items-center h-full">
            <div className="relative w-full md:w-80">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                <FiSearch />
              </span>
              <input
                type="text"
                placeholder="Search by team name or leader..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {(userRole === "admin" || userRole === "hr") && (
              <button
                onClick={() => navigate("/add-team")}
                onMouseEnter={() => setIsHoveringCreateBtn(true)}
                onMouseLeave={() => setIsHoveringCreateBtn(false)}
                style={{
                  // Default: Blue (37, 99, 235), Hover: Orange (255, 172, 28)
                  backgroundColor: isHoveringCreateBtn ? 'rgb(255, 172, 28)' : 'rgb(37, 99, 235)', 
                  color: '#ffffff', // Dark text
                  boxShadow: isHoveringCreateBtn ? '0 10px 15px -3px rgba(255, 172, 28, 0.4)' : '0 10px 15px -3px rgba(37, 99, 235, 0.4)',
                  transform: isHoveringCreateBtn ? 'translateY(-2px)' : 'translateY(0)'
                }}
                className="h-full px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-medium border border-transparent transition-all duration-300 ease-out"
              >
                <span>Create Team</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <FiBriefcase size={24} />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Teams</p>
                <p className="text-2xl font-bold text-slate-800">{filteredTeams.length}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <FiUsers size={24} />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Members</p>
                <p className="text-2xl font-bold text-slate-800">{totalMembers}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow min-h-[120px]">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <FiShield size={24} />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Teams with Leader</p>
                <p className="text-2xl font-bold text-slate-800">{teamsWithLeaders}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading / Error / Empty */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
            <p className="mt-4 text-slate-500 text-sm animate-pulse">Loading teams...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-red-50 rounded-2xl border border-red-100">
            <p className="text-red-500 font-medium">{error}</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
            <FiUsers className="mx-auto h-16 w-16 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No teams found.</p>
          </div>
        ) : (
          /* Table */
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Team Name</th>
                    <th className="px-6 py-4">Leader</th>
                    <th className="px-6 py-4">Members</th>
                    <th className="px-6 py-4">Timeline</th>
                    <th className="px-6 py-4 text-center">Total</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeams.map((team) => (
                    <tr key={team._id} className="hover:bg-orange-50/30 transition duration-200 group">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 text-base block group-hover:text-orange-600 transition-colors">
                          {team.team_name || "Unnamed Team"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{team._id.slice(-6)}</span>
                      </td>
                      <td className="px-6 py-4">
                        {team.team_leader ? (
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md text-xs shrink-0">
                              {team.team_leader.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col justify-center">
                              <div className="font-semibold text-slate-700 text-sm">{team.team_leader.name}</div>
                              <div className="text-[10px] text-slate-400">{team.team_leader.role}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Unassigned</span>
                        )}
                      </td>
                      <td 
                        className="px-6 py-4 cursor-pointer transition duration-200"
                        onClick={() => setViewTeam(team)}
                      >
                         <div className="flex -space-x-1 items-center">
                            {team.members && team.members.length > 0 ? (
                               team.members.slice(0, 3).map((m, idx) => (
                                <div key={idx} className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 text-slate-500 text-[10px] flex items-center justify-center font-medium">
                                  {m.employee?.name ? m.employee.name.charAt(0).toUpperCase() : "?"}
                                </div>
                              ))
                            ) : <span className="text-slate-300 text-xs">-</span>}
                          </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col justify-center h-full text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 mb-0.5">
                            <FiCalendar size={10} className="text-blue-400"/> Created: {new Date(team.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                             Updated: {new Date(team.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center cursor-pointer" onClick={() => setViewTeam(team)}>
                        <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200 group-hover:bg-orange-100 group-hover:text-orange-600 group-hover:border-orange-200 transition-all">
                          {team.members?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right relative dropdown-actions">
                        {(userRole === "admin" || userRole === "hr") && (
                          <div className="inline-block relative">
                            <button
                              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDropdownOpen(dropdownOpen === team._id ? null : team._id);
                              }}
                            >
                              <FiMoreVertical className="text-xl" />
                            </button>
                            <div
                              className={`absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-2xl border border-slate-100 z-20 overflow-hidden transition-all duration-200 origin-top-right ${
                                dropdownOpen === team._id
                                  ? "opacity-100 scale-100 visible"
                                  : "opacity-0 scale-95 invisible"
                              }`}
                            >
                              <button
                                className="block w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 flex items-center gap-2 hover:text-blue-600 transition-colors"
                                onClick={() => {
                                  setViewTeam(team);
                                  setDropdownOpen(null);
                                }}
                              >
                                <FiEye size={14}/> View Detail
                              </button>
                              <div className="border-t border-slate-100">
                                <button
                                  className="block w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 hover:text-orange-600 transition-colors"
                                  onClick={() => {
                                    navigate(`/edit-team/${team._id}`);
                                    setDropdownOpen(null);
                                  }}
                                >
                                  <FiUsers size={14}/> Edit
                                </button>
                              </div>
                              {userRole === "admin" && (
                                <div className="border-t border-slate-100">
                                    <button
                                      className="block w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                                      onClick={() => confirmDelete(team._id)}
                                    >
                                      <FiX size={14}/> Delete
                                    </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- TEAM DETAILS MODAL (Advanced Split Layout) --- */}
      {viewTeam && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-xl p-4 sm:p-6 transition-opacity duration-300"
          style={{
            // FORCED GRADIENT STYLE: Dark Slate to Deep Blue to Dark Slate
            background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 58, 138, 0.75) 50%, rgba(15, 23, 42, 0.95) 100%)"
          }}
        >
          {/* Wide Modal Container */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-white shrink-0 z-10 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                   <FiBriefcase size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 truncate">{viewTeam.team_name}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {viewTeam._id}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewTeam(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500 transition shrink-0"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Body: Split Layout */}
            <div className="flex flex-col lg:flex-row h-full overflow-hidden">
              
              {/* LEFT COLUMN: Team Info (Sidebar) */}
              <div className="w-full lg:w-1/3 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 p-6 flex flex-col gap-6 shrink-0">
                
                {/* Leader Profile Card */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Team Leader</p>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md mb-3">
                        {viewTeam.team_leader ? viewTeam.team_leader.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <p className="font-bold text-slate-800 text-lg truncate w-full">{viewTeam.team_leader ? viewTeam.team_leader.name : "Unassigned"}</p>
                    {viewTeam.team_leader && (
                         <span className={`mt-2 text-[10px] px-2 py-1 rounded-md font-bold uppercase border max-w-max ${
                            roleColors[viewTeam.team_leader.role?.toUpperCase()] ? 
                            `${roleColors[viewTeam.team_leader.role?.toUpperCase()].bg} ${roleColors[viewTeam.team_leader.role?.toUpperCase()].text}` :
                            "bg-gray-100 text-gray-700"
                         }`}>
                            {viewTeam.team_leader.role}
                         </span>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Overview</p>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                <FiUsers size={18}/>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Members</p>
                                <p className="text-lg font-bold text-slate-700">{viewTeam.members?.length || 0}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <FiCalendar size={18}/>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-semibold">Created On</p>
                                <p className="text-sm font-semibold text-slate-700">{new Date(viewTeam.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Member List */}
              <div className="w-full lg:w-2/3 p-6 bg-white flex flex-col h-full overflow-hidden">
                 <div className="flex justify-between items-center mb-4 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Team Members</h3>
                        <p className="text-xs text-slate-400 mt-1">{viewTeam.members?.length} employees assigned</p>
                    </div>
                 </div>
                 
                 {/* SCROLL AREA: Responsive Grid */}
                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                      {viewTeam.members && viewTeam.members.length > 0 ? (
                        viewTeam.members.map((m) => {
                          const role = m.employee?.role?.toUpperCase() || "DEFAULT";
                          const colors = roleColors[role] || roleColors.DEFAULT;
                          return (
                            <div key={m._id} className="group flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all min-w-0">
                              
                              {/* Avatar */}
                              <div className="shrink-0 w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm border border-slate-200">
                                {m.employee?.name ? m.employee.name.charAt(0).toUpperCase() : "?"}
                              </div>
                              
                              {/* Text Info - Truncated to prevent grid break */}
                              <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
                                <h4 className="font-semibold text-slate-700 text-sm truncate group-hover:text-blue-600 transition-colors">
                                  {m.employee?.name || "Unknown User"}
                                </h4>
                                <p className="text-[11px] text-slate-400 truncate">{m.employee?.email}</p>
                              </div>

                              {/* Badge */}
                              {m.employee?.role && (
                                <div className={`shrink-0 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider border whitespace-nowrap ${colors.bg} ${colors.text} ${colors.border}`}>
                                  {m.employee.role}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                           <FiUsers className="text-slate-200 mb-3" size={32} />
                          <p className="text-sm text-slate-400 font-medium">No members assigned yet</p>
                        </div>
                      )}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE MODAL (Bug Fixed: State Reset on Cancel) --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Delete Team?</h2>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">This will permanently remove team and all associated data. This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button
                className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-medium text-sm"
                onClick={cancelDelete} // Fixed: Calls cancelDelete to reset ID
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

export default Team;