import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

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

// ✅ Updated PageLayout
// pt-16 = 64px (Exactly Navbar height), so NO GAP.
// Use pt-20 if you want a gap, but pt-16 looks cleaner.
const PageLayout = ({ children }) => {
  return (
    <div className="bg-slate-50 min-h-screen">
      <Navbar />
      {/* ❗ Changed from pt-20 to pt-16 to remove the gap */}
      <div className="pt-4 px-4 sm:px-6 lg:px-8 transition-all duration-300">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route path="/dashboard" element={<PageLayout><Dashboard /></PageLayout>} />
        <Route path="/profile" element={<PageLayout><ProfilePage /></PageLayout>} />
        <Route path="/employees" element={<PageLayout><Employees /></PageLayout>} />
        <Route path="/add-employee" element={<PageLayout><AddEmployee /></PageLayout>} />
        <Route path="/edit-employee/:id" element={<PageLayout><EditEmployee /></PageLayout>} />
        
        <Route path="/team" element={<PageLayout><Team /></PageLayout>} />
        <Route path="/add-team" element={<PageLayout><AddTeam /></PageLayout>} />
        <Route path="/edit-team/:id" element={<PageLayout><EditTeam /></PageLayout>} />
        
        <Route path="/projects" element={<PageLayout><Project /></PageLayout>} />
        <Route path="/add-project" element={<PageLayout><AddProject /></PageLayout>} />
        <Route path="/edit-project/:id" element={<PageLayout><EditProject /></PageLayout>} />
        
        <Route path="/tasks" element={<PageLayout><Tickets /></PageLayout>} />
        <Route path="/add-task" element={<PageLayout><AddTask /></PageLayout>} />
        <Route path="/edit-task/:id" element={<PageLayout><EditTask /></PageLayout>} />
        <Route path="/my-tasks" element={<PageLayout><MyTickets /></PageLayout>} />
        
        <Route path="/attendance" element={<PageLayout><Attendance /></PageLayout>} />
        <Route path="/leave" element={<PageLayout><Leave /></PageLayout>} />
      </Routes>
    </Router>
  );
}

export default App;