import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5001/api",
  withCredentials: true,
});

// -------------------- Auth --------------------
export const loginUser = (data) => API.post("/users/login", data);
export const logoutUser = () => API.post("/users/logout");
export const createUser = (data) => API.post("/users", data);
export const getUsers = () => API.get("/users");
// delete user
export const deleteUser = (id) => API.delete(`/users/${id}`);
// get user by id
export const getUserById = (id) => API.get(`/users/${id}`);

// -------------------- Visitors --------------------
// For new visitor + visit
export const registerVisitor = (formData) =>
  API.post("/visitors/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// For existing visitor: add visit
export const addVisit = (data) =>
  API.post("/visitors/" + data.visitorId + "/visits", data);

export const getVisitors = () => API.get("/visitors");
export const getVisits = (params) => API.get("/visitors/visits", { params });
export const updateVisitorStatus = (id, visitId, data) =>
  API.patch(`/visitors/${id}/visits/${visitId}/status`, data);
export const checkInVisitor = (id, visitId, data) =>
  API.put(`/visitors/${id}/visits/${visitId}/checkin`, data);
export const checkOutVisitor = (id, visitId, data) =>
  API.put(`/visitors/${id}/visits/${visitId}/checkout`, data);

// -------------------- Departments --------------------
export const createDepartment = (data) => API.post("/departments", data);
export const getDepartments = () => API.get("/departments");
export const getHostsByDepartment = (id) => API.get(`/departments/${id}/hosts`);

export default API;
