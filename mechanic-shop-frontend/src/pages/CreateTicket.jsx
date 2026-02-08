/**
 * Create Ticket Page
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { serviceTicketAPI } from '../services/api.service';
import './CreateTicket.css';

const CreateTicket = () => {
  const { customer } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    vehicle_year: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_vin: '',
    description: '',
    estimated_cost: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const ticketData = {
        customer_id: customer.id,
        vehicle_year: formData.vehicle_year || null,
        vehicle_make: formData.vehicle_make || null,
        vehicle_model: formData.vehicle_model || null,
        vehicle_vin: formData.vehicle_vin || null,
        description: formData.description,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        status: 'Open',
      };
      
      await serviceTicketAPI.create(ticketData);
      navigate('/tickets');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0] || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-ticket-container">
      <div className="create-ticket-card">
        <h2>Create New Service Ticket</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="vehicle_year">Vehicle Year</label>
              <input
                type="number"
                id="vehicle_year"
                name="vehicle_year"
                value={formData.vehicle_year}
                onChange={handleChange}
                placeholder="e.g., 2024"
              />
            </div>
            <div className="form-group">
              <label htmlFor="vehicle_make">Vehicle Make</label>
              <input
                type="text"
                id="vehicle_make"
                name="vehicle_make"
                value={formData.vehicle_make}
                onChange={handleChange}
                placeholder="e.g., Toyota"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="vehicle_model">Vehicle Model</label>
              <input
                type="text"
                id="vehicle_model"
                name="vehicle_model"
                value={formData.vehicle_model}
                onChange={handleChange}
                placeholder="e.g., Camry"
              />
            </div>
            <div className="form-group">
              <label htmlFor="vehicle_vin">VIN</label>
              <input
                type="text"
                id="vehicle_vin"
                name="vehicle_vin"
                value={formData.vehicle_vin}
                onChange={handleChange}
                placeholder="e.g., 1HGCM82633A123456"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Describe the issue with your vehicle *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="6"
              placeholder="Please provide details about the problem you're experiencing..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="estimated_cost">Estimated Cost ($)</label>
            <input
              type="number"
              id="estimated_cost"
              name="estimated_cost"
              value={formData.estimated_cost}
              onChange={handleChange}
              placeholder="e.g., 150.00"
              step="0.01"
              min="0"
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => navigate('/tickets')}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;
