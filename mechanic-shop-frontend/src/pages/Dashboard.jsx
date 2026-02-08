/**
 * Dashboard Page
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { serviceTicketAPI, mechanicAPI, inventoryAPI } from '../services/api.service';
import './Dashboard.css';

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return '#3498db';
      case 'In Progress':
        return '#f39c12';
      case 'Completed':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Welcome back, {customer?.first_name}!</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalTickets}</div>
          <div className="stat-label">Total Tickets</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.openTickets}</div>
          <div className="stat-label">Open</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.inProgressTickets}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.completedTickets}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="recent-tickets">
        <h2>Recent Tickets</h2>
        {tickets.length === 0 ? (
          <p className="no-data">No tickets yet. Create your first service ticket!</p>
        ) : (
          <div className="tickets-list">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="ticket-card">
                <div className="ticket-header">
                  <span className="ticket-id">#{ticket.id.substring(0, 8)}</span>
                  <span 
                    className="ticket-status"
                    style={{ backgroundColor: getStatusColor(ticket.status) }}
                  >
                    {ticket.status}
                  </span>
                </div>
                <p className="ticket-description">{ticket.description}</p>
                <div className="ticket-footer">
                  <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                  {ticket.assigned_mechanics?.length > 0 && (
                    <span>Assigned: {ticket.assigned_mechanics.length} mechanic(s)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
