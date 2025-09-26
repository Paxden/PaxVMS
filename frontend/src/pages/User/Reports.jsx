import { useEffect, useState } from "react";
import { getVisits } from "../../services/api"; // adjust path
import { FaSync, FaSearch, FaFileCsv } from "react-icons/fa";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";

export default function Reports() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const query = {};
      if (statusFilter !== "all") query.status = statusFilter;
      if (dateRange.from) query.from = dateRange.from;
      if (dateRange.to) query.to = dateRange.to;

      const response = await getVisits(query);
      setVisits(response.data || []);
    } catch (err) {
      setError(
        "Failed to fetch reports: " +
          (err.response?.data?.message || err.message)
      );
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

  const exportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Visitor,Email,Host,Purpose,Appointment,Status,Check-in,Check-out"]
        .concat(
          filteredVisits.map((v) =>
            [
              v.visitor?.name,
              v.visitor?.email,
              v.host?.name,
              v.purpose,
              formatDate(v.appointmentDate),
              v.status,
              v.checkInTime ? formatDate(v.checkInTime) : "",
              v.checkOutTime ? formatDate(v.checkOutTime) : "",
            ].join(",")
          )
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "visits_report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Visits Report</h2>
        <Button variant="outline-primary" onClick={fetchReports}>
          <FaSync /> Refresh
        </Button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filters */}
      <div className="row mb-3">
        <div className="col-md-3">
          <InputGroup>
            <InputGroup.Text>Status</InputGroup.Text>
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="waiting">Waiting</option>
              <option value="in-session">In Session</option>
              <option value="completed">Completed</option>
            </Form.Select>
          </InputGroup>
        </div>
        <div className="col-md-3">
          <Form.Control
            type="date"
            value={dateRange.from}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, from: e.target.value }))
            }
          />
        </div>
        <div className="col-md-3">
          <Form.Control
            type="date"
            value={dateRange.to}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, to: e.target.value }))
            }
          />
        </div>
        <div className="col-md-3">
          <InputGroup>
            <Form.Control
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="success" onClick={exportCSV}>
              <FaFileCsv /> Export CSV
            </Button>
          </InputGroup>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-5">Loading...</div>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead className="table-dark">
              <tr>
                <th>Visitor</th>
                <th>Email</th>
                <th>Host</th>
                <th>Purpose</th>
                <th>Appointment</th>
                <th>Status</th>
                <th>Check-in</th>
                <th>Check-out</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    No records found
                  </td>
                </tr>
              ) : (
                filteredVisits.map((visit) => (
                  <tr key={visit._id}>
                    <td>{visit.visitor?.name}</td>
                    <td>{visit.visitor?.email}</td>
                    <td>{visit.host?.name}</td>
                    <td>{visit.purpose}</td>
                    <td>{formatDate(visit.appointmentDate)}</td>
                    <td>{getStatusBadge(visit.status)}</td>
                    <td>
                      {visit.checkInTime ? formatDate(visit.checkInTime) : "-"}
                    </td>
                    <td>
                      {visit.checkOutTime
                        ? formatDate(visit.checkOutTime)
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}
      <style jsx>{`
        .table td,
        .table th {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }
      `}</style>
    </div>
  );
}
