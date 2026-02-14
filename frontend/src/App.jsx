import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from './store/authSlice';
import Sidebar from "./components/Sidebar";
import Login from './pages/Login';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Register from "./pages/Signup"
import History from './pages/History';
const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  if (loading) return <div className="h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>;
  
  return isAuthenticated ? (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  ) : (
    <Navigate to="/login" />
  );
};

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Register />} />
      <Route path="/" element={<ProtectedLayout />}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="history" element={<History/>} />
      </Route>
    </Routes>
  );
}