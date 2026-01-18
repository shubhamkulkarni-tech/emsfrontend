import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Footer from "./Footer";
import Toast from "./Toast";
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiEye, 
  FiCamera, FiX, FiBriefcase, FiShield, FiCheck, FiCalendar, FiLock
} from "react-icons/fi";

// --- AESTHETIC CONSTANTS ---
const roleColors = {
  ADMIN: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  HR: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  EMPLOYEE: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  MANAGER: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  DEFAULT: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
};

const departments = [
  "Engineering", "HR", "Finance", "Marketing", "Sales", "Operations", "IT Support",
  "Customer Service", "Logistics", "Legal", "Procurement", "R&D", "Quality", "Admin",
  "Production", "Maintenance", "Design", "Training", "Compliance", "Analytics",
  "Strategy", "Security", "Public Relations", "Facilities", "Health & Safety",
  "UX/UI", "Data Science", "Content", "Business Development", "Innovation"
];

const designations = [
  "Manager", "Senior Engineer", "Junior Engineer", "Intern", "Team Lead", "HR Executive",
  "Finance Analyst", "Marketing Specialist", "Sales Associate", "Operations Manager",
  "IT Support Engineer", "Customer Support Rep", "Logistics Coordinator", "Legal Advisor",
  "Procurement Officer", "R&D Scientist", "Quality Analyst", "Admin Assistant",
  "Production Supervisor", "Maintenance Technician", "Designer", "Trainer",
  "Compliance Officer", "Data Analyst", "Strategy Consultant", "Security Officer",
  "PR Executive", "Facilities Manager", "Safety Officer", "Content Writer",
  "Business Developer", "Innovation Lead", "UX Designer", "UI Designer", "Data Engineer",
  "Product Manager", "Software Engineer", "Network Engineer", "Cloud Engineer", "DevOps Engineer",
  "Database Admin", "AI Specialist", "Machine Learning Engineer", "Cybersecurity Analyst",
  "Marketing Manager", "Sales Manager", "Operations Executive", "HR Manager", "Finance Manager",
  "Legal Manager", "Customer Success Manager"
];

const roles = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "hr", label: "HR" },
  { value: "employee", label: "Employee" }
];

// --- AXIOS INSTANCE ---
const api = axios.create({
  baseURL: "https://emsbackend-2w9c.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AddEmployee = () => {
  const navigate = useNavigate();  
  // --- State ---
  const [formData, setFormData] = useState({
    employeeId: "", 
    name: "", email: "", role: "", department: "", designation: "", phone: "", 
    joining_date: "", dob: "", location: "", address: "", gender: "", password: ""
  });
  
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false); 
  
  // Hover State for Buttons
  const [isHoveringSubmit, setIsHoveringSubmit] = useState(false);

  // --- HELPER: Robust Date Formatter (DD-MM-YYYY) ---
  // Uses string splitting to avoid "Invalid Date" and Timezone issues
  const formatDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return "-";
    // Expects YYYY-MM-DD (standard HTML date input format)
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      // Returns DD-MM-YYYY
      return `${day}-${month}-${year}`;
    }
    // Fallback for unexpected formats
    return dateStr; 
  };

  // --- Generate Employee ID Logic ---
  useEffect(() => {
    if (formData.joining_date) {
      const parts = formData.joining_date.split('-');
      // Only generate if we have a valid YYYY-MM-DD structure
      if (parts.length === 3) {
        const yy = parts[0].slice(-2);
        const mm = parts[1];
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const newId = `${yy}${mm}${randomDigits}`;
        setFormData(prev => ({ ...prev, employeeId: newId }));
      }
    }
  }, [formData.joining_date]);

  // --- Handlers ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  // --- Validation & Open Modal ---
  const handleOpenConfirm = (e) => {
    e.preventDefault();
    
    if (!formData.employeeId || !formData.name || !formData.email || !formData.role || !formData.password) {
      setToast({ show: true, message: "Please fill in all required fields.", type: "error" });
      return;
    }
    setShowConfirmModal(true);
  };

  // --- Final Submit Logic ---
  const handleSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    
    const payload = new FormData();
    
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== "") {
        payload.append(key, formData[key]);
      }
    });
    
    if (file) {
      payload.append('profileImage', file);
    }

    try {
      await api.post("/users/register", payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setToast({ show: true, message: 'Employee added successfully!', type: 'success' });
      setTimeout(() => navigate('/employees'), 1500);
    } catch (err) {
      console.error(err);
      setToast({ message: err.response?.data?.message || 'Failed to add employee.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">

        <div className="flex-1 flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  // Helper for Detail Rows in Modal
  const DetailRow = ({ label, value }) => (
    <div className="flex justify-between py-3 border-b border-slate-50 last:border-0">
      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</span>
      <span className="text-slate-800 text-sm font-medium text-right truncate max-w-[60%]">{value || "-"}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      

      <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Add New Employee</h1>
            <p className="text-slate-500 text-sm mt-1">Fill in the details to onboard a new team member</p>
          </div>
          <button
             onClick={() => navigate('/employees')}
             className="text-slate-500 hover:text-slate-700 text-sm font-medium flex items-center gap-1 transition-colors px-4 py-2 rounded-lg hover:bg-slate-100"
          >
             <FiX /> Cancel
          </button>
        </div>
        
        <form onSubmit={handleOpenConfirm} className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          
          {/* 1. Profile Image & Basic Info */}
          <div className="p-6 md:p-8 border-b border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              
              {/* Profile Upload */}
              <div className="flex flex-col items-center md:col-span-1">
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Profile Photo</label>
                 <div className="relative w-32 h-32 group cursor-pointer">
                    <div className="w-full h-full rounded-2xl border-4 border-slate-100 shadow-sm bg-white flex items-center justify-center overflow-hidden group-hover:shadow-md transition-all">
                      {file ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <FiUser className="text-slate-300" size={40} />
                      )}
                    </div>
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center text-white rounded-2xl">
                       <FiCamera size={20} />
                       <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                 </div>
              </div>

              {/* Name, Email & ID */}
              <div className="space-y-5 md:col-span-2">
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                   <input type="text" name="name" value={formData.name} onChange={handleChange}
                      placeholder="Enter full name" required
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                      placeholder="name@company.com" required
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Employee ID</label>
                       <div className="flex">
                          <input type="text" value={formData.employeeId} readOnly
                            className="w-full px-4 py-3.5 rounded-l-xl border border-slate-200 bg-slate-100 text-slate-500 font-mono text-sm cursor-not-allowed"
                            placeholder="Select Joining Date"
                          />
                          <span className="bg-blue-50 text-blue-600 border border-l-0 border-slate-200 rounded-r-xl px-4 flex items-center justify-center">
                            <FiCalendar size={18} />
                          </span>
                       </div>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Professional Details */}
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/30">
             <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FiBriefcase size={18} /></div>
               <h2 className="text-lg font-bold text-slate-800">Professional Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Role</label>
                  <div className="relative">
                    <select name="role" value={formData.role} onChange={handleChange} required
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all text-sm cursor-pointer"
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (<option key={role.value} value={role.value}>{role.label}</option>))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none border-l border-slate-400 rounded-sm ml-2"></div>
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Department</label>
                  <div className="relative">
                    <select name="department" value={formData.department} onChange={handleChange}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all text-sm cursor-pointer"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept, index) => (<option key={index} value={dept}>{dept}</option>))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none border-l border-slate-400 rounded-sm ml-2"></div>
                  </div>
               </div>
            </div>
             <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Designation</label>
                    <div className="relative">
                      <select name="designation" value={formData.designation} onChange={handleChange}
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all text-sm cursor-pointer"
                      >
                        <option value="">Select Designation</option>
                        {designations.map((desig, index) => (<option key={index} value={desig}>{desig}</option>))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none border-l border-slate-400 rounded-sm ml-2"></div>
                  </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Location</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange}
                      placeholder="City, Country"
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                 </div>
            </div>
          </div>

          {/* 3. Contact & Personal */}
          <div className="p-6 md:p-8 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-green-100 text-green-600 rounded-lg"><FiPhone size={18} /></div>
               <h2 className="text-lg font-bold text-slate-800">Contact & Personal</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
               </div>
               <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gender</label>
                    <div className="relative">
                       <select name="gender" value={formData.gender} onChange={handleChange}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all text-sm cursor-pointer"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none border-l border-slate-400 rounded-sm ml-2"></div>
                    </div>
               </div>
               <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Date of Joining</label>
                    <input type="date" name="joining_date" value={formData.joining_date} onChange={handleChange} required
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
               </div>
               <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Date of Birth</label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
               </div>
            </div>
          </div>

          {/* 4. Security */}
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><FiShield size={18} /></div>
               <h2 className="text-lg font-bold text-slate-800">Security & Address</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="md:col-span-2">
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Residential Address</label>
                   <textarea name="address" value={formData.address} onChange={handleChange} rows="2"
                         placeholder="Street address, City, Zip Code..."
                         className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm"
                   />
               </div>
               <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                  <div className="relative max-w-md">
                        <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange}
                          placeholder="Set initial password" required
                          className="w-full px-4 py-3.5 pr-10 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                             className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                          >
                             <FiEye size={18} />
                        </button>
                  </div>
               </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 md:px-8 py-6 bg-white border-t border-slate-100 flex justify-end gap-3">
             <button type="button" onClick={() => navigate('/employees')}
               className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all text-sm"
             >
               Cancel
             </button>
             <button type="submit"
               disabled={submitting}
               onMouseEnter={() => setIsHoveringSubmit(true)}
               onMouseLeave={() => setIsHoveringSubmit(false)}
               style={{
                  backgroundColor: isHoveringSubmit ? 'rgb(255, 172, 28)' : 'rgb(37, 99, 235)', 
                  color: '#ffffff',
                  boxShadow: isHoveringSubmit ? '0 10px 15px -3px rgba(255, 172, 28, 0.4)' : '0 10px 15px -3px rgba(37, 99, 235, 0.4)',
                  transform: isHoveringSubmit ? 'translateY(-2px)' : 'translateY(0)'
               }}
               className="h-full px-8 py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold border border-transparent transition-all duration-300 ease-out text-sm"
             >
               <span>Review & Add Employee</span>
             </button>
          </div>
        </form>
      </div>

      {/* --- CONFIRMATION MODAL (Team Style UI) --- */}
      {showConfirmModal && (
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
                   <FiUser size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Confirm Employee Details</h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {formData.employeeId}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500 transition shrink-0"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Body: Split Layout */}
            <div className="flex flex-col lg:flex-row h-full overflow-hidden">
              
              {/* LEFT COLUMN: Summary Sidebar */}
              <div className="w-full lg:w-1/3 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 p-6 flex flex-col items-center text-center shrink-0">
                
                <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden mb-4">
                   {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <FiUser size={40} />
                      </div>
                   )}
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-1">{formData.name || "Employee Name"}</h3>
                
                {formData.role && (
                     <span className={`mb-6 text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wide border ${
                        roleColors[formData.role?.toUpperCase()] ? 
                        `${roleColors[formData.role?.toUpperCase()].bg} ${roleColors[formData.role?.toUpperCase()].text}` :
                        "bg-gray-100 text-gray-700"
                     }`}>
                        {formData.role}
                     </span>
                )}

                <div className="w-full space-y-3 mt-auto">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-center gap-2">
                     <FiMail className="text-slate-400" size={16}/>
                     <span className="text-xs font-semibold text-slate-600 truncate">{formData.email}</span>
                  </div>
                  {/* SAFE DATE DISPLAY */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-center gap-2">
                     <FiCalendar className="text-slate-400" size={16}/>
                     <span className="text-xs font-semibold text-slate-600">{formatDate(formData.joining_date)}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Detailed Fields Grid */}
              <div className="w-full lg:w-2/3 p-6 bg-white flex flex-col h-full overflow-hidden">
                 <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Information Review</h3>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Identity */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                             <DetailRow label="Employee ID" value={formData.employeeId} />
                             <DetailRow label="Full Name" value={formData.name} />
                             <DetailRow label="Email" value={formData.email} />
                             <DetailRow label="Phone" value={formData.phone} />
                        </div>

                        {/* Job */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                             <DetailRow label="Role" value={formData.role} />
                             <DetailRow label="Department" value={formData.department} />
                             <DetailRow label="Designation" value={formData.designation} />
                             <DetailRow label="Location" value={formData.location} />
                        </div>

                        {/* Personal */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                             <DetailRow label="Gender" value={formData.gender} />
                             {/* SAFE DATE DISPLAY */}
                             <DetailRow label="Date of Birth" value={formatDate(formData.dob)} />
                             <DetailRow label="Address" value={formData.address} />
                             {/* SAFE DATE DISPLAY */}
                             <DetailRow label="Date of Joining" value={formatDate(formData.joining_date)} />
                        </div>

                        {/* Security */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                    <FiLock size={16} />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Security</span>
                            </div>
                            <p className="text-xs text-slate-500 mb-1">Password set to:</p>
                            <p className="text-sm font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 truncate">
                                {formData.password}
                            </p>
                            <p className="text-[10px] text-orange-500 mt-2 flex items-center gap-1">
                                <FiShield size={10}/> Ensure that user knows this password.
                            </p>
                        </div>

                    </div>
                 </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-all text-sm"
              >
                Edit Details
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 text-sm"
              >
                <FiCheck size={18} /> Confirm & Add
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
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
export default AddEmployee;
