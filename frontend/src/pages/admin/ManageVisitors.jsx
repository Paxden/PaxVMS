import { useEffect, useState } from "react";
import { getVisitors, getVisits } from "../../services/api";
import {
  Modal,
  Button,
  Table,
  Image,
  Card,
  Badge,
  Form,
} from "react-bootstrap";
import Loader from "../loaders/Loader";

export default function ManageVisitors() {
  const [visitors, setVisitors] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [visitorsRes, visitsRes] = await Promise.all([
        getVisitors(),
        getVisits(),
      ]);
      setVisitors(visitorsRes.data || []);
      setVisits(visitsRes.data || []);
    } catch (err) {
      console.error("❌ Dashboard fetch error:", err);
      setError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group visits by visitorId and get visit statistics
  const getVisitorVisits = (visitorId) => {
    const visitorVisits = visits.filter((v) => v.visitor?._id === visitorId);
    const stats = {
      total: visitorVisits.length,
      pending: visitorVisits.filter((v) => v.status === "pending").length,
      completed: visitorVisits.filter((v) => v.status === "completed").length,
      inProgress: visitorVisits.filter((v) =>
        ["checked-in", "waiting", "in-session"].includes(v.status)
      ).length,
      lastVisit:
        visitorVisits.length > 0
          ? new Date(
              Math.max(...visitorVisits.map((v) => new Date(v.appointmentDate)))
            )
          : null,
    };
    return { visits: visitorVisits, stats };
  };

  // Filter and sort visitors
  const filteredAndSortedVisitors = visitors
    .filter(
      (visitor) =>
        visitor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aVisits = getVisitorVisits(a._id);
      const bVisits = getVisitorVisits(b._id);

      switch (sortBy) {
        case "name":
          return sortOrder === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case "visits":
          return sortOrder === "asc"
            ? aVisits.stats.total - bVisits.stats.total
            : bVisits.stats.total - aVisits.stats.total;
        case "lastVisit": {
          const aDate = aVisits.stats.lastVisit || new Date(0);
          const bDate = bVisits.stats.lastVisit || new Date(0);
          return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
        }
        default:
          return 0;
      }
    });

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

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return "↕️";
    return sortOrder === "asc" ? "⬆️" : "⬇️";
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader />
      </div>
    );
  }

  return (
    <div className="manage-visitors container-scroll">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title text-light">👥 Manage Visitors</h1>
        <p className="page-subtitle">Visitor management and analytics</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-container mb-4">
        <Card className="stat-card">
          <Card.Body>
            <div className="stat-icon">👤</div>
            <div className="stat-content">
              <h3>{visitors.length}</h3>
              <p>Total Visitors</p>
            </div>
          </Card.Body>
        </Card>

        <Card className="stat-card">
          <Card.Body>
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{visits.length}</h3>
              <p>Total Visits</p>
            </div>
          </Card.Body>
        </Card>

        <Card className="stat-card">
          <Card.Body>
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{visits.filter((v) => v.status === "completed").length}</h3>
              <p>Completed Visits</p>
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
                placeholder="Search visitors by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="d-flex align-items-center gap-3">
              <label className="mb-0">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="name">Name</option>
                <option value="visits">Visit Count</option>
                <option value="lastVisit">Last Visit</option>
              </select>

              <Button
                variant="outline"
                onClick={() => handleSort(sortBy)}
                className="sort-btn"
              >
                {getSortIcon(sortBy)}{" "}
                {sortOrder === "asc" ? "Ascending" : "Descending"}
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Visitors Table */}
      <Card className="dashboard-card">
        <Card.Header>
          <h5>
            👥 Visitor Directory ({filteredAndSortedVisitors.length})
            <small className="text-muted ms-2">
              Showing {filteredAndSortedVisitors.length} of {visitors.length}{" "}
              visitors
            </small>
          </h5>
        </Card.Header>
        <Card.Body>
          {filteredAndSortedVisitors.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👤</div>
              <h4>No visitors found</h4>
              <p>
                {searchTerm
                  ? "No visitors match your search criteria"
                  : "No visitors in the system"}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Contact Information</th>
                    <th>Visit Statistics</th>
                    <th>Last Visit</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedVisitors.map((visitor, index) => {
                    const { visits: visitorVisits, stats } = getVisitorVisits(
                      visitor._id
                    );

                    return (
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
                                width={50}
                                height={50}
                                className="visitor-avatar"
                                alt={visitor.name}
                              />
                            ) : (
                              <div className="avatar-placeholder">
                                {visitor.name?.charAt(0) || "V"}
                              </div>
                            )}
                            <div>
                              <strong>{visitor.name}</strong>
                              <br />
                              <small className="text-muted">
                                ID: {visitor._id?.substring(0, 8)}...
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div>📧 {visitor.email}</div>
                            <div>📱 {visitor.phone}</div>
                            {visitor.company && (
                              <small className="text-muted">
                                🏢 {visitor.company}
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="visit-stats">
                            <div className="stat-badge total">
                              <span className="stat-number">{stats.total}</span>
                              <span className="stat-label">Total</span>
                            </div>
                            <div className="stat-badge completed">
                              <span className="stat-number">
                                {stats.completed}
                              </span>
                              <span className="stat-label">Completed</span>
                            </div>
                            <div className="stat-badge pending">
                              <span className="stat-number">
                                {stats.pending}
                              </span>
                              <span className="stat-label">Pending</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {stats.lastVisit ? (
                            <div>
                              <div>{stats.lastVisit.toLocaleDateString()}</div>
                              <small className="text-muted">
                                {stats.lastVisit.toLocaleTimeString()}
                              </small>
                            </div>
                          ) : (
                            <span className="text-muted">No visits</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setSelectedVisitor({
                                  ...visitor,
                                  visits: visitorVisits,
                                  stats,
                                })
                              }
                              className="btn-sm"
                            >
                              👁️ Details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Visitor Details Modal */}
      <Modal
        show={!!selectedVisitor}
        onHide={() => setSelectedVisitor(null)}
        size="xl"
        centered
        className="modal-overlay"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            👤 Visitor Details - {selectedVisitor?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVisitor && (
            <div>
              {/* Visitor Header */}
              <div className="d-flex align-items-center gap-4 mb-4">
                {selectedVisitor.photoUrl ? (
                  <Image
                    src={selectedVisitor.photoUrl}
                    roundedCircle
                    width={100}
                    height={100}
                    className="visitor-avatar large"
                    alt={selectedVisitor.name}
                  />
                ) : (
                  <div className="avatar-placeholder large">
                    {selectedVisitor.name?.charAt(0) || "V"}
                  </div>
                )}
                <div>
                  <h3>{selectedVisitor.name}</h3>
                  <div className="visitor-contact">
                    <div>📧 {selectedVisitor.email}</div>
                    <div>📱 {selectedVisitor.phone}</div>
                    {selectedVisitor.company && (
                      <div>🏢 {selectedVisitor.company}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistics Overview */}
              <div className="stats-overview mb-4">
                <h5>Visit Statistics</h5>
                <div className="stats-grid">
                  <div className="stat-card mini">
                    <div className="stat-number">
                      {selectedVisitor.stats?.total || 0}
                    </div>
                    <div className="stat-label">Total Visits</div>
                  </div>
                  <div className="stat-card mini">
                    <div className="stat-number">
                      {selectedVisitor.stats?.completed || 0}
                    </div>
                    <div className="stat-label">Completed</div>
                  </div>
                  <div className="stat-card mini">
                    <div className="stat-number">
                      {selectedVisitor.stats?.pending || 0}
                    </div>
                    <div className="stat-label">Pending</div>
                  </div>
                  <div className="stat-card mini">
                    <div className="stat-number">
                      {selectedVisitor.stats?.inProgress || 0}
                    </div>
                    <div className="stat-label">In Progress</div>
                  </div>
                </div>
              </div>

              {/* Visits Table */}
              <h5>Visit History ({selectedVisitor.visits?.length || 0})</h5>
              {selectedVisitor.visits?.length === 0 ? (
                <div className="empty-state small">
                  <div className="empty-icon">📭</div>
                  <p>No visits recorded for this visitor</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Host</th>
                        <th>Department</th>
                        <th>Purpose</th>
                        <th>Appointment Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedVisitor.visits?.map((visit) => (
                        <tr key={visit._id}>
                          <td>
                            <strong>{visit.host?.name}</strong>
                            <br />
                            <small className="text-muted">
                              {visit.host?.email}
                            </small>
                          </td>
                          <td>{visit.department?.name}</td>
                          <td>{visit.purpose}</td>
                          <td>
                            {new Date(
                              visit.appointmentDate
                            ).toLocaleDateString()}
                            <br />
                            <small className="text-muted">
                              {new Date(
                                visit.appointmentDate
                              ).toLocaleTimeString()}
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline" onClick={() => setSelectedVisitor(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
