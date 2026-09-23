import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, User } from 'lucide-react';

export const BottomNav = () => {
  return (
    <nav className="bottom-nav">
      <NavLink 
        to="/" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        end
      >
        <Home size={24} />
        <span>Board</span>
      </NavLink>
      
      <NavLink 
        to="/chats" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <MessageCircle size={24} />
        <span>Chat</span>
      </NavLink>
      
      <NavLink 
        to="/me" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <User size={24} />
        <span>Me</span>
      </NavLink>
    </nav>
  );
};
