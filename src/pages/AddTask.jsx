import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { 
  FiChevronDown, FiBriefcase, FiUsers, FiCalendar, FiClock, 
  FiTag, FiFileText, FiPaperclip, FiBell, FiX, FiEye, 
  FiShield, FiActivity 
} from "react-icons/fi";

const AddTask = () => {
  // --- State Management ---
  const [ticket, setTicket] = useState({
    title: "",
    description: "",
    assignedTo: [], 
    team: "",
    startDate: "",
    dueDate: "",
    estimatedHours: "",
    priority: "Medium",
    category: "Development",
    progress: 0,
    tags: "",
    notes: "",
    notifyAssignee: true
  });
  
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const [currentUser, setCurrentUser] = useState({ id: "", name: "", employeeId: "" });
  const [userLoading, setUserLoading] = useState(true);
  
  // Hover State for Submit Button
  const [isHoveringSubmit, setIsHoveringSubmit] = useState(false);

  // Modal State for View Team Details
  const [viewTeam, setViewTeam] = useState(null);

  const navigate = useNavigate();
  
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const dropdownRef = useRef(null); 
  
  const token = localStorage.getItem("token");

  const api = axios.create({
    baseURL: "https://emsbackend-2w9c.onrender.com/api",
  });

  api.interceptors.request.use((config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  
  const decodeJWT = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const fetchUserById = async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      return null;
    }
  };

  // --- Click Outside Logic ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsAssigneeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // --- Escape Key Logic ---
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setViewTeam(null);
        setIsAssigneeDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);
  
  useEffect(() => {
    const getInitialData = async () => {
      if (!token) {
        setCurrentUser({ id: "no-token", name: "Guest", employeeId: "N/A" });
        localStorage.removeItem('id');
        localStorage.removeItem('name');
        localStorage.removeItem('employeeId');
        setUserLoading(false);
        return;
      }

      try {
        const decoded = decodeJWT(token);
        if (!decoded || !decoded.id) {
          throw new Error("Invalid token");
        }
        const userId = decoded.id || decoded._id;

        const userData = await fetchUserById(userId);
        
        if (userData) {
          const userToSet = {
            id: userData._id,
            name: userData.name,
            employeeId: userData.employeeId,
          };
          setCurrentUser(userToSet);
          localStorage.setItem("id", userToSet.id);
          localStorage.setItem("name", userToSet.name);
          localStorage.setItem("employeeId", userToSet.employeeId);
        } else {
          setCurrentUser({ id: "not-found", name: "User Not Found", employeeId: "N/A" });
        }
      } catch (error) {
        console.error("Failed to get current user:", error);
        setCurrentUser({ id: "error", name: "Error Loading User", employeeId: "N/A" });
      } finally {
        setUserLoading(false);
      }
      
      try {
        const [employeesRes, teamsRes] = await Promise.all([
          api.get("/users"),
          api.get("/teams")
        ]);
        
        setEmployees(employeesRes.data || []);
        setFilteredEmployees(employeesRes.data || []);
        setTeams(teamsRes.data || []);
      } catch (err) {
        console.error("Error fetching dropdown data:", err);
      }
    };

    getInitialData();
  }, [token]);
  
  useEffect(() => {
    if (ticket.team && teams.length > 0 && employees.length > 0) {
      const selectedTeam = teams.find(team => team._id === ticket.team);
      if (selectedTeam && selectedTeam.members) {
        const teamMemberIds = selectedTeam.members
          .map(member => {
            if (member.employee && typeof member.employee === 'object') {
              return member.employee._id || member.employee;
            }
            return member.employee;
          })
          .filter(Boolean);
        
        if (selectedTeam.team_leader) {
          const leaderId = typeof selectedTeam.team_leader === 'object' 
            ? selectedTeam.team_leader._id 
            : selectedTeam.team_leader;
          if (leaderId && !teamMemberIds.includes(leaderId)) {
            teamMemberIds.push(leaderId);
          }
        }
        
        const teamMembers = employees.filter(emp => 
          teamMemberIds.some(id => 
            id.toString() === emp._id.toString()
          )
        );
        setFilteredEmployees(teamMembers);
      } else {
        setFilteredEmployees(employees);
      }
    } else {
      setFilteredEmployees(employees);
    }
    setTicket(prev => ({ ...prev, assignedTo: [] }));
  }, [ticket.team, teams, employees]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTicket(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEmployeeToggle = (employeeId) => {
    setTicket(prev => {
      const isSelected = prev.assignedTo.includes(employeeId);
      let newAssignedTo;
      if (isSelected) {
        newAssignedTo = prev.assignedTo.filter(id => id !== employeeId);
      } else {
        newAssignedTo = [...prev.assignedTo, employeeId];
      }
      return { ...prev, assignedTo: newAssignedTo };
    });
  };
  
  const handleFileChange = (e) => {
    setAttachments(e.target.files);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser.id || currentUser.id === "no-token" || currentUser.id === "error") {
      setToast({ show: true, message: 'User information is missing. Please log in again.', type: 'error' });
      return;
    }
    
    if (ticket.assignedTo.length === 0) {
      setToast({ show: true, message: 'Please assign at least one employee to this ticket.', type: 'error' });
      return;
    }
    
    try {
      setUploading(true);
      
      const formData = new FormData();
      
      Object.keys(ticket).forEach(key => {
        if (key === 'assignedTo') {
          formData.append(key, JSON.stringify(ticket[key]));
        } else {
          formData.append(key, ticket[key]);
        }
      });
      
      formData.append('status', 'Not Started');
      formData.append('createdBy', currentUser.id);
      
      if (attachments.length > 0) {
        for (let i = 0; i < attachments.length; i++) {
          formData.append('attachments', attachments[i]);
        }
      }
      
      await api.post("/tasks", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setToast({ show: true, message: 'Ticket created successfully!', type: 'success' });
      setTimeout(() => navigate("/tasks"), 1500);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: err.response?.data?.error || 'Failed to create ticket.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  // Role Colors (Same as Team.js)
  const roleColors = {
    ADMIN: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
    HR: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
    EMPLOYEE: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
    MANAGER: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
    DEFAULT: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      
      
      <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Add New Ticket</h1>
            <p className="text-slate-500 text-sm mt-1">Create and assign tasks to your team</p>
          </div>
          <button
             onClick={() => navigate("/tasks")}
             className="text-slate-500 hover:text-slate-700 text-sm font-medium flex items-center gap-1 transition-colors"
          >
             <FiX /> Cancel
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          
          {/* 1. Ticket Information */}
          <div className="p-6 md:p-8 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <FiBriefcase size={20} />
               </div>
               <h2 className="text-xl font-bold text-slate-800">Ticket Details</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  value={ticket.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Enter ticket title..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={ticket.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  placeholder="Detailed description of the task..."
                ></textarea>
              </div>
            </div>
          </div>
          
          {/* 2. Assignment & Time */}
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/30">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Assignment Column */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                      <FiUsers size={18} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">Assignment</h2>
                  </div>
                  
                  {/* Team Select */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Select Team</label>
                    <div className="relative flex items-center gap-2">
                      <select
                        name="team"
                        value={ticket.team}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all cursor-pointer pr-10"
                      >
                        <option value="">Choose a team...</option>
                        {teams.map(team => (
                          <option key={team._id} value={team._id}>{team.team_name}</option>
                        ))}
                      </select>
                      <FiChevronDown className="absolute right-4 text-slate-400 pointer-events-none" />
                      
                      {/* View Team Details Button */}
                      {ticket.team && (
                         <button
                           type="button"
                           onClick={() => setViewTeam(teams.find(t => t._id === ticket.team))}
                           className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-200 transition-colors shadow-sm"
                           title="View Team Details"
                         >
                            <FiEye size={18} />
                         </button>
                      )}
                    </div>
                  </div>

                  {/* Custom Assignee Dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Assign To *</label>
                    <div ref={dropdownRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                        className={`w-full px-4 py-3 text-left border rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 flex items-center justify-between transition-all ${
                           ticket.assignedTo.length > 0 ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <span className="text-slate-700 text-sm font-medium">
                          {ticket.assignedTo.length === 0
                            ? "Select Employees"
                            : `${ticket.assignedTo.length} Employee${ticket.assignedTo.length > 1 ? 's' : ''} Selected`
                          }
                        </span>
                        <FiChevronDown className={`text-slate-400 transition-transform ${isAssigneeDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isAssigneeDropdownOpen && (
                        <div className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden">
                          <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {filteredEmployees.length > 0 ? (
                              filteredEmployees.map(emp => (
                                <label key={emp._id} className="flex items-center px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors">
                                  <div className="w-5 h-5 border border-slate-300 rounded flex items-center justify-center mr-3 text-white bg-white">
                                    {ticket.assignedTo.includes(emp._id) && (
                                      <div className="w-3 h-3 bg-blue-600 rounded-sm" />
                                    )}
                                  </div>
                                  <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={ticket.assignedTo.includes(emp._id)}
                                    onChange={() => handleEmployeeToggle(emp._id)}
                                  />
                                  <span className="text-sm text-slate-700 font-medium">{emp.name}</span>
                                  <span className="text-xs text-slate-400 ml-2 truncate">{emp.email}</span>
                                </label>
                              ))
                            ) : (
                              <div className="px-4 py-8 text-center text-slate-400 text-sm">
                                No members found. Select a team first.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
              </div>

              {/* Time Column */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                      <FiClock size={18} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">Timeline</h2>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Estimated Hours</label>
                    <input
                      type="number"
                      name="estimatedHours"
                      value={ticket.estimatedHours}
                      onChange={handleChange}
                      min="0"
                      step="0.5"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="0.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Due Date</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={ticket.dueDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                    <div className="relative">
                      <select
                        name="priority"
                        value={ticket.priority}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all cursor-pointer"
                      >
                        <option value="Low">Low Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="High">High Priority</option>
                        <option value="Critical">Critical Priority</option>
                      </select>
                      <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
              </div>
            </div>
          </div>
          
          {/* 3. Properties & Tags */}
          <div className="p-6 md:p-8 border-b border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                  <div className="relative">
                    <select
                      name="category"
                      value={ticket.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all cursor-pointer"
                    >
                      <option value="Development">Development</option>
                      <option value="Design">Design</option>
                      <option value="Testing">Testing</option>
                      <option value="Documentation">Documentation</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Research">Research</option>
                    </select>
                    <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                     <FiTag size={16} className="text-slate-400"/> Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={ticket.tags}
                    onChange={handleChange}
                    placeholder="e.g., urgent, frontend, client"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
               </div>
            </div>
          </div>
          
          {/* 4. Attachments & Notes */}
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/30">
             <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                     <FiPaperclip size={16} className="text-slate-400"/> Attachments
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer relative">
                     <input
                       type="file"
                       onChange={handleFileChange}
                       multiple
                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                     />
                     <div className="text-slate-500 flex flex-col items-center gap-2">
                        <FiPaperclip size={24} />
                        <p className="text-sm font-medium">Click to upload files</p>
                        <p className="text-xs text-slate-400">or drag and drop</p>
                     </div>
                  </div>
                  
                  {attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selected Files</p>
                      {Array.from(attachments).map((file, index) => (
                        <div key={index} className="flex items-center justify-between px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                           <div className="flex items-center gap-2 overflow-hidden">
                              <FiFileText className="text-blue-500 shrink-0" size={16} />
                              <span className="text-sm text-slate-700 truncate">{file.name}</span>
                           </div>
                           <span className="text-xs text-slate-400 font-mono">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-2">Additional Notes</label>
                   <textarea
                     name="notes"
                     value={ticket.notes}
                     onChange={handleChange}
                     rows="2"
                     placeholder="Internal notes for the team..."
                     className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                   ></textarea>
                </div>
             </div>
          </div>
          
          {/* Footer Actions */}
          <div className="px-6 md:px-8 py-6 bg-white border-t border-slate-100 flex items-center justify-between">
             <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                   <input
                      type="checkbox"
                      name="notifyAssignee"
                      checked={ticket.notifyAssignee}
                      onChange={handleChange}
                      className="peer sr-only"
                    />
                   <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all"></div>
                   <FiBell className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                </div>
                <div className="flex flex-col">
                   <span className="text-sm font-medium text-slate-700">Notify Assignees</span>
                   <span className="text-xs text-slate-400">Send email notification</span>
                </div>
             </label>

             <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/tasks")}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onMouseEnter={() => setIsHoveringSubmit(true)}
                  onMouseLeave={() => setIsHoveringSubmit(false)}
                  // UPDATED COLORS TO MATCH REQUEST
                  style={{
                    backgroundColor: isHoveringSubmit ? 'rgb(255, 172, 28)' : 'rgb(100, 149, 237)', 
                    color: '#1e293b',
                    boxShadow: isHoveringSubmit ? '0 10px 15px -3px rgba(255, 172, 28, 0.4)' : '0 10px 15px -3px rgba(100, 149, 237, 0.4)',
                    transform: isHoveringSubmit ? 'translateY(-2px)' : 'translateY(0)'
                  }}
                  className="h-full px-8 py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold border border-transparent transition-all duration-300 ease-out"
                  disabled={uploading || userLoading}
                >
                  <span>{uploading ? "Creating..." : "Create Ticket"}</span>
                </button>
             </div>
          </div>
        </form>
      </div>

      {/* --- TEAM DETAILS MODAL (Reused from Team.js) --- */}
      {viewTeam && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-xl p-4 sm:p-6 transition-opacity duration-300"
          style={{
            // SAME FORCED GRADIENT STYLE FROM TEAM PAGE
            background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 58, 138, 0.75) 50%, rgba(15, 23, 42, 0.95) 100%)"
          }}
        >
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
                              
                              {/* Text Info */}
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

export default AddTask;