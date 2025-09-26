import { useEffect, useState } from "react";
import { getVisits, getVisitors, getUsers } from "../../services/api";
import {
  Table,
  Card,
  Row,
  Col,
  Button,
  Badge,
  Modal,
  Form,
} from "react-bootstrap";
import Loader from "../loaders/Loader";

export default function Reports() {
  const [visits, setVisits] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [visitsRes, visitorsRes, usersRes] = await Promise.all([
        getVisits(),
        getVisitors(),
        getUsers(),
      ]);
      setVisits(visitsRes.data || []);
      setVisitors(visitorsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error("❌ Reports fetch error:", err);
      setError("Failed to fetch report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter visits based on date range
  const filteredVisits = visits.filter((visit) => {
    if (dateRange === "all") return true;

    const visitDate = new Date(visit.appointmentDate);
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    return visitDate >= start && visitDate <= end;
  });

  // Analytics calculations
  const getAnalytics = () => {
    const totalVisits = filteredVisits.length;
    const totalVisitors = visitors.length;
    const totalHosts = users.filter((u) => u.role === "host").length;

    // Status summary
    const statusSummary = filteredVisits.reduce((acc, visit) => {
      acc[visit.status] = (acc[visit.status] || 0) + 1;
      return acc;
    }, {});

    // Department summary
    const deptSummary = filteredVisits.reduce((acc, visit) => {
      const deptName = visit.department?.name || "Unknown";
      acc[deptName] = (acc[deptName] || 0) + 1;
      return acc;
    }, {});

    // Monthly trend
    const monthlyTrend = filteredVisits.reduce((acc, visit) => {
      const month = new Date(visit.appointmentDate).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    // Top hosts
    const hostSummary = filteredVisits.reduce((acc, visit) => {
      const hostName = visit.host?.name || "Unknown";
      if (hostName !== "Unknown") {
        acc[hostName] = (acc[hostName] || 0) + 1;
      }
      return acc;
    }, {});

    // Visit duration stats (assuming we have check-in/check-out times)
    const completedVisits = filteredVisits.filter(
      (v) => v.status === "completed"
    );
    const avgVisitDuration =
      completedVisits.length > 0
        ? completedVisits.reduce((sum, visit) => {
            if (visit.checkInTime && visit.checkOutTime) {
              const duration =
                new Date(visit.checkOutTime) - new Date(visit.checkInTime);
              return sum + duration;
            }
            return sum;
          }, 0) / completedVisits.length
        : 0;

    return {
      totalVisits,
      totalVisitors,
      totalHosts,
      statusSummary,
      deptSummary,
      monthlyTrend,
      hostSummary,
      avgVisitDuration: Math.round(avgVisitDuration / (1000 * 60)), // Convert to minutes
      completionRate:
        totalVisits > 0
          ? (((statusSummary.completed || 0) / totalVisits) * 100).toFixed(1)
          : 0,
    };
  };

  const analytics = getAnalytics();

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

  // Export functions
  const exportCSV = () => {
    if (!filteredVisits.length) return;

    const headers = [
      "Visitor Name",
      "Visitor Email",
      "Visitor Phone",
      "Host Name",
      "Host Email",
      "Department",
      "Purpose",
      "Appointment Date",
      "Status",
      "Check-in Time",
      "Check-out Time",
    ];

    const rows = filteredVisits.map((v) => [
      v.visitor?.name || "",
      v.visitor?.email || "",
      v.visitor?.phone || "",
      v.host?.name || "",
      v.host?.email || "",
      v.department?.name || "",
      v.purpose || "",
      new Date(v.appointmentDate).toLocaleString(),
      v.status || "",
      v.checkInTime ? new Date(v.checkInTime).toLocaleString() : "",
      v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    downloadFile(csvContent, "visits_report.csv", "text/csv");
  };

  const exportJSON = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange: { start: startDate, end: endDate },
      analytics: analytics,
      visits: filteredVisits,
    };
    downloadFile(
      JSON.stringify(reportData, null, 2),
      "visits_report.json",
      "application/json"
    );
  };

  const downloadFile = (content, filename, mimeType) => {
    setExportLoading(true);

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => setExportLoading(false), 1000);
    setShowExportModal(false);
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    if (range === "custom") {
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(lastWeek.toISOString().split("T")[0]);
      setEndDate(today.toISOString().split("T")[0]);
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
    <div className="reports-dashboard container-scroll">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title text-light">📊 Reports & Analytics</h1>
        <p className="page-subtitle">
          Comprehensive visitor management insights and analytics
        </p>
      </div>

      {/* Date Range Filter */}
      <Card className="controls-card mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="filter-group">
              <label className="filter-label">Date Range:</label>
              <select
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {dateRange === "custom" && (
              <div className="d-flex align-items-center gap-3">
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-input"
                />
                <span>to</span>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-input"
                />
              </div>
            )}

            <Button
              variant="primary"
              onClick={() => setShowExportModal(true)}
              className="export-btn"
            >
              📤 Export Reports
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Key Metrics */}
      <div className="stats-container mb-4">
        <Card className="stat-card">
          <Card.Body>
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{analytics.totalVisits}</h3>
              <p>Total Visits</p>
              <small className="text-muted">
                {filteredVisits.length} filtered
              </small>
            </div>
          </Card.Body>
        </Card>

        <Card className="stat-card">
          <Card.Body>
            <div className="stat-icon">👤</div>
            <div className="stat-content">
              <h3>{analytics.totalVisitors}</h3>
              <p>Total Visitors</p>
            </div>
          </Card.Body>
        </Card>

        <Card className="stat-card">
          <Card.Body>
            <div className="stat-icon">👨‍💼</div>
            <div className="stat-content">
              <h3>{analytics.totalHosts}</h3>
              <p>Active Hosts</p>
            </div>
          </Card.Body>
        </Card>

        <Card className="stat-card">
          <Card.Body>
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{analytics.completionRate}%</h3>
              <p>Completion Rate</p>
            </div>
          </Card.Body>
        </Card>

        <Card className="stat-card">
          <Card.Body>
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <h3>{analytics.avgVisitDuration}</h3>
              <p>Avg. Duration (min)</p>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Analytics Charts */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="dashboard-card">
            <Card.Header>
              <h5>📈 Visits by Status</h5>
            </Card.Header>
            <Card.Body>
              <div className="analytics-chart">
                {Object.entries(analytics.statusSummary).map(
                  ([status, count]) => (
                    <div key={status} className="chart-item">
                      <div className="chart-label">
                        <Badge
                          bg={getStatusVariant(status)}
                          className="status-badge"
                        >
                          {getStatusIcon(status)} {status.replace("-", " ")}
                        </Badge>
                      </div>
                      <div className="chart-bar">
                        <div
                          className="chart-fill"
                          style={{
                            width: `${(count / analytics.totalVisits) * 100}%`,
                            backgroundColor: `var(--${getStatusVariant(
                              status
                            )})`,
                          }}
                        ></div>
                      </div>
                      <div className="chart-value">{count}</div>
                    </div>
                  )
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="dashboard-card">
            <Card.Header>
              <h5>🏢 Visits by Department</h5>
            </Card.Header>
            <Card.Body>
              <div className="analytics-chart">
                {Object.entries(analytics.deptSummary)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([dept, count]) => (
                    <div key={dept} className="chart-item">
                      <div className="chart-label">{dept}</div>
                      <div className="chart-bar">
                        <div
                          className="chart-fill"
                          style={{
                            width: `${(count / analytics.totalVisits) * 100}%`,
                            backgroundColor: "var(--primary)",
                          }}
                        ></div>
                      </div>
                      <div className="chart-value">{count}</div>
                    </div>
                  ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Top Hosts and Monthly Trend */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="dashboard-card">
            <Card.Header>
              <h5>🏆 Top Hosts</h5>
            </Card.Header>
            <Card.Body>
              <Table striped hover className="mb-0">
                <thead>
                  <tr>
                    <th>Host</th>
                    <th>Visits</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analytics.hostSummary)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([host, count]) => {
                      const hostData = users.find((u) => u.name === host);
                      return (
                        <tr key={host}>
                          <td>{host}</td>
                          <td>
                            <Badge bg="primary">{count}</Badge>
                          </td>
                          <td>{hostData?.department?.name || "N/A"}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="dashboard-card">
            <Card.Header>
              <h5>📅 Monthly Trend</h5>
            </Card.Header>
            <Card.Body>
              <Table striped hover className="mb-0">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Visits</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analytics.monthlyTrend)
                    .sort(([a], [b]) => new Date(a) - new Date(b))
                    .slice(-6)
                    .map(([month, count]) => (
                      <tr key={month}>
                        <td>{month}</td>
                        <td>
                          <Badge bg="info">{count}</Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Detailed Visits Table */}
      <Card className="dashboard-card">
        <Card.Header>
          <h5>📋 Detailed Visit Report ({filteredVisits.length} visits)</h5>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Host</th>
                  <th>Department</th>
                  <th>Purpose</th>
                  <th>Appointment Date</th>
                  <th>Status</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisits.map((visit, index) => {
                  const duration =
                    visit.checkInTime && visit.checkOutTime
                      ? Math.round(
                          (new Date(visit.checkOutTime) -
                            new Date(visit.checkInTime)) /
                            (1000 * 60)
                        )
                      : null;

                  return (
                    <tr
                      key={visit._id}
                      className="table-row"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td>
                        <strong>{visit.visitor?.name}</strong>
                        <br />
                        <small className="text-muted">
                          {visit.visitor?.email}
                        </small>
                      </td>
                      <td>{visit.host?.name}</td>
                      <td>{visit.department?.name}</td>
                      <td className="purpose-cell">{visit.purpose}</td>
                      <td>
                        {new Date(visit.appointmentDate).toLocaleDateString()}
                        <br />
                        <small className="text-muted">
                          {new Date(visit.appointmentDate).toLocaleTimeString()}
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
                      <td>{duration ? `${duration} min` : "N/A"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>

      {/* Export Modal */}
      <Modal
        show={showExportModal}
        onHide={() => setShowExportModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>📤 Export Reports</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Export {filteredVisits.length} visits in your preferred format:</p>
          <div className="export-options">
            <Button
              variant="success"
              onClick={exportCSV}
              disabled={exportLoading}
              className="export-option"
            >
              📄 CSV Format
              <small>Excel compatible</small>
            </Button>
            <Button
              variant="primary"
              onClick={exportJSON}
              disabled={exportLoading}
              className="export-option"
            >
              🔧 JSON Format
              <small>For developers</small>
            </Button>
          </div>
          {exportLoading && (
            <div className="text-center mt-3">
              <div className="loading-spinner small"></div>
              <p>Preparing download...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline" onClick={() => setShowExportModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
