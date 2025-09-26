import React from "react";
import ReactDOM from "react-dom/client";
// bootstrap css
import "bootstrap/dist/css/bootstrap.min.css";
// bootstrap bundle js
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
