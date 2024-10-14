import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { useUser } from '../Auth/UserContext'; // Import the context
import logo from '../../assets/profile-logo.png';
import './Profile.css';

const Layout = () => {
  const { userData } = useUser(); // Access userData from the context

  return (
    <div className="dashboard-container1">
      <header className="header">
        <div className="logo">
          <img src={logo} alt="BOREZY Logo" />
        </div>
        <div className="profile">
          <h3>{userData.name}</h3> {/* Display the user name */}
          <p>{userData.role} <br /> Tukaram Kapse Pvt. Ltd.</p>
        </div>
      </header>
      <div className='profile1'>
      <nav>
  <ul>
    {userData.role === 'Branch Manager' ? (
      <li><NavLink to="/overview">Overview</NavLink></li>
    ) : (
      <li><NavLink to="/profile">Overview</NavLink></li>
    )}
    {userData.role === 'Super Admin' ? (
      <li><NavLink to="/superadmin">Super Admin</NavLink></li>
    ) : (
      <li><NavLink to="/usersidebar/users">Create Users</NavLink></li>
    )}
    <li><NavLink to="/transaction">Transaction</NavLink></li>
    <li><NavLink to="/settings">Settings</NavLink></li>
  </ul>
</nav>
      </div>
      <main>
        <Outlet /> {/* Render the nested route content here */}
      </main>
    </div>
  );
};

export default Layout;
