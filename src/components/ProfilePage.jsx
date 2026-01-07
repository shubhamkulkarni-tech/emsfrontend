import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, 
  FiBriefcase, FiLayers
} from "react-icons/fi";

const ProfilePage = () => {
  const [user, setUser] = useState({});

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  // Reusable Detail Field Component
  const DetailField = ({ label, value, icon }) => {
    return (
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div className="flex items-center gap-3 text-slate-400 mb-1">
          {icon}
          <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-slate-800 font-medium">{value}</div>
      </div>
    );
  };

  if (!user || Object.keys(user).length === 0) {
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

      <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-10">
          
          {/* Header */}
          <div className="flex flex-col items-center justify-between mb-8 border-b border-slate-100 pb-6">
            <div className="flex flex-col items-center">
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">My Profile</h1>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-blue-200 mt-1">
                  {user.role || "Employee"}
                </span>
            </div>
          </div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-32 h-32 rounded-full bg-blue-50 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden relative group hover:scale-105 transition-transform duration-300">
              {user.profileImage ? (
                <img
                  src={`https://emsbackend-2w9c.onrender.com${user.profileImage}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-200 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                  </span>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800">{user.name || "Employee Name"}</h2>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Employee ID */}
            <DetailField 
              label="Employee ID" 
              value={user.employeeId || "N/A"} 
              icon={<FiUser size={18} />} 
            />
            
            {/* Email */}
            <DetailField 
              label="Email" 
              value={user.email || "N/A"} 
              icon={<FiMail size={18} />} 
            />
            
            {/* Phone */}
            <DetailField 
              label="Phone" 
              value={user.phone || "N/A"} 
              icon={<FiPhone size={18} />} 
            />
            
            {/* Department */}
            <DetailField 
              label="Department" 
              value={user.department || "N/A"} 
              icon={<FiBriefcase size={18} />} 
            />

            {/* Designation */}
            <DetailField 
              label="Designation" 
              value={user.designation || "N/A"} 
              icon={<FiLayers size={18} />} 
            />
            
            {/* Date of Joining */}
            <DetailField 
              label="Date of Joining" 
              value={user.joining_date ? new Date(user.joining_date).toLocaleDateString() : "N/A"} 
              icon={<FiCalendar size={18} />} 
            />
            
            {/* Location */}
            <DetailField 
              label="Address" 
              value={user.address || "N/A"} 
              icon={<FiMapPin size={18} />} 
            />
            
            {/* Date of Birth */}
            <DetailField 
              label="Date of Birth" 
              value={user.dob ? new Date(user.dob).toLocaleDateString() : "N/A"} 
              icon={<FiCalendar size={18} />} 
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProfilePage;