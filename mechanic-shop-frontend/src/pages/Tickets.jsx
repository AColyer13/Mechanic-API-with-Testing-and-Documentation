/**
 * My Tickets Page
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { serviceTicketAPI } from '../services/api.service';
import './Tickets.css';

const Tickets = () => {
  const { customer } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Open');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await serviceTicketAPI.getByCustomer(customer.id);
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    setUpdatingId(ticketId);
    try {
      await serviceTicketAPI.update(ticketId, { status: newStatus });
      // Refresh tickets after update
      const response = await serviceTicketAPI.getByCustomer(customer.id);
      setTickets(response.data);
    } catch (error) {
      console.error('Error updating ticket status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'Open':
        return 'In Progress';
      case 'In Progress':
        return 'Completed';
      case 'Completed':
        return 'Open';
      default:
        return 'Open';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

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
    return <div className="loading">Loading tickets...</div>;
  }

  return (
    <div className="tickets-container">
      <div className="tickets-header">
        <h1>My Service Tickets</h1>
        <Link to="/create-ticket" className="btn-create">
          + New Ticket
        </Link>
      </div>

      <div className="filter-buttons">
        <button 
          className={filter === 'Open' ? 'active' : ''}
          onClick={() => setFilter('Open')}
        >
          Open ({tickets.filter(t => t.status === 'Open').length})
        </button>
        <button 
          className={filter === 'In Progress' ? 'active' : ''}
          onClick={() => setFilter('In Progress')}
        >
          In Progress ({tickets.filter(t => t.status === 'In Progress').length})
        </button>
        <button 
          className={filter === 'Completed' ? 'active' : ''}
          onClick={() => setFilter('Completed')}
        >
          Completed ({tickets.filter(t => t.status === 'Completed').length})
        </button>
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({tickets.length})
        </button>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="no-tickets">
          <p>No tickets found with status: {filter}</p>
          <Link to="/create-ticket" className="btn-create">Create your first ticket</Link>
        </div>
      ) : (
        <div className="tickets-grid">
          {filteredTickets.map((ticket) => (
            <div key={ticket.id} className="ticket-detail-card">
              <div className="ticket-header">
                <span className="ticket-id">#{ticket.id.substring(0, 8)}</span>
                <span 
                  className="ticket-status"
                  style={{ backgroundColor: getStatusColor(ticket.status) }}
                >
                  {ticket.status}
                </span>
              </div>
              
              <div className="ticket-body">
                <div className="ticket-section">
                  <h4>Vehicle Information</h4>
                  <ul>
                    {(ticket.vehicle_year || ticket.vehicle_make || ticket.vehicle_model) && (
                      <li>{ticket.vehicle_year && `${ticket.vehicle_year} `}{ticket.vehicle_make} {ticket.vehicle_model}</li>
                    )}
                    {ticket.vehicle_vin && (
                      <li>VIN: {ticket.vehicle_vin}</li>
                    )}
                  </ul>
                </div>

                <div className="ticket-section">
                  <h3>Description</h3>
                  <p>{ticket.description}</p>
                </div>

                {ticket.estimated_cost && (
                  <div className="ticket-section">
                    <h4>Cost</h4>
                    <p className="ticket-cost">${ticket.estimated_cost.toFixed(2)}</p>
                  </div>
                )}
                
                {ticket.assigned_mechanics?.length > 0 && (
                  <div className="ticket-section">
                    <h4>Assigned Mechanics</h4>
                    <ul>
                      {ticket.assigned_mechanics.map(id => (
                        <li key={id}>Mechanic ID: {id.substring(0, 8)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {ticket.parts_used?.length > 0 && (
                  <div className="ticket-section">
                    <h4>Parts Used</h4>
                    <ul>
                      {ticket.parts_used.map(id => (
                        <li key={id}>Part ID: {id.substring(0, 8)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="ticket-footer">
                <div className="ticket-dates">
                  <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                  {ticket.completed_at && (
                    <span>Completed: {new Date(ticket.completed_at).toLocaleDateString()}</span>
                  )}
                </div>
                
                <div className="ticket-status-controls">
                  <select 
                    value={ticket.status}
                    onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                    disabled={updatingId === ticket.id}
                    className="status-dropdown"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tickets;
