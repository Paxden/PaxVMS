import { useEffect, useState } from "react";
import { getVisits, updateVisitorStatus } from "../../services/api";
import { Table, Button, Alert, Badge, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Loader from "../loaders/Loader";

export default function SecurityDashboard() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingVisitId, setUpdatingVisitId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  // Fetch all visits
  const fetchVisits = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getVisits();
      setVisits(res.data);
    } catch (err) {
      console.error("❌ Security dashboard fetch error:", err);
      setError("Failed to fetch visits.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  // Filter visits based on status and search term
  const filteredVisits = visits.filter((visit) => {
    const matchesFilter = filter === "all" || visit.status === filter;
    const matchesSearch =
      visit.visitor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.host?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Handle status change based on flow
  const handleStatusChange = async (visit) => {
    setError("");
    setSuccess("");
    setUpdatingVisitId(visit._id);

    let newStatus;
    switch (visit.status) {
      case "pending":
        newStatus = "checked-in";
        break;
      case "checked-in":
        newStatus = "waiting";
        break;
      case "waiting":
        newStatus = "in-session";
        break;
      case "in-session":
        newStatus = "completed";
        break;
      case "completed":
        newStatus = "checked-out";
        break;
      default:
        return;
    }

    try {
      await updateVisitorStatus(visit.visitor._id, visit._id, {
        status: newStatus,
      });
      setSuccess(
        `Visitor ${visit.visitor.name} marked as ${newStatus.replace("-", " ")}`
      );
      fetchVisits();
    } catch (err) {
      console.error("❌ Status update error:", err);
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingVisitId(null);
    }
  };

  // Get status badge variant
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
      default:
        return "light";
    }
  };

  // Get status icon
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
      default:
        return "📋";
    }
  };

  // Get button configuration based on status
  const getButtonConfig = (status) => {
    const configs = {
      pending: { label: "Check In", variant: "primary", icon: "🔒" },
      "checked-in": { label: "Mark Waiting", variant: "info", icon: "⏱️" },
      waiting: { label: "Start Session", variant: "warning", icon: "🚀" },
      "in-session": { label: "Complete Visit", variant: "success", icon: "✅" },
      completed: { label: "Check Out", variant: "secondary", icon: "🚪" },
    };
    return (
      configs[status] || {
        label: "Update",
        variant: "outline-primary",
        icon: "📝",
      }
    );
  };

  // Statistics
  const stats = {
    total: visits.length,
    pending: visits.filter((v) => v.status === "pending").length,
    active: visits.filter((v) =>
      ["checked-in", "waiting", "in-session"].includes(v.status)
    ).length,
    completed: visits.filter((v) =>
      ["completed", "checked-out"].includes(v.status)
    ).length,
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader />
      </div>
    );
  }

  return (
    <div className="security-dashboard container-scroll">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="dashboard-title">
              <i className="header-icon">🛡️</i>
              Security Dashboard
            </h1>
            <p className="dashboard-subtitle">
              Manage visitor access and monitor visit status
            </p>
          </div>
          <Button
            variant="primary"
            className="register-btn"
            onClick={() => navigate("/security/register")}
          >
            <i className="btn-icon">👤</i>
            Register New Visitor
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-container">
        <Card className="stat-card total">
          <Card.Body>
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total Visits</p>
            </div>
          </Card.Body>
        </Card>

        <Card className="stat-card pending">
          <Card.Body>
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{stats.pending}</h3>
              <p>Pending</p>
            </div>
          </Card.Body>
        </Card>

      

        <Card className="stat-card completed">
          <Card.Body>
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.completed}</h3>
              <p>Completed</p>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Controls Section */}
      <Card className="controls-card">
        <Card.Body>
          <div className="controls-row">
            <div className="search-section">
              <div className="search-box">
                <i className="search-icon">🔍</i>
                <input
                  type="text"
                  placeholder="Search visitors, hosts, or purpose..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="filter-section">
              <label>Filter by status:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="status-filter"
              >
                <option value="all">All Visits</option>
                <option value="pending">Pending</option>
                <option value="checked-in">Checked In</option>
                <option value="waiting">Waiting</option>
                <option value="in-session">In Session</option>
                <option value="completed">Completed</option>
                <option value="checked-out">Checked Out</option>
              </select>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert
          variant="danger"
          className="dashboard-alert"
          dismissible
          onClose={() => setError("")}
        >
          <i className="alert-icon">⚠️</i>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          variant="success"
          className="dashboard-alert"
          dismissible
          onClose={() => setSuccess("")}
        >
          <i className="alert-icon">✅</i>
          {success}
        </Alert>
      )}

      {/* Visits Table */}
      <Card className="table-card">
        <Card.Header className="table-header">
          <h5>
            <i className="table-icon">📋</i>
            Visitor Log ({filteredVisits.length}{" "}
            {filter === "all" ? "total" : filter})
          </h5>
        </Card.Header>
        <Card.Body className="table-body">
          {filteredVisits.length === 0 ? (
            <div className="empty-state">
              <i className="empty-icon">📭</i>
              <h4>No visits found</h4>
              <p>
                {searchTerm || filter !== "all"
                  ? "Try adjusting your search or filter"
                  : "No visits scheduled yet"}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="visits-table">
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Contact</th>
                    <th>Purpose</th>
                    <th>Host & Dept</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.map((visit, index) => (
                    <tr
                      key={visit._id}
                      className="visit-row"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td>
                        <div className="visitor-info">
                          <div className="avatar">
                            {visit.visitor?.photoUrl ? (
                              <img
                                src={visit.visitor.photoUrl}
                                alt={visit.visitor.name}
                                className="avatar-img"
                              />
                            ) : (
                              <div className="avatar-placeholder">
                                {visit.visitor?.name?.charAt(0) || "V"}
                              </div>
                            )}
                          </div>
                          <div className="visitor-details">
                            <strong>{visit.visitor?.name}</strong>
                            <small>
                              ID: {visit.visitor?._id?.substring(0, 8)}...
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-info">
                          <div>📱 {visit.visitor?.phone}</div>
                          {visit.visitor?.email && (
                            <small>📧 {visit.visitor.email}</small>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="purpose-cell">{visit.purpose}</div>
                      </td>
                      <td>
                        <div className="host-info">
                          <strong>{visit.host?.name}</strong>
                          <br />
                          <small>🏢 {visit.department?.name || "N/A"}</small>
                        </div>
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
                        <div className="action-buttons">
                          {[
                            "pending",
                            "checked-in",
                            "waiting",
                            "in-session",
                            "completed",
                          ].includes(visit.status) ? (
                            <Button
                              size="sm"
                              variant={getButtonConfig(visit.status).variant}
                              disabled={updatingVisitId === visit._id}
                              onClick={() => handleStatusChange(visit)}
                              className="status-btn"
                            >
                              {updatingVisitId === visit._id ? (
                                <>
                                  <span className="button-spinner"></span>
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <i className="btn-icon">
                                    {getButtonConfig(visit.status).icon}
                                  </i>
                                  {getButtonConfig(visit.status).label}
                                </>
                              )}
                            </Button>
                          ) : (
                            <span className="text-muted">Completed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
