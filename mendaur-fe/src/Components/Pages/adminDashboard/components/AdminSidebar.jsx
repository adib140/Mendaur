import React, { useState } from 'react';
import {
  Menu,
  X,
  BarChart3,
  Users,
  BoxesIcon,
  Wallet,
  FileText,
  ChevronDown,
  ChevronRight,
  Home,
  TrendingUp,
  LogOut,
  Calendar,
  Award,
  Bell,
  Trophy,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../styles/adminSidebar.css';

export default function AdminSidebar({ activeTab, onTabChange, onLogout, userRole }) {
  const { hasPermission } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState(['tabung-penukaran', 'management', 'content', 'overview-group']);

  const menuGroups = [
  
    {
      id: 'management',
      label: 'Management',
      icon: <Users size={20} />,
      items: [
        { id: 'users', label: 'User Management', icon: <Users size={18} /> },
        { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy size={18} /> },
        { id: 'notification', label: 'Notification Management', icon: <Bell size={18} /> },
      ],
    },

    {
      id: 'tabung-penukaran',
      label: 'Tabung & Penukaran',
      icon: <Wallet size={20} />,
      items: [
        { id: 'waste-deposits', label: 'Penyetoran Sampah', icon: <BoxesIcon size={18} /> },
        { id: 'product-redemption', label: 'Penukaran Produk', icon: <BoxesIcon size={18} /> },
        { id: 'cash-withdrawal', label: 'Penarikan Tunai', icon: <Wallet size={18} /> },
      ],
    },


    // CUT ANALYTICS FOR NOW
    // {
    //   id: 'analytics',
    //   label: 'Analytics',
    //   icon: <BarChart3 size={20} />,
    //   items: [
    //     { id: 'waste', label: 'Waste Analytics', icon: <BarChart3 size={18} /> },
    //     { id: 'points', label: 'Points Distribution', icon: <TrendingUp size={18} /> },
    //     { id: 'waste-by-user', label: 'Waste by User', icon: <Users size={18} /> },
    //   ],
    // },
    {
      id: 'content',
      label: 'Content Management',
      icon: <FileText size={20} />,
      items: [
        { id: 'content-produk', label: 'Produk', icon: <BoxesIcon size={18} /> },
        { id: 'content-artikel', label: 'Artikel', icon: <FileText size={18} /> },
        { id: 'content-badge', label: 'Badge', icon: <Award size={18} /> },
        { id: 'content-jadwal', label: 'Jadwal Penyetoran', icon: <Calendar size={18} /> },
        { id: 'content-harga', label: 'Daftar Harga Sampah', icon: <TrendingUp size={18} /> },
      ],
    }

    // CUT REPORTS FOR NOW
    // {
    //   id: 'reports',
    //   label: 'Reports & System',
    //   icon: <FileText size={20} />,
    //   items: [
    //     { id: 'reports', label: 'Reports', icon: <FileText size={18} /> },
    //   ],
    // },
  ];

  const toggleMenu = (groupId) => {
    setExpandedMenu(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleTabClick = (tabId) => {
    onTabChange(tabId);
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Hamburger Button - Mobile Only */}
      <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Overlay - Mobile Only */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <BoxesIcon size={28} />
            <span>Mendaur Admin</span>
          </div>
          <button className="sidebar-close" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Content */}
        <nav className="sidebar-nav">
          {menuGroups.map((group) => (
            <div key={group.id} className="menu-group">
              <button
                className={`menu-group-header ${expandedMenu.includes(group.id) ? 'expanded' : ''}`}
                onClick={() => toggleMenu(group.id)}
              >
                <span className="group-icon">{group.icon}</span>
                <span className="group-label">{group.label}</span>
                <ChevronDown size={16} className="group-chevron" />
              </button>

              {expandedMenu.includes(group.id) && (
                <div className="menu-items">
                  {group.items.map((item) => {
                    // ✅ Permission check - filter menu items based on user permissions
                    // Admin and Superadmin have access to all admin menu items
                    const itemPermissionMap = {
                      'waste-deposits': 'view_deposits',
                      'product-redemption': 'view_redemptions',
                      'cash-withdrawal': 'view_withdrawals',
                      'users': 'view_users',
                      'analytics': 'view_analytics',
                      'content': 'manage_content',
                      'notifications': 'manage_notifications',
                      'reports': 'export_reports',
                    }
                    
                    const requiredPermission = itemPermissionMap[item.id]
                    // If user is admin or superadmin (has userRole prop), they can see all items
                    // Otherwise check specific permission
                    const isAdminRole = userRole === 'admin' || userRole === 'superadmin'
                    if (requiredPermission && !isAdminRole && !hasPermission(requiredPermission)) {
                      return null
                    }
                    
                    return (
                      <button
                        key={item.id}
                        className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => handleTabClick(item.id)}
                        title={item.label}
                      >
                        <span className="item-icon">{item.icon}</span>
                        <span className="item-label">{item.label}</span>
                        {activeTab === item.id && <ChevronRight size={16} className="active-indicator" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-badge">{userRole.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <p className="user-role">{userRole.toUpperCase()}</p>
              <p className="user-label">Admin Account</p>
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}
