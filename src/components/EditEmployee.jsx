import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Toast from "./Toast";
import { 
  FiUser, FiMail, FiPhone, FiCalendar, FiMapPin, FiEye, FiEyeOff, // FIX: Using FiEyeOff
  FiCamera, FiX, FiBriefcase, FiShield, FiAward, FiChevronDown, FiSave 
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

// --- DATA LISTS (Based on user input) ---
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
  "Marketing Manager", "Sales Manager", "Operations Executive", "HR Manager", "Finance Manager", "Legal Manager",
  "Customer Success Manager"
];

// Role options for dropdown
const roles = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "hr", label: "HR" },
  { value: "employee", label: "Employee" }
];

// --- ROLE COLORS ---
const roleColors = {
  ADMIN: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  HR: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  EMPLOYEE: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  MANAGER: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  DEFAULT: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
};

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- State ---
  const [formData, setFormData] = useState({
    name: "", email: "", role: "", department: "", designation: "", phone: "", 
    joining_date: "", dob: "", location: "", address: "", gender: "", password: "" 
  });

  const [profileImage, setProfileImage] = useState("");
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(""); // State to preview NEW file
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [showPassword, setShowPassword] = useState(false);
  
  // Hover State for Submit Button
  const [isHoveringSubmit, setIsHoveringSubmit] = useState(false);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await api.get(`/users/${id}`);
        const data = res.data;
        
        // Pre-fill form data
        setFormData({
          name: data.name || "",
          email: data.email || "",
          role: data.role || "",
          department: data.department || "",
          designation: data.designation || "",
          phone: data.phone || "",
          joining_date: data.joining_date?.slice(0, 10) || "",
          dob: data.dob?.slice(0, 10) || "",
          location: data.location || "",
          address: data.address || "",
          gender: data.gender || "",
          password: "" // Do not pre-fill password
        });
        setProfileImage(data.profileImage || "");
        setLoading(false);
      } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 401) {
          setError("You are not authorized to view this page. Please log in again.");
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError("Failed to load employee data.");
        }
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
    }
  };

  // --- Submit Logic ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!formData.name || !formData.email || !formData.role) {
      setError("Name, Email, and Role are required.");
      return;
    }

    setSubmitting(true);
    const payload = new FormData();
    
    // Append fields
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== "") {
        payload.append(key, formData[key]);
      }
    });
    
    // Append Image if exists
    // Note: We append the NEW file if selected. 
    // If no new file is selected, backend should keep the existing profileImage (as 'profileImage' string isn't in FormData).
    if (file) {
      payload.append('profileImage', file);
    }

    try {
      const response = await api.put(`/users/${id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setToast({ show: true, message: 'Employee updated successfully!', type: 'success' });
      setTimeout(() => navigate('/employees'), 1500);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        setToast({ message: 'You are not authorized to update this employee.', type: 'error' });
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response && err.response.data) {
        // Handle specific error messages from backend
        if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
          setError(`Validation errors: ${err.response.data.errors.join(', ')}`);
          setToast({ 
            message: `Validation errors: ${err.response.data.errors.join(', ')}`, 
            type: 'error' 
          });
        } else {
          setError(err.response.data.message || 'Failed to update employee.');
          setToast({ message: err.response.data.message || 'Failed to update employee.', type: 'error' });
        }
      } else {
        setError('Failed to update employee. Please try again.');
        setToast({ message: 'Failed to update employee. Please try again.', type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl text-blue-700">Loading employee data...</div>
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Edit Employee</h1>
            <p className="text-slate-500 text-sm mt-1">Update employee information and profile</p>
          </div>
          <button
             onClick={() => navigate('/employees')}
             className="text-slate-500 hover:text-slate-700 text-sm font-medium flex items-center gap-1 transition-colors"
          >
             <FiX /> Cancel
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          
          {/* 1. Profile Image & Basic Info */}
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              
              {/* Profile Upload */}
              <div className="flex flex-col items-center md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-3 text-center">Profile Photo</label>
                <div className="relative w-32 h-32 group">
                  <div className="w-full h-full rounded-full border-4 border-slate-100 bg-white flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                    {/* LOGIC: Show Preview of NEW file (imagePreview), otherwise show DB Image (profileImage) */}
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : profileImage ? (
                      <img 
                        src={`https://emsbackend-2w9c.onrender.com${profileImage}`}
                        alt={formData.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FiUser className="text-slate-300" size={40} />
                    )}
                    
                    {/* Camera Icon Overlay */}
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center text-white">
                      <FiCamera size={20} />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Name & Email */}
              <div className="space-y-6 md:col-span-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                    <FiUser size={14} className="text-slate-400"/> Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                    <FiMail size={14} className="text-slate-400"/> Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                    <FiPhone size={14} className="text-slate-400"/> Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
                  <div className="relative">
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all cursor-pointer"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Professional Details */}
          <div className="p-6 md:p-8 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <FiBriefcase size={20} />
               </div>
               <h2 className="text-xl font-bold text-slate-800">Professional Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                     <FiShield size={16} className="text-slate-400"/> Role
                  </label>
                  <div className="relative">
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all cursor-pointer"
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                     <FiAward size={16} className="text-slate-400"/> Designation
                  </label>
                  <div className="relative">
                    <select
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all cursor-pointer"
                    >
                      <option value="">Select Designation</option>
                      {designations.map((desig, index) => (
                        <option key={index} value={desig}>{desig}</option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                     <FiMapPin size={16} className="text-slate-400"/> Department
                  </label>
                  <div className="relative">
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all cursor-pointer"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept, index) => (
                        <option key={index} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="City, Country"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
               </div>
            </div>
          </div>

          {/* 3. Dates & Password */}
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                       <FiCalendar size={14} className="text-slate-400"/> Joining Date
                    </label>
                    <input
                      type="date"
                      name="joining_date"
                      value={formData.joining_date}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                       <FiCalendar size={14} className="text-slate-400"/> Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                 </div>
              </div>
              
              {/* Password Field */}
              <div className="space-y-4">
                 <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                       <FiShield size={14} className="text-slate-400"/> Password (Update only if needed)
                 </label>
                 <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter new password"
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <button
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                       {/* FIX: Use FiEyeOff when password is visible (to hide it), FiEye when hidden */}
                       {showPassword ? <FiEye /> : <FiEyeOff />}
                    </button>
                 </div>
                 <p className="text-xs text-slate-400 mt-1">Leave blank to keep current password.</p>
              </div>
            </div>
          </div>

          {/* 4. Address */}
          <div className="p-6 md:p-8 border-b border-slate-100">
             <label className="block text-sm font-semibold text-slate-700 mb-2">Full Address</label>
             <textarea
               name="address"
               value={formData.address}
               onChange={handleChange}
               rows="3"
               placeholder="Street address, City, Zip Code..."
               className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
             />
          </div>

          {/* Footer Actions */}
          <div className="px-6 md:px-8 py-6 bg-white border-t border-slate-100 flex justify-end gap-3">
             <button
               type="button"
               onClick={() => navigate('/employees')}
               className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all"
             >
               Cancel
             </button>
             <button
               type="submit"
               disabled={submitting}
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
               <span>{submitting ? "Updating..." : "Update Employee"}</span>
             </button>
          </div>
        </form>
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

export default EditEmployee;