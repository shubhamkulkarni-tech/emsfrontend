import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import { socket } from "./socket.js";

// Pages Import
import Login from "./components/auth/Login";
import Dashboard from "./components/Dashboard";
import ProfilePage from "./components/ProfilePage";
import Employees from "./components/Employees";
import AddEmployee from "./components/AddEmployee";
import EditEmployee from "./components/EditEmployee";
import Team from "./pages/Team";
import AddTeam from "./pages/AddTeam";
import EditTeam from "./pages/EditTeam";
import Project from "./pages/Project";
import Tickets from "./pages/Tasks";
import AddTask from "./pages/AddTask";
import EditTask from "./pages/EditTask";
import MyTickets from "./pages/MyTasks";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import AddProject from "./pages/AddProject";
import EditProject from "./pages/EditProject";
import EmployeeKYC from "./pages/EmployeeKYC";
import AdminKYCVerify from "./components/AdminKYCVerify";
import MissingKycEmployees from "./components/MissingKycEmployees";
import ChatPage from "./pages/ChatPage";

// ✅ Correct Layout Component
const PageLayout = ({ children }) => {
  return (
    <div className="h-screen flex flex-col">
      <Navbar />

      {/* ✅ Scroll allowed for all pages */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};


function App() {
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    // ✅ Connect socket only when user is logged in
    if (user?._id) {
      socket.connect(); // ✅ IMPORTANT (autoConnect:false hai)

      socket.emit("join", user._id);
      console.log("✅ Socket Connected + Joined room:", user._id);
    }

    // ✅ Listen online users (optional)
    socket.on("onlineUsers", (users) => {
      console.log("🟢 Online users:", users);
    });

    // ✅ Notification
    socket.on("notification:new", (data) => {
      console.log("🔔 New notification:", data);
    });

    // ✅ Chat Receive
    socket.on("chat:receiveMessage", (msg) => {
      console.log("💬 New message:", msg);
    });

    return () => {
      socket.off("onlineUsers");
      socket.off("notification:new");
      socket.off("chat:receiveMessage");

      // ✅ Optional: Disconnect socket when app unmounts
      socket.disconnect();
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* ✅ Login Page */}
        <Route path="/" element={<Login />} />

        {/* ✅ Pages with Navbar */}
        <Route
          path="/dashboard"
          element={
            <PageLayout>
              <Dashboard />
            </PageLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <PageLayout>
              <ProfilePage />
            </PageLayout>
          }
        />
        <Route
          path="/employees"
          element={
            <PageLayout>
              <Employees />
            </PageLayout>
          }
        />
        <Route
          path="/add-employee"
          element={
            <PageLayout>
              <AddEmployee />
            </PageLayout>
          }
        />
        <Route
          path="/edit-employee/:id"
          element={
            <PageLayout>
              <EditEmployee />
            </PageLayout>
          }
        />

        <Route
          path="/team"
          element={
            <PageLayout>
              <Team />
            </PageLayout>
          }
        />
        <Route
          path="/add-team"
          element={
            <PageLayout>
              <AddTeam />
            </PageLayout>
          }
        />
        <Route
          path="/edit-team/:id"
          element={
            <PageLayout>
              <EditTeam />
            </PageLayout>
          }
        />

        <Route
          path="/projects"
          element={
            <PageLayout>
              <Project />
            </PageLayout>
          }
        />
        <Route
          path="/add-project"
          element={
            <PageLayout>
              <AddProject />
            </PageLayout>
          }
        />
        <Route
          path="/edit-project/:id"
          element={
            <PageLayout>
              <EditProject />
            </PageLayout>
          }
        />

        <Route
          path="/tasks"
          element={
            <PageLayout>
              <Tickets />
            </PageLayout>
          }
        />
        <Route
          path="/add-task"
          element={
            <PageLayout>
              <AddTask />
            </PageLayout>
          }
        />
        <Route
          path="/edit-task/:id"
          element={
            <PageLayout>
              <EditTask />
            </PageLayout>
          }
        />
        <Route
          path="/my-tasks"
          element={
            <PageLayout>
              <MyTickets />
            </PageLayout>
          }
        />

        <Route
          path="/attendance"
          element={
            <PageLayout>
              <Attendance />
            </PageLayout>
          }
        />
        <Route
          path="/leave"
          element={
            <PageLayout>
              <Leave />
            </PageLayout>
          }
        />

        {/* ✅ Chat Page */}
        <Route
          path="/chat"
          element={
            <PageLayout>
              <ChatPage />
            </PageLayout>
          }
        />

        {/* ✅ KYC Pages */}
        <Route
          path="/employees/:employeeId/kyc"
          element={
            <PageLayout>
              <EmployeeKYC />
            </PageLayout>
          }
        />
        <Route
          path="/admin/kyc"
          element={
            <PageLayout>
              <AdminKYCVerify />
            </PageLayout>
          }
        />
        <Route
          path="/admin/missing-kyc"
          element={
            <PageLayout>
              <MissingKycEmployees />
            </PageLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
