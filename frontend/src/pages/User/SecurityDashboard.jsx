import { useEffect, useState } from "react";
import { getVisits, updateVisitorStatus } from "../../services/api";
import { Table, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function SecurityDashboard() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingVisitId, setUpdatingVisitId] = useState(null);

  const navigate = useNavigate();

  // Fetch all visits
  const fetchVisits = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getVisits();
      setVisits(res.data);
    } catch (err) {
      console.error("❌ Security dashboard fetch error:", err);
      setError("Failed to fetch visits.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  // Handle status change based on flow
  const handleStatusChange = async (visit) => {
    setError("");
    setSuccess("");
    setUpdatingVisitId(visit._id);

    let newStatus;
    switch (visit.status) {
      case "pending":
        newStatus = "checked-in";
        break;
      case "checked-in":
        newStatus = "waiting";
        break;
      case "waiting":
        newStatus = "in-session";
        break;
      case "in-session":
        newStatus = "completed";
        break;
      case "completed":
        newStatus = "checked-out";
        break;
      default:
        return;
    }

    try {
      await updateVisitorStatus(visit.visitor._id, visit._id, {
        status: newStatus,
      });
      setSuccess(`Visitor ${visit.visitor.name} marked as ${newStatus}`);
      fetchVisits();
    } catch (err) {
      console.error("❌ Status update error:", err);
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingVisitId(null);
    }
  };

  // Determine button label based on status
  const getButtonLabel = (status) => {
    if (status === "pending") return "Check-in";
    if (["checked-in", "waiting", "in-session", "completed"].includes(status))
      return "Check-out";
    return "-";
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Security Dashboard</h3>
        <Button
          variant="primary"
          onClick={() => navigate("/security/register")}
        >
          Register Visitor
        </Button>
      </div>

      {loading && <Spinner animation="border" />}
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Photo</th>
            <th>Visitor</th>
            <th>Phone</th>
            <th>Purpose</th>
            <th>Host</th>
            <th>Department</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visits.length === 0 && !loading && (
            <tr>
              <td colSpan="8" className="text-center">
                No visits scheduled
              </td>
            </tr>
          )}
          {visits.map((visit) => (
            <tr key={visit._id}>
              <td>
                {visit.visitor?.photoUrl ? (
                  <img
                    src={visit.visitor.photoUrl}
                    alt={visit.visitor.name}
                    width={40}
                    height={40}
                    className="rounded-circle"
                  />
                ) : (
                  <span>No photo</span>
                )}
              </td>
              <td>{visit.visitor?.name}</td>
              <td>{visit.visitor?.phone}</td>
              <td>{visit.purpose}</td>
              <td>{visit.host?.name}</td>
              <td>{visit.department?.name}</td>
              <td>{visit.status}</td>
              <td>
                {[
                  "pending",
                  "checked-in",
                  "waiting",
                  "in-session",
                  "completed",
                ].includes(visit.status) ? (
                  <Button
                    size="sm"
                    variant={visit.status === "pending" ? "primary" : "success"}
                    disabled={updatingVisitId === visit._id}
                    onClick={() => handleStatusChange(visit)}
                  >
                    {updatingVisitId === visit._id
                      ? "Updating..."
                      : getButtonLabel(visit.status)}
                  </Button>
                ) : (
                  <span>-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
