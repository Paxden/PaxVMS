import { useEffect, useState } from "react";
import { getVisits, updateVisitorStatus } from "../../services/api";
import {
  Table,
  Modal,
  Button,
  Form,
  Image,
  Card,
  Badge,
  Alert,
} from "react-bootstrap";
import Loader from "../loaders/Loader";

const STATUS_OPTIONS = [
  { value: "pending", label: "⏳ Pending", color: "warning" },
  { value: "approved", label: "✅ Approved", color: "success" },
  { value: "rejected", label: "❌ Rejected", color: "danger" },
  { value: "checked-in", label: "🔒 Checked In", color: "info" },
  { value: "waiting", label: "🪑 Waiting", color: "primary" },
  { value: "in-session", label: "💬 In Session", color: "success" },
  { value: "completed", label: "✔️ Completed", color: "secondary" },
  { value: "checked-out", label: "🚪 Checked Out", color: "dark" },
];

export default function ManageVisits() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Fetch all visits
  const fetchVisits = async () => {
    setLoading(true);
    try {
      const res = await getVisits();
      setVisits(res.data || []);
    } catch (err) {
      console.error("❌ ManageVisits fetch error:", err);
      setError("Failed to fetch visits.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  // Filter visits based on search and filters
  const filteredVisits = visits.filter((visit) => {
    const matchesSearch =
      visit.visitor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.host?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.department?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || visit.status === statusFilter;

    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "today" && isToday(visit.appointmentDate)) ||
      (dateFilter === "upcoming" && isUpcoming(visit.appointmentDate)) ||
      (dateFilter === "past" && isPast(visit.appointmentDate));

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Date helper functions
  const isToday = (dateStr) => {
    const visitDate = new Date(dateStr);
    const today = new Date();
    return visitDate.toDateString() === today.toDateString();
  };

  const isUpcoming = (dateStr) => {
    const visitDate = new Date(dateStr);
    const now = new Date();
    return visitDate > now;
  };

  const isPast = (dateStr) => {
    const visitDate = new Date(dateStr);
    const now = new Date();
    return visitDate < now;
  };

  // Update visit status
  const handleUpdateStatus = async (visit) => {
    if (!statusUpdate || statusUpdate === visit.status) {
      setSelectedVisit(null);
      return;
    }

    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      await updateVisitorStatus(visit.visitor._id, visit._id, {
        status: statusUpdate,
      });
      setSuccess(`Visit status updated to ${getStatusLabel(statusUpdate)}`);
      setSelectedVisit(null);
      fetchVisits();
    } catch (err) {
      console.error("❌ Status update failed:", err);
      setError(
        err.response?.data?.message ||
          "Failed to update status. Only authorized personnel can modify visit status."
      );
    } finally {
      setUpdating(false);
    }
  };

  const getStatusLabel = (status) => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === status);
    return option
      // eslint-disable-next-line no-misleading-character-class
      ? option.label.replace(/[⏳✅❌🔒🪑💬✔️🚪]/gu, "").trim()
      : status;
  };

  const getStatusVariant = (status) => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === status);
    return option ? option.color : "secondary";
  };

  const getStatusIcon = (status) => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === status);
    return option ? option.label.split(" ")[0] : "📋";
  };

  // Statistics
  const stats = {
    total: visits.length,
    today: visits.filter((v) => isToday(v.appointmentDate)).length,
    upcoming: visits.filter((v) => isUpcoming(v.appointmentDate)).length,
    pending: visits.filter((v) => v.status === "pending").length,
    inProgress: visits.filter((v) =>
      ["checked-in", "waiting", "in-session"].includes(v.status)
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
    <div className="manage-visits container-scroll">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title text-light">📅 Manage Visits</h1>
        <p className="page-subtitle">
          Comprehensive visit management and tracking
        </p>
      </div>

      {/* Statistics */}
      <div className="stats-container mb-4">
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

        <Card className="stat-card">
          <Card.Body>
            <div className="stat-icon">🔵</div>
            <div className="stat-content">
              <h3>{stats.inProgress}</h3>
              <p>In Progress</p>
            </div>
          </Card.Body>
        </Card>

        <Card className="stat-card">
          <Card.Body>
            <div className="stat-icon">🔄</div>
            <div className="stat-content">
              <h3>{stats.upcoming}</h3>
              <p>Upcoming</p>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Controls */}
      <Card className="controls-card mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search visits by visitor, host, purpose, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div className="filter-group">
                <label className="filter-label">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Statuses</option>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Date:</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>
              </div>
            </div>
          </div>
        </Card.Body>
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
          <h5>
            📋 Visit Management ({filteredVisits.length})
            <small className="text-muted ms-2">
              Showing {filteredVisits.length} of {visits.length} visits
            </small>
          </h5>
        </Card.Header>
        <Card.Body>
          {filteredVisits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h4>No visits found</h4>
              <p>
                {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                  ? "No visits match your search criteria"
                  : "No visits scheduled yet"}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Host & Department</th>
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
                        <div className="visitor-info">
                          {visit.visitor?.photoUrl ? (
                            <Image
                              src={visit.visitor.photoUrl}
                              roundedCircle
                              width={50}
                              height={50}
                              className="visitor-avatar"
                              alt={visit.visitor.name}
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
                              📱 {visit.visitor?.phone}
                            </small>
                          </div>
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
                          {isToday(visit.appointmentDate) && (
                            <Badge bg="info" className="ms-1">
                              Today
                            </Badge>
                          )}
                          {isUpcoming(visit.appointmentDate) && (
                            <Badge bg="success" className="ms-1">
                              Upcoming
                            </Badge>
                          )}
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedVisit(visit);
                              setStatusUpdate(visit.status);
                            }}
                            className="btn-sm"
                          >
                            ✏️ Edit Status
                          </Button>
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

      {/* Status Update Modal */}
      <Modal
        show={!!selectedVisit}
        onHide={() => setSelectedVisit(null)}
        centered
        className="modal-overlay"
      >
        <Modal.Header closeButton>
          <Modal.Title>✏️ Update Visit Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVisit && (
            <div>
              {/* Visit Header */}
              <div className="d-flex align-items-center gap-3 mb-4">
                {selectedVisit.visitor?.photoUrl ? (
                  <Image
                    src={selectedVisit.visitor.photoUrl}
                    roundedCircle
                    width={80}
                    height={80}
                    className="visitor-avatar"
                    alt={selectedVisit.visitor.name}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {selectedVisit.visitor?.name?.charAt(0) || "V"}
                  </div>
                )}
                <div>
                  <h5>{selectedVisit.visitor?.name}</h5>
                  <Badge bg={getStatusVariant(selectedVisit.status)}>
                    Current: {selectedVisit.status.replace("-", " ")}
                  </Badge>
                </div>
              </div>

              {/* Visit Details */}
              <div className="detail-grid small mb-4">
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
                  <span className="detail-label">🎯 Purpose</span>
                  <span className="detail-value">{selectedVisit.purpose}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">📅 Appointment</span>
                  <span className="detail-value">
                    {new Date(selectedVisit.appointmentDate).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status Update Form */}
              <Form>
                <Form.Group>
                  <Form.Label className="form-label">
                    <span className="input-icon">🔄</span>
                    Update Status
                  </Form.Label>
                  <Form.Select
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                    className="form-select-custom"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Select the new status for this visit
                  </Form.Text>
                </Form.Group>
              </Form>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline"
            onClick={() => setSelectedVisit(null)}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => handleUpdateStatus(selectedVisit)}
            disabled={
              updating ||
              !statusUpdate ||
              statusUpdate === selectedVisit?.status
            }
          >
            {updating ? (
              <>
                <span className="button-spinner"></span>
                Updating...
              </>
            ) : (
              <>
                <span className="button-icon">💾</span>
                Update Status
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
