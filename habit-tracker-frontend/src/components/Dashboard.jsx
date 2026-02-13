import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axiosInstance";
import { Plus, Trash2, Clock, Briefcase } from "lucide-react";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ activityName: "", duration: "", category: "Work" });

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const res = await api.get('/activities');
      return res.data.data;
    }
  });

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
    createMutation.mutate(form);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Log your daily progress.</p>
      </div>

      <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <input
            className="md:col-span-5 bg-secondary/50 border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
            placeholder="Activity Name"
            value={form.activityName}
            onChange={(e) => setForm({ ...form, activityName: e.target.value })}
            required
          />
          <input
            type="number"
            className="md:col-span-3 bg-secondary/50 border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
            placeholder="Duration (m)"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            required
            min="1"
          />
          <select
            className="md:col-span-3 bg-secondary/50 border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {["Work", "Study", "Exercise", "Break", "Other"].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="md:col-span-1 bg-primary text-primary-foreground rounded-md flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {createMutation.isPending ? "..." : <Plus className="w-5 h-5" />}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Today's Logs</h2>
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : activities?.length === 0 ? (
                <p className="text-muted-foreground">No activities yet.</p>
            ) : activities?.map((activity) => (
              <motion.div
                key={activity._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border p-4 rounded-lg flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{activity.activityName}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="bg-secondary px-2 py-0.5 rounded text-foreground">{activity.category}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {activity.duration}m</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(activity._id)}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}