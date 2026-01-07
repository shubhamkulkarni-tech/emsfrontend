import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { FiArrowLeft, FiBriefcase, FiCalendar, FiUser, FiLayers, FiCheckCircle, FiPlus } from "react-icons/fi";

const AddProject = () => {
  const [teams, setTeams] = useState([]);
  const [managers, setManagers] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [status, setStatus] = useState("In Progress");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const [tRes, mRes] = await Promise.all([API.get("/teams"), API.get("/users/managers")]);
        setTeams(tRes.data || []);
        setManagers(mRes.data || []);
      } catch (err) {
        console.error("Error fetching teams/managers:", err);
        setError("Failed to load teams/managers.");
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }
    if (!managerId) {
      setError("Please select a manager");
      return;
    }

    setLoading(true);
    try {
      // Convert date to ISO format if it exists
      const processedDeadline = deadline ? new Date(deadline).toISOString() : null;
      
      await API.post("/projects", {
        project_name: projectName,
        description,
        team_id: teamId,
        manager_id: managerId,
        status,
        deadline: processedDeadline, // Send as deadline
      });

      setLoading(false);
      setToast({ show: true, message: 'Project created successfully!', type: 'success' });
      setTimeout(() => navigate("/projects"), 2000);
    } catch (err) {
      console.error(err);
      setError("Failed to create project.");
      setLoading(false);
    }
  };

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
          
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Create New Project</h1>
          <p className="text-slate-500 text-sm mt-1">Start a new project and assign responsibilities</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

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
                    placeholder="e.g. Website Redesign"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    required
                    />
                </div>
              </div>

              {/* Status */}
              <div className="col-span-2 md:col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                  Initial Status
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                        <FiCheckCircle size={18} />
                    </span>
                    <select
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    >
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
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
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    required
                    >
                    <option value="">Select Manager</option>
                    {managers.map((m) => (
                        <option key={m._id} value={m._id}>
                        {m.name}
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
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
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
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={deadline} 
                    onChange={(e) => setDeadline(e.target.value)} 
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
                placeholder="Enter project description..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => navigate("/projects")}
                className="flex-1 px-6 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-semibold bg-white hover:bg-slate-50 transition shadow-sm"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? "Creating..." : (
                    <>
                        <FiPlus size={18} />
                        Create Project
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

export default AddProject;