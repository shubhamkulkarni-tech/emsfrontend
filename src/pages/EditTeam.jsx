import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { 
  FiEdit, FiUsers, FiShield, FiX, FiChevronDown, 
  FiBriefcase, FiUserCheck 
} from "react-icons/fi";

import Footer from "../components/Footer";
import Toast from "../components/Toast";

const EditTeam = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- State Management ---
  const [teamName, setTeamName] = useState("");
  const [teamLeader, setTeamLeader] = useState("");
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Custom Dropdown State
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Hover State for Submit Button
  const [isHoveringSubmit, setIsHoveringSubmit] = useState(false);

  // --- API Setup ---
  const api = axios.create({
    baseURL: "https://emsbackend-2w9c.onrender.com/api",
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // --- Fetch Users & Team Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, teamRes] = await Promise.all([
          api.get("/users"),
          api.get(`/teams/${id}`),
        ]);

        setAllUsers(usersRes.data || []);

        const teamData = teamRes.data;
        setTeamName(teamData.team_name || "");
        
        // Handle Team Leader (could be object or ID depending on backend population)
        const leaderId = typeof teamData.team_leader === 'object' 
          ? teamData.team_leader._id 
          : teamData.team_leader;
        setTeamLeader(leaderId || "");

        // Handle Members (map safely to IDs)
        const memberIds = (teamData.members || [])
          .map((m) => m.employee?._id || m.employee)
          .filter(Boolean);
        setMembers(memberIds);

      } catch (err) {
        console.error(err);
        setToast({ show: true, message: 'Failed to fetch team data.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // --- Logic: Filter Leader out of Members ---
  useEffect(() => {
    if (teamLeader && members.includes(teamLeader)) {
      setMembers(prev => prev.filter(id => id !== teamLeader));
    }
  }, [teamLeader]);

  // --- Click Outside Logic ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMemberDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- Toggle Member Selection ---
  const handleMemberToggle = (userId) => {
    setMembers(prev => {
      const isSelected = prev.includes(userId);
      if (isSelected) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // --- Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!teamName || !teamLeader) {
      setToast({ show: true, message: "Team Name and Leader are required!", type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/teams/${id}`, {
        team_name: teamName,
        team_leader_id: teamLeader,
        member_ids: members,
      });
      
      setToast({ show: true, message: 'Team updated successfully!', type: 'success' });
      setTimeout(() => navigate("/team"), 1500);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: err.response?.data?.error || 'Failed to update team.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Users for Dropdown (Excluding Leader)
  const availableMembers = allUsers.filter(user => user._id !== teamLeader);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      

      <div className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Edit Team</h1>
            <p className="text-slate-500 text-sm mt-1">Update team details and members</p>
          </div>
          <button
             onClick={() => navigate("/team")}
             className="text-slate-500 hover:text-slate-700 text-sm font-medium flex items-center gap-1 transition-colors"
          >
             <FiX /> Cancel
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          
          {/* 1. Core Information */}
          <div className="p-6 md:p-8 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <FiBriefcase size={20} />
               </div>
               <h2 className="text-xl font-bold text-slate-800">Team Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Team Name</label>
                  <input
                    type="text"
                    placeholder="Enter team name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
               </div>
               
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                     <FiShield size={16} className="text-slate-400"/> Team Leader
                  </label>
                  <div className="relative">
                    <select
                      value={teamLeader}
                      onChange={(e) => setTeamLeader(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all cursor-pointer"
                    >
                      <option value="">Select Leader...</option>
                      {allUsers.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
               </div>
            </div>
          </div>
          
          {/* 2. Member Selection */}
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/30">
             <div className="flex flex-col md:flex-row gap-8">
                {/* Left: Info Text */}
                <div className="w-full md:w-1/3 flex flex-col justify-center space-y-2">
                   <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                          <FiUsers size={18} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Members</h2>
                  </div>
                  <p className="text-sm text-slate-500">
                     Select employees to join the team. The selected team leader cannot be assigned as a regular member.
                  </p>
                </div>

                {/* Right: Custom Multi-Select Dropdown */}
                <div className="w-full md:w-2/3">
                   <label className="block text-sm font-semibold text-slate-700 mb-2">Assign Members</label>
                   <div ref={dropdownRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
                        className={`w-full px-4 py-3 text-left border rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 flex items-center justify-between transition-all ${
                           members.length > 0 ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <span className="text-slate-700 text-sm font-medium">
                          {members.length === 0
                            ? "Select Members"
                            : `${members.length} Member${members.length > 1 ? 's' : ''} Selected`
                          }
                        </span>
                        <FiChevronDown className={`text-slate-400 transition-transform ${isMemberDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isMemberDropdownOpen && (
                        <div className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden">
                           <div className="max-h-60 overflow-y-auto custom-scrollbar">
                              {availableMembers.length > 0 ? (
                                availableMembers.map(user => (
                                  <label key={user._id} className="flex items-center px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors">
                                    <div className="w-5 h-5 border border-slate-300 rounded flex items-center justify-center mr-3 text-white bg-white">
                                      {members.includes(user._id) && (
                                        <div className="w-3 h-3 bg-blue-600 rounded-sm" />
                                      )}
                                    </div>
                                    <input
                                      type="checkbox"
                                      className="hidden"
                                      checked={members.includes(user._id)}
                                      onChange={() => handleMemberToggle(user._id)}
                                    />
                                    <span className="text-sm text-slate-700 font-medium">{user.name}</span>
                                    <span className="text-xs text-slate-400 ml-2 truncate">{user.email}</span>
                                  </label>
                                ))
                              ) : (
                                <div className="px-4 py-8 text-center text-slate-400 text-sm">
                                   {allUsers.length === 0 ? "No users found" : "Select a team leader first."}
                                </div>
                              )}
                           </div>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 md:px-8 py-6 bg-white border-t border-slate-100 flex justify-end gap-3">
             <button
               type="button"
               onClick={() => navigate("/team")}
               className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all"
             >
               Cancel
             </button>
             <button
               type="submit"
               disabled={submitting || loading}
               onMouseEnter={() => setIsHoveringSubmit(true)}
               onMouseLeave={() => setIsHoveringSubmit(false)}
               style={{
                  backgroundColor: isHoveringSubmit ? 'rgb(255, 172, 28)' : 'rgb(100, 149, 237)', 
                  color: '#1e293b',
                  boxShadow: isHoveringSubmit ? '0 10px 15px -3px rgba(255, 172, 28, 0.4)' : '0 10px 15px -3px rgba(100, 149, 237, 0.4)',
                  transform: isHoveringSubmit ? 'translateY(-2px)' : 'translateY(0)'
               }}
               className="h-full px-8 py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold border border-transparent transition-all duration-300 ease-out"
             >
               <span>{submitting ? "Updating..." : "Update Team"}</span>
             </button>
          </div>
        </form>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
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

export default EditTeam;