import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { registerUser, resetAuthStatus } from "../store/authSlice";
import { User, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, success, isAuthenticated } = useSelector((state) => state.auth);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  // Redirect to login on successful registration
  useEffect(() => {
    if (success) {
      dispatch(resetAuthStatus());
      navigate("/login");
    }
  }, [success, navigate, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    // Dispatch register action
    dispatch(registerUser({ 
      name: formData.name, 
      email: formData.email, 
      password: formData.password 
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Decorative Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-card border border-border p-8 rounded-2xl shadow-2xl backdrop-blur-sm"
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
            <User className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-foreground">Create Account</h1>
          <p className="text-muted-foreground">Join us to track your habits & focus.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <input 
                name="name"
                type="text" 
                placeholder="John Doe"
                className="w-full bg-secondary/50 border border-input text-foreground rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-muted-foreground/50"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <input 
                name="email"
                type="email" 
                placeholder="you@example.com"
                className="w-full bg-secondary/50 border border-input text-foreground rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-muted-foreground/50"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <input 
                name="password"
                type="password" 
                placeholder="••••••••"
                className="w-full bg-secondary/50 border border-input text-foreground rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-muted-foreground/50"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground ml-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <input 
                name="confirmPassword"
                type="password" 
                placeholder="••••••••"
                className="w-full bg-secondary/50 border border-input text-foreground rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-muted-foreground/50"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-destructive text-sm text-center font-medium bg-destructive/10 p-2 rounded-lg"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="group w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Creating Account...
              </>
            ) : (
              <>
                Sign Up <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}