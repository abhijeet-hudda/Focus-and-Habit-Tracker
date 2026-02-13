
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  Clock, 
  Briefcase, 
  BookOpen, 
  Dumbbell, 
  Coffee, 
  MoreHorizontal, 
  Activity, 
  Zap,
  Calendar
} from "lucide-react";
import api from "../api/axiosInstance";

// ... (Keep your existing calculateStats and CATEGORIES helpers here) ...
const calculateStats = (activities) => {
  const totalMinutes = activities.reduce((acc, curr) => acc + curr.duration, 0);
  const workMinutes = activities.filter(a => a.category === "Work").reduce((acc, curr) => acc + curr.duration, 0);
  const studyMinutes = activities.filter(a => a.category === "Study").reduce((acc, curr) => acc + curr.duration, 0);

  const formatTime = (m) => {
    const h = Math.floor(m / 60);
    const mins = m % 60;
    if (h === 0) return `${mins}m`;
    return `${h}h ${mins}m`;
  };

  return {
    count: activities.length,
    total: formatTime(totalMinutes),
    work: formatTime(workMinutes),
    study: formatTime(studyMinutes)
  };
};

const CATEGORIES = [
  { id: "Work", icon: Briefcase, color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20" },
  { id: "Study", icon: BookOpen, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { id: "Exercise", icon: Dumbbell, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { id: "Break", icon: Coffee, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  { id: "Other", icon: MoreHorizontal, color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20" }
];

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ activityName: "", duration: "", category: "Work" });

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const res = await api.get('/activities');
      const today = new Date().toDateString();
      return res.data.data.filter(a => new Date(a.createdAt).toDateString() === today);
    }
  });

  const stats = calculateStats(activities || []);

  const createMutation = useMutation({
    mutationFn: (newActivity) => api.post('/activities/create-Activity', newActivity),
    onSuccess: () => {
      queryClient.invalidateQueries(['activities']);
      setForm({ activityName: "", duration: "", category: "Work" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/activities/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['activities'])
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.activityName || !form.duration) return;
    createMutation.mutate(form);
  };

  const getCategoryStyle = (catName) => {
    return CATEGORIES.find(c => c.id === catName) || CATEGORIES[4];
  };

  return (
    // MAIN CONTAINER: Locked to full height, hidden overflow to stop page scroll
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-6 overflow">
      
      {/* --- TOP SECTION (Fixed Height) --- */}
      <div className="shrink-0 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Stat Cards... (kept same as before) */}
          <div className="bg-card border border-border p-4 rounded-xl">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="w-4 h-4" /> <span className="text-xs font-medium">Activities</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.count}</p>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" /> <span className="text-xs font-medium">Total Time</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Briefcase className="w-4 h-4" /> <span className="text-xs font-medium">Work</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.work}</p>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BookOpen className="w-4 h-4" /> <span className="text-xs font-medium">Study</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.study}</p>
          </div>
        </div>
      </div>

      {/* --- BOTTOM SECTION (Takes remaining space) --- */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6 pb-2">
        
        {/* LEFT: FORM (Scrollable if needed, but usually fits) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-y-auto custom-scrollbar h-fit max-h-full">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Log Activity</h2>
            <p className="text-sm text-muted-foreground">Track a new session</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ... Form Inputs (Same as before) ... */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Activity Name</label>
              <input
                className="w-full bg-secondary/30 border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/40"
                placeholder="e.g., Deep work session"
                value={form.activityName}
                onChange={(e) => setForm({ ...form, activityName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Duration (minutes)</label>
              <input
                type="number"
                className="w-full bg-secondary/30 border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/40"
                placeholder="30"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                required
                min="1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Category</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat.id })}
                    className={`
                      flex flex-col items-center justify-center gap-1 py-3 rounded-xl border transition-all
                      ${form.category === cat.id 
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105" 
                        : "bg-secondary/30 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                      }
                    `}
                  >
                    <cat.icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{cat.id}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? "Saving..." : <><Plus className="w-5 h-5" /> Add Activity</>}
            </button>
          </form>
        </div>

        {/* RIGHT: LIST (This is the only part that scrolls now) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-border shrink-0">
            <div>
              <h2 className="text-xl font-bold text-foreground">Today's Activities</h2>
              <p className="text-sm text-muted-foreground">Recent logs</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
              <Zap className="w-3 h-3" />
              {stats.total} total
            </div>
          </div>

          {/* The Scrollable List Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <p className="text-center text-muted-foreground py-10">Loading...</p>
              ) : activities?.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                  <Activity className="w-12 h-12 mb-2" />
                  <p>No activities yet today.</p>
                </div>
              ) : (
                activities?.slice().map((activity) => {
                  const style = getCategoryStyle(activity.category);
                  const Icon = style.icon;
                  return (
                    <motion.div
                      key={activity._id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                      className="group bg-secondary/20 border border-border/50 p-4 rounded-xl flex items-center justify-between hover:bg-secondary/40 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${style.bg} ${style.color} border ${style.border}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">{activity.activityName}</h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className={`${style.color} font-medium`}>{activity.category}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {activity.duration}m</span>
                            <span>• {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteMutation.mutate(activity._id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}