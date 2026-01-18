import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // <--- THIS WAS MISSING
import Logo from '../../assets/logo.png';
import { FiLock, FiBriefcase, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import Navbar from '../Navbar';
import Footer from '../../components/shared/Footer';

const Login = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('https://emsbackend-2w9c.onrender.com/api/users/login', {
        employeeId,
        password,
        role,
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.user.role);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // --- CRITICAL FIX FOR 10 MIN EXPIRY ---
      // Note: Setting token expiry is handled server-side in modern apps.
      // For this client-side implementation, we rely on the backend's response.
      // const expiryTime = Date.now() + (10 * 60 * 1000); 
      // localStorage.setItem('tokenExpiry', expiryTime.toString());
      // -----------------------------------------

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-x-hidden">
        <div className="flex w-full max-w-5xl bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden transform transition-all duration-500">
          
          {/* Left Section: Login Form */}
          <div className="w-full md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
            <div className="mb-8 flex items-center justify-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center animate-[bounce_1s_infinite] hover:scale-110 transition-transform duration-300">
                    <img src={Logo} alt="Company Logo" className="w-10 h-10 object-contain" />
                </div>
            </div>

            <h1 className="text-3xl font-bold text-slate-800 tracking-tight text-center mb-2">Welcome Back</h1>
            <p className="text-slate-500 text-center text-sm mb-8">Please sign in to your account</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Employee ID */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                  Employee ID
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                        <FiLock size={18} />
                    </span>
                    <input
                        type="text"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="Enter Employee ID"
                        required
                    />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                  Password
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                        <FiLock size={18} />
                    </span>
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="Enter Password"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                    Login As
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['admin', 'employee', 'hr', 'manager'].map((r) => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className={`px-4 py-3 rounded-xl border font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md ${
                                role === r 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md hover:shadow-lg' 
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-slate-100'
                            }`}
                        >
                            <FiBriefcase size={16} />
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                    ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <>
                        <span>Sign In</span>
                        <FiArrowRight size={18} />
                    </>
                )}
              </button>
            </form>

            <div className="text-center mt-6">
                <p className="text-sm text-slate-500">Don't have an account?</p>
                <button className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline">Contact HR</button>
            </div>
          </div>

          {/* Right Section: Decorative */}
          <div className="hidden md:flex w-2/5 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute inset-0 bg-black opacity-20"></div>
            
            <div className="relative z-10 h-full flex flex-col justify-center items-center p-12 text-white text-center">
                <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20 mb-8">
                      <img src={Logo} alt="Logo" className="w-24 h-auto mx-auto mb-4 opacity-90" />
                      <h2 className="text-3xl font-bold tracking-tight">Wordlane Tech</h2>
                      <p className="text-blue-100 text-sm opacity-80 mt-2">Employee Management System</p>
                </div>
                
                <div className="space-y-6 max-w-md mx-auto">
                    <div className="flex items-center gap-3 text-blue-100">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                          <span className="text-sm font-medium">Secure Login</span>
                    </div>
                    <div className="flex items-center gap-3 text-blue-100">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                          <span className="text-sm font-medium">Fast Access</span>
                    </div>
                    <div className="flex items-center gap-3 text-blue-100">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                          <span className="text-sm font-medium">24/7 Support</span>
                    </div>
                </div>
            </div>

            {/* Decorative Circles */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-slate-500">
            &copy; 2025 Company Name. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Login;