import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import { FiArrowLeft, FiBriefcase, FiCalendar, FiUser, FiLayers, FiCheckCircle, FiSave } from "react-icons/fi";

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const [formData, setFormData] = useState({
    project_name: '',
    description: '',
    manager_id: '',
    team_id: '',
    deadline: '',
    status: 'In Progress'
  });

  useEffect(() => {
    fetchProject();
    fetchManagers();
    fetchTeams();
  }, [id]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://emsbackend-2w9c.onrender.com/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Project data:', response.data);
      const project = response.data;
      
      // Map API data to form state
      setFormData({
        project_name: project.project_name || '',
        description: project.description || '',
        manager_id: project.manager?._id || '',
        team_id: project.team?._id || '',
        deadline: project.end_date ? project.end_date.split('T')[0] : '',
        status: project.status || 'In Progress'
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching project:', error);
      setToast({ show: true, message: 'Failed to load project data', type: 'error' });
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem('token');
      let response;
      try {
        response = await axios.get('https://emsbackend-2w9c.onrender.com/api/users/managers', {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        // Fallback to all users if managers endpoint doesn't exist
        response = await axios.get('https://emsbackend-2w9c.onrender.com/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Filter for managers and admins
        response.data = response.data.filter(user => 
          user.role === 'manager' || user.role === 'admin'
        );
      }
      console.log('Managers data:', response.data);
      setManagers(response.data || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://emsbackend-2w9c.onrender.com/api/teams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Teams data:', response.data);
      setTeams(response.data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        end_date: formData.deadline // Map frontend deadline to backend end_date
      };
      delete payload.deadline; 
      console.log('Submitting form data:', payload);
      
      await axios.put(`https://emsbackend-2w9c.onrender.com/api/projects/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setToast({ show: true, message: 'Project updated successfully!', type: 'success' });
      setTimeout(() => navigate("/projects"), 2000);
    } catch (error) {
      console.error('Error updating project:', error);
      setToast({ show: true, message: 'Failed to update project', type: 'error' });
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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
      
      <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/projects"
            className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 transition mb-4 group"
          >
            <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" /> 
            Back to Projects
          </Link>
          
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Edit Project</h1>
          <p className="text-slate-500 text-sm mt-1">Update project details, assignments, and deadlines</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Name */}
              <div className="col-span-2 md:col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                  Project Name
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                        <FiBriefcase size={18} />
                    </span>
                    <input
                    type="text"
                    name="project_name"
                    value={formData.project_name}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                    />
                </div>
              </div>

              {/* Status */}
              <div className="col-span-2 md:col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                  Current Status
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                        <FiCheckCircle size={18} />
                    </span>
                    <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    >
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                    </select>
                </div>
              </div>

              {/* Manager */}
              <div className="col-span-2 md:col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                  Project Manager
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                        <FiUser size={18} />
                    </span>
                    <select
                    name="manager_id"
                    value={formData.manager_id}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    required
                    >
                    <option value="">Select Manager</option>
                    {managers.map((manager) => (
                        <option key={manager._id} value={manager._id}>
                        {manager.name}
                        </option>
                    ))}
                    </select>
                </div>
              </div>

              {/* Team */}
              <div className="col-span-2 md:col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                  Team (Optional)
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                        <FiLayers size={18} />
                    </span>
                    <select
                    name="team_id"
                    value={formData.team_id}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    >
                    <option value="">Select Team</option>
                    {teams.map((team) => (
                        <option key={team._id} value={team._id}>
                        {team.team_name}
                        </option>
                    ))}
                    </select>
                </div>
              </div>

              {/* Deadline */}
              <div className="col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                  Deadline
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                        <FiCalendar size={18} />
                    </span>
                    <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                placeholder="Enter project description..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="flex-1 px-6 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-semibold bg-white hover:bg-slate-50 transition shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                <FiSave size={18} />
                Update Project
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

export default EditProject;