import React, { useState, useEffect } from "react";

const EditProfileModal = ({ isOpen, onClose, emp, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    employeeId: "",
    email: "",
    phone: "",
    joining_date: "",
    department: "",
    designation: "",
    location: "",
    dob: "",
    gender: "",
  });

  useEffect(() => {
    if (emp) {
      setFormData({
        name: emp.name || "",
        employeeId: emp.employeeId || "",
        email: emp.email || "",
        phone: emp.phone || "",
        joining_date: emp.joining_date || "",
        department: emp.department || "",
        designation: emp.designation || "",
        location: emp.location || "",
        dob: emp.dob || "",
        gender: emp.gender || "",
      });
    }
  }, [emp]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitHandler = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    // Changed inset-0 to inset-x-0 and added specific top and bottom values
    <div className="fixed inset-x-0 top-4 bottom-4 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl space-y-6 max-h-full overflow-y-auto">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">
          Edit Profile
        </h2>

        {/* EMPLOYEE ID */}
        <div>
          <label className="font-semibold">Employee ID</label>
          <input 
            type="text" 
            name="employeeId"
            value={formData.employeeId} 
            onChange={handleChange}
            className="w-full p-3 bg-white-200 rounded" 
            readOnly 
          />
        </div>

        {/* FULL NAME + EMAIL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold">Full Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              className="w-full p-3 border rounded" 
            />
          </div>
          <div>
            <label className="font-semibold">Email</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              className="w-full p-3 border rounded" 
            />
          </div>
        </div>

        {/* PHONE + GENDER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold">Phone Number</label>
            <input 
              type="text" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              className="w-full p-3 border rounded" 
            />
          </div>
          <div>
            <label className="font-semibold">Gender</label>
            <select 
              name="gender" 
              value={formData.gender} 
              onChange={handleChange} 
              className="w-full p-3 border rounded bg-white"
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* DOB + Date of Joining */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold">Date of Birth</label>
            <input 
              type="date" 
              name="dob" 
              value={formData.dob} 
              onChange={handleChange} 
              className="w-full p-3 border rounded" 
            />
          </div>
          <div>
            <label className="font-semibold">Date of Joining</label>
            <input 
              type="date" 
              name="joining_date" 
              value={formData.joining_date} 
              onChange={handleChange} 
              className="w-full p-3 border rounded" 
            />
          </div>
        </div>

        {/* DEPARTMENT + DESIGNATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold">Department</label>
            <input 
              type="text" 
              name="department" 
              value={formData.department} 
              onChange={handleChange} 
              className="w-full p-3 border rounded" 
            />
          </div>
          <div>
            <label className="font-semibold">Designation</label>
            <input 
              type="text" 
              name="designation" 
              value={formData.designation} 
              onChange={handleChange} 
              className="w-full p-3 border rounded" 
            />
          </div>
        </div>

        {/* LOCATION */}
        <div>
          <label className="font-semibold">Location</label>
          <input 
            type="text" 
            name="location" 
            value={formData.location} 
            onChange={handleChange} 
            className="w-full p-3 border rounded" 
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={submitHandler}
            className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-white text-blue-600 border-2 border-blue-600 font-semibold py-3 rounded-lg hover:bg-blue-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;














// import React, { useState, useEffect } from "react";

// const EditProfileModal = ({ isOpen, onClose, emp, onSave }) => {
//   const [formData, setFormData] = useState({
//     name: "",
//     employeeId: "",
//     email: "",
//     phone: "",
//     joining_date: "",
//     department: "",
//     designation: "",
//     location: "",
//     dob: "",
//     gender: "",
//   });

//   useEffect(() => {
//     if (emp) {
//       setFormData({
//         name: emp.name || "",
//         employeeId: emp.employeeId || "",
//         email: emp.email || "",
//         phone: emp.phone || "",
//         joining_date: emp.joining_date || "",
//         department: emp.department || "",
//         designation: emp.designation || "",
//         location: emp.location || "",
//         dob: emp.dob || "",
//         gender: emp.gender || "",
//       });
//     }
//   }, [emp]);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const submitHandler = () => {
//     onSave(formData);
//     onClose();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
//       <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl space-y-6">
//         <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">
//           Edit Profile
//         </h2>

//         {/* EMPLOYEE ID */}
//         <div>
//           <label className="font-semibold">Employee ID</label>
//           <input 
//             type="text" 
//             name="employeeId"
//             value={formData.employeeId} 
//             onChange={handleChange}
//             className="w-full p-3 bg-gray-200 rounded" 
//             readOnly 
//           />
//         </div>

//         {/* FULL NAME + EMAIL */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <label className="font-semibold">Full Name</label>
//             <input 
//               type="text" 
//               name="name" 
//               value={formData.name} 
//               onChange={handleChange} 
//               className="w-full p-3 border rounded" 
//             />
//           </div>
//           <div>
//             <label className="font-semibold">Email</label>
//             <input 
//               type="email" 
//               name="email" 
//               value={formData.email} 
//               onChange={handleChange} 
//               className="w-full p-3 border rounded" 
//             />
//           </div>
//         </div>

//         {/* PHONE + GENDER */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <label className="font-semibold">Phone Number</label>
//             <input 
//               type="text" 
//               name="phone" 
//               value={formData.phone} 
//               onChange={handleChange} 
//               className="w-full p-3 border rounded" 
//             />
//           </div>
//           <div>
//             <label className="font-semibold">Gender</label>
//             <select 
//               name="gender" 
//               value={formData.gender} 
//               onChange={handleChange} 
//               className="w-full p-3 border rounded bg-white"
//             >
//               <option value="">Select gender</option>
//               <option value="Male">Male</option>
//               <option value="Female">Female</option>
//               <option value="Other">Other</option>
//             </select>
//           </div>
//         </div>

//         {/* DOB + Date of Joining */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <label className="font-semibold">Date of Birth</label>
//             <input 
//               type="date" 
//               name="dob" 
//               value={formData.dob} 
//               onChange={handleChange} 
//               className="w-full p-3 border rounded" 
//             />
//           </div>
//           <div>
//             <label className="font-semibold">Date of Joining</label>
//             <input 
//               type="date" 
//               name="joining_date" 
//               value={formData.joining_date} 
//               onChange={handleChange} 
//               className="w-full p-3 border rounded" 
//             />
//           </div>
//         </div>

//         {/* DEPARTMENT + DESIGNATION */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <label className="font-semibold">Department</label>
//             <input 
//               type="text" 
//               name="department" 
//               value={formData.department} 
//               onChange={handleChange} 
//               className="w-full p-3 border rounded" 
//             />
//           </div>
//           <div>
//             <label className="font-semibold">Designation</label>
//             <input 
//               type="text" 
//               name="designation" 
//               value={formData.designation} 
//               onChange={handleChange} 
//               className="w-full p-3 border rounded" 
//             />
//           </div>
//         </div>

//         {/* LOCATION */}
//         <div>
//           <label className="font-semibold">Location</label>
//           <input 
//             type="text" 
//             name="location" 
//             value={formData.location} 
//             onChange={handleChange} 
//             className="w-full p-3 border rounded" 
//           />
//         </div>

//         <div className="flex gap-4">
//           <button
//             onClick={submitHandler}
//             className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
//           >
//             Save Changes
//           </button>
//           <button
//             onClick={onClose}
//             className="flex-1 bg-white text-blue-600 border-2 border-blue-600 font-semibold py-3 rounded-lg hover:bg-blue-50 transition"
//           >
//             Cancel
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EditProfileModal;