import { useEffect, useState } from "react";
import { getVisits, updateVisitorStatus } from "../../services/api"; // adjust API
import {
  FaEye,
  FaSync,
  FaSearch,
  FaFilter,
  FaCheck,
  FaSignOutAlt,
} from "react-icons/fa";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";

export default function ManageVisits() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVisit, setSelectedVisit] = useState(null);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getVisits();
      setVisits(response.data || []);
    } catch (err) {
      setError(
        "Failed to fetch visits: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (visit, newStatus) => {
    try {
      // Fill in the actionBy and role based on current user context
      const data = {
        status: newStatus,
        actionBy: "System Admin", // e.g., receptionist's id or email
        role: "admin", // or "host" depending on who is updating
      };

      await updateVisitorStatus(visit.visitor._id, visit._id, data);
      fetchVisits();
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to update visit status");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: "warning", text: "Pending" },
      approved: { variant: "success", text: "Approved" },
      rejected: { variant: "danger", text: "Rejected" },
      waiting: { variant: "info", text: "Waiting" },
      "in-session": { variant: "primary", text: "In Session" },
      completed: { variant: "secondary", text: "Completed" },
    };
    const config = statusConfig[status] || { variant: "light", text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredVisits = visits.filter((visit) => {
    const matchesSearch =
      visit.visitor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.visitor?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.host?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && visit.status === statusFilter;
  });

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "50vh" }}
      >
        <FaSync className="spinner" style={{ fontSize: "2rem" }} />
        <span className="ms-2">Loading visits...</span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Visits</h2>
        <Button variant="outline-primary" onClick={fetchVisits}>
          <FaSync /> Refresh
        </Button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Search + Filter */}
      <div className="row mb-3">
        <div className="col-md-6">
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search visits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </div>
        <div className="col-md-3">
          <InputGroup>
            <InputGroup.Text>
              <FaFilter />
            </InputGroup.Text>
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="waiting">Waiting</option>
              <option value="in-session">In Session</option>
              <option value="completed">Completed</option>
            </Form.Select>
          </InputGroup>
        </div>
      </div>

      {/* Visits Table */}
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>Visitor</th>
              <th>Host</th>
              <th>Appointment</th>
              <th>Check</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVisits.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4">
                  No visits found
                </td>
              </tr>
            ) : (
              filteredVisits.map((visit) => (
                <tr key={visit._id}>
                  <td>
                    <strong>{visit.visitor?.name}</strong>
                    <br />
                    <small>{visit.visitor?.email}</small>
                  </td>
                  <td>{visit.host?.name}</td>
                  <td>{formatDate(visit.appointmentDate)}</td>
                  <td>
                    {visit.status === "pending" && (
                      <Badge bg="secondary">Not in</Badge>
                    )}

                    {(visit.status === "waiting" ||
                      visit.status === "in-session") && (
                      <>
                        <Badge bg="warning">Not out</Badge>
                      </>
                    )}

                    {visit.status === "completed" && (
                      <>
                        <Badge bg="success">out</Badge>
                      </>
                    )}
                  </td>

                  <td>{getStatusBadge(visit.status)}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => setSelectedVisit(visit)}
                      className="me-2"
                    >
                      <FaEye /> View
                    </Button>
                    {visit.status === "waiting" && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleStatusUpdate(visit, "in-session")}
                        className="me-2"
                      >
                        <FaCheck /> Check-in
                      </Button>
                    )}

                    {visit.status === "in-session" && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleStatusUpdate(visit, "completed")}
                      >
                        <FaSignOutAlt /> Check-out
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Visit Details Modal */}
      <Modal
        show={!!selectedVisit}
        onHide={() => setSelectedVisit(null)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Visit Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVisit && (
            <>
              <p>
                <strong>Visitor:</strong> {selectedVisit.visitor?.name} (
                {selectedVisit.visitor?.email})
              </p>
              <p>
                <strong>Host:</strong> {selectedVisit.host?.name}
              </p>
              <p>
                <strong>Purpose:</strong> {selectedVisit.purpose}
              </p>
              <p>
                <strong>Appointment Date:</strong>{" "}
                {formatDate(selectedVisit.appointmentDate)}
              </p>
              <p>
                <strong>Status:</strong> {getStatusBadge(selectedVisit.status)}
              </p>
              <p>
                <strong>Check-in:</strong>{" "}
                {selectedVisit.checkInTime
                  ? formatDate(selectedVisit.checkInTime)
                  : "Not checked in"}
              </p>
              <p>
                <strong>Check-out:</strong>{" "}
                {selectedVisit.checkOutTime
                  ? formatDate(selectedVisit.checkOutTime)
                  : "Not checked out"}
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedVisit(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
