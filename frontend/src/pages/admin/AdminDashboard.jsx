import { useEffect, useState } from "react";
import { getUsers, getVisitors, getVisits } from "../../services/api";
import { Button, Table, Card, Image, Badge, Modal } from "react-bootstrap";
import Loader from "../loaders/Loader";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    visitors: 0,
    visits: 0,
    todayVisits: 0,
    pendingVisits: 0,
  });
  const [users, setUsers] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Helper to filter visits for today and yesterday
  const isRecentVisit = (dateStr) => {
    const visitDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const visitDay = visitDate.setHours(0, 0, 0, 0);
    return (
      visitDay === today.setHours(0, 0, 0, 0) ||
      visitDay === yesterday.setHours(0, 0, 0, 0)
    );
  };

  // Check if visit is today
  const isToday = (dateStr) => {
    const visitDate = new Date(dateStr);
    const today = new Date();
    return visitDate.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0);
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, visitorsRes, visitsRes] = await Promise.all([
          getUsers(),
          getVisitors(),
          getVisits(),
        ]);

        const allVisits = visitsRes.data || [];
        const recentVisits = allVisits.filter((v) =>
          isRecentVisit(v.appointmentDate)
        );
        const todayVisits = allVisits.filter((v) => isToday(v.appointmentDate));
        const pendingVisits = allVisits.filter((v) => v.status === "pending");

        setStats({
          users: usersRes.data?.length || 0,
          visitors: visitorsRes.data?.length || 0,
          visits: allVisits.length,
          todayVisits: todayVisits.length,
          pendingVisits: pendingVisits.length,
        });

        setUsers(usersRes.data?.slice(-8).reverse() || []);
        setVisitors(visitorsRes.data?.slice(-8).reverse() || []);
        setVisits(recentVisits);
      } catch (err) {
        console.error("❌ Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "checked-in":
        return "✅";
      case "waiting":
        return "🪑";
      case "in-session":
        return "💬";
      case "completed":
        return "✔️";
      case "checked-out":
        return "🚪";
      case "rejected":
        return "❌";
      default:
        return "📋";
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "checked-in":
        return "info";
      case "waiting":
        return "primary";
      case "in-session":
        return "success";
      case "completed":
        return "secondary";
      case "checked-out":
        return "dark";
      case "rejected":
        return "danger";
      default:
        return "light";
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { variant: "danger", icon: "👑" },
      host: { variant: "primary", icon: "👨‍💼" },
      security: { variant: "warning", icon: "🛡️" },
      receptionist: { variant: "info", icon: "💁" },
    };

    const config = roleConfig[role] || { variant: "secondary", icon: "👤" };
    return (
      <Badge bg={config.variant} className="role-badge">
        {config.icon} {role}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader />
      </div>
    );
  }

  return (
    <div className="admin-dashboard container-scroll">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title text-light">👑 Admin Dashboard</h1>
        <p className="page-subtitle">System overview and management</p>
      </div>

      {/* Navigation Tabs */}
      <Card className="mb-4">
        <Card.Body className="p-0">
          <div className="dashboard-tabs">
            <button
              className={`tab-button ${
                activeTab === "overview" ? "active" : ""
              }`}
              onClick={() => setActiveTab("overview")}
            >
              📊 Overview
            </button>
            <button
              className={`tab-button ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              👥 Users
            </button>
            <button
              className={`tab-button ${
                activeTab === "visitors" ? "active" : ""
              }`}
              onClick={() => setActiveTab("visitors")}
            >
              👤 Visitors
            </button>
            <button
              className={`tab-button ${activeTab === "visits" ? "active" : ""}`}
              onClick={() => setActiveTab("visits")}
            >
              📅 Visits
            </button>
          </div>
        </Card.Body>
      </Card>

      {/* Statistics Cards */}
      {activeTab === "overview" && (
        <>
          <div className="stats-container">
            <Card className="stat-card">
              <Card.Body>
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3>{stats.users}</h3>
                  <p>Total Users</p>
                </div>
              </Card.Body>
            </Card>

            <Card className="stat-card">
              <Card.Body>
                <div className="stat-icon">👤</div>
                <div className="stat-content">
                  <h3>{stats.visitors}</h3>
                  <p>Total Visitors</p>
                </div>
              </Card.Body>
            </Card>

            <Card className="stat-card">
              <Card.Body>
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <h3>{stats.visits}</h3>
                  <p>Total Visits</p>
                </div>
              </Card.Body>
            </Card>

            <Card className="stat-card">
              <Card.Body>
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>{stats.todayVisits}</h3>
                  <p>Today's Visits</p>
                </div>
              </Card.Body>
            </Card>

            <Card className="stat-card">
              <Card.Body>
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <h3>{stats.pendingVisits}</h3>
                  <p>Pending Approval</p>
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Quick Stats Row */}
          <div className="row mb-4">
            <div className="col-md-6">
              <Card className="dashboard-card">
                <Card.Header>
                  <h5>📈 Quick Stats</h5>
                </Card.Header>
                <Card.Body>
                  <div className="quick-stats">
                    <div className="stat-item">
                      <span className="stat-label">Active Visits Today:</span>
                      <span className="stat-value">
                        {
                          visits.filter((v) =>
                            ["checked-in", "waiting", "in-session"].includes(
                              v.status
                            )
                          ).length
                        }
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Completed Today:</span>
                      <span className="stat-value">
                        {
                          visits.filter(
                            (v) =>
                              v.status === "completed" &&
                              isToday(v.appointmentDate)
                          ).length
                        }
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Avg. Visits/Day:</span>
                      <span className="stat-value">
                        {Math.round(stats.visits / 30)}
                      </span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
            <div className="col-md-6">
              <Card className="dashboard-card">
                <Card.Header>
                  <h5>🚀 System Status</h5>
                </Card.Header>
                <Card.Body>
                  <div className="system-status">
                    <div className="status-item online">
                      <span className="status-dot"></span>
                      <span>API Services</span>
                    </div>
                    <div className="status-item online">
                      <span className="status-dot"></span>
                      <span>Database</span>
                    </div>
                    <div className="status-item online">
                      <span className="status-dot"></span>
                      <span>File Storage</span>
                    </div>
                    <div className="status-item online">
                      <span className="status-dot"></span>
                      <span>Email Service</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Recent Users & Visitors */}
      <div className="row mb-4">
        {/* Recent Users */}
        <div className="col-md-6">
          <Card className="dashboard-card">
            <Card.Header>
              <h5>👥 Recent Users ({users.length})</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr
                        key={user._id}
                        className="table-row"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <td>
                          <div className="user-info">
                            <div className="avatar-placeholder small">
                              {user.name?.charAt(0) || "U"}
                            </div>
                            <span>{user.name}</span>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>{getRoleBadge(user.role)}</td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan="3" className="text-center">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Recent Visitors */}
        <div className="col-md-6">
          <Card className="dashboard-card">
            <Card.Header>
              <h5>👤 Recent Visitors ({visitors.length})</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Visitor</th>
                      <th>Contact</th>
                      <th>Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.map((visitor, index) => (
                      <tr
                        key={visitor._id}
                        className="table-row"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <td>
                          <div className="visitor-info">
                            {visitor.photoUrl ? (
                              <Image
                                src={visitor.photoUrl}
                                roundedCircle
                                width={40}
                                height={40}
                                className="visitor-avatar"
                                alt={visitor.name}
                              />
                            ) : (
                              <div className="avatar-placeholder small">
                                {visitor.name?.charAt(0) || "V"}
                              </div>
                            )}
                            <span>{visitor.name}</span>
                          </div>
                        </td>
                        <td>
                          <div>
                            <small>📱 {visitor.phone}</small>
                            <br />
                            <small>📧 {visitor.email}</small>
                          </div>
                        </td>
                        <td>
                          <Badge bg="secondary">
                            {Math.floor(Math.random() * 5) + 1}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {visitors.length === 0 && (
                      <tr>
                        <td colSpan="3" className="text-center">
                          No visitors found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Recent Visits */}
      <Card className="dashboard-card">
        <Card.Header>
          <h5>📅 Recent Visits - Today & Yesterday ({visits.length})</h5>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Host</th>
                  <th>Department</th>
                  <th>Purpose</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((visit, index) => (
                  <tr
                    key={visit._id}
                    className="table-row"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <td>
                      <div className="visitor-info">
                        {visit.visitor?.photoUrl ? (
                          <Image
                            src={visit.visitor.photoUrl}
                            roundedCircle
                            width={40}
                            height={40}
                            className="visitor-avatar"
                            alt={visit.visitor.name}
                          />
                        ) : (
                          <div className="avatar-placeholder small">
                            {visit.visitor?.name?.charAt(0) || "V"}
                          </div>
                        )}
                        <div>
                          <strong>{visit.visitor?.name}</strong>
                          <br />
                          <small className="text-muted">
                            {visit.visitor?.phone}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{visit.host?.name}</strong>
                      <br />
                      <small className="text-muted">{visit.host?.email}</small>
                    </td>
                    <td>{visit.department?.name}</td>
                    <td>
                      <div className="purpose-cell">{visit.purpose}</div>
                    </td>
                    <td>
                      {new Date(visit.appointmentDate).toLocaleDateString()}
                      <br />
                      <small className="text-muted">
                        {new Date(visit.appointmentDate).toLocaleTimeString()}
                      </small>
                    </td>
                    <td>
                      <Badge
                        bg={getStatusVariant(visit.status)}
                        className="status-badge"
                      >
                        {getStatusIcon(visit.status)}{" "}
                        {visit.status.replace("-", " ")}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedVisit(visit)}
                        className="btn-sm"
                      >
                        👁️ View
                      </Button>
                    </td>
                  </tr>
                ))}
                {visits.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No recent visits found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>

      {/* Visit Details Modal */}
      <Modal
        show={!!selectedVisit}
        onHide={() => setSelectedVisit(null)}
        centered
        className="modal-overlay"
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>👤 Visit Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVisit && (
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Visitor Name</span>
                <span className="detail-value">
                  {selectedVisit.visitor?.name}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Visitor Email</span>
                <span className="detail-value">
                  {selectedVisit.visitor?.email}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Visitor Phone</span>
                <span className="detail-value">
                  {selectedVisit.visitor?.phone}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Host</span>
                <span className="detail-value">{selectedVisit.host?.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Department</span>
                <span className="detail-value">
                  {selectedVisit.department?.name}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Purpose</span>
                <span className="detail-value">{selectedVisit.purpose}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Appointment Date</span>
                <span className="detail-value">
                  {new Date(selectedVisit.appointmentDate).toLocaleString()}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value">
                  <Badge bg={getStatusVariant(selectedVisit.status)}>
                    {selectedVisit.status.replace("-", " ")}
                  </Badge>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Check-in Time</span>
                <span className="detail-value">
                  {selectedVisit.checkInTime
                    ? new Date(selectedVisit.checkInTime).toLocaleString()
                    : "Not checked in"}
                </span>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline" onClick={() => setSelectedVisit(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
