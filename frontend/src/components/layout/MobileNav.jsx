import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, Users, CircleDot, Phone, Settings } from 'lucide-react';

export const MobileNav = () => {
  const navLinks = [
    { to: '/chats', icon: MessageSquare, label: 'Chats' },
    { to: '/contacts', icon: Users, label: 'Contacts' },
    { to: '/status', icon: CircleDot, label: 'Stories' },
    { to: '/calls', icon: Phone, label: 'Calls' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0B0E14]/95 border-t border-white/5 backdrop-blur-lg flex items-center justify-around px-2 z-40">
      {navLinks.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all ${
              isActive ? 'text-[#7C3AED]' : 'text-[#64748B] hover:text-[#94A3B8]'
            }`
          }
        >
          <Icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileNav;
