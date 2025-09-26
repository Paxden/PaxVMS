import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
// CSS
import "./App.css";

import DashboardLayout from "./component/DashboardLayout";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageVisitors from "./pages/admin/ManageVisitors";
import ManageVisits from "./pages/admin/ManageVisits";
import Reports from "./pages/admin/Reports";

// Other dashboards
import HostDashboard from "./pages/host/HostDashboard";
import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard";
import SecurityDashboard from "./pages/security/SecurityDashboard";
import Login from "./pages/Login";
import PreAppointVisit from "./pages/host/Appointment";
import MyVisitors from "./pages/host/MyVisitors";
import RegisterVisitor from "./pages/security/RegisterVisitor";

function RoleRouter() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case "admin":
      return <Navigate to="/admin" replace />;
    case "host":
      return <Navigate to="/host" replace />;
    case "receptionist":
      return <Navigate to="/reception" replace />;
    case "security":
      return <Navigate to="/security" replace />;
    default:
      return <p>Unknown role</p>;
  }
}

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  if (role && user.role !== role) return <p>Unauthorized</p>;

  return children;
}

function App() {
  return (
    <Routes>
      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Root → redirect based on role */}
      <Route path="/" element={<RoleRouter />} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute role="admin">
            <DashboardLayout>
              <ManageUsers />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/visitors"
        element={
          <ProtectedRoute role="admin">
            <DashboardLayout>
              <ManageVisitors />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/visits"
        element={
          <ProtectedRoute role="admin">
            <DashboardLayout>
              <ManageVisits />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute role="admin">
            <DashboardLayout>
              <Reports />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Host */}
      <Route
        path="/host"
        element={
          <ProtectedRoute role="host">
            <DashboardLayout>
              <HostDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Host */}
      <Route
        path="/host/appointments"
        element={
          <ProtectedRoute role="host">
            <DashboardLayout>
              <PreAppointVisit />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/visitors"
        element={
          <ProtectedRoute role="host">
            <DashboardLayout>
              <MyVisitors />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Receptionist */}
      <Route
        path="/reception"
        element={
          <ProtectedRoute role="receptionist">
            <DashboardLayout>
              <ReceptionistDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Security */}
      <Route
        path="/security"
        element={
          <ProtectedRoute role="security">
            <DashboardLayout>
              <SecurityDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/security/register"
        element={
          <ProtectedRoute role="security">
            <DashboardLayout>
              <RegisterVisitor />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Default */}
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
