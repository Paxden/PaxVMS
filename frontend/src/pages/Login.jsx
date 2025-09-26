import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic validation
    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const user = await login(email, password, rememberMe);
      console.log("✅ Logged in as:", user);
      
      // Redirect to intended page or dashboard
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    const demoCredentials = {
      admin: { email: "admin@vms.com", password: "admin123" },
      host: { email: "host@vms.com", password: "host123" },
      receptionist: { email: "reception@vms.com", password: "reception123" },
      security: { email: "security@vms.com", password: "security123" }
    };

    const creds = demoCredentials[role];
    if (creds) {
      setEmail(creds.email);
      setPassword(creds.password);
      setRememberMe(true);
    }
  };

  return (
    <div className="login-container">
      {/* Background Decoration */}
      <div className="login-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      <div className="login-content">
        {/* Header Section */}
        <div className="login-header">
          <div className="logo">
            <div className="logo-icon">🏢</div>
            <div className="logo-text">
              <h1>Visitor Management System</h1>
              <p>Secure access to your dashboard</p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <div className="card-header ">
            <h2 className="text-light">Welcome Back</h2>
            <p className="text-light">Sign in to your account</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span>{error}</span>
              <button 
                className="alert-close"
                onClick={() => setError("")}
              >
                ×
              </button>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">📧</span>
                Email Address
              </label>
              <div className="input-group">
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">🔒</span>
                Password
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span className="checkmark"></span>
                Remember me
              </label>
              <a href="/forgot-password" className="forgot-link">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Signing In...
                </>
              ) : (
                <>
                  <span className="button-icon">🚀</span>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo Accounts Section */}
          <div className="demo-section">
            <div className="demo-divider">
              <span>Demo Accounts</span>
            </div>
            
            <div className="demo-buttons">
              <button
                type="button"
                className="demo-button admin"
                onClick={() => handleDemoLogin("admin")}
                disabled={loading}
              >
                <span className="demo-icon">👑</span>
                Admin
              </button>
              
              <button
                type="button"
                className="demo-button host"
                onClick={() => handleDemoLogin("host")}
                disabled={loading}
              >
                <span className="demo-icon">👨‍💼</span>
                Host
              </button>
              
              <button
                type="button"
                className="demo-button receptionist"
                onClick={() => handleDemoLogin("receptionist")}
                disabled={loading}
              >
                <span className="demo-icon">💁</span>
                Receptionist
              </button>
              
              <button
                type="button"
                className="demo-button security"
                onClick={() => handleDemoLogin("security")}
                disabled={loading}
              >
                <span className="demo-icon">🛡️</span>
                Security
              </button>
            </div>
          </div>

          {/* Footer Links */}
          <div className="login-footer">
            <p>
              Don't have an account?{" "}
              <a href="/request-access" className="footer-link">
                Request access
              </a>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="security-notice">
          <div className="security-icon">🔐</div>
          <p>Your login information is encrypted and secure</p>
        </div>
      </div>
    </div>
  );
}