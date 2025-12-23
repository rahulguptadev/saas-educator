import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiLogOut, FiUser, FiMessageCircle } from 'react-icons/fi';
import NotificationPanel from './NotificationPanel';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'admin':
        return '/admin';
      case 'teacher':
        return '/teacher';
      case 'student':
        return '/student';
      default:
        return '/login';
    }
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand" onClick={() => navigate(getDashboardPath())}>
            <h2>🎓 Anita Scholar Academy </h2>
          </div>
          <div className="navbar-menu">
            <button 
              className="btn-nav" 
              onClick={() => navigate('/chat')}
              title="Messages"
            >
              <FiMessageCircle />
              Messages
            </button>
            <NotificationPanel />
            <div className="navbar-user">
              <FiUser />
              <span>{user?.name}</span>
              <span className="role-badge">{user?.role}</span>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              <FiLogOut />
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;

