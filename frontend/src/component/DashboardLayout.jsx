import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// 🔑 Icons
import {
  FaUserShield,
  FaUsers,
  FaUserTie,
  FaClipboardList,
  FaChartBar,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { MdSecurity, MdDashboard } from "react-icons/md";
import { IoLogOutOutline, IoSettingsOutline } from "react-icons/io5";

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  // Role-based menus with icons and submenus
  const menuItems = {
    admin: [
      { path: "/admin", label: "Dashboard", icon: <MdDashboard /> },
      { path: "/admin/users", label: "Manage Users", icon: <FaUsers /> },
      {
        path: "/admin/visitors",
        label: "Manage Visitors",
        icon: <FaUserTie />,
      },
      {
        path: "/admin/visits",
        label: "Manage Visits",
        icon: <FaClipboardList />,
      },
      { path: "/admin/reports", label: "Reports", icon: <FaChartBar /> },
    ],
    host: [
      { path: "/host", label: "Dashboard", icon: <MdDashboard /> },
      { path: "/host/visitors", label: "My Visitors", icon: <FaUserTie /> },
      {
        path: "/host/appointments",
        label: "Appointments",
        icon: <FaClipboardList />,
      },
    ],
    receptionist: [
      { path: "/reception", label: "Dashboard", icon: <MdDashboard /> },
    ],
    security: [
      { path: "/security", label: "Dashboard", icon: <MdDashboard /> },
      {
        path: "/security/register",
        label: "Register Visitor",
        icon: <FaUserShield />,
      },
    ],
  };

  const roleLinks = menuItems[user?.role] || [];

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSubmenu = (index) => {
    setActiveSubmenu(activeSubmenu === index ? null : index);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { color: "danger", icon: "👑" },
      host: { color: "primary", icon: "👨‍💼" },
      security: { color: "warning", icon: "🛡️" },
      receptionist: { color: "info", icon: "💁" },
    };

    const config = roleConfig[role] || { color: "secondary", icon: "👤" };
    return (
      <span className={`role-badge role-${config.color}`}>
        {config.icon} {role}
      </span>
    );
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">🏢</div>
            <div className="logo-text">
              <span className="logo-title">VMS</span>
              <span className="logo-subtitle">Visitor Management</span>
            </div>
          </div>
          <button className="sidebar-close" onClick={toggleSidebar}>
            <FaTimes />
          </button>
        </div>

        <div className="user-info">
          <div className="user-avatar">{user?.name?.charAt(0) || "U"}</div>
          <div className="user-details">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{getRoleBadge(user?.role)}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-menu">
            {roleLinks.map((item, idx) => (
              <li key={idx} className="nav-item">
                {item.submenu ? (
                  <div className="nav-group">
                    <button
                      className={`nav-link ${
                        activeSubmenu === idx ? "active" : ""
                      }`}
                      onClick={() => toggleSubmenu(idx)}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-arrow">
                        {activeSubmenu === idx ? "▼" : "▶"}
                      </span>
                    </button>
                    <div
                      className={`submenu ${
                        activeSubmenu === idx ? "submenu-open" : ""
                      }`}
                    >
                      {item.submenu.map((subItem, subIdx) => (
                        <NavLink
                          key={subIdx}
                          to={subItem.path}
                          className={({ isActive }) =>
                            `submenu-link ${isActive ? "active" : ""}`
                          }
                        >
                          {subItem.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "active" : ""}`
                    }
                    end={item.exact}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-link logout-btn" onClick={handleLogout}>
            <span className="nav-icon">
              <IoLogOutOutline />
            </span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <button className="sidebar-toggle" onClick={toggleSidebar}>
              <FaBars />
            </button>
            <div className="breadcrumb">
              <span className="page-title">
                {getPageTitle(location.pathname, roleLinks)}
              </span>
            </div>
          </div>

          <div className="header-right">
            <div className="user-menu">
              <div className="user-greeting">
                Welcome back, <strong>{user?.name}</strong>
              </div>
              <div className="header-role">{getRoleBadge(user?.role)}</div>
            </div>
            <button className="logout-btn-mobile" onClick={handleLogout}>
              <IoLogOutOutline />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

// Helper function to get page title from current path
const getPageTitle = (pathname, menuItems) => {
  for (const item of menuItems) {
    if (item.path === pathname) return item.label;
    if (item.submenu) {
      for (const subItem of item.submenu) {
        if (subItem.path === pathname) return subItem.label;
      }
    }
  }
  return "Dashboard";
};

export default DashboardLayout;
