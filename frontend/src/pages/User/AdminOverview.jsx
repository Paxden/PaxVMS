import { useEffect, useState } from "react";
import { getVisitors, getVisits } from "../../services/api";
import {
  FaUsers,
  FaCalendarCheck,
  FaClock,
  FaCheckCircle,
  FaSearch,
} from "react-icons/fa";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Table from "react-bootstrap/Table";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Badge from "react-bootstrap/Badge";

export default function DashboardOverview() {
  const [visitors, setVisitors] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      setError(null);

      const visitorsRes = await getVisitors();
      const visitsRes = await getVisits();

      setVisitors(visitorsRes.data || []);
      setVisits(visitsRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const countByStatus = (status) =>
    visits.filter((visit) => visit.status === status).length;

  const formatDate = (dateString) => new Date(dateString).toLocaleString();

  const filteredVisits = visits.filter((visit) => {
    const visitDate = new Date(visit.appointmentDate);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let matchesDate = true;

    if (dateFilter === "today") {
      matchesDate = visitDate.toDateString() === today.toDateString();
    } else if (dateFilter === "yesterday") {
      matchesDate = visitDate.toDateString() === yesterday.toDateString();
    }

    const matchesSearch =
      visit.visitor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.visitor?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.host?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.purpose.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesDate && matchesSearch;
  });

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "50vh" }}
      >
        <span className="spinner-border spinner-border-lg"></span>
        <span className="ms-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="mb-4">Dashboard Overview</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center shadow-sm">
            <Card.Body>
              <FaUsers size={32} className="mb-2 text-primary" />
              <Card.Title>Total Visitors</Card.Title>
              <Card.Text>{visitors.length}</Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center shadow-sm">
            <Card.Body>
              <FaCalendarCheck size={32} className="mb-2 text-success" />
              <Card.Title>Total Visits</Card.Title>
              <Card.Text>{visits.length}</Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center shadow-sm">
            <Card.Body>
              <FaClock size={32} className="mb-2 text-warning" />
              <Card.Title>Active Visits</Card.Title>
              <Card.Text>
                {countByStatus("waiting") + countByStatus("in-session")}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center shadow-sm">
            <Card.Body>
              <FaCheckCircle size={32} className="mb-2 text-secondary" />
              <Card.Title>Completed Visits</Card.Title>
              <Card.Text>{countByStatus("completed")}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search + Date Filter */}
      <Row className="mb-3">
        <Col md={6} className="mb-2">
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
        </Col>
        <Col md={3}>
          <Form.Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Visits Table */}
      <div className="table-responsive">
        <Table striped hover>
          <thead className="table-dark">
            <tr>
              <th>Visitor</th>
              <th>Host</th>
              <th>Purpose</th>
              <th>Appointment Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredVisits.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4">
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
                  <td>{visit.purpose}</td>
                  <td>{formatDate(visit.appointmentDate)}</td>
                  <td>
                    <Badge
                      bg={
                        visit.status === "pending"
                          ? "warning"
                          : visit.status === "waiting"
                          ? "info"
                          : visit.status === "in-session"
                          ? "primary"
                          : "secondary"
                      }
                    >
                      {visit.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
