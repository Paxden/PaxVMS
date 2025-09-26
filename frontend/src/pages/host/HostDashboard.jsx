import { useEffect, useState } from "react";
import { getVisits } from "../../services/api";
import { Table, Card, Button, Image, Modal, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import Loader from "../loaders/Loader";

export default function HostDashboard() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchVisits = async () => {
      setLoading(true);
      try {
        const res = await getVisits();
        setVisits(res.data || []);
      } catch (err) {
        console.error("❌ Host dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVisits();
  }, []);

  // Filter visits for current host and by search/filter
  const hostVisits = visits.filter((v) => v.host?._id); // Only visits with host assigned
  const filteredVisits = hostVisits.filter((visit) => {
    const matchesFilter = filter === "all" || visit.status === filter;
    const matchesSearch =
      visit.visitor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.department?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Statistics for host
  const stats = {
    total: hostVisits.length,
    today: hostVisits.filter((v) => {
      const visitDate = new Date(v.appointmentDate);
      const today = new Date();
      return visitDate.toDateString() === today.toDateString();
    }).length,
    pending: hostVisits.filter((v) => v.status === "pending").length,
    active: hostVisits.filter((v) =>
      ["checked-in", "waiting", "in-session"].includes(v.status)
    ).length,
  };

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

  if (loading) {
    return (
      <div className="loading-container">
        <Loader />
      </div>
    );
  }

  return (
    <div className="host-dashboard container-scroll">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title text-light">🏠 Host Dashboard</h1>
        <p className="page-subtitle">
          Manage your visitor appointments and meetings
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-4">
        <Link to="/host/appointments" className="btn btn-primary">
          📅 Pre-appoint Visit
        </Link>
      </div>

      {/* Statistics */}
      <div className="stats-container">
        <Card className="stat-card">
          <Card.Body>
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total Visits</p>
            </div>
          </Card.Body>
        </Card>

        <Card className="stat-card">
          <Card.Body>
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{stats.today}</h3>
              <p>Today's Visits</p>
            </div>
          </Card.Body>
        </Card>

        <Card className="stat-card">
          <Card.Body>
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{stats.pending}</h3>
              <p>Pending</p>
            </div>
          </Card.Body>
        </Card>

       
      </div>

      {/* Controls */}
      <Card className="controls-card">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search visitors or purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="d-flex align-items-center gap-3">
            <label className="mb-0">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
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
      </Card>

      {/* Visits Table */}
      <Card className="dashboard-card">
        <Card.Header>
          <h5>📋 My Visitor Schedule ({filteredVisits.length} visits)</h5>
        </Card.Header>
        <Card.Body>
          {filteredVisits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h4>No visits scheduled</h4>
              <p>
                {searchTerm || filter !== "all"
                  ? "No visits match your search criteria"
                  : "You have no visitor appointments scheduled"}
              </p>
              <Link to="/host/appointments" className="btn btn-primary mt-3">
                📅 Schedule Your First Visit
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Contact Info</th>
                    <th>Department</th>
                    <th>Purpose</th>
                    <th>Appointment Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.map((visit, index) => (
                    <tr
                      key={visit._id}
                      className="table-row"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          {visit.visitor?.photoUrl ? (
                            <Image
                              src={visit.visitor.photoUrl}
                              roundedCircle
                              width={40}
                              height={40}
                              className="visitor-avatar"
                            />
                          ) : (
                            <div className="avatar-placeholder">
                              {visit.visitor?.name?.charAt(0) || "V"}
                            </div>
                          )}
                          <div>
                            <strong>{visit.visitor?.name}</strong>
                            <br />
                            <small className="text-muted">
                              ID: {visit.visitor?._id?.substring(0, 8)}...
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>📱 {visit.visitor?.phone}</div>
                          {visit.visitor?.email && (
                            <small className="text-muted">
                              📧 {visit.visitor.email}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="detail-value">
                          {visit.department?.name}
                        </span>
                      </td>
                      <td>
                        <div className="purpose-cell">{visit.purpose}</div>
                      </td>
                      <td>
                        <div>
                          <strong>
                            {new Date(
                              visit.appointmentDate
                            ).toLocaleDateString()}
                          </strong>
                          <br />
                          <small className="text-muted">
                            {new Date(
                              visit.appointmentDate
                            ).toLocaleTimeString()}
                          </small>
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedVisit(visit)}
                          className="btn-sm"
                        >
                          👁️ Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
          <Modal.Title>👤 Visitor Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVisit && (
            <div>
              {/* Visitor Header */}
              <div className="d-flex align-items-center gap-4 mb-4">
                {selectedVisit.visitor?.photoUrl ? (
                  <Image
                    src={selectedVisit.visitor.photoUrl}
                    roundedCircle
                    width={100}
                    height={100}
                    className="visitor-avatar"
                  />
                ) : (
                  <div className="avatar-placeholder large">
                    {selectedVisit.visitor?.name?.charAt(0) || "V"}
                  </div>
                )}
                <div>
                  <h3>{selectedVisit.visitor?.name}</h3>
                  <Badge
                    bg={getStatusVariant(selectedVisit.status)}
                    className="status-badge large"
                  >
                    {getStatusIcon(selectedVisit.status)}{" "}
                    {selectedVisit.status.replace("-", " ")}
                  </Badge>
                  <p className="text-muted mt-2">
                    Visitor ID: {selectedVisit.visitor?._id}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">📧 Email Address</span>
                  <span className="detail-value">
                    {selectedVisit.visitor?.email || "Not provided"}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">📱 Phone Number</span>
                  <span className="detail-value">
                    {selectedVisit.visitor?.phone}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">👨‍💼 Host</span>
                  <span className="detail-value">
                    {selectedVisit.host?.name}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">🏢 Department</span>
                  <span className="detail-value">
                    {selectedVisit.department?.name}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">🎯 Purpose of Visit</span>
                  <span className="detail-value">{selectedVisit.purpose}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">📅 Appointment Date</span>
                  <span className="detail-value">
                    {new Date(
                      selectedVisit.appointmentDate
                    ).toLocaleDateString()}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">⏰ Appointment Time</span>
                  <span className="detail-value">
                    {new Date(
                      selectedVisit.appointmentDate
                    ).toLocaleTimeString()}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">⏱️ Check-in Time</span>
                  <span className="detail-value">
                    {selectedVisit.checkInTime
                      ? new Date(selectedVisit.checkInTime).toLocaleString()
                      : "Not checked in yet"}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">📝 Additional Notes</span>
                  <span className="detail-value">
                    {selectedVisit.notes || "No additional notes"}
                  </span>
                </div>
              </div>

              {/* Meeting Actions */}
              <div
                className="mt-4 p-3"
                style={{ background: "#f8fafc", borderRadius: "8px" }}
              >
                <h6>Meeting Preparation</h6>
                <div className="d-flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline">
                    📋 Meeting Agenda
                  </Button>
                  <Button size="sm" variant="outline">
                    📎 Attachments
                  </Button>
                  <Button size="sm" variant="outline">
                    ⏰ Reminder
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="action-buttons">
            <Button variant="outline" onClick={() => setSelectedVisit(null)}>
              Close
            </Button>
            <Button variant="primary">📞 Contact Visitor</Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
