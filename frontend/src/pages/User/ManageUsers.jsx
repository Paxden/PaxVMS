import React, { useEffect, useState } from "react";
import {
  getUsers,
  createUser,
  deleteUser,
  getUserById,
  getDepartments,
} from "../../services/api";
import { Eye, Trash2, UserPlus } from "lucide-react";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filterRole, setFilterRole] = useState("");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "host",
    department: "",
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Load users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Load departments
  const fetchDepartments = async () => {
    try {
      const { data } = await getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error("Error fetching departments", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  // 🔹 Filtered users
  const filteredUsers = filterRole
    ? users.filter((u) => u.role === filterRole)
    : users;

  // 🔹 Register user
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUser(newUser);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "host",
        department: "",
      });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create user");
    }
  };

  // 🔹 Delete user
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  // 🔹 View details
  const handleView = async (id) => {
    try {
      const { data } = await getUserById(id);
      setSelectedUser(data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch user details");
    }
  };

  return (
    <div>
      <h3 className="mb-3">Manage Users</h3>

      {/* Filter */}
      <div className="mb-3 d-flex align-items-center">
        <label className="me-2 fw-bold">Filter by Role:</label>
        <select
          className="form-select w-auto"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">All</option>
          <option value="admin">Admin</option>
          <option value="host">Host</option>
          <option value="receptionist">Receptionist</option>
          <option value="security">Security</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="table table-hover table-bordered">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th style={{ width: "120px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.department?.name || "-"}</td>
                <td className="text-center">
                  <button
                    className="btn btn-sm btn-outline-info me-2"
                    onClick={() => handleView(u._id)}
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(u._id)}
                    title="Delete User"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div
          className="modal show fade d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">User Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedUser(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <b>Name:</b> {selectedUser.name}
                </p>
                <p>
                  <b>Email:</b> {selectedUser.email}
                </p>
                <p>
                  <b>Role:</b> {selectedUser.role}
                </p>
                <p>
                  <b>Department:</b> {selectedUser.department?.name || "N/A"}
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedUser(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register New User */}
      <div className="card mt-4 p-3">
        <h5 className="mb-3">
          <UserPlus size={18} className="me-2" />
          Register New User
        </h5>
        <form onSubmit={handleRegister}>
          <div className="mb-2">
            <input
              type="text"
              placeholder="Name"
              className="form-control"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              required
            />
          </div>
          <div className="mb-2">
            <input
              type="email"
              placeholder="Email"
              className="form-control"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
              required
            />
          </div>
          <div className="mb-2">
            <input
              type="password"
              placeholder="Password"
              className="form-control"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              required
            />
          </div>
          <div className="mb-2">
            <select
              className="form-select"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <option value="host">Host</option>
              <option value="receptionist">Receptionist</option>
              <option value="security">Security</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Show department selection only for hosts */}
          {newUser.role === "host" && (
            <div className="mb-2">
              <select
                className="form-select"
                value={newUser.department}
                onChange={(e) =>
                  setNewUser({ ...newUser, department: e.target.value })
                }
                required
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button className="btn btn-primary">
            <UserPlus size={16} className="me-1" /> Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManageUsers;
