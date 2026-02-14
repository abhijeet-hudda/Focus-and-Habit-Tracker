import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { loginUser } from "../store/authSlice";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, error, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(formData));
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card border border-border p-8 rounded-2xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground">Login to access your tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Email</label>
            <input 
              type="email" 
              className="w-full bg-secondary/50 border border-input text-foreground rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Password</label>
            <input 
              type="password" 
              className="w-full bg-secondary/50 border border-input text-foreground rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          {error && <p className="text-destructive text-sm text-center">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">New here? </span>
          <Link to="/signup" className="text-primary hover:underline">Create an account</Link>
        </div>
      </motion.div>
    </div>
  );
}