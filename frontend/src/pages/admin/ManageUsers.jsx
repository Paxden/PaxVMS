import { useEffect, useState } from "react";
import {
  getUsers,
  createUser,
  deleteUser,
  getDepartments,
  // eslint-disable-next-line no-unused-vars
  getUserById,
  getVisits,
} from "../../services/api";
import {
  Modal,
  Button,
  Form,
  Table,
  Card,
  Badge,
  Image,
} from "react-bootstrap";
import Loader from "../loaders/Loader";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create modal state
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "receptionist",
    department: "",
  });
  const [creating, setCreating] = useState(false);

  // View details modal state
  const [showDetails, setShowDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userVisits, setUserVisits] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Fetch users + departments
  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, deptRes] = await Promise.all([
        getUsers(),
        getDepartments(),
      ]);
      setUsers(usersRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err) {
      setError("Failed to load users");
      console.error("❌ Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter users based on search and role filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Create user
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      await createUser(newUser);
      setSuccess(`User ${newUser.name} created successfully!`);
      setShowModal(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "receptionist",
        department: "",
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Error creating user");
    } finally {
      setCreating(false);
    }
  };

  // Delete user
  const handleDelete = async (id, userName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete user "${userName}"? This action cannot be undone.`
      )
    )
      return;

    try {
      await deleteUser(id);
      setSuccess(`User ${userName} deleted successfully`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
      console.error("❌ Delete error:", err);
    }
  };

  // View user details
  const handleViewUser = async (user) => {
    setDetailsLoading(true);
    setSelectedUser(user);
    setShowDetails(true);

    try {
      const visitsRes = await getVisits();
      let userVisits = [];

      if (user.role === "host") {
        // Filter visits for this host
        userVisits = visitsRes.data.filter((v) => v.host?._id === user._id);
      } else if (user.role === "receptionist") {
        // For receptionist, show recent visits they might have handled
        userVisits = visitsRes.data.slice(0, 10); // Show recent 10 visits
      }

      setUserVisits(userVisits);
    } catch (err) {
      console.error("❌ Error loading user details:", err);
      setUserVisits([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { variant: "danger", icon: "👑", label: "Admin" },
      host: { variant: "primary", icon: "👨‍💼", label: "Host" },
      security: { variant: "warning", icon: "🛡️", label: "Security" },
      receptionist: { variant: "info", icon: "💁", label: "Receptionist" },
    };

    const config = roleConfig[role] || {
      variant: "secondary",
      icon: "👤",
      label: role,
    };
    return (
      <Badge bg={config.variant} className="role-badge">
        {config.icon} {config.label}
      </Badge>
    );
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
      case "checked-out":
        return "🚪";
      default:
        return "📋";
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
    <div className="manage-users container-scroll">
      {/* Header */}
      <div className="page-header text-center">
        <h1 className="page-title text-light ">👥 Manage Users</h1>
        <p className="page-subtitle">User management and administration</p>
      </div>

      {/* Alerts */}
      {error && (
        <div
          className="alert alert-danger"
          dismissible
          onClose={() => setError("")}
        >
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div
          className="alert alert-success"
          dismissible
          onClose={() => setSuccess("")}
        >
          ✅ {success}
        </div>
      )}

      {/* Controls Card */}
      <Card className="controls-card mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search users by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="d-flex align-items-center gap-3">
              <label className="mb-0">Filter by role:</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="host">Host</option>
                <option value="receptionist">Receptionist</option>
                <option value="security">Security</option>
              </select>

              <Button
                variant="primary"
                onClick={() => setShowModal(true)}
                className="add-user-btn"
              >
                <span className="btn-icon">➕</span>
                Add User
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Users Table Card */}
      <Card className="dashboard-card">
        <Card.Header>
          <h5>
            👥 System Users ({filteredUsers.length})
            <small className="text-muted ms-2">
              Showing {filteredUsers.length} of {users.length} users
            </small>
          </h5>
        </Card.Header>
        <Card.Body>
          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👤</div>
              <h4>No users found</h4>
              <p>
                {searchTerm || roleFilter !== "all"
                  ? "No users match your search criteria"
                  : "No users in the system"}
              </p>
              <Button variant="primary" onClick={() => setShowModal(true)}>
                ➕ Add First User
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Contact Information</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr
                      key={user._id}
                      className="table-row"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td>
                        <div className="user-info">
                          <div className="avatar-placeholder">
                            {user.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <strong>{user.name}</strong>
                            <br />
                            <small className="text-muted">
                              ID: {user._id?.substring(0, 8)}...
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>📧 {user.email}</div>
                          {user.phone && (
                            <small className="text-muted">
                              📱 {user.phone}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>
                        <span className="department-badge">
                          {user.department?.name || "N/A"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewUser(user)}
                            className="btn-sm"
                          >
                            👁️ View
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(user._id, user.name)}
                            className="btn-sm"
                            disabled={user.role === "admin"} // Prevent deleting admin
                          >
                            🗑️ Delete
                          </Button>
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

      {/* Create User Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        className="modal-overlay"
      >
        <Modal.Header closeButton>
          <Modal.Title>➕ Create New User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreate}>
          <Modal.Body>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">
                    <span className="input-icon">👤</span>
                    Full Name *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    required
                    className="form-control-custom"
                    placeholder="Enter user's full name"
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">
                    <span className="input-icon">📧</span>
                    Email Address *
                  </Form.Label>
                  <Form.Control
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    required
                    className="form-control-custom"
                    placeholder="user@company.com"
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">
                    <span className="input-icon">🔒</span>
                    Password *
                  </Form.Label>
                  <Form.Control
                    type="password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    required
                    className="form-control-custom"
                    placeholder="Enter secure password"
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">
                    <span className="input-icon">🎭</span>
                    Role *
                  </Form.Label>
                  <Form.Select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value })
                    }
                    className="form-select-custom"
                  >
                    <option value="receptionist">Receptionist</option>
                    <option value="host">Host</option>
                    <option value="security">Security</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Form.Group>
              </div>

              {newUser.role === "host" && (
                <div className="col-md-12">
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label">
                      <span className="input-icon">🏢</span>
                      Department *
                    </Form.Label>
                    <Form.Select
                      value={newUser.department}
                      onChange={(e) =>
                        setNewUser({ ...newUser, department: e.target.value })
                      }
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
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={creating}>
              {creating ? (
                <>
                  <span className="button-spinner"></span>
                  Creating...
                </>
              ) : (
                <>
                  <span className="button-icon">✅</span>
                  Create User
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* User Details Modal */}
      <Modal
        size="lg"
        show={showDetails}
        onHide={() => setShowDetails(false)}
        centered
        className="modal-overlay"
      >
        <Modal.Header closeButton>
          <Modal.Title>👤 User Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsLoading ? (
            <div className="text-center">
              <div className="loading-spinner"></div>
              <p>Loading user details...</p>
            </div>
          ) : selectedUser ? (
            <div>
              {/* User Header */}
              <div className="d-flex align-items-center gap-4 mb-4">
                <div className="avatar-placeholder large">
                  {selectedUser.name?.charAt(0) || "U"}
                </div>
                <div>
                  <h3>{selectedUser.name}</h3>
                  {getRoleBadge(selectedUser.role)}
                  <p className="text-muted mt-2">User ID: {selectedUser._id}</p>
                </div>
              </div>

              {/* User Details Grid */}
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">📧 Email Address</span>
                  <span className="detail-value">{selectedUser.email}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">🎭 User Role</span>
                  <span className="detail-value">
                    {getRoleBadge(selectedUser.role)}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">🏢 Department</span>
                  <span className="detail-value">
                    {selectedUser.department?.name || "N/A"}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">📞 Phone Number</span>
                  <span className="detail-value">
                    {selectedUser.phone || "Not provided"}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">📅 Created Date</span>
                  <span className="detail-value">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* User-specific Information */}
              {selectedUser.role === "host" && userVisits.length > 0 && (
                <div className="mt-4">
                  <h6>📋 Host's Recent Visits ({userVisits.length})</h6>
                  <div className="table-responsive">
                    <table className="data-table small">
                      <thead>
                        <tr>
                          <th>Visitor</th>
                          <th>Purpose</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userVisits.slice(0, 5).map((visit) => (
                          <tr key={visit._id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                {visit.visitor?.photoUrl ? (
                                  <Image
                                    src={visit.visitor.photoUrl}
                                    roundedCircle
                                    width={30}
                                    height={30}
                                    alt={visit.visitor.name}
                                  />
                                ) : (
                                  <div className="avatar-placeholder xs">
                                    {visit.visitor?.name?.charAt(0) || "V"}
                                  </div>
                                )}
                                <span>{visit.visitor?.name}</span>
                              </div>
                            </td>
                            <td>{visit.purpose}</td>
                            <td>
                              {new Date(
                                visit.appointmentDate
                              ).toLocaleDateString()}
                            </td>
                            <td>
                              <Badge bg="secondary" className="status-badge">
                                {getStatusIcon(visit.status)} {visit.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p>No user data available</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline" onClick={() => setShowDetails(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
