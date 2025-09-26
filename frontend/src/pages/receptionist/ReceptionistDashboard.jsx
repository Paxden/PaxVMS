import { useEffect, useState } from "react";
import { getVisits, updateVisitorStatus } from "../../services/api";
import {
  Table,
  Button,
  Alert,
  Modal,
  Image,
  Card,
  Badge,
} from "react-bootstrap";
import Loader from "../loaders/Loader";

export default function ReceptionistVisits() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const res = await getVisits();
      setVisits(res.data);
    } catch (err) {
      console.error("❌ Receptionist fetch error:", err);
      setError("Failed to load visits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  // Filter visits
  const filteredVisits = visits.filter((visit) => {
    const matchesFilter = filter === "all" || visit.status === filter;
    const matchesSearch =
      visit.visitor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.host?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleStatusChange = async (visitId, visitorId, status) => {
    setError("");
    setSuccess("");
    try {
      await updateVisitorStatus(visitorId, visitId, { status });
      setSuccess(`Visit marked as ${status}`);
      setSelectedVisit(null); // close modal
      fetchVisits();
    } catch (err) {
      console.error("❌ Status update error:", err);
      setError(err.response?.data?.message || "Failed to update status");
    }
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

  if (loading) {
    return (
      <div className="loading-container">
        <Loader />
      </div>
    );
  }

  return (
    <div className="receptionist-dashboard container-scroll">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title text-light">👥 Receptionist Dashboard</h1>
        <p className="page-subtitle">
          Manage and monitor all visitor appointments
        </p>
      </div>

      {/* Statistics */}
      <div className="stats-container">
        <Card className="stat-card">
          <Card.Body>
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total Visits</p>
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

        <Card className="stat-card">
          <Card.Body>
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.completed}</h3>
              <p>Completed</p>
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
              placeholder="Search visitors, hosts, or purpose..."
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

      {/* Alerts */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          ⚠️ {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess("")}>
          ✅ {success}
        </Alert>
      )}

      {/* Visits Table */}
      <Card className="dashboard-card">
        <Card.Header>
          <h5>📋 Visitor Log ({filteredVisits.length} visits)</h5>
        </Card.Header>
        <Card.Body>
          {filteredVisits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h4>No visits found</h4>
              <p>
                {searchTerm || filter !== "all"
                  ? "Try adjusting your search or filter"
                  : "No visits scheduled yet"}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Contact</th>
                    <th>Host & Department</th>
                    <th>Appointment</th>
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
                              width={50}
                              height={50}
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
                              {visit.purpose}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>📱 {visit.visitor?.phone}</div>
                          <small className="text-muted">
                            📧 {visit.visitor?.email}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{visit.host?.name}</strong>
                          <br />
                          <small className="text-muted">
                            🏢 {visit.department?.name}
                          </small>
                        </div>
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
                          className={`text-light status-badge status-${visit.status}`}
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
      >
        <Modal.Header closeButton>
          <Modal.Title>👤 Visit Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVisit && (
            <div>
              {/* Visitor Info Header */}
              <div className="d-flex align-items-center gap-4 mb-4">
                {selectedVisit.visitor?.photoUrl ? (
                  <Image
                    src={selectedVisit.visitor.photoUrl}
                    roundedCircle
                    width={80}
                    height={80}
                    className="visitor-avatar"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {selectedVisit.visitor?.name?.charAt(0) || "V"}
                  </div>
                )}
                <div>
                  <h4>{selectedVisit.visitor?.name}</h4>
                  <Badge
                    className={`status-badge status-${selectedVisit.status}`}
                  >
                    {getStatusIcon(selectedVisit.status)}{" "}
                    {selectedVisit.status.replace("-", " ")}
                  </Badge>
                </div>
              </div>

              {/* Details Grid using Bootstrap */}
              <div className="row g-3">
                {" "}
                {/* g-3 adds some spacing between columns */}
                <div className="col-md-6">
                  <strong>📧 Email:</strong> <br />
                  {selectedVisit.visitor?.email || "N/A"}
                </div>
                <div className="col-md-6">
                  <strong>📱 Phone:</strong> <br />
                  {selectedVisit.visitor?.phone || "N/A"}
                </div>
                <div className="col-md-6">
                  <strong>👨‍💼 Host:</strong> <br />{" "}
                  {selectedVisit.host?.name || "N/A"}
                </div>
                <div className="col-md-6">
                  <strong>🏢 Department:</strong> <br />
                  {selectedVisit.department?.name || "N/A"}
                </div>
                <div className="col-md-6">
                  <strong>🎯 Purpose:</strong> <br />{" "}
                  {selectedVisit.purpose || "N/A"}
                </div>
                <div className="col-md-6">
                  <strong>📅 Appointment:</strong> <br />
                  {selectedVisit.appointmentDate
                    ? new Date(selectedVisit.appointmentDate).toLocaleString()
                    : "N/A"}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="action-buttons">
            {selectedVisit?.status === "pending" && (
              <Button
                variant="primary"
                onClick={() =>
                  handleStatusChange(
                    selectedVisit._id,
                    selectedVisit.visitor._id,
                    "checked-in"
                  )
                }
              >
                ✅ Check In
              </Button>
            )}
            {selectedVisit?.status === "checked-in" && (
              <Button
                variant="primary"
                onClick={() =>
                  handleStatusChange(
                    selectedVisit._id,
                    selectedVisit.visitor._id,
                    "in-session"
                  )
                }
              >
                💬 Start Session
              </Button>
            )}
            {selectedVisit?.status === "in-session" && (
              <Button
                variant="success"
                onClick={() =>
                  handleStatusChange(
                    selectedVisit._id,
                    selectedVisit.visitor._id,
                    "completed"
                  )
                }
              >
                ✔️ Complete Visit
              </Button>
            )}
            {selectedVisit?.status === "completed" && (
              <Button
                variant="dark"
                onClick={() =>
                  handleStatusChange(
                    selectedVisit._id,
                    selectedVisit.visitor._id,
                    "checked-out"
                  )
                }
              >
                🚪 Check Out
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedVisit(null)}>
              Close
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
