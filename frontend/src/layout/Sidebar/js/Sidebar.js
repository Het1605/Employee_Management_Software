import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Link as LinkIcon, 
  Calendar, 
  Banknote, 
  FileText, 
  ClipboardCheck, 
  ClipboardList, 
  Umbrella, 
  UserCircle 
} from 'lucide-react';
import styles from '../style/Sidebar.module.css';

const Sidebar = ({ isOpen, onClose }) => {
  const role = (localStorage.getItem('role') || 'EMPLOYEE').toUpperCase();

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  const menuConfig = [
    {
      type: 'link',
      to: `/${role.toLowerCase()}`,
      icon: LayoutDashboard,
      label: 'Dashboard',
      end: true
    },
    {
      type: 'group',
      title: 'Users Management',
      roles: ['ADMIN', 'HR', 'MANAGER'],
      items: [
        { to: `/${role.toLowerCase()}/users`, icon: Users, label: 'Manage Users' }
      ]
    },
    {
      type: 'group',
      title: 'Organization',
      roles: ['HR', 'ADMIN'],
      items: [
        { to: "/admin/companies", icon: Building2, label: 'Manage Companies', end: true },
        { to: "/admin/companies/assign", icon: LinkIcon, label: 'Company Assignment' },
        { to: `/${role.toLowerCase()}/calendar`, icon: Calendar, label: 'Calendar' }
      ]
    },
    {
      type: 'group',
      title: 'Payroll',
      roles: ['HR', 'ADMIN'],
      items: [
        { to: `/${role.toLowerCase()}/salary-structure`, icon: Banknote, label: 'Salary Structure' }
      ]
    },
    {
      type: 'group',
      title: 'Documents',
      roles: ['HR', 'ADMIN'],
      items: [
        { to: "/documents", icon: FileText, label: 'Documents' }
      ]
    },
    {
      type: 'group',
      title: 'Attendance',
      items: [
        { 
          to: "/employee/attendance", 
          icon: ClipboardCheck, 
          label: 'Mark Attendance', 
          roles: ['EMPLOYEE', 'INTERN', 'MANAGER'] 
        },
        { 
          to: `/${role.toLowerCase()}/attendance`, 
          icon: ClipboardList, 
          label: 'Manage Attendance', 
          roles: ['ADMIN', 'HR'] 
        },
        { to: "/attendance/leave", icon: Umbrella, label: 'Leave Management' },
        { 
          to: "/employee/calendar", 
          icon: Calendar, 
          label: 'My Calendar',
          roles: ['EMPLOYEE', 'INTERN', 'MANAGER'] 
        }
      ]
    },
    {
      type: 'group',
      title: 'Self Service',
      items: [
        { to: "/employee/profile", icon: UserCircle, label: 'My Profile' }
      ]
    }
  ];

  const renderNavLink = (item) => {
    const IconComponent = item.icon;
    return (
      <NavLink 
        key={item.to}
        to={item.to} 
        className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`} 
        end={item.end}
        onClick={handleLinkClick}
      >
        <div className={styles.iconContainer}>
          <IconComponent size={18} strokeWidth={2.25} />
        </div>
        <span className={styles.linkText}>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.isOpen : ''}`}>
      <div className={styles.sidebarHeader}>
        <div className={styles.logo}>HR Portal</div>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
      </div>

      <nav className={styles.nav}>
        {menuConfig.map((section, idx) => {
          if (section.type === 'link') {
            return renderNavLink(section);
          }

          // Group rendering
          const hasGroupAccess = !section.roles || section.roles.includes(role);
          if (!hasGroupAccess) return null;

          const visibleItems = section.items.filter(item => !item.roles || item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className={styles.navGroup}>
              <h3 className={styles.groupTitle}>{section.title}</h3>
              {visibleItems.map(renderNavLink)}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
