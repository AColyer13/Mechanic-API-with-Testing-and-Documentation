/**
 * Dashboard Page - Fully Responsive
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { serviceTicketAPI } from '../services/api.service';

const Dashboard = () => {
  const { customer } = useAuth();
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    completedTickets: 0,
  });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await serviceTicketAPI.getByCustomer(customer.id);
      const ticketsData = response.data;
      
      setTickets(ticketsData.slice(0, 5)); // Show latest 5 tickets
      
      setStats({
        totalTickets: ticketsData.length,
        openTickets: ticketsData.filter(t => t.status === 'Open').length,
        inProgressTickets: ticketsData.filter(t => t.status === 'In Progress').length,
        completedTickets: ticketsData.filter(t => t.status === 'Completed').length,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-500 text-white';
      case 'In Progress':
        return 'bg-orange-500 text-white';
      case 'Completed':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-6 md:mb-8">
          Welcome back, {customer?.first_name}!
        </h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">
              {stats.totalTickets}
            </div>
            <div className="text-sm md:text-base text-gray-600 font-medium">
              Total Tickets
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
              {stats.openTickets}
            </div>
            <div className="text-sm md:text-base text-gray-600 font-medium">
              Open
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">
              {stats.inProgressTickets}
            </div>
            <div className="text-sm md:text-base text-gray-600 font-medium">
              In Progress
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
              {stats.completedTickets}
            </div>
            <div className="text-sm md:text-base text-gray-600 font-medium">
              Completed
            </div>
          </div>
        </div>

        {/* Recent Tickets Section */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 lg:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">
            Recent Tickets
          </h2>
          
          {tickets.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No tickets yet. Create your first service ticket!
            </p>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  className="border border-gray-200 rounded-lg p-4 md:p-6 hover:border-purple-300 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <span className="font-mono text-sm md:text-base text-gray-600 font-medium">
                      #{ticket.id.substring(0, 8)}
                    </span>
                    <span 
                      className={`inline-block px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${getStatusStyle(ticket.status)}`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  
                  <p className="text-sm md:text-base text-gray-700 mb-3">
                    {ticket.description}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-gray-500">
                    <span>
                      Created: {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                    {ticket.assigned_mechanics?.length > 0 && (
                      <span>
                        Assigned: {ticket.assigned_mechanics.length} mechanic(s)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
