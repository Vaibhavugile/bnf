import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Cleads.css';
import CSidebar from '../../UserDashboard/UserSidebar'; // Import the CSidebar component
import ClientHeader from '../../UserDashboard/UserHeader'; // Import the ClientHeader component

const ClientLeads = () => {
  const [formData, setFormData] = useState({
    leadName: '', 
    mobileNo: '',
    requirement: '',
    fromDate: '',
    toDate: '',
    source: 'google',
    stage: 'fresh lead',
    

  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleCreateClientLead = async (e) => {
    e.preventDefault();

    const { leadName, mobileNo, requirement, fromDate, toDate, source, stage, email,  } = formData;

    const today = new Date().toISOString().split('T')[0];
    if (new Date(toDate) < new Date(today)) {
      toast.error('To Date cannot be in the past.');
      return;
    }

    try {
      await addDoc(collection(db, 'clientleads'), {
        leadName,
        mobileNo,
        requirement,
        fromDate,
        toDate,
        source,
        stage,
        email,
         // Include new field
      });

      toast.success('Client lead created successfully.');
      setTimeout(() => {
        navigate('/show');
      }, 1500);
    } catch (error) {
      toast.error('Failed to create client lead. Please try again.');
    }
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`dashboard-container1 ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <CSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <div className="dashboard-content1">
        <ClientHeader onMenuClick={handleSidebarToggle} isSidebarOpen={sidebarOpen} />
        <h2>Add Lead</h2>
        <p className="subheading">Fill out the form below to add a new lead</p>
        <form onSubmit={handleCreateClientLead}>
        <form className="add-user-form">
        <div className="form-left">
          <div className="form-group">
            <label htmlFor="name">Lead Name</label>
            <input 
                type="text" 
                name="leadName" 
                value={formData.leadName} 
                onChange={handleChange} 
                placeholder="Enter Lead Name" 
                required 
              />
          </div>
          <div className="form-group">
            <label htmlFor="contactno">Contact No.</label>
            <input 
                type="text" 
                name="mobileNo" 
                value={formData.mobileNo} 
                onChange={handleChange} 
                placeholder="Enter Mobile No" 
                required 
              />
          </div>
          <div className="form-group">
            <label htmlFor="date">Event Date</label>
            <input 
                type="date" 
                name="fromDate" 
                value={formData.fromDate} 
                onChange={handleChange} 
                required 
              />
          </div>
          <div className="form-group">
            <label htmlFor="source">Source</label>
            
            <select className='opt'
                name="source" 
                value={formData.source} 
                onChange={handleChange} 
                required
              >
                <option value="google">Google</option>
                <option value="walk in">Walk In</option>
                <option value="insta">Instagram</option>
                <option value="facebook">Facebook</option>
              </select>
              
          </div>
          <div className="form-group">
            <label htmlFor="comment">Comment</label>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                placeholder="Enter any comments here"
              />
          </div>
          {/* <div className="form-group">
            <label htmlFor="budget">Budget</label>
            <input 
                type="text" 
                name="budget" 
                value={formData.budget} 
                onChange={handleChange} 
                placeholder="Enter Budget" 
                required 
              />
          </div> */}
          
        </div>

        <div className="form-right">
          <div className="form-group">
            <label htmlFor="require">Requirement</label>
            <input 
                type="text" 
                name="requirement" 
                value={formData.requirement} 
                onChange={handleChange} 
                placeholder="Enter Requirement" 
                required 
              />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
                type="text" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="Enter Email-ID" 
                required 
              />
          </div>
          <div className="form-group">
            <label htmlFor="role">Next Follow-up Date</label>
            <input 
                type="date" 
                name="toDate" 
                value={formData.toDate} 
                onChange={handleChange} 
                required 
              />
          </div>
          <div className="form-group">
            <label htmlFor="stage">Status</label>
            <select className='opt'
                name="stage" 
                value={formData.stage} 
                onChange={handleChange} 
                required
              >
                <option value="fresh lead">Fresh Lead</option>
                <option value="requirement fulfilled">Requirement Fulfilled</option>
                <option value="not interested">Not Interested</option>
                <option value="interested">Interested</option>
              </select>
          </div>
        </div>
      </form>

      <div className="button-group">
        <button type="button" className="btn cancel">Cancel</button>
        
        <button type="submit" className="btn add-employee">Add Lead</button>
      </div>
        </form>
        <ToastContainer />
      </div>
    </div>
  );
};

export default ClientLeads;
