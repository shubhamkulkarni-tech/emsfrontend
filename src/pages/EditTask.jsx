import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams, Link } from "react-router-dom";

import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { 
  FiArrowLeft, FiBriefcase, FiCalendar, FiUser, FiLayers, FiUsers, 
  FiCheckCircle, FiClock, FiAlertCircle, FiTag, FiFileText, 
  FiUpload, FiTrash2, FiSave, FiChevronDown 
} from "react-icons/fi";

const EditTask = () => {
  const { id } = useParams();
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
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const [currentUser, setCurrentUser] = useState({ id: "", name: "", employeeId: "" });
  const [userLoading, setUserLoading] = useState(true);
  const [taskCreator, setTaskCreator] = useState({ id: "", name: "", employeeId: "" });
  const [creatorLoading, setCreatorLoading] = useState(true);
  
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const navigate = useNavigate();
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
      return null;
    }
  };

  const fetchUserById = async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  };

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
  
  useEffect(() => {
    const getCurrentUser = async () => {
      if (!token) {
        setCurrentUser({ id: "no-token", name: "Guest", employeeId: "N/A" });
        setUserLoading(false);
        return;
      }
      try {
        const decoded = decodeJWT(token);
        if (!decoded || !decoded.id) throw new Error("Invalid token");
        const userId = decoded.id || decoded._id;
        const userData = await fetchUserById(userId);
        if (userData) {
          setCurrentUser({
            id: userData._id,
            name: userData.name,
            employeeId: userData.employeeId,
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setUserLoading(false);
      }
    };
    getCurrentUser();
  }, [token]);
  
  useEffect(() => {
    const getInitialData = async () => {
      try {
        const taskResponse = await api.get(`/tasks/${id}`);
        const taskData = taskResponse.data;
        
        let assignedToValue = [];
        if (taskData.assignedTo) {
          if (Array.isArray(taskData.assignedTo)) {
            assignedToValue = taskData.assignedTo.map(assignee => 
              typeof assignee === 'object' ? assignee._id : assignee
            );
          } else if (typeof taskData.assignedTo === 'object') {
            assignedToValue = [taskData.assignedTo._id];
          } else {
            assignedToValue = [taskData.assignedTo];
          }
        }
        
        setTicket({
          title: taskData.title || "",
          description: taskData.description || "",
          assignedTo: assignedToValue,
          team: taskData.team?._id || "",
          startDate: taskData.startDate ? new Date(taskData.startDate).toISOString().split('T')[0] : "",
          dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString().split('T')[0] : "",
          estimatedHours: taskData.estimatedHours || "",
          priority: taskData.priority || "Medium",
          category: taskData.category || "Development",
          progress: taskData.progress || 0,
          tags: taskData.tags || "",
          notes: taskData.notes || "",
          notifyAssignee: taskData.notifyAssignee !== undefined ? taskData.notifyAssignee : true
        });
        
        setExistingAttachments(taskData.attachments || []);
        
        if (taskData.createdBy) {
          const creatorData = await fetchUserById(taskData.createdBy._id || taskData.createdBy);
          if (creatorData) {
            setTaskCreator({
              id: creatorData._id,
              name: creatorData.name,
              employeeId: creatorData.employeeId
            });
          }
        }
        
        const [employeesRes, teamsRes] = await Promise.all([
          api.get("/users"),
          api.get("/teams")
        ]);
        
        setEmployees(employeesRes.data || []);
        setTeams(teamsRes.data || []);
      } catch (err) {
        console.error(err);
        setToast({ show: true, message: 'Failed to load task data', type: 'error' });
      } finally {
        setLoading(false);
        setCreatorLoading(false);
      }
    };
    getInitialData();
  }, [id]);
  
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
  
  const handleRemoveAttachment = async (index) => {
    try {
      const attachmentToRemove = existingAttachments[index];
      if (attachmentToRemove._id) {
        await api.delete(`/tasks/${id}/attachments/${attachmentToRemove._id}`);
      }
      const updatedAttachments = [...existingAttachments];
      updatedAttachments.splice(index, 1);
      setExistingAttachments(updatedAttachments);
      setToast({ show: true, message: 'Attachment removed successfully', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Failed to remove attachment', type: 'error' });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      
      if (attachments.length > 0) {
        for (let i = 0; i < attachments.length; i++) {
          formData.append('attachments', attachments[i]);
        }
      }
      
      await api.put(`/tasks/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setToast({ show: true, message: 'Ticket updated successfully!', type: 'success' });
      setTimeout(() => navigate("/tasks"), 1500);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: err.response?.data?.error || 'Failed to update ticket.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      
      
      <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/tasks"
            className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 transition mb-4 group"
          >
            <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" /> 
            Back to Tasks
          </Link>
          
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Edit Ticket</h1>
          <p className="text-slate-500 text-sm mt-1">Update ticket details, assignments, and progress</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Core Ticket Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                  <FiFileText className="text-blue-500" size={20} />
                  <h2 className="text-lg font-bold text-slate-800">Ticket Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                    Title
                  </label>
                  <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                          <FiBriefcase size={18} />
                      </span>
                      <input
                      type="text"
                      name="title"
                      value={ticket.title}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="e.g. Fix Login Bug"
                      required
                      />
                  </div>
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={ticket.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    placeholder="Detailed description of the task..."
                  />
                </div>
              </div>
            </div>

            {/* Assignment */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                  <FiUsers className="text-blue-500" size={20} />
                  <h2 className="text-lg font-bold text-slate-800">Assignment</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                    Team
                  </label>
                  <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                          <FiLayers size={18} />
                      </span>
                      <select
                      name="team"
                      value={ticket.team}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                      >
                      <option value="">Select Team</option>
                      {teams.map(team => (
                        <option key={team._id} value={team._id}>{team.team_name}</option>
                      ))}
                      </select>
                  </div>
                </div>
                
                {/* Assigned To (Multi-select) */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                    Assigned To *
                  </label>
                  <div ref={dropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                      className="w-full pl-11 pr-4 py-3 text-left border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all flex items-center justify-between h-[50px]"
                    >
                      <span className={`truncate ${ticket.assignedTo.length === 0 ? "text-slate-400" : ""}`}>
                        {ticket.assignedTo.length === 0
                          ? "Select Employees"
                          : ticket.assignedTo.length === 1
                          ? filteredEmployees.find(emp => emp._id === ticket.assignedTo[0])?.name || "Selected"
                          : `${ticket.assignedTo.length} Employees Selected `
                        }
                      </span>
                      <FiChevronDown className={`text-slate-400 transition-transform ml-2 flex-shrink-0 ${isAssigneeDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isAssigneeDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-auto">
                        {filteredEmployees.length > 0 ? (
                          filteredEmployees.map(emp => (
                            <label key={emp._id} className="flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                className="mr-3 h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                checked={ticket.assignedTo.includes(emp._id)}
                                onChange={() => handleEmployeeToggle(emp._id)}
                              />
                              <span className="text-sm text-slate-700">{emp.name}</span>
                            </label>
                          ))
                        ) : (
                          <p className="px-4 py-2 text-sm text-slate-500 italic">No members found in selected team</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Creator Info (Read Only) */}
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                        Created By
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                            <FiUser size={18} />
                        </span>
                        <input
                            type="text"
                            value={creatorLoading ? "Loading..." : taskCreator.name || "N/A"}
                            readOnly
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 focus:outline-none"
                        />
                    </div>
                </div>
              </div>
            </div>

            {/* Time Management */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                    <FiClock className="text-blue-500" size={20} />
                    <h2 className="text-lg font-bold text-slate-800">Time Management</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                            Estimated Hours
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                                <FiClock size={18} />
                            </span>
                            <input
                            type="number"
                            name="estimatedHours"
                            value={ticket.estimatedHours}
                            onChange={handleChange}
                            min="0"
                            step="0.5"
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                            Due Date
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                                <FiCalendar size={18} />
                            </span>
                            <input
                            type="date"
                            name="dueDate"
                            value={ticket.dueDate}
                            onChange={handleChange}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            required
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Properties */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                    <FiAlertCircle className="text-blue-500" size={20} />
                    <h2 className="text-lg font-bold text-slate-800">Properties</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                            Priority
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                                <FiAlertCircle size={18} />
                            </span>
                            <select
                            name="priority"
                            value={ticket.priority}
                            onChange={handleChange}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                            >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                            Category
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                                <FiTag size={18} />
                            </span>
                            <select
                            name="category"
                            value={ticket.category}
                            onChange={handleChange}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                            >
                            <option value="Development">Development</option>
                            <option value="Design">Design</option>
                            <option value="Testing">Testing</option>
                            <option value="Documentation">Documentation</option>
                            <option value="Meeting">Meeting</option>
                            <option value="Research">Research</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Additional Info & Attachments */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                    <FiTag className="text-blue-500" size={20} />
                    <h2 className="text-lg font-bold text-slate-800">Additional Details</h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                            Tags
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                                <FiTag size={18} />
                            </span>
                            <input
                            type="text"
                            name="tags"
                            value={ticket.tags}
                            onChange={handleChange}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            placeholder="e.g. urgent, bug, feature"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                            Notes
                        </label>
                        <textarea
                        name="notes"
                        value={ticket.notes}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                        placeholder="Internal notes..."
                        />
                    </div>
                </div>
            </div>

            {/* Attachments */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                    <FiUpload className="text-blue-500" size={20} />
                    <h2 className="text-lg font-bold text-slate-800">Attachments</h2>
                </div>
                
                {existingAttachments.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-xs font-bold uppercase text-slate-400 mb-2">Existing Files</p>
                        <ul className="space-y-2">
                        {existingAttachments.map((attachment, index) => (
                            <li key={index} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                            <span className="text-sm text-slate-700 truncate flex-1 mr-2">{attachment.filename}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveAttachment(index)}
                                className="text-red-500 hover:text-red-700 transition flex-shrink-0"
                            >
                                <FiTrash2 size={18} />
                            </button>
                            </li>
                        ))}
                        </ul>
                    </div>
                )}
                
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                        Upload New Files
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-0 border-2 border-dashed border-slate-300 rounded-xl pointer-events-none group-hover:border-blue-400 transition-colors"></div>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            multiple
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all relative z-10"
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-1 ml-1">Supports multiple files</p>
                </div>
            </div>
            
            {/* Notification Settings */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <input
                    type="checkbox"
                    name="notifyAssignee"
                    checked={ticket.notifyAssignee}
                    onChange={handleChange}
                    className="h-5 w-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">Notify assignees when ticket is updated</span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate("/tasks")}
                className="flex-1 px-6 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-semibold bg-white hover:bg-slate-50 transition shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                disabled={uploading || userLoading}
              >
                {uploading ? "Updating..." : (
                    <>
                        <FiSave size={18} />
                        Update Ticket
                    </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
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

export default EditTask;