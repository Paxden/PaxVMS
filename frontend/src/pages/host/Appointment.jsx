import { useEffect, useState } from "react";
import {
  getVisitors,
  getDepartments,
  getHostsByDepartment,
  registerVisitor,
  addVisit,
} from "../../services/api";
import { Form, Button, Row, Col, Alert, Card, Modal } from "react-bootstrap";
import Loader from "../loaders/Loader";

export default function PreAppointVisit() {
  const [visitors, setVisitors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [visitorData, setVisitorData] = useState({
    name: "",
    email: "",
    phone: "",
    photo: null,
  });
  const [visitData, setVisitData] = useState({
    department: "",
    host: "",
    purpose: "",
    appointmentDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [success, setSuccess] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successDetails, setSuccessDetails] = useState({});

  // Fetch visitors and departments on mount
  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        const [visitorsRes, deptsRes] = await Promise.all([
          getVisitors(),
          getDepartments(),
        ]);
        setVisitors(visitorsRes.data || []);
        setDepartments(deptsRes.data || []);
      } catch (err) {
        console.error("❌ Pre-appoint fetch error:", err);
        setError("Failed to load initial data");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch hosts whenever department changes
  useEffect(() => {
    const fetchHosts = async () => {
      if (!visitData.department) {
        setHosts([]);
        return;
      }
      try {
        const res = await getHostsByDepartment(visitData.department);
        setHosts(res.data || []);
        // Clear host selection when department changes
        setVisitData((prev) => ({ ...prev, host: "" }));
      } catch (err) {
        console.error("❌ Fetch hosts error:", err);
        setError("Failed to load hosts for selected department");
      }
    };
    fetchHosts();
  }, [visitData.department]);

  const handleVisitorSelect = (e) => {
    const visitorId = e.target.value;
    if (!visitorId) {
      setSelectedVisitor(null);
      setVisitorData({ name: "", email: "", phone: "", photo: null });
      return;
    }
    const visitor = visitors.find((v) => v._id === visitorId);
    setSelectedVisitor(visitor);
    setVisitorData({
      name: visitor.name,
      email: visitor.email,
      phone: visitor.phone,
      photo: null,
    });
  };

  const handleVisitorChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      setVisitorData((prev) => ({ ...prev, photo: files[0] }));
    } else {
      setVisitorData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleVisitChange = (e) => {
    const { name, value } = e.target;
    setVisitData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      let result;
      if (selectedVisitor) {
        // Existing visitor → add visit
        result = await addVisit({
          visitorId: selectedVisitor._id,
          host: visitData.host,
          purpose: visitData.purpose,
          appointmentDate: visitData.appointmentDate,
        });
        setSuccessDetails({
          type: "existing",
          visitorName: selectedVisitor.name,
          appointmentDate: visitData.appointmentDate,
        });
      } else {
        // New visitor → register visitor + visit
        const formData = new FormData();
        formData.append("name", visitorData.name);
        formData.append("email", visitorData.email);
        formData.append("phone", visitorData.phone);
        formData.append("purpose", visitData.purpose);
        formData.append("host", visitData.host);
        formData.append("appointmentDate", visitData.appointmentDate);
        if (visitorData.photo) formData.append("photo", visitorData.photo);

        // eslint-disable-next-line no-unused-vars
        result = await registerVisitor(formData);
        setSuccessDetails({
          type: "new",
          visitorName: visitorData.name,
          appointmentDate: visitData.appointmentDate,
        });
      }

      setSuccess("Appointment scheduled successfully!");
      setShowSuccessModal(true);

      // Reset form
      setSelectedVisitor(null);
      setVisitorData({ name: "", email: "", phone: "", photo: null });
      setVisitData({
        department: "",
        host: "",
        purpose: "",
        appointmentDate: "",
      });
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
    } catch (err) {
      console.error("❌ Pre-appoint submit error:", err);
      setError(err.response?.data?.message || "Failed to create appointment");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedVisitor(null);
    setVisitorData({ name: "", email: "", phone: "", photo: null });
    setVisitData({
      department: "",
      host: "",
      purpose: "",
      appointmentDate: "",
    });
    setError("");
    setSuccess("");
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  if (initialLoading) {
    return (
      <div className="loading-container">
        <Loader />
        <p className="loading-text">Loading appointment form...</p>
      </div>
    );
  }

  return (
    <div className="pre-appoint-visit container-scroll">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title text-light">📅 Pre-Appoint Visitor</h1>
        <p className="page-subtitle">
          Schedule visitor appointments in advance
        </p>
      </div>

      {/* Main Form Card */}
      <Card className="dashboard-card">
        <Card.Header>
          <h5>👥 Visitor Appointment Form</h5>
        </Card.Header>
        <Card.Body>
          {/* Alerts */}
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              ⚠️ {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit} className="appointment-form">
            {/* Visitor Selection Section */}
            <div className="form-section">
              <h6 className="section-title">
                <span className="section-icon">👤</span>
                Visitor Information
              </h6>

              <Row className="mb-4">
                <Col md={6}>
                  <Form.Label className="form-label">
                    <span className="input-icon">🔍</span>
                    Select Existing Visitor
                  </Form.Label>
                  <Form.Select
                    value={selectedVisitor?._id || ""}
                    onChange={handleVisitorSelect}
                    className="form-select-custom"
                  >
                    <option value="">-- Register New Visitor --</option>
                    {visitors.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.name} ({v.phone}) - {v.email}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Choose an existing visitor or register a new one below
                  </Form.Text>
                </Col>
              </Row>

              {/* New Visitor Fields */}
              {!selectedVisitor && (
                <div className="new-visitor-section">
                  <div className="section-subtitle">New Visitor Details</div>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="form-label">
                          <span className="input-icon">👤</span>
                          Full Name *
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={visitorData.name}
                          onChange={handleVisitorChange}
                          required
                          className="form-control-custom"
                          placeholder="Enter visitor's full name"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="form-label">
                          <span className="input-icon">📧</span>
                          Email Address *
                        </Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={visitorData.email}
                          onChange={handleVisitorChange}
                          required
                          className="form-control-custom"
                          placeholder="visitor@example.com"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="form-label">
                          <span className="input-icon">📱</span>
                          Phone Number *
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="phone"
                          value={visitorData.phone}
                          onChange={handleVisitorChange}
                          required
                          className="form-control-custom"
                          placeholder="+1 (555) 123-4567"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="form-label">
                          <span className="input-icon">🖼️</span>
                          Photo (Optional)
                        </Form.Label>
                        <Form.Control
                          type="file"
                          name="photo"
                          onChange={handleVisitorChange}
                          className="form-control-custom"
                          accept="image/*"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}

              {/* Selected Visitor Info */}
              {selectedVisitor && (
                <div className="selected-visitor-info">
                  <div className="visitor-card">
                    <div className="visitor-avatar">
                      {selectedVisitor.photoUrl ? (
                        <img
                          src={selectedVisitor.photoUrl}
                          alt={selectedVisitor.name}
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {selectedVisitor.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="visitor-details">
                      <h6>{selectedVisitor.name}</h6>
                      <p>📧 {selectedVisitor.email}</p>
                      <p>📱 {selectedVisitor.phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Visit Details Section */}
            <div className="form-section">
              <h6 className="section-title">
                <span className="section-icon">📋</span>
                Appointment Details
              </h6>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label">
                      <span className="input-icon">🏢</span>
                      Department *
                    </Form.Label>
                    <Form.Select
                      name="department"
                      value={visitData.department}
                      onChange={handleVisitChange}
                      required
                      className="form-select-custom"
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label">
                      <span className="input-icon">👨‍💼</span>
                      Host *
                    </Form.Label>
                    <Form.Select
                      name="host"
                      value={visitData.host}
                      onChange={handleVisitChange}
                      required
                      disabled={!visitData.department}
                      className="form-select-custom"
                    >
                      <option value="">-- Select Host --</option>
                      {hosts.map((h) => (
                        <option key={h._id} value={h._id}>
                          {h.name} ({h.email})
                        </option>
                      ))}
                    </Form.Select>
                    {!visitData.department && (
                      <Form.Text className="text-muted">
                        Please select a department first
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label">
                      <span className="input-icon">🎯</span>
                      Purpose of Visit *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="purpose"
                      value={visitData.purpose}
                      onChange={handleVisitChange}
                      required
                      className="form-control-custom"
                      placeholder="Meeting, interview, delivery, etc."
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label">
                      <span className="input-icon">📅</span>
                      Appointment Date & Time *
                    </Form.Label>
                    <Form.Control
                      type="datetime-local"
                      name="appointmentDate"
                      value={visitData.appointmentDate}
                      onChange={handleVisitChange}
                      required
                      className="form-control-custom"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <Button
                type="submit"
                disabled={loading}
                className="submit-button"
              >
                {loading ? (
                  <>
                    <span className="button-spinner"></span>
                    Scheduling...
                  </>
                ) : (
                  <>
                    <span className="button-icon">✅</span>
                    Schedule Appointment
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="reset-button"
              >
                <span className="button-icon">🔄</span>
                Reset Form
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Success Modal */}
      <Modal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        centered
        className="modal-overlay"
      >
        <Modal.Header closeButton>
          <Modal.Title>✅ Appointment Scheduled!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="success-content">
            <div className="success-icon">🎉</div>
            <h5>Appointment Confirmed</h5>
            <p>
              {successDetails.type === "existing"
                ? `Visit for ${successDetails.visitorName} has been scheduled successfully.`
                : `New visitor ${successDetails.visitorName} has been registered and appointment scheduled.`}
            </p>
            <div className="appointment-details">
              <p>
                <strong>Appointment Time:</strong>
              </p>
              <p>{new Date(successDetails.appointmentDate).toLocaleString()}</p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowSuccessModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
