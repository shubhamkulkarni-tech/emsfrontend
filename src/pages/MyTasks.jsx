import React, { useEffect, useState } from "react";
import axios from "axios";

import Footer from "../components/Footer";
import { FiClock, FiUser, FiCalendar } from "react-icons/fi";

const statusColors = {
  "Pending": "bg-yellow-500",
  "In Progress": "bg-blue-500",
  "Completed": "bg-green-500",
};

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadMyTickets = async () => {
      try {
        const res = await axios.get(`https://emsbackend-2w9c.onrender.com/api/tasks/my-tasks/${user.employeeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTickets(res.data);
        setFilteredTickets(res.data);
      } catch (err) {
        console.error("Error loading my tickets:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.employeeId) {
      loadMyTickets();
    }
  }, [user?.employeeId, token]);

  useEffect(() => {
    let filtered = [...tickets];
    
    if (search) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(search.toLowerCase()) ||
        ticket.status.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }
    
    setFilteredTickets(filtered);
  }, [search, statusFilter, tickets]);

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      await axios.patch(`/api/tasks/${ticketId}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTickets(prev => prev.map(ticket => 
        ticket._id === ticketId ? { ...ticket, status: newStatus } : ticket
      ));
    } catch (err) {
      console.error("Error updating ticket status:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100">
      

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl font-extrabold text-blue-700">My Tickets</h1>

          <div className="flex gap-3 flex-col sm:flex-row w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search tickets..."
              className="px-4 py-2 rounded-full shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1 sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="In Review">In Review</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <p className="text-gray-600 text-center text-lg mt-10">
            No tickets assigned to you.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredTickets.map((ticket, index) => (
              <div
                key={ticket._id}
                className="bg-white rounded-3xl shadow-md p-6 flex flex-col items-center text-center border border-blue-200 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fadeIn"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-28 h-28 rounded-full overflow-hidden mb-4 border-4 border-blue-200 shadow-sm bg-blue-400 flex items-center justify-center">
                  <FiClock className="text-white text-4xl" />
                </div>

                <h2 className="text-2xl font-semibold text-blue-700">{ticket.title}</h2>
                <span
                  className={`text-white px-3 py-1 rounded-full mt-1 ${
                    statusColors[ticket.status] || "bg-gray-500"
                  }`}
                >
                  {ticket.status}
                </span>

                <p className="text-gray-500 text-sm mt-2">
                  Priority: {ticket.priority}
                </p>
                <p className="text-gray-500 text-sm">
                  {ticket.deadline || "No deadline"}
                </p>

                <div className="flex flex-col items-center mt-3 gap-1">
                  <div className="flex items-center gap-1 text-gray-600 text-sm">
                    <FiUser /> {user.name}
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 text-sm">
                    <FiCalendar /> {ticket.deadline || "No deadline"}
                  </div>
                </div>

                <div className="mt-4 w-full">
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={ticket.status}
                    onChange={(e) => updateTicketStatus(ticket._id, e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MyTickets;