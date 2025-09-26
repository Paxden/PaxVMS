import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../../component/DashboardLayout";
import AdminOverview from "./AdminOverview";
import ManageUsers from "./ManageUsers";
import ManageVisitors from "./ManageVisitors";
import ManageVisits from "./ManageVisits";
import Reports from "./Reports";

const AdminDashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<AdminOverview />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="visitors" element={<ManageVisitors />} />
        <Route path="visits" element={<ManageVisits />} />
        <Route path="reports" element={<Reports />} />

        {/* redirect unknown subroutes */}
        {/* <Route path="*" element={<Navigate to="/admin" replace />} /> */}
      </Routes>
    </DashboardLayout>
  );
};

export default AdminDashboard;
