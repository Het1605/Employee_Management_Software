import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  UserCircle,
  History,
  Navigation
} from 'lucide-react';
import styles from '../style/Sidebar.module.css';

const Sidebar = ({ isOpen, onClose }) => {
  const role = (localStorage.getItem('role') || 'EMPLOYEE').toUpperCase();
  const location = useLocation();

  React.useEffect(() => {
    // Small timeout to ensure the active class is applied and DOM is ready
    const timeoutId = setTimeout(() => {
        const activeItem = document.querySelector(`.${styles.active}`);
        if (activeItem) {
            activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

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
        { to: "/user-management", icon: Users, label: 'Manage Users' }
      ]
    },
    {
      type: 'group',
      title: 'Organization',
      roles: ['HR', 'ADMIN'],
      items: [
        { to: "/company-management", icon: Building2, label: 'Manage Companies', end: true },
        { to: "/company-assignment", icon: LinkIcon, label: 'Company Assignment' },
        { to: `/${role.toLowerCase()}/calendar`, icon: Calendar, label: 'Calendar' }
      ]
    },
    {
      type: 'group',
      title: 'Payroll',
      roles: ['HR', 'ADMIN'],
      items: [
        { to: "/salary-structure", icon: Banknote, label: 'Salary Structure' }
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
          to: "/mark-attendance", 
          icon: ClipboardCheck, 
          label: 'Mark Attendance', 
          roles: ['EMPLOYEE', 'INTERN', 'MANAGER'] 
        },
        { 
          to: "/attendance-management", 
          icon: ClipboardList, 
          label: 'Manage Attendance', 
          roles: ['ADMIN', 'HR'] 
        },
        { 
          to: "/calendar", 
          icon: Calendar, 
          label: 'My Calendar',
          roles: ['EMPLOYEE', 'INTERN', 'MANAGER'] 
        }
      ]
    },
    {
      type: 'group',
      title: 'Leave Management',
      items: [
        { to: "/leave-management", icon: Umbrella, label: 'Manage Leaves', roles: ['ADMIN', 'HR', 'MANAGER'] },
        { to: "/apply-leave", icon: ClipboardCheck, label: 'Apply Leave' },
        { 
          to: "/leave-structure", 
          icon: ClipboardList, 
          label: 'Leave Structure', 
          roles: ['ADMIN', 'HR'] 
        }
      ]
    },
    {
      type: 'group',
      title: 'Field Operations',
      roles: ['ADMIN', 'HR', 'MANAGER'],
      items: [
        { to: "/location", icon: Navigation, label: 'Location Tracking' }
      ]
    },
    {
      type: 'group',
      title: 'Audit Management',
      roles: ['ADMIN', 'HR'],
      items: [
        { to: "/audit-logs", icon: History, label: 'Audit Log' }
      ]
    },
    {
      type: 'group',
      title: 'Self Service',
      items: [
        { to: "/profile", icon: UserCircle, label: 'My Profile' }
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
