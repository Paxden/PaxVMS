import { useEffect, useState } from "react";
import {
  getUsers,
  getVisitors,
  registerVisitor,
  addVisit,
} from "../../services/api";
import { Form, Button, Card, Alert } from "react-bootstrap";
import Loader from "../loaders/Loader";

export default function RegisterVisitor() {
  const [visitors, setVisitors] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    visitorId: "",
    name: "",
    email: "",
    phone: "",
    photo: null,
    host: "",
    department: "",
    purpose: "",
    appointmentDate: "",
  });

  // Animation states
  const [showForm, setShowForm] = useState(false);
  const [alertAnimation, setAlertAnimation] = useState("");

  // Fetch visitors and hosts
  const fetchData = async () => {
    setLoading(true);
    try {
      const [visitorsRes, usersRes] = await Promise.all([
        getVisitors(),
        getUsers(),
      ]);
      setVisitors(visitorsRes.data);
      const hostUsers = usersRes.data.filter((u) => u.role === "host");
      setHosts(hostUsers);
      const depts = [
        ...new Set(hostUsers.map((u) => u.department?.name).filter(Boolean)),
      ];
      setDepartments(depts);

      // Trigger form animation after data loads
      setTimeout(() => setShowForm(true), 300);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError("Failed to load data.");
      setAlertAnimation("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({ ...formData, [name]: files ? files[0] : value });

    // Clear alerts when user starts typing
    if (error || success) {
      setError("");
      setSuccess("");
      setAlertAnimation("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    setAlertAnimation("");

    try {
      if (!formData.appointmentDate) {
        setError("Appointment date is required.");
        setAlertAnimation("error");
        return;
      }

      if (formData.visitorId) {
        // Existing visitor → add visit
        await addVisit({
          visitorId: formData.visitorId,
          host: formData.host,
          department: formData.department,
          purpose: formData.purpose,
          appointmentDate: formData.appointmentDate,
        });
        setSuccess("Visit added for existing visitor successfully! ✓");
        setAlertAnimation("success");
      } else {
        // New visitor → register visitor + visit
        const data = new FormData();
        data.append("name", formData.name);
        data.append("email", formData.email);
        data.append("phone", formData.phone);
        if (formData.photo) data.append("photo", formData.photo);
        data.append("host", formData.host);
        data.append("department", formData.department);
        data.append("purpose", formData.purpose);
        data.append("appointmentDate", formData.appointmentDate);

        await registerVisitor(data);
        setSuccess("New visitor registered successfully! ✓");
        setAlertAnimation("success");
      }

      // Reset form with animation
      setTimeout(() => {
        setFormData({
          visitorId: "",
          name: "",
          email: "",
          phone: "",
          photo: null,
          host: "",
          department: "",
          purpose: "",
          appointmentDate: "",
        });
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = "";
      }, 500);

      fetchData();
    } catch (err) {
      console.error("❌ Submit error:", err);
      setError(err.response?.data?.message || "Failed to register visitor.");
      setAlertAnimation("error");
    } finally {
      setSubmitting(false);
    }
  };

  // Show loader while data is loading
  if (loading) {
    return (
      <div className="loading-container">
        <Loader />
      </div>
    );
  }

  return (
    <div className="register-visitor-container container-scroll">
      <div className="page-header">
        <h4 className="page-title text-light">Register Visitor</h4>
        <div className="header-decoration"></div>
      </div>

      {/* Animated Alerts */}
      {error && (
        <Alert
          variant="danger"
          className={`custom-alert ${alertAnimation}`}
          onClose={() => setError("")}
          dismissible
        >
          <i className="alert-icon">⚠️</i>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          variant="success"
          className={`custom-alert ${alertAnimation}`}
          onClose={() => setSuccess("")}
          dismissible
        >
          <i className="alert-icon">✅</i>
          {success}
        </Alert>
      )}

      <Card className={`form-card ${showForm ? "card-visible" : ""}`}>
        <Card.Header className="form-card-header ">
          <i className="card-icon text-light"></i>
          <h5 className="text-center">Visitor Registration Form</h5>
        </Card.Header>

        <Card.Body>
          <Form onSubmit={handleSubmit} className="visitor-form ">
            {/* Select existing visitor */}
            <Form.Group className="mb-4 form-group-animated">
              <Form.Label className="form-label">
                <i className="input-icon">🔍</i>
                Existing Visitor (optional)
              </Form.Label>
              <Form.Select
                name="visitorId"
                value={formData.visitorId}
                onChange={handleChange}
                className="form-select-custom"
              >
                <option value="">-- New Visitor --</option>
                {visitors.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name} ({v.phone})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* New visitor fields - Animated transition */}
            {!formData.visitorId && (
              <div className="new-visitor-section">
                <div className="section-title">
                  <i className="section-icon">🆕</i>
                  New Visitor Information
                </div>

                <div className="row">
                  <Form.Group className="mb-3 col-md-6 form-group-animated">
                    <Form.Label className="form-label">
                      <i className="input-icon">👤</i>
                      Full Name *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="form-control-custom"
                      placeholder="Enter visitor's full name"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3 col-md-6 form-group-animated">
                    <Form.Label className="form-label">
                      <i className="input-icon">📧</i>
                      Email Address
                    </Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-control-custom"
                      placeholder="visitor@example.com"
                    />
                  </Form.Group>
                </div>

                <div className="row">
                  <Form.Group className="mb-3 col-md-6 form-group-animated">
                    <Form.Label className="form-label">
                      <i className="input-icon">📱</i>
                      Phone Number *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="form-control-custom"
                      placeholder="+1 (555) 123-4567"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3 col-md-6 form-group-animated">
                    <Form.Label className="form-label">
                      <i className="input-icon">🖼️</i>
                      Photo Upload
                    </Form.Label>
                    <Form.Control
                      type="file"
                      name="photo"
                      onChange={handleChange}
                      className="form-control-custom"
                      accept="image/*"
                    />
                  </Form.Group>
                </div>
              </div>
            )}

            <div className="row">
              <Form.Group className="mb-3 col-md-6 form-group-animated">
                <Form.Label className="form-label">
                  <i className="input-icon">👨‍💼</i>
                  Host *
                </Form.Label>
                <Form.Select
                  name="host"
                  value={formData.host}
                  onChange={handleChange}
                  required
                  className="form-select-custom"
                >
                  <option value="">-- Select Host --</option>
                  {hosts.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.name} ({h.department?.name})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3 col-md-6 form-group-animated">
                <Form.Label className="form-label">
                  <i className="input-icon">🏢</i>
                  Department *
                </Form.Label>
                <Form.Select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className="form-select-custom"
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d, idx) => (
                    <option key={idx} value={d}>
                      {d}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>

            <Form.Group className="mb-4 form-group-animated">
              <Form.Label className="form-label">
                <i className="input-icon">🎯</i>
                Purpose of Visit *
              </Form.Label>
              <Form.Control
                type="text"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                required
                className="form-control-custom"
                placeholder="Meeting, interview, delivery, etc."
              />
            </Form.Group>

            <Form.Group className="mb-4 form-group-animated">
              <Form.Label className="form-label">
                <i className="input-icon">📅</i>
                Appointment Date & Time *
              </Form.Label>
              <Form.Control
                type="datetime-local"
                name="appointmentDate"
                value={formData.appointmentDate}
                onChange={handleChange}
                required
                className="form-control-custom"
              />
            </Form.Group>

            <div className="form-actions">
              <Button
                type="submit"
                variant="primary"
                className="submit-button"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="button-spinner"></span>
                    Processing...
                  </>
                ) : formData.visitorId ? (
                  <>
                    <i className="button-icon">➕</i>
                    Add Visit
                  </>
                ) : (
                  <>
                    <i className="button-icon">✓</i>
                    Register Visitor
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline-secondary"
                className="reset-button"
                onClick={() => {
                  setFormData({
                    visitorId: "",
                    name: "",
                    email: "",
                    phone: "",
                    photo: null,
                    host: "",
                    department: "",
                    purpose: "",
                    appointmentDate: "",
                  });
                  setError("");
                  setSuccess("");
                }}
              >
                <i className="button-icon">🔄</i>
                Reset Form
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
