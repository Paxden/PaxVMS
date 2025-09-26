import { useEffect, useState } from "react";
import { getVisitors, getVisits } from "../../services/api";
import { FaUser, FaEye, FaSync, FaSearch, FaFilter } from "react-icons/fa";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";

export default function ManageVisitors() {
  const [visitors, setVisitors] = useState([]);
  const [visits, setVisits] = useState([]);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("visitors"); // "visitors" or "visits"

  useEffect(() => {
    fetchData();
  }, [activeTab]); // 🔹 fetch whenever tab changes

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === "visitors") {
        const response = await getVisitors();
        setVisitors(response.data || []);
      } else {
        const response = await getVisits();
        setVisits(response.data || []);
      }
    } catch (err) {
      setError(
        "Failed to fetch data: " + (err.response?.data?.message || err.message)
      );
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
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

  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleString() : "N/A";

  // Filter visitors
  const filteredVisitors = visitors.filter((visitor) => {
    const matchesSearch =
      visitor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.phone?.includes(searchTerm);

    if (statusFilter === "all") return matchesSearch;

    return (
      matchesSearch &&
      visitor.visits?.some((visit) => visit.status === statusFilter)
    );
  });

  // Filter visits
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
        <span className="ms-2">Loading {activeTab}...</span>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <FaUser className="me-2" />
          {activeTab === "visitors" ? "Manage Visitors" : "Visit History"}
        </h2>
        <Button variant="outline-primary" onClick={fetchData}>
          <FaSync /> Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-3">
        <Button
          variant={activeTab === "visitors" ? "primary" : "outline-primary"}
          className="me-2"
          onClick={() => setActiveTab("visitors")}
        >
          Visitors ({visitors.length})
        </Button>
        <Button
          variant={activeTab === "visits" ? "primary" : "outline-primary"}
          onClick={() => setActiveTab("visits")}
        >
          Visit History ({visits.length})
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="row mb-3">
        <div className="col-md-6">
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder={`Search ${activeTab}...`}
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

      {/* Visitors Table */}
      {activeTab === "visitors" && (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Total Visits</th>
                <th>Last Visit</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    {visitors.length === 0
                      ? "No visitors found"
                      : "No visitors match your search"}
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((visitor) => {
                  const latestVisit =
                    visitor.visits?.[visitor.visits.length - 1];
                  return (
                    <tr key={visitor._id}>
                      <td>
                        <strong>{visitor.name}</strong>
                      </td>
                      <td>{visitor.email}</td>
                      <td>{visitor.phone}</td>
                      <td>
                        <Badge bg="info">{visitor.visits?.length || 0}</Badge>
                      </td>
                      <td>
                        {latestVisit?.appointmentDate
                          ? formatDate(latestVisit.appointmentDate)
                          : "N/A"}
                      </td>
                      <td>
                        {latestVisit
                          ? getStatusBadge(latestVisit.status)
                          : "N/A"}
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => setSelectedVisitor(visitor)}
                        >
                          <FaEye /> View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Visits Table */}
      {activeTab === "visits" && (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Visitor</th>
                <th>Host</th>
                <th>Purpose</th>
                <th>Appointment</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    {visits.length === 0
                      ? "No visits found"
                      : "No visits match your search"}
                  </td>
                </tr>
              ) : (
                filteredVisits.map((visit) => (
                  <tr key={visit._id}>
                    <td>
                      <strong>{visit.visitor?.name}</strong>
                      <br />
                      <small className="text-muted">
                        {visit.visitor?.email}
                      </small>
                    </td>
                    <td>{visit.host?.name}</td>
                    <td>{visit.purpose}</td>
                    <td>{formatDate(visit.appointmentDate)}</td>
                    <td>
                      {visit.checkInTime ? (
                        formatDate(visit.checkInTime)
                      ) : (
                        <Badge bg="secondary">Not checked in</Badge>
                      )}
                    </td>
                    <td>
                      {visit.checkOutTime ? (
                        formatDate(visit.checkOutTime)
                      ) : (
                        <Badge bg="secondary">Not checked out</Badge>
                      )}
                    </td>
                    <td>{getStatusBadge(visit.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Visitor Modal */}
      <Modal
        show={!!selectedVisitor}
        onHide={() => setSelectedVisitor(null)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Visitor Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVisitor && (
            <>
              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>Name:</strong>
                  <p>{selectedVisitor.name}</p>
                </div>
                <div className="col-md-4">
                  <strong>Email:</strong>
                  <p>{selectedVisitor.email}</p>
                </div>
                <div className="col-md-4">
                  <strong>Phone:</strong>
                  <p>{selectedVisitor.phone}</p>
                </div>
              </div>

              <h5>Visit History</h5>
              {selectedVisitor.visits?.length === 0 ? (
                <p className="text-muted">No visit history</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Purpose</th>
                        <th>Host</th>
                        <th>Appointment</th>
                        <th>Status</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedVisitor.visits?.map((visit) => (
                        <tr key={visit._id}>
                          <td>{visit.purpose}</td>
                          <td>{visit.host?.name}</td>
                          <td>{formatDate(visit.appointmentDate)}</td>
                          <td>{getStatusBadge(visit.status)}</td>
                          <td>
                            {visit.checkInTime
                              ? formatDate(visit.checkInTime)
                              : "N/A"}
                          </td>
                          <td>
                            {visit.checkOutTime
                              ? formatDate(visit.checkOutTime)
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedVisitor(null)}>
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
