import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/auth/Login';
import Dashboard from './components/Dashboard';
import ProfilePage from './components/ProfilePage';
import Employees from './components/Employees';
import AddEmployee from './components/AddEmployee';
import EditEmployee from './components/EditEmployee';
import Team from './pages/Team'
import AddTeam from './pages/AddTeam';
import EditTeam from './pages/EditTeam';
import Project from './pages/Project';
import Tickets from './pages/Tasks';
import AddTask from './pages/AddTask';
import EditTask from './pages/EditTask'; // Added this import
import MyTickets from './pages/MyTasks';
import Attendance from './pages/Attendance';
import Leave from './pages/Leave';
import AddProject from './pages/AddProject';
import EditProject from './pages/EditProject';
                                                                  
function App() {  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/add-employee" element={<AddEmployee />} />
        <Route path="/edit-employee/:id" element={<EditEmployee />} />
        <Route path="/team" element={<Team />}/>
        <Route path="/add-team" element={<AddTeam />}/>
        <Route path="/edit-team/:id" element={<EditTeam />}/>
        <Route path="/projects" element={<Project />}/>
        <Route path="/tasks" element={<Tickets />}/>
        <Route path="/add-task" element={<AddTask />}/> {/* Fixed path */}
        <Route path="/edit-task/:id" element={<EditTask />}/> {/* Added this route */}
        <Route path="/my-tasks" element={<MyTickets />}/>
        <Route path="/attendance" element={<Attendance />}/>
        <Route path="/leave" element={<Leave />}/>
        <Route path="/add-project" element={<AddProject />}/>
        <Route path="/edit-project/:id" element={<EditProject />}/>
      </Routes>
    </Router>
  );
}

export default App;
