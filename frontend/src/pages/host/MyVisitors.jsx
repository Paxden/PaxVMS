import { useEffect, useState } from "react";
import { getVisits, updateVisitorStatus } from "../../services/api";
import {
  Table,
  Button,
  Alert,
  Image,
  Modal,
  Badge,
  Card,
} from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import Loader from "../loaders/Loader";

export default function MyVisitors() {
  const { user } = useAuth();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchMyVisits = async () => {
    setLoading(true);
    try {
      const res = await getVisits();
      const myVisits = res.data.filter(
        (v) => String(v.host?._id) === String(user.id)
      );
      setVisits(myVisits);
    } catch (err) {
      console.error("❌ MyVisitors fetch error:", err);
      setError("Failed to load visits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyVisits();
  }, [user.id]);

  // Filter visits
  const filteredVisits = visits.filter((visit) => {
    const matchesFilter = filter === "all" || visit.status === filter;
    const matchesSearch =
      visit.visitor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.visitor?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleStatusChange = async (visitId, status) => {
    setError("");
    setSuccess("");
    try {
      const visit = visits.find((v) => v._id === visitId);
      if (!visit) return;

      const newStatus = status === "approved" ? "waiting" : status;

      await updateVisitorStatus(visit.visitor._id, visit._id, {
        status: newStatus,
      });
      setSuccess(
        `Visit for ${visit.visitor.name} marked as ${newStatus.replace(
          "-",
          " "
        )}`
      );
      setSelectedVisit(null); // Close modal after action
      fetchMyVisits();
    } catch (err) {
      console.error("❌ Status update error:", err);
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  // Statistics
  const stats = {
    total: visits.length,
    pending: visits.filter((v) => v.status === "pending").length,
    approved: visits.filter((v) => v.status === "waiting").length,
    inSession: visits.filter((v) => v.status === "in-session").length,
    completed: visits.filter((v) => v.status === "completed").length,
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
        return "success";
      case "in-session":
        return "primary";
      case "completed":
        return "secondary";
      case "rejected":
        return "danger";
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
    <div className="my-visitors container-scroll">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title text-light">👥 My Visitors</h1>
        <p className="page-subtitle">Manage and approve visitor appointments</p>
      </div>

      {/* Statistics */}
      <div className="stats-container">
        <Card className="stat-card">
          <Card.Body>
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total Visitors</p>
            </div>
          </Card.Body>
        </Card>

        <Card className="stat-card">
          <Card.Body>
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{stats.pending}</h3>
              <p>Pending Approval</p>
            </div>
          </Card.Body>
        </Card>

        <Card className="stat-card">
          <Card.Body>
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.approved}</h3>
              <p>Approved</p>
            </div>
          </Card.Body>
        </Card>

        <Card className="stat-card">
          <Card.Body>
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <h3>{stats.inSession}</h3>
              <p>In Session</p>
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
              <option value="all">All Visitors</option>
              <option value="pending">Pending Approval</option>
              <option value="waiting">Approved/Waiting</option>
              <option value="in-session">In Session</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
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
          <h5>📋 Visitor Appointments ({filteredVisits.length})</h5>
        </Card.Header>
        <Card.Body>
          {filteredVisits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h4>No visitors scheduled</h4>
              <p>
                {searchTerm || filter !== "all"
                  ? "No visitors match your search criteria"
                  : "You have no visitor appointments scheduled yet"}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Contact Information</th>
                    <th>Purpose</th>
                    <th>Appointment Date & Time</th>
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
                              {visit.department?.name}
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
                        <div className="action-buttons">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedVisit(visit)}
                            className="btn-sm"
                          >
                            👁️ View
                          </Button>

                          {/* Quick Actions */}
                          {visit.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() =>
                                  handleStatusChange(visit._id, "approved")
                                }
                                className="btn-sm"
                              >
                                ✅ Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() =>
                                  handleStatusChange(visit._id, "rejected")
                                }
                                className="btn-sm"
                              >
                                ❌ Reject
                              </Button>
                            </>
                          )}

                          {(visit.status === "waiting" ||
                            visit.status === "checked-in") && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() =>
                                handleStatusChange(visit._id, "in-session")
                              }
                              className="btn-sm"
                            >
                              💬 Start Session
                            </Button>
                          )}

                          {visit.status === "in-session" && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() =>
                                handleStatusChange(visit._id, "completed")
                              }
                              className="btn-sm"
                            >
                              ✔️ Complete
                            </Button>
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

              {/* Action Buttons Section */}
              <div className="mt-4 p-3 action-section">
                <h6>Manage This Visit</h6>
                <div className="d-flex gap-2 flex-wrap">
                  {selectedVisit.status === "pending" && (
                    <>
                      <Button
                        variant="success"
                        onClick={() =>
                          handleStatusChange(selectedVisit._id, "approved")
                        }
                      >
                        ✅ Approve Visit
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() =>
                          handleStatusChange(selectedVisit._id, "rejected")
                        }
                      >
                        ❌ Reject Visit
                      </Button>
                    </>
                  )}

                  {(selectedVisit.status === "waiting" ||
                    selectedVisit.status === "checked-in") && (
                    <Button
                      variant="primary"
                      onClick={() =>
                        handleStatusChange(selectedVisit._id, "in-session")
                      }
                    >
                      💬 Start Session
                    </Button>
                  )}

                  {selectedVisit.status === "in-session" && (
                    <Button
                      variant="success"
                      onClick={() =>
                        handleStatusChange(selectedVisit._id, "completed")
                      }
                    >
                      ✔️ Complete Visit
                    </Button>
                  )}

                  <Button variant="outline">📞 Contact Visitor</Button>

                  <Button variant="outline">📧 Send Email</Button>
                </div>
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
